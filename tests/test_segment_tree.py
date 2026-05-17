"""
test_segment_tree.py — Unit tests for Segment Tree DSA implementation.
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.segment_tree import SegmentTree


class TestSegmentTreeBuild:
    def test_empty_data(self):
        st = SegmentTree([])
        assert st.query(0, 0) == 0

    def test_single_element(self):
        st = SegmentTree([42])
        assert st.query(0, 0) == 42

    def test_full_range_sum(self, segment_tree):
        st, data = segment_tree
        assert st.query(0, len(data) - 1) == sum(data)


class TestSegmentTreeQuery:
    def test_range_sum_first_half(self, segment_tree):
        st, data = segment_tree
        mid = len(data) // 2 - 1
        assert st.query(0, mid) == sum(data[:mid + 1])

    def test_range_sum_second_half(self, segment_tree):
        st, data = segment_tree
        mid = len(data) // 2
        assert st.query(mid, len(data) - 1) == sum(data[mid:])

    def test_single_element_query(self, segment_tree):
        st, data = segment_tree
        for i in range(len(data)):
            assert st.query(i, i) == data[i]

    def test_out_of_bounds_range(self, segment_tree):
        st, data = segment_tree
        # Out-of-range should return 0
        assert st.query(100, 200) == 0


class TestSegmentTreeUpdate:
    def test_update_single_point(self, segment_tree):
        st, data = segment_tree
        st.update(0, 999)
        assert st.query(0, 0) == 999

    def test_update_affects_parent_ranges(self, segment_tree):
        st, data = segment_tree
        original_sum = st.query(0, len(data) - 1)
        st.update(3, 500)  # was 150
        new_sum = st.query(0, len(data) - 1)
        assert new_sum == original_sum - data[3] + 500

    def test_multiple_updates(self):
        st = SegmentTree([1, 2, 3, 4, 5])
        st.update(2, 10)
        st.update(4, 20)
        assert st.query(0, 4) == 1 + 2 + 10 + 4 + 20


class TestSegmentTreePerformance:
    @pytest.mark.performance
    def test_large_range_queries_fast(self):
        import time
        data = list(range(10000))
        st = SegmentTree(data)
        start = time.perf_counter()
        for _ in range(1000):
            st.query(0, 9999)
        elapsed = time.perf_counter() - start
        assert elapsed < 1.0, f"1000 full-range queries took {elapsed:.3f}s"
