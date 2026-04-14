import subprocess
import sys
import os
import time
import signal

# Configuration
SERVICES = [
    {"name": "API Gateway", "dir": "services/main-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5000", "--host", "0.0.0.0"]},
    {"name": "User Service", "dir": "services/user-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5001", "--host", "0.0.0.0"]},
    {"name": "Product Service", "dir": "services/product-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5002", "--host", "0.0.0.0"]},
    {"name": "Inventory Service", "dir": "services/inventory-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5003", "--host", "0.0.0.0"]},
    {"name": "Order Service", "dir": "services/order-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5004", "--host", "0.0.0.0"]},
    {"name": "Recommendation Service", "dir": "services/recommendation-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5005", "--host", "0.0.0.0"]},
    {"name": "Analytics Service", "dir": "services/analytics-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5006", "--host", "0.0.0.0"]},
    {"name": "Notification Service", "dir": "services/notification-service/app", "cmd": [sys.executable, "-m", "uvicorn", "main:app", "--port", "5007", "--host", "0.0.0.0"]},
    {"name": "Celery Worker", "dir": "services/notification-service/app", "cmd": [sys.executable, "-m", "celery", "-A", "worker.celery_app", "worker", "--loglevel=info"]},
]

processes = []

def install_dependencies():
    print("--- Installing Dependencies from master_requirements.txt ---")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "master_requirements.txt"])
        print("--- Dependencies installed successfully ---\n")
    except subprocess.CalledProcessError as e:
        print(f"Error installing dependencies: {e}")
        sys.exit(1)

def signal_handler(sig, frame):
    print("\n--- Stopping all services ---")
    for p in processes:
        p.terminate()
    sys.exit(0)

def main():
    # Install dependencies first
    if "--no-install" not in sys.argv:
        install_dependencies()
    else:
        print("Skipping dependency installation...")

    signal.signal(signal.SIGINT, signal_handler)

    print("--- Starting Microservices ---")
    base_path = os.getcwd()
    
    # Set PYTHONPATH to include the root directory so shared/ modules can be found
    os.environ["PYTHONPATH"] = base_path + os.pathsep + os.environ.get("PYTHONPATH", "")

    for service in SERVICES:
        print(f"Starting {service['name']}...")
        service_dir = os.path.join(base_path, service['dir'])
        
        # Determine the CWD for the process (usually the 'app' directory or service root)
        # We'll run from the service root so internal imports work if they aren't absolute from root
        cwd = os.path.dirname(service_dir) 
        
        # Actually, many services use 'from shared...' which needs root in path.
        # Let's run from root to be safe, specifying the module path
        
        rel_module_path = service['dir'].replace("/", ".").replace("\\", ".")
        # If the command is uvicorn, we can pass it as a module
        
        p = subprocess.Popen(
            service['cmd'],
            cwd=base_path, # Run everything from project root
            env=os.environ.copy()
        )
        processes.append(p)
        time.sleep(1) # Small delay between starts

    print("\n--- All services are running. Press Ctrl+C to stop. ---")
    
    try:
        while True:
            time.sleep(1)
            # Check if any process has died
            for i, p in enumerate(processes):
                if p.poll() is not None:
                    print(f"Warning: {SERVICES[i]['name']} has stopped with exit code {p.returncode}")
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    main()
