# Troubleshooting Guide

## Common Errors & Solutions

### 1. "Python can't find requirements.txt"
- **Cause**: The old script was looking in the wrong directories.
- **Fix**: Use the new `run_all_services.py` or `start_all.bat`. They are designed to find the specific requirements file for each service.

### 2. "ConnectionRefusedError" (RabbitMQ/Celery)
- **Cause**: RabbitMQ isn't fully started when the service tries to connect.
- **Fix**: Wait 30 seconds after `docker-compose up -d`. You can check the status at [http://localhost:15672](http://localhost:15672).

### 3. "Port already in use" (Error 10048)
- **Cause**: Another service (or an old instance) is using port 5000-5007.
- **Fix**: 
    1. Run `netstat -ano | findstr :500` to find the Process ID (PID).
    2. Kill the process: `taskkill /F /PID <PID>`.

### 4. Celery Worker not receiving tasks
- **Cause**: On Windows, Celery needs the `-P solo` or `-P gevent` flag to work reliably.
- **Fix**: The new `run_all_services.py` already includes the `--pool=solo` flag for stability.

### 5. "ModuleNotFoundError: No module named 'shared'"
- **Cause**: The `PYTHONPATH` is not set to the root directory.
- **Fix**: The new orchestrator automatically sets `PYTHONPATH` to the project root before launching each service.

## Health Check Quick Reference
| Service | Local URL |
| :--- | :--- |
| API Gateway | http://localhost:5000/health |
| Notification | http://localhost:5007/health |
| RabbitMQ UI | http://localhost:15672 |
