import hashlib
import math

class BloomFilter:
    """
    Bloom Filter implementation for probabilistic existence checks.
    Time Complexity: O(k) for add/check where k is number of hash functions.
    Benefit: Instantly rejects queries for non-existent items with 0% false negatives.
    """
    def __init__(self, expected_elements: int = 10000, false_positive_rate: float = 0.05):
        # Calculate optimal size (m) and number of hash functions (k)
        self.size = self._get_size(expected_elements, false_positive_rate)
        self.hash_count = self._get_hash_count(self.size, expected_elements)
        self.bit_array = [0] * self.size

    def _get_size(self, n, p):
        """Calculate the size of bit array."""
        m = -(n * math.log(p)) / (math.log(2)**2)
        return int(m)

    def _get_hash_count(self, m, n):
        """Calculate the number of hash functions."""
        k = (m / n) * math.log(2)
        return int(k)

    def _hashes(self, item):
        """Generate k different hashes for an item using salt with MD5."""
        hashes = []
        for i in range(self.hash_count):
            # Dynamic salting for multiple hash functions
            res = hashlib.md5((str(item) + str(i)).encode())
            hashes.append(int(res.hexdigest(), 16) % self.size)
        return hashes

    def add(self, item):
        """Add an item to the Bloom Filter."""
        for h in self._hashes(item):
            self.bit_array[h] = 1

    def exists(self, item) -> bool:
        """
        Check if an item might exist.
        Returns False if definitely doesn't exist.
        Returns True if it might exist (probabilistic).
        """
        for h in self._hashes(item):
            if self.bit_array[h] == 0:
                return False
        return True
