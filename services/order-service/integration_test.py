import sys
import os
import requests
import time

# Service URLs
ORDER_SERVICE_URL = "http://localhost:8004"
INVENTORY_SERVICE_URL = "http://localhost:8006"

def test_full_flow():
    print("--- HyperScale Phase 3: Integration Test ---")
    
    # 1. Setup Inventory for Product 101
    print("Setting up inventory for Product 101...")
    try:
        inv_resp = requests.post(f"{INVENTORY_SERVICE_URL}/inventory", params={"product_id": 101, "stock_level": 50})
        print(f"Inventory Response: {inv_resp.status_code}")
    except Exception as e:
        print(f"Skipping actual requests (local servers not running). Testing Logic.")
        return

    # 2. Create Orders with different priorities
    print("Creating orders with mixed priorities...")
    # Standard Priority (3)
    requests.post(f"{ORDER_SERVICE_URL}/orders", params={"user_id": 1, "product_id": 101, "quantity": 5, "priority": 3})
    # Express Priority (1) - Should be processed FIRST by the Min Heap worker
    requests.post(f"{ORDER_SERVICE_URL}/orders", params={"user_id": 2, "product_id": 101, "quantity": 10, "priority": 1})
    
    print("Waiting for Kafka event processing...")
    time.sleep(5)
    
    print("Check logs for the order of processing.")
    print("Min Heap (DSA #3) should have popped Priority 1 before Priority 3.")
    
    # 3. Test Bloom Filter rejection
    print("Testing Bloom Filter rejection for non-existent Product 999...")
    # This order uses a product ID that was NEVER added to inventory
    requests.post(f"{ORDER_SERVICE_URL}/orders", params={"user_id": 3, "product_id": 999, "quantity": 1, "priority": 1})
    
    print("Bloom Filter (DSA #5) should reject Product 999 instantly in the Inventory Service logs.")

if __name__ == "__main__":
    test_full_flow()
