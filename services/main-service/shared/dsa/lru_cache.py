class Node:
    """Doubly Linked List Node"""
    def __init__(self, key: any, value: any):
        self.key = key
        self.value = value
        self.prev = None
        self.next = None

class LRUCache:
    """
    Least Recently Used (LRU) Cache implementation.
    Time Complexity: O(1) for both get and put operations.
    Space Complexity: O(capacity) to store characters in hash map and doubly linked list.
    """
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}  # Map key to Node
        # Dummy head and tail nodes to avoid edge cases
        self.head = Node(0, 0)
        self.tail = Node(0, 0)
        self.head.next = self.tail
        self.tail.prev = self.head

    def _remove(self, node: Node):
        """Remove an existing node from the linked list."""
        prev = node.prev
        new_next = node.next
        prev.next = new_next
        new_next.prev = prev

    def _add_to_front(self, node: Node):
        """Add a new node right after the head (most recently used)."""
        node.next = self.head.next
        node.prev = self.head
        self.head.next.prev = node
        self.head.next = node

    def get(self, key: any) -> any:
        """
        Return the value of the key if it exists, otherwise return -1.
        Moves the accessed node to the front (MRU).
        """
        if key in self.cache:
            node = self.cache[key]
            self._remove(node)
            self._add_to_front(node)
            return node.value
        return -1

    def put(self, key: any, value: any) -> None:
        """
        Update the value of the key if it exists, or insert the key.
        If capacity is reached, evict the least recently used item (near tail).
        """
        if key in self.cache:
            self._remove(self.cache[key])
        
        new_node = Node(key, value)
        self._add_to_front(new_node)
        self.cache[key] = new_node

        if len(self.cache) > self.capacity:
            # Evict from tail
            lru = self.tail.prev
            self._remove(lru)
            del self.cache[lru.key]

    def size(self) -> int:
        return len(self.cache)
