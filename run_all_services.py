import subprocess
import os
import sys
import time
import threading
from concurrent.futures import ThreadPoolExecutor

# Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICES_DIR = os.path.join(BASE_DIR, "services")

SERVICES = [
    {"name": "main-service", "port": 5000, "module": "services.main-service.app.main:app"},
    {"name": "user-service", "port": 5001, "module": "services.user-service.app.main:app"},
    {"name": "product-service", "port": 5002, "module": "services.product-service.app.main:app"},
    {"name": "inventory-service", "port": 5003, "module": "services.inventory-service.app.main:app"},
    {"name": "order-service", "port": 5004, "module": "services.order-service.app.main:app"},
    {"name": "recommendation-service", "port": 5005, "module": "services.recommendation-service.app.main:app"},
    {"name": "analytics-service", "port": 5006, "module": "services.analytics-service.app.main:app"},
    {"name": "notification-service", "port": 5007, "module": "services.notification-service.app.main:app"},
    {"name": "notification-worker", "type": "celery", "module": "services.notification-service.app.worker.celery_app"},
]

processes = []

def log_output(pipe, prefix):
    for line in iter(pipe.readline, b''):
        print(f"[{prefix}] {line.decode().strip()}")

def run_service(service):
    env = os.environ.copy()
    env["PYTHONPATH"] = BASE_DIR
    
    # Install dependencies first
    req_file = os.path.join(SERVICES_DIR, service['name'].replace("-worker", ""), "requirements.txt")
    if os.path.exists(req_file):
        print(f"--- Installing deps for {service['name']} ---")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", req_file])

    if service.get("type") == "celery":
        cmd = [sys.executable, "-m", "celery", "-A", service["module"], "worker", "--loglevel=info", "-P", "solo"]
    else:
        cmd = [sys.executable, "-m", "uvicorn", service["module"], "--host", "0.0.0.0", "--port", str(service["port"])]

    print(f"🚀 Starting {service['name']}...")
    p = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        env=env,
        cwd=BASE_DIR
    )
    processes.append(p)
    
    # Start logging thread
    threading.Thread(target=log_output, args=(p.stdout, service['name']), daemon=True).start()

def main():
    print("=" * 60)
    print("HYPERSCALE COMMERCE - MICROSERVICES ORCHESTRATOR")
    print("=" * 60)

    # 1. Check for infrastructure (Optional, but recommended)
    print("\nEnsuring infrastructure is up (Docker Compose)...")
    try:
        subprocess.run(["docker-compose", "up", "-d"], check=False)
        print("✅ Docker services are running background.")
    except Exception:
        print("⚠️ Docker Compose not found or failed. Ensure Redis, RabbitMQ, and DBs are running manually.")

    # 2. Run services in parallel
    with ThreadPoolExecutor(max_workers=len(SERVICES)) as executor:
        for service in SERVICES:
            executor.submit(run_service, service)
            time.sleep(1) # Stagger starts slightly

    print("\n" + "=" * 60)
    print("ALL SERVICES INITIALIZED. Press Ctrl+C to stop.")
    print("=" * 60 + "\n")

    try:
        while True:
            time.sleep(1)
            # Check if any process died
            for p in processes:
                if p.poll() is not None:
                    # Find service name
                    idx = processes.index(p)
                    print(f"❌ WARNING: Service {SERVICES[idx]['name']} died with exit code {p.returncode}")
                    processes.remove(p)
    except KeyboardInterrupt:
        print("\nStopping all services...")
        for p in processes:
            p.terminate()
        print("Cleanup complete.")

if __name__ == "__main__":
    main()
