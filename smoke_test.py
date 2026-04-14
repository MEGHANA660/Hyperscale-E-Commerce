import requests
import time

SERVICES = [
    {"name": "API Gateway", "url": "http://localhost:5000/health"},
    {"name": "User Service", "url": "http://localhost:5001/health"},
    {"name": "Product Service", "url": "http://localhost:5002/health"},
    {"name": "Order Service", "url": "http://localhost:5004/orders/queue"},
    {"name": "Inventory Service", "url": "http://localhost:5003/health"},
    {"name": "Recommendation Service", "url": "http://localhost:5005/recommendations/1"},
    {"name": "Analytics Service", "url": "http://localhost:5006/analytics/stock/range?low_idx=0&high_idx=10"},
    {"name": "Notification Service", "url": "http://localhost:5007/health"},
]

def run_smoke_test():
    print("--- HyperScale Commerce: Connectivity Smoke Test ---")
    
    all_passed = True
    for service in SERVICES:
        print(f"Checking {service['name']}... ", end="", flush=True)
        try:
            resp = requests.get(service["url"], timeout=5)
            if resp.status_code in [200, 201]:
                print("✅ ONLINE")
            else:
                print(f"❌ ERROR ({resp.status_code})")
                all_passed = False
        except Exception as e:
            print("❌ OFFLINE")
            all_passed = False

    print("-" * 40)
    if all_passed:
        print("RESULT: All services are successfully communicating! 🚀")
    else:
        print("RESULT: Some services are unreachable. Ensure 'run_all.py' is running.")
    print("-" * 40)

if __name__ == "__main__":
    run_smoke_test()
