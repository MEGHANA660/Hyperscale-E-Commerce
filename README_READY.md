# HyperScale Commerce - Getting Started

This guide covers how to set up and run the microservices architecture.

## Option 1: Local Setup (Native Python)

This option is best if you want to run services directly on your machine.

### 1. Prerequisites
- Python 3.10+
- **RabbitMQ**: Required for the Notification Service.
  - **Windows**: Download from [RabbitMQ Site](https://www.rabbitmq.com/download.html) (Requires Erlang).
  - **Mac**: `brew install rabbitmq`
  - **Linux**: `sudo apt-get install rabbitmq-server`
- **Other Databases**: You will need PostgreSQL, MongoDB, and Redis running locally if you use the default config.

### 2. Configuration
Copy `.env.example` to `.env` and update your database credentials.
```bash
cp .env.example .env
```

### 3. Run Everything
Use the provided master script to install dependencies and start all services:
```bash
python setup_and_run.py
```

---

## Option 2: Containerized (Docker Compose) - HIGHLY RECOMMENDED

This is the easiest way to run everything (including databases) in one command.

### 1. Prerequisites
- Docker and Docker Compose installed.

### 2. Startup
Run the following at the project root:
```bash
docker-compose up --build
```
This will start all 8 microservices, RabbitMQ, Redis, PostgreSQL, and MongoDB.

---

## Verification

### 1. Check Service Health
Visit the following URLs in your browser to verify connectivity:
- **API Gateway**: [http://localhost:5000/health](http://localhost:5000/health)
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672) (User/Pass: guest/guest)

### 2. Test Notification Service (Celery)
Send a POST request to the Gateway or direct to the service:
```bash
curl -X POST "http://localhost:5007/notify?user_id=1&message=Welcome&type=email"
```
Check your console/docker logs to see the Celery worker processing the task.
