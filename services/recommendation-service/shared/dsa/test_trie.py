import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from shared.dsa.trie import Trie

def test_trie():
    print("Testing Trie Search...")
    trie = Trie()
    
    products = [
        (1, "Laptop"),
        (2, "Lamp"),
        (3, "Latex Gloves"),
        (4, "Latex Paint"),
        (5, "Iphone"),
        (6, "Ipad")
    ]
    
    for pid, name in products:
        trie.insert(name, pid)
        
    print("Searching for 'La':")
    la_results = trie.search("La")
    print(f"Suggestions: {la_results}")
    assert len(la_results) > 0
    
    print("Searching for 'Ip':")
    ip_results = trie.search("Ip")
    print(f"Suggestions: {ip_results}")
    assert len(ip_results) == 2
    
    print("Deep search 'Latex':")
    latex_words = trie.get_all_with_prefix("Latex")
    print(f"Words: {latex_words}")
    assert "latex gloves" in latex_words
    
    print("Trie tests passed! ✅")

if __name__ == "__main__":
    test_trie()
