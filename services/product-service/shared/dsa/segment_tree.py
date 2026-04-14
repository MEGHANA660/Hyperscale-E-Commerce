class SegmentTree:
    """
    Segment Tree for range queries and point updates.
    Time Complexity: O(log n) for build, update, and query.
    Use Case: Inventory analytics (e.g. range-based stock levels).
    """
    def __init__(self, data: list):
        self.n = len(data)
        # Tree size is approximately 4 * n
        self.tree = [0] * (4 * self.n)
        if self.n > 0:
            self._build(data, 1, 0, self.n - 1)

    def _build(self, data, node, start, end):
        if start == end:
            self.tree[node] = data[start]
            return
        
        mid = (start + end) // 2
        self._build(data, 2 * node, start, mid)
        self._build(data, 2 * node + 1, mid + 1, end)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def update(self, idx, val):
        """Update value at index idx to val."""
        if self.n == 0: return
        self._update(1, 0, self.n - 1, idx, val)

    def _update(self, node, start, end, idx, val):
        if start == end:
            self.tree[node] = val
            return
        
        mid = (start + end) // 2
        if start <= idx <= mid:
            self._update(2 * node, start, mid, idx, val)
        else:
            self._update(2 * node + 1, mid + 1, end, idx, val)
        self.tree[node] = self.tree[2 * node] + self.tree[2 * node + 1]

    def query(self, L, R):
        """Query sum in range [L, R]."""
        if self.n == 0: return 0
        return self._query(1, 0, self.n - 1, L, R)

    def _query(self, node, start, end, L, R):
        if R < start or end < L:
            return 0
        if L <= start and end <= R:
            return self.tree[node]
        
        mid = (start + end) // 2
        p1 = self._query(2 * node, start, mid, L, R)
        p2 = self._query(2 * node + 1, mid + 1, end, L, R)
        return p1 + p2
