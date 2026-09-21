import subprocess
import time
import sys
import os

SERVICES = [
    {"name": "API Gateway", "port": 5000, "dir": "services/main-service"},
    {"name": "User Service", "port": 5001, "dir": "services/user-service"},
    {"name": "Product Service", "port": 5002, "dir": "services/product-service"},
    {"name": "Inventory Service", "port": 5003, "dir": "services/inventory-service"},
    {"name": "Order Service", "port": 5004, "dir": "services/order-service"},
    {"name": "Recommendation Service", "port": 5005, "dir": "services/recommendation-service"},
    {"name": "Analytics Service", "port": 5006, "dir": "services/analytics-service"},
    {"name": "Notification Service", "port": 5007, "dir": "services/notification-service"},
    {"name": "Auth Service", "port": 5008, "dir": "services/auth-service"},
    {"name": "Cart Service", "port": 5009, "dir": "services/cart_service"},
    {"name": "Payment Service", "port": 5010, "dir": "services/payment_service"},
    {"name": "Review Service", "port": 5011, "dir": "services/review_service"},
]

def run_services():
    processes = []
    print("=" * 60)
    print("--- HyperScale Commerce: Master Orchestrator ---")
    print("=" * 60)
    
    # 1. Start Infrastructure (PostgreSQL, MongoDB, Redis, RabbitMQ)
    print("\n[1/3] Starting Infrastructure (Docker Compose)...")
    try:
        res = subprocess.run(["docker-compose", "up", "-d", "postgres", "mongodb", "redis", "rabbitmq"], check=False)
        if res.returncode == 0:
            print("✅ Docker infrastructure containers started.")
        else:
            print("⚠️ Docker Compose returned non-zero. Ensure Docker Desktop is running.")
    except Exception as e:
        print(f"⚠️ Could not run docker-compose: {e}. Ensure Docker Desktop is running.")

    print("Waiting 5s for databases and queues to initialize...")
    time.sleep(5)

    # 2. Start Microservices
    print("\n[2/3] Launching Microservices...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for service in SERVICES:
        cmd = [
            sys.executable,
            "-m", "uvicorn", 
            "app.main:app", 
            "--host", "0.0.0.0", 
            "--port", str(service["port"])
        ]
        
        cwd = os.path.join(base_dir, service["dir"])
        if not os.path.exists(cwd):
            print(f"⚠️ Skipping missing directory: {cwd}")
            continue
            
        env = os.environ.copy()
        env["PYTHONPATH"] = f"{base_dir}{os.pathsep}{cwd}"
        
        try:
            p = subprocess.Popen(
                cmd, 
                cwd=cwd, 
                env=env,
                stdout=subprocess.DEVNULL, 
                stderr=subprocess.DEVNULL
            )
            processes.append(p)
            print(f"🚀 {service['name']} starting on port {service['port']}...")
        except Exception as e:
            print(f"❌ Failed to start {service['name']}: {e}")

    print("\n[3/3] System Startup Complete.")
    print("-" * 60)
    print("Services are warming up... Run 'python smoke_test.py' to verify.")
    print("-" * 60)
    print("Press Ctrl+C to stop all local services.\n")

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
