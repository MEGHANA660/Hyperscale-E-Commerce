class MinHeap:
    """
    Min Heap (Binary Heap) implementation for priority queues.
    Time Complexity: O(log n) for push and pop.
    Use Case: Priority-based order processing (Express > Premium > Standard).
    """
    def __init__(self):
        self.heap = []

    def push(self, priority: int, data: any):
        """Add an item to the heap with a given priority."""
        self.heap.append((priority, data))
        self._bubble_up(len(self.heap) - 1)

    def pop(self) -> tuple:
        """Remove and return the item with the minimum priority value (highest priority)."""
        if not self.heap:
            return None
        if len(self.heap) == 1:
            return self.heap.pop()
        
        root = self.heap[0]
        self.heap[0] = self.heap.pop()
        self._bubble_down(0)
        return root

    def peek(self):
        return self.heap[0] if self.heap else None

    def size(self):
        return len(self.heap)

    def is_empty(self):
        return len(self.heap) == 0

    def _bubble_up(self, index):
        parent_index = (index - 1) // 2
        if index > 0 and self.heap[index][0] < self.heap[parent_index][0]:
            self.heap[index], self.heap[parent_index] = self.heap[parent_index], self.heap[index]
            self._bubble_up(parent_index)

    def _bubble_down(self, index):
        left_child = 2 * index + 1
        right_child = 2 * index + 2
        smallest = index

        if left_child < len(self.heap) and self.heap[left_child][0] < self.heap[smallest][0]:
            smallest = left_child
        
        if right_child < len(self.heap) and self.heap[right_child][0] < self.heap[smallest][0]:
            smallest = right_child

        if smallest != index:
            self.heap[index], self.heap[smallest] = self.heap[smallest], self.heap[index]
            self._bubble_down(smallest)
