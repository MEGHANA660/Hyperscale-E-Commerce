import sys
import os
import requests
import time

# Services URLs (Assumes local dev without gateway for seeding)
PRODUCT_SERVICE_URL = "http://localhost:8002"

products = [
    {"name": "Gaming Laptop", "price": 1200.0, "description": "High performance gaming laptop with NVIDIA RTX 4080."},
    {"name": "MacBook Pro", "price": 2400.0, "description": "Apple M3 Pro chip, 14-inch Display."},
    {"name": "Mechanical Keyboard", "price": 150.0, "description": "RGB backlit mechanical keyboard with blue switches."},
    {"name": "Wireless Mouse", "price": 50.0, "description": "Ergonomic wireless mouse with 25k DPI."},
    {"name": "4K Monitor", "price": 400.0, "description": "32-inch 4K UHD monitor with HDR support."},
    {"name": "UltraWide Monitor", "price": 800.0, "description": "49-inch curved ultrawide monitor for multitasking."},
    {"name": "Desk Lamp", "price": 30.0, "description": "LED desk lamp with adjustable brightness."},
    {"name": "Gaming Chair", "price": 300.0, "description": "Ergonomic gaming chair with lumbar support."},
]

def seed_products():
    print(f"Seeding {len(products)} products to {PRODUCT_SERVICE_URL}...")
    for p in products:
        try:
            resp = requests.post(f"{PRODUCT_SERVICE_URL}/products", params=p)
            if resp.status_code == 200:
                print(f"✅ Created: {p['name']}")
            else:
                print(f"❌ Failed: {p['name']} - {resp.text}")
        except Exception as e:
            print(f"❌ Connection error: {e}")

if __name__ == "__main__":
    seed_products()
