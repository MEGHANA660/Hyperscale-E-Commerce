import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.dsa.lru_cache import LRUCache
import time

def test_lru_cache():
    print("Testing LRU Cache...")
    cache = LRUCache(3)
    
    cache.put(1, "User A")
    cache.put(2, "User B")
    cache.put(3, "User C")
    
    assert cache.get(1) == "User A"
    print("Accessed 1, moving to MRU")
    
    cache.put(4, "User D")
    print("Added 4, should evict 2 (LRU)")
    
    assert cache.get(2) == -1
    assert cache.get(3) == "User C"
    assert cache.get(4) == "User D"
    assert cache.get(1) == "User A"
    
    print("LRU Cache tests passed! ✅")

if __name__ == "__main__":
    # Add project root to sys path to allow shared imports if running directly
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    test_lru_cache()
