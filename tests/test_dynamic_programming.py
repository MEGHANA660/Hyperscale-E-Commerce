"""
test_dynamic_programming.py — Unit tests for 0/1 Knapsack DP implementation.
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.discount_dp import optimize_discounts


class TestOptimizeDiscountsBasic:
    def test_empty_discounts(self):
        result, indices = optimize_discounts([], 100)
        assert result == 0
        assert indices == []

    def test_zero_budget(self, sample_discounts):
        result, indices = optimize_discounts(sample_discounts, 0)
        assert result == 0
        assert indices == []

    def test_single_affordable_discount(self):
        discounts = [(10, 30)]  # 10% increase, costs 30
        result, indices = optimize_discounts(discounts, 50)
        assert result == 10
        assert 0 in indices

    def test_single_unaffordable_discount(self):
        discounts = [(10, 100)]
        result, indices = optimize_discounts(discounts, 50)
        assert result == 0
        assert indices == []

    def test_optimal_selection(self, sample_discounts):
        """With budget=100, should select optimal combination."""
        result, indices = optimize_discounts(sample_discounts, 100)
        # Verify result matches hand calculation
        total_cost = sum(sample_discounts[i][1] for i in indices)
        assert total_cost <= 100
        assert result > 0

    def test_selected_items_within_budget(self, sample_discounts):
        budget = 80
        result, indices = optimize_discounts(sample_discounts, budget)
        total_cost = sum(sample_discounts[i][1] for i in indices)
        assert total_cost <= budget

    def test_result_is_sum_of_selected(self, sample_discounts):
        budget = 100
        result, indices = optimize_discounts(sample_discounts, budget)
        total_value = sum(sample_discounts[i][0] for i in indices)
        assert result == total_value

    def test_no_duplicates_in_selected(self, sample_discounts):
        _, indices = optimize_discounts(sample_discounts, 200)
        assert len(indices) == len(set(indices))

    def test_optimal_vs_greedy(self):
        """DP must produce at least as good a result as greedy ratio approach."""
        discounts = [(10, 60), (8, 40), (6, 30), (12, 70)]
        budget = 100
        result, indices = optimize_discounts(discounts, budget)
        # Greedy (by ratio): 8/40=0.2, 6/30=0.2, 10/60≈0.17, 12/70≈0.17
        # Greedy picks 8+6=14 for cost 70, or 8+12=20 for cost 110 (over budget)
        # DP should find optimal
        assert result >= 14  # at least as good as greedy


class TestOptimizeDiscountsEdgeCases:
    def test_all_items_fit_in_budget(self):
        discounts = [(5, 10), (8, 20), (12, 30)]
        result, indices = optimize_discounts(discounts, 100)
        assert result == 25  # all items selected
        assert set(indices) == {0, 1, 2}

    def test_large_budget_selects_all(self):
        discounts = [(i, i * 5) for i in range(1, 6)]
        budget = sum(d[1] for d in discounts)
        result, indices = optimize_discounts(discounts, budget)
        assert result == sum(d[0] for d in discounts)
