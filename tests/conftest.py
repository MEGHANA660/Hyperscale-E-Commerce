"""
conftest.py — Shared pytest fixtures for HyperScale Commerce DSA tests.
"""
import sys
import os
import pytest

# Add shared DSA module to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))

from dsa.lru_cache import LRUCache
from dsa.trie import Trie
from dsa.min_heap import MinHeap
from dsa.graph_bfs import ProductGraph
from dsa.bloom_filter import BloomFilter
from dsa.segment_tree import SegmentTree
from dsa.discount_dp import optimize_discounts


@pytest.fixture
def lru_cache_small():
    """LRU Cache with capacity 3."""
    return LRUCache(3)


@pytest.fixture
def lru_cache_large():
    """LRU Cache with capacity 100."""
    return LRUCache(100)


@pytest.fixture
def trie_empty():
    return Trie()


@pytest.fixture
def trie_loaded():
    """Trie pre-loaded with product names."""
    t = Trie()
    products = [
        ("macbook", 1), ("macbook pro", 2), ("iphone", 3),
        ("iphone 15", 4), ("ipad", 5), ("apple watch", 6),
        ("samsung galaxy", 7), ("sony headphones", 8),
    ]
    for word, pid in products:
        t.insert(word, pid)
    return t


@pytest.fixture
def min_heap_empty():
    return MinHeap()


@pytest.fixture
def min_heap_loaded():
    """Min Heap with 5 orders of varying priority."""
    h = MinHeap()
    h.push(3, {"order": "A", "type": "standard"})
    h.push(1, {"order": "B", "type": "express"})
    h.push(2, {"order": "C", "type": "premium"})
    h.push(1, {"order": "D", "type": "express"})
    h.push(3, {"order": "E", "type": "standard"})
    return h


@pytest.fixture
def product_graph():
    """Product graph with known relationships."""
    g = ProductGraph()
    g.add_edge(1, 2)
    g.add_edge(1, 3)
    g.add_edge(2, 4)
    g.add_edge(3, 5)
    g.add_edge(4, 6)
    return g


@pytest.fixture
def bloom_filter():
    """Bloom Filter seeded with product IDs 1–100."""
    bf = BloomFilter(expected_elements=1000, false_positive_rate=0.01)
    for i in range(1, 101):
        bf.add(i)
    return bf


@pytest.fixture
def segment_tree():
    """Segment Tree with 12 months of sales data."""
    data = [120, 85, 200, 150, 300, 250, 180, 95, 320, 410, 290, 175]
    return SegmentTree(data), data


@pytest.fixture
def sample_discounts():
    """Discount list: [(conversion_increase, cost), ...]"""
    return [(10, 50), (8, 30), (15, 70), (5, 20)]
