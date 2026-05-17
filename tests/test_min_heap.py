"""
test_min_heap.py — Unit tests for Min Heap DSA implementation.
"""
import pytest, time, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.min_heap import MinHeap


class TestMinHeapBasic:
    def test_empty_heap_pop_returns_none(self, min_heap_empty):
        assert min_heap_empty.pop() is None

    def test_push_and_pop_single(self, min_heap_empty):
        min_heap_empty.push(1, {"order": "express"})
        result = min_heap_empty.pop()
        assert result[0] == 1
        assert result[1]["order"] == "express"

    def test_min_priority_popped_first(self, min_heap_loaded):
        priority, _ = min_heap_loaded.pop()
        assert priority == 1

    def test_size_decreases_on_pop(self, min_heap_loaded):
        initial_size = min_heap_loaded.size()
        min_heap_loaded.pop()
        assert min_heap_loaded.size() == initial_size - 1

    def test_is_empty_after_all_pops(self, min_heap_empty):
        min_heap_empty.push(2, "a")
        min_heap_empty.pop()
        assert min_heap_empty.is_empty()

    def test_peek_does_not_remove(self, min_heap_loaded):
        size_before = min_heap_loaded.size()
        min_heap_loaded.peek()
        assert min_heap_loaded.size() == size_before

    def test_peek_returns_min(self, min_heap_loaded):
        priority, _ = min_heap_loaded.peek()
        assert priority == 1


class TestMinHeapOrdering:
    def test_sorted_order_on_pop(self, min_heap_empty):
        priorities = [5, 2, 8, 1, 6, 3]
        for p in priorities:
            min_heap_empty.push(p, f"order_{p}")
        extracted = []
        while not min_heap_empty.is_empty():
            priority, _ = min_heap_empty.pop()
            extracted.append(priority)
        assert extracted == sorted(priorities)

    def test_equal_priority_items(self, min_heap_empty):
        min_heap_empty.push(1, "first_express")
        min_heap_empty.push(1, "second_express")
        p1, d1 = min_heap_empty.pop()
        p2, d2 = min_heap_empty.pop()
        assert p1 == 1
        assert p2 == 1

    def test_large_heap_sorted(self, min_heap_empty):
        import random
        priorities = [random.randint(1, 100) for _ in range(100)]
        for p in priorities:
            min_heap_empty.push(p, p)
        extracted = []
        while not min_heap_empty.is_empty():
            p, _ = min_heap_empty.pop()
            extracted.append(p)
        assert extracted == sorted(priorities)


class TestMinHeapPerformance:
    @pytest.mark.performance
    def test_ten_thousand_push_pop(self, min_heap_empty):
        start = time.perf_counter()
        for i in range(10000):
            min_heap_empty.push(i % 10, f"order_{i}")
        for _ in range(10000):
            min_heap_empty.pop()
        elapsed = time.perf_counter() - start
        assert elapsed < 1.0, f"10000 push+pop took {elapsed:.3f}s"
