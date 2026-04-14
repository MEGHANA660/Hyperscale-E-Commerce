from fastapi import FastAPI

from .worker import send_notification
from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale Notification Service")

# Initialize Core Logger
logger = CoreLogger("notification-service")

@app.on_event("startup")
async def startup_event():
    await logger.connect()
    await logger.info("Notification Service started.")

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/notify")
async def trigger_notification(user_id: int, message: str, type: str = "email"):
    """
    Trigger an asynchronous notification task using Celery.
    """
    task = send_notification.delay(user_id, message, type)
    await logger.info(f"Notification task queued: {task.id}")
    return {"message": "Notification queued", "task_id": task.id}
