from fastapi import FastAPI, Request, Response, HTTPException
import httpx
import os
import time

from shared.core_logger.logger import CoreLogger

app = FastAPI(title="HyperScale API Gateway")

# Initialize Core Logger
logger = CoreLogger("api-gateway")

# Microservice URL mappings
SERVICES = {
    "user": os.getenv("USER_SERVICE_URL", "http://localhost:8001"),
    "product": os.getenv("PRODUCT_SERVICE_URL", "http://localhost:8002"),
}

@app.on_event("startup")
async def startup_event():
    await logger.connect()
    await logger.info("API Gateway started.")

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    
    await logger.info(
        f"Request: {request.method} {request.url.path} - {response.status_code}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "status_code": response.status_code,
            "latency_ms": process_time * 1000
        }
    )
    
    return response

@app.get("/health")
def health_check():
    return {"status": "gateway-online"}

@app.api_route("/{service}/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def gateway(service: str, path: str, request: Request):
    if service not in SERVICES:
        raise HTTPException(status_code=404, detail="Service not found")
    
    target_url = f"{SERVICES[service]}/{path}"
    
    async with httpx.AsyncClient() as client:
        req_params = {
            "method": request.method,
            "url": target_url,
            "headers": dict(request.headers),
            "content": await request.body(),
            "params": dict(request.query_params)
        }
        
        if "host" in req_params["headers"]:
            del req_params["headers"]["host"]
            
        proxy_resp = await client.request(**req_params)
        
        return Response(
            content=proxy_resp.content,
            status_code=proxy_resp.status_code,
            headers=dict(proxy_resp.headers)
        )
