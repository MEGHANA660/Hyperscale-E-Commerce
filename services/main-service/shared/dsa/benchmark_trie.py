import time
import sys
import os

# Add shared/ to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(BASE_DIR)

from shared.dsa.trie import Trie

def benchmark_search():
    print("--- HyperScale Performance Benchmark: Trie vs Naive ---")
    
    # 1. Setup Data (100,000 product names)
    print("Generating 100,000 products...")
    trie = Trie()
    product_names = [f"Product_{i}_{'suffix' if i % 10 == 0 else ''}" for i in range(100000)]
    
    for i, name in enumerate(product_names):
        trie.insert(name, i)
        
    prefix = "Product_123" # A common prefix
    
    # 2. Benchmark Naive (SQL LIKE simulation)
    # Naive search iterates through the entire list to find matches
    print(f"Benchmarking Naive Search (SQL LIKE simulation) for '{prefix}'...")
    start_time = time.perf_counter()
    naive_results = [name for name in product_names if name.lower().startswith(prefix.lower())]
    naive_time = (time.perf_counter() - start_time) * 1000
    print(f"Naive Time: {naive_time:.4f} ms (Found {len(naive_results)} items)")

    # 3. Benchmark Trie (DSA #2)
    print(f"Benchmarking Trie Search for '{prefix}'...")
    start_time = time.perf_counter()
    trie_results = trie.search(prefix)
    trie_time = (time.perf_counter() - start_time) * 1000
    print(f"Trie Time: {trie_time:.4f} ms (Found {len(trie_results)} items - capped at 5 for top suggestions)")

    # 4. Results
    improvement = naive_time / trie_time if trie_time > 0 else 0
    print("-" * 50)
    print(f"RESULT: Trie is {improvement:.2f}x faster than Naive Search.")
    print("-" * 50)

    if improvement >= 50:
        print("✅ HYPOTHESIS PROVEN: >50x performance improvement achieved.")
    else:
        print("❌ HYPOTHESIS FAILED: Performance improvement was less than 50x.")

if __name__ == "__main__":
    benchmark_search()
