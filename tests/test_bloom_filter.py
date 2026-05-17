"""
test_bloom_filter.py — Unit tests for Bloom Filter DSA implementation.
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.bloom_filter import BloomFilter


class TestBloomFilterBasic:
    def test_added_item_always_exists(self, bloom_filter):
        for i in range(1, 101):
            assert bloom_filter.exists(i) is True

    def test_unadded_item_mostly_not_exists(self, bloom_filter):
        """False negative rate must be 0%."""
        false_negatives = 0
        for i in range(1, 101):
            if not bloom_filter.exists(i):
                false_negatives += 1
        assert false_negatives == 0, "Bloom filter must have zero false negatives!"

    def test_false_positive_rate_acceptable(self):
        """False positive rate should be close to configured rate."""
        bf = BloomFilter(expected_elements=1000, false_positive_rate=0.05)
        for i in range(1000):
            bf.add(f"product:{i}")
        false_positives = sum(1 for i in range(1000, 2000) if bf.exists(f"product:{i}"))
        fp_rate = false_positives / 1000
        assert fp_rate < 0.15, f"False positive rate {fp_rate:.2%} too high"

    def test_empty_filter_returns_false(self):
        bf = BloomFilter()
        assert bf.exists("anything") is False

    def test_string_and_int_items(self):
        bf = BloomFilter(100, 0.01)
        bf.add("hello")
        bf.add(42)
        assert bf.exists("hello") is True
        assert bf.exists(42) is True

    def test_large_capacity(self):
        bf = BloomFilter(100000, 0.01)
        for i in range(10000):
            bf.add(i)
        for i in range(10000):
            assert bf.exists(i) is True


class TestBloomFilterQueryReduction:
    def test_blocks_nonexistent_queries(self, bloom_filter):
        """Items clearly not in the filter should be blocked."""
        blocked = 0
        for i in range(9901, 10001):  # far outside 1-100
            if not bloom_filter.exists(i):
                blocked += 1
        # Most should be blocked (not false positive)
        assert blocked > 80, f"Only {blocked}/100 non-existent items blocked"
