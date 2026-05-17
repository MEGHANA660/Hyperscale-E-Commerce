"""
visualize_results.py — Generate performance charts from benchmark results.
Run AFTER performance_tests.py to generate results.csv first.
"""
import csv, os, sys

# Try matplotlib, gracefully degrade
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    import matplotlib.patches as mpatches
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False
    print("⚠️  matplotlib not installed. Run: pip install matplotlib")
    print("   Printing ASCII chart instead.\n")


RESULTS_PATH = os.path.join(os.path.dirname(__file__), "results.csv")
CHARTS_DIR = os.path.join(os.path.dirname(__file__), "charts")


def load_results():
    if not os.path.exists(RESULTS_PATH):
        print(f"❌ results.csv not found. Run performance_tests.py first.")
        sys.exit(1)
    rows = []
    with open(RESULTS_PATH) as f:
        reader = csv.DictReader(f)
        for row in reader:
            row["Speedup"] = float(row["Speedup"])
            row["Improvement_pct"] = float(row["Improvement_pct"])
            row["Baseline_us"] = float(row["Baseline_us"])
            row["Optimized_us"] = float(row["Optimized_us"])
            rows.append(row)
    return rows


def ascii_bar_chart(rows):
    print("📊 HyperScale Commerce — DSA Performance Speedups")
    print("=" * 65)
    max_speedup = max(r["Speedup"] for r in rows)
    for row in rows:
        bar_len = int((row["Speedup"] / max_speedup) * 40)
        bar = "█" * bar_len
        print(f"  {row['DSA']:<22} {bar:<42} {row['Speedup']:>6.1f}×")
    print()


def matplotlib_charts(rows):
    os.makedirs(CHARTS_DIR, exist_ok=True)
    dsa_names = [r["DSA"] for r in rows]
    speedups = [r["Speedup"] for r in rows]
    improvements = [r["Improvement_pct"] for r in rows]
    baselines = [r["Baseline_us"] for r in rows]
    optimized = [r["Optimized_us"] for r in rows]

    colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

    # Chart 1: Speedup bar chart
    fig, ax = plt.subplots(figsize=(12, 6))
    bars = ax.barh(dsa_names, speedups, color=colors, edgecolor="white", linewidth=0.5)
    ax.set_xlabel("Speedup Factor (×)", fontsize=12)
    ax.set_title("HyperScale Commerce — DSA Performance Speedups", fontsize=14, fontweight="bold")
    ax.set_facecolor("#0f172a")
    fig.patch.set_facecolor("#0f172a")
    ax.tick_params(colors="white")
    ax.xaxis.label.set_color("white")
    ax.title.set_color("white")
    for spine in ax.spines.values():
        spine.set_edgecolor("#334155")
    for bar, speed in zip(bars, speedups):
        ax.text(bar.get_width() + 0.5, bar.get_y() + bar.get_height() / 2,
                f"{speed:.1f}×", va="center", color="white", fontsize=10)
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "speedups.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✅ Saved: charts/speedups.png")

    # Chart 2: Baseline vs Optimized (log scale)
    x = range(len(dsa_names))
    width = 0.35
    fig, ax = plt.subplots(figsize=(14, 6))
    bars1 = ax.bar([i - width / 2 for i in x], baselines, width, label="Baseline", color="#ef4444", alpha=0.8)
    bars2 = ax.bar([i + width / 2 for i in x], optimized, width, label="Optimized (DSA)", color="#10b981", alpha=0.8)
    ax.set_yscale("log")
    ax.set_xticks(list(x))
    ax.set_xticklabels(dsa_names, rotation=30, ha="right", color="white")
    ax.set_ylabel("Time (μs) — log scale", color="white")
    ax.set_title("Baseline vs DSA-Optimized Response Times", fontsize=14, fontweight="bold", color="white")
    ax.set_facecolor("#0f172a")
    fig.patch.set_facecolor("#0f172a")
    ax.tick_params(colors="white")
    ax.yaxis.label.set_color("white")
    ax.legend(facecolor="#1e293b", edgecolor="#334155", labelcolor="white")
    for spine in ax.spines.values():
        spine.set_edgecolor("#334155")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "baseline_vs_optimized.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✅ Saved: charts/baseline_vs_optimized.png")

    # Chart 3: Improvement % pie
    fig, ax = plt.subplots(figsize=(9, 9))
    wedge_colors = colors[:len(rows)]
    wedges, texts, autotexts = ax.pie(
        improvements, labels=dsa_names, autopct="%1.0f%%",
        colors=wedge_colors, startangle=90,
        pctdistance=0.8, textprops={"color": "white"},
    )
    ax.set_title("Performance Improvement % by DSA", color="white", fontsize=14, fontweight="bold")
    fig.patch.set_facecolor("#0f172a")
    plt.tight_layout()
    plt.savefig(os.path.join(CHARTS_DIR, "improvement_pie.png"), dpi=150, bbox_inches="tight")
    plt.close()
    print(f"  ✅ Saved: charts/improvement_pie.png")


if __name__ == "__main__":
    print("\n📊 HyperScale Commerce — Visualizing Benchmark Results\n")
    rows = load_results()
    ascii_bar_chart(rows)
    if HAS_MATPLOTLIB:
        print("Generating matplotlib charts...")
        matplotlib_charts(rows)
        print(f"\nAll charts saved to: {CHARTS_DIR}/")
    else:
        print("Install matplotlib for graphical charts: pip install matplotlib")
