import logging
import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import json
import os

class CoreLogger:
    """
    Centralized logging system that pipes logs to MongoDB for persistent analysis.
    Used by the Gateway and other microservices.
    """
    def __init__(self, service_name: str, mongo_uri: str = None):
        self.service_name = service_name
        self.mongo_uri = mongo_uri or os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.client = None
        self.db = None
        self.collection = None
        
        # Standard python logging setup
        self.logger = logging.getLogger(service_name)
        self.logger.setLevel(logging.INFO)
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)

    async def connect(self):
        """Connect to MongoDB for logging."""
        try:
            self.client = AsyncIOMotorClient(self.mongo_uri)
            self.db = self.client["hyperscale_logs"]
            self.collection = self.db["logs"]
            self.logger.info(f"Connected to MongoDB logs for service: {self.service_name}")
        except Exception as e:
            self.logger.error(f"Failed to connect to MongoDB: {e}")

    async def log(self, level: str, message: str, extra: dict = None):
        """Log a message to both console and MongoDB."""
        log_entry = {
            "timestamp": datetime.datetime.utcnow(),
            "service": self.service_name,
            "level": level.upper(),
            "message": message,
            "extra": extra or {}
        }
        
        # Log to terminal
        if level.upper() == "INFO":
            self.logger.info(message)
        elif level.upper() == "ERROR":
            self.logger.error(message)
        elif level.upper() == "WARNING":
            self.logger.warning(message)

        # Log to MongoDB if connected
        if self.collection is not None:
            try:
                await self.collection.insert_one(log_entry)
            except Exception as e:
                self.logger.warning(f"Failed to write log to MongoDB: {e}")

    async def info(self, message: str, extra: dict = None):
        await self.log("INFO", message, extra)

    async def error(self, message: str, extra: dict = None):
        await self.log("ERROR", message, extra)

    async def warning(self, message: str, extra: dict = None):
        await self.log("WARNING", message, extra)
