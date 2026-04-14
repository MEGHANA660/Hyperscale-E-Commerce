from celery import Celery
import os
import time

# Celery Configuration
CELERY_BROKER_URL = os.getenv("RABBITMQ_URL", "pyamqp://guest:guest@localhost:5672//")
celery_app = Celery("notifications", broker=CELERY_BROKER_URL)

@celery_app.task(name="send_notification")
def send_notification(user_id: int, message: str, type: str = "email"):
    """
    Simulated notification task. In production, this would use
    SendGrid, Twilio, or another provider.
    """
    print(f"--- Sending {type} to user {user_id} ---")
    print(f"Message: {message}")
    # Simulate work
    time.sleep(2)
    print(f"--- {type} sent successfully ---")
    return True
