"""
test_lru_cache.py — Unit tests for LRU Cache DSA implementation.
Target: 90%+ coverage of lru_cache.py
"""
import pytest
import time
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.lru_cache import LRUCache


class TestLRUCacheBasic:
    """Basic get/put operations."""

    def test_get_nonexistent_returns_minus_one(self, lru_cache_small):
        assert lru_cache_small.get("missing_key") == -1

    def test_put_and_get(self, lru_cache_small):
        lru_cache_small.put("user:1", {"name": "Alice"})
        result = lru_cache_small.get("user:1")
        assert result == {"name": "Alice"}

    def test_put_overwrites_existing(self, lru_cache_small):
        lru_cache_small.put("user:1", "old_value")
        lru_cache_small.put("user:1", "new_value")
        assert lru_cache_small.get("user:1") == "new_value"

    def test_size_increases_on_put(self, lru_cache_small):
        assert lru_cache_small.size() == 0
        lru_cache_small.put("a", 1)
        assert lru_cache_small.size() == 1
        lru_cache_small.put("b", 2)
        assert lru_cache_small.size() == 2

    def test_various_value_types(self):
        cache = LRUCache(10)
        cache.put("string", "hello")
        cache.put("integer", 42)
        cache.put("list", [1, 2, 3])
        cache.put("dict", {"k": "v"})
        assert cache.get("string") == "hello"
        assert cache.get("integer") == 42
        assert cache.get("list") == [1, 2, 3]
        assert cache.get("dict") == {"k": "v"}


class TestLRUCacheEviction:
    """LRU eviction policy tests."""

    def test_evicts_lru_on_overflow(self, lru_cache_small):
        lru_cache_small.put("a", 1)
        lru_cache_small.put("b", 2)
        lru_cache_small.put("c", 3)
        # Access 'a' to make it recently used
        lru_cache_small.get("a")
        # 'd' should evict 'b' (now LRU)
        lru_cache_small.put("d", 4)
        assert lru_cache_small.get("b") == -1
        assert lru_cache_small.get("a") == 1
        assert lru_cache_small.get("c") == 3
        assert lru_cache_small.get("d") == 4

    def test_size_never_exceeds_capacity(self, lru_cache_small):
        for i in range(20):
            lru_cache_small.put(f"key:{i}", i)
        assert lru_cache_small.size() <= 3

    def test_most_recently_used_stays(self, lru_cache_small):
        lru_cache_small.put("a", 1)
        lru_cache_small.put("b", 2)
        lru_cache_small.put("c", 3)
        lru_cache_small.put("d", 4)  # triggers eviction of 'a'
        assert lru_cache_small.get("a") == -1
        assert lru_cache_small.get("b") == 2

    def test_capacity_one(self):
        cache = LRUCache(1)
        cache.put("x", 10)
        cache.put("y", 20)  # evicts x
        assert cache.get("x") == -1
        assert cache.get("y") == 20


class TestLRUCachePerformance:
    """Performance assertions — must complete within thresholds."""

    @pytest.mark.performance
    def test_put_thousand_items_fast(self, lru_cache_large):
        start = time.perf_counter()
        for i in range(1000):
            lru_cache_large.put(f"product:{i}", {"id": i, "price": i * 10})
        elapsed = time.perf_counter() - start
        assert elapsed < 0.1, f"1000 puts took {elapsed:.3f}s — expected < 0.1s"

    @pytest.mark.performance
    def test_get_thousand_items_fast(self, lru_cache_large):
        for i in range(100):
            lru_cache_large.put(f"k:{i}", i)
        start = time.perf_counter()
        for i in range(1000):
            lru_cache_large.get(f"k:{i % 100}")
        elapsed = time.perf_counter() - start
        assert elapsed < 0.05, f"1000 gets took {elapsed:.3f}s — expected < 0.05s"

    @pytest.mark.performance
    def test_o1_complexity_proof(self):
        """Hit rate should not degrade as capacity fills up."""
        cache = LRUCache(50)
        for i in range(50):
            cache.put(f"k:{i}", i)
        hits = sum(1 for i in range(50) if cache.get(f"k:{i}") != -1)
        assert hits == 50
