# HyperScale Commerce Setup Guide

Follow these steps to get your 8 microservices running in parallel on Windows.

##  Prerequisites

1.  **Python 3.10+**: Ensure Python is in your PATH.
    *   Test: `python --version`
2.  **Docker Desktop**: Required for infrastructure (RabbitMQ, Postgres, MongoDB, etc.).
    *   Test: `docker compose version`
3.  **RabbitMQ & Redis**: These are started inside Docker. Celery and Notification services depend on them.

## Setup Steps

### 1. Initialize Infrastructure
Open a terminal in the project root and run:
```powershell
docker-compose up -d
```
This will start Postgres, MongoDB, Redis, and RabbitMQ.

### 2. Run the Orchestrator
You can start all 8 services and the Celery worker with a single command:
*   **Option A (Recommended)**: Double-click `start_all.bat`.
*   **Option B (Console)**: Run `python run_all_services.py`.

The script will automatically:
- Install missing `requirements.txt` for each service.
- Start all microservices in parallel.
- Stream all logs to your console with service-specific prefixes.

### 3. Verify Success
Once the logs show services have started, open a new terminal and run:
```powershell
python smoke_test.py
```
If you see all ✅ ONLINE, your system is fully functional!

## Accessing Services
- **API Gateway**: [http://localhost:5000](http://localhost:5000)
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (guest/guest)
- **Service Ports**: 5000 (Gateway) through 5007 (Notification).
