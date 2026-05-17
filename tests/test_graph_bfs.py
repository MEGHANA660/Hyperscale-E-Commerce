"""
test_graph_bfs.py — Unit tests for Graph BFS DSA implementation.
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'shared'))
from dsa.graph_bfs import ProductGraph


class TestProductGraphEdges:
    def test_add_edge_creates_bidirectional(self, product_graph):
        # Product 1 and 2 are connected
        recs_from_1 = product_graph.get_recommendations(1, depth=1)
        recs_from_2 = product_graph.get_recommendations(2, depth=1)
        assert 2 in recs_from_1
        assert 1 in recs_from_2

    def test_node_without_edges(self):
        g = ProductGraph()
        assert g.get_recommendations(999, depth=2) == []

    def test_add_edge_no_self_loop(self):
        g = ProductGraph()
        g.add_edge(1, 1)
        # BFS from 1 should not include 1 in recommendations
        result = g.get_recommendations(1, depth=1)
        assert 1 not in result


class TestProductGraphBFS:
    def test_depth_one_returns_direct_neighbors(self, product_graph):
        result = product_graph.get_recommendations(1, depth=1)
        assert 2 in result
        assert 3 in result
        # Depth 2 nodes should NOT be included
        assert 4 not in result

    def test_depth_two_returns_second_degree(self, product_graph):
        result = product_graph.get_recommendations(1, depth=2)
        # 4 is 2 hops from 1 (1->2->4)
        assert 4 in result
        # 5 is 2 hops from 1 (1->3->5)
        assert 5 in result

    def test_no_duplicates_in_results(self, product_graph):
        result = product_graph.get_recommendations(1, depth=3)
        assert len(result) == len(set(result))

    def test_starting_product_not_in_results(self, product_graph):
        result = product_graph.get_recommendations(1, depth=2)
        assert 1 not in result

    def test_depth_zero(self, product_graph):
        result = product_graph.get_recommendations(1, depth=0)
        assert result == []

    def test_large_graph(self):
        g = ProductGraph()
        # Create a linear chain: 1-2-3-...-50
        for i in range(1, 50):
            g.add_edge(i, i + 1)
        result = g.get_recommendations(1, depth=2)
        assert 2 in result
        assert 3 in result
        assert 4 not in result  # depth=2 only
