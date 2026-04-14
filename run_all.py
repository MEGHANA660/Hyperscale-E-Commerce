import subprocess
import time
import sys
import os

SERVICES = [
    {"name": "Main Service (Gateway)", "port": 8000, "dir": "services/main-service"},
    {"name": "User Service", "port": 8001, "dir": "services/user-service"},
    {"name": "Product Service", "port": 8002, "dir": "services/product-service"},
    {"name": "Order Service", "port": 8004, "dir": "services/order-service"},
    {"name": "Inventory Service", "port": 8006, "dir": "services/inventory-service"},
    {"name": "Recommendation Service", "port": 8007, "dir": "services/recommendation-service"},
    {"name": "Analytics Service", "port": 8008, "dir": "services/analytics-service"},
    {"name": "Notification Service", "port": 8009, "dir": "services/notification-service"},
]

def run_services():
    processes = []
    print("--- HyperScale Commerce: Master Orchestrator ---")
    
    # 1. Start Infrastructure (Assuming Docker is installed)
    print("\n[1/3] Starting Infrastructure (Docker Compose)...")
    try:
        subprocess.Popen(["docker-compose", "up", "-d"])
        print("✅ Docker Compose command sent.")
    except Exception as e:
        print(f"⚠️ Could not run docker-compose: {e}. Ensure Docker Desktop is running.")

    time.sleep(2)

    # 2. Start Microservices
    print("\n[2/3] Launching Microservices...")
    for service in SERVICES:
        cmd = [
            "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", str(service["port"]),
            "--reload"
        ]
        
        cwd = os.path.join(os.getcwd(), service["dir"])
        
        try:
            # We use subprocess.Popen to let them run in background
            p = subprocess.Popen(
                cmd, 
                cwd=cwd, 
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL
            )
            processes.append(p)
            print(f"🚀 {service['name']} starting on port {service['port']}...")
        except Exception as e:
            print(f"❌ Failed to start {service['name']}: {e}")

    print("\n[3/3] System Startup Complete.")
    print("-" * 40)
    print("Services are warming up... Run 'python smoke_test.py' in 10 seconds.")
    print("-" * 40)
    print("Press Ctrl+C to stop all services.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutting down all services...")
        for p in processes:
            p.terminate()
        print("Done.")

if __name__ == "__main__":
    run_services()
