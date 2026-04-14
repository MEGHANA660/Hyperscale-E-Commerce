from collections import deque

class ProductGraph:
    """
    Adjacency List Graph for product relationships.
    Time Complexity: O(V + E) for BFS.
    Use Case: "Customers also bought" recommendations.
    """
    def __init__(self):
        self.graph = {} # product_id -> set([related_product_ids])

    def add_edge(self, p1: int, p2: int):
        """Add an undirected edge between two products (bought together)."""
        if p1 not in self.graph:
            self.graph[p1] = set()
        if p2 not in self.graph:
            self.graph[p2] = set()
            
        self.graph[p1].add(p2)
        self.graph[p2].add(p1)

    def get_recommendations(self, product_id: int, depth: int = 2) -> list:
        """
        Find related products using Breadth-First Search (BFS).
        Returns a list of unique product IDs found within 'depth' degrees.
        """
        if product_id not in self.graph:
            return []

        visited = {product_id}
        queue = deque([(product_id, 0)])
        recommendations = []

        while queue:
            current_id, current_depth = queue.popleft()
            
            if current_depth > 0:
                recommendations.append(current_id)
            
            if current_depth < depth:
                for neighbor in self.graph.get(current_id, []):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, current_depth + 1))
        
        return recommendations
