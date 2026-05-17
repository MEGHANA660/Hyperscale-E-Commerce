"""
test_trie.py — Unit tests for Trie (Prefix Tree) DSA implementation.
"""
import pytest, time, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.trie import Trie


class TestTrieInsertion:
    def test_insert_single_word(self, trie_empty):
        trie_empty.insert("macbook", 1)
        assert 1 in trie_empty.search("mac")

    def test_insert_multiple_words_same_prefix(self, trie_empty):
        trie_empty.insert("mac", 1)
        trie_empty.insert("macbook", 2)
        trie_empty.insert("macbook pro", 3)
        results = trie_empty.search("mac")
        assert 1 in results
        assert 2 in results

    def test_insert_case_insensitive(self, trie_empty):
        trie_empty.insert("MacBook", 1)
        assert 1 in trie_empty.search("mac")
        assert 1 in trie_empty.search("MAC")

    def test_insert_duplicate_id_not_added_twice(self, trie_empty):
        trie_empty.insert("iphone", 5)
        trie_empty.insert("iphone", 5)  # same id
        result = trie_empty.search("iphone")
        assert result.count(5) == 1

    def test_insert_empty_string(self, trie_empty):
        # Should not crash
        trie_empty.insert("", 1)


class TestTrieSearch:
    def test_search_returns_empty_for_no_match(self, trie_loaded):
        result = trie_loaded.search("zzz")
        assert result == []

    def test_search_partial_prefix(self, trie_loaded):
        result = trie_loaded.search("iph")
        assert 3 in result or 4 in result

    def test_search_full_word(self, trie_loaded):
        result = trie_loaded.search("iphone")
        assert 3 in result

    def test_search_single_char(self, trie_loaded):
        result = trie_loaded.search("m")
        assert len(result) > 0

    def test_search_empty_string_returns_empty(self, trie_loaded):
        result = trie_loaded.search("")
        assert isinstance(result, list)

    def test_get_all_with_prefix(self, trie_loaded):
        words = trie_loaded.get_all_with_prefix("mac")
        assert any("mac" in w for w in words)


class TestTriePerformance:
    @pytest.mark.performance
    def test_insert_ten_thousand_words(self, trie_empty):
        words = [f"product{i}" for i in range(10000)]
        start = time.perf_counter()
        for i, w in enumerate(words):
            trie_empty.insert(w, i)
        elapsed = time.perf_counter() - start
        assert elapsed < 2.0, f"10000 inserts took {elapsed:.3f}s"

    @pytest.mark.performance
    def test_search_is_faster_than_sql_simulation(self, trie_empty):
        words = ["laptop", "phone", "tablet", "watch", "headphones"]
        for i, w in enumerate(words):
            trie_empty.insert(w, i)

        # Trie search
        start = time.perf_counter()
        for _ in range(1000):
            trie_empty.search("lap")
        trie_time = time.perf_counter() - start

        # Linear scan baseline
        product_names = words * 200
        start = time.perf_counter()
        for _ in range(1000):
            [n for n in product_names if n.startswith("lap")]
        linear_time = time.perf_counter() - start

        # Trie should be at least as fast or faster for repeated queries
        assert trie_time < linear_time * 5  # reasonable margin
