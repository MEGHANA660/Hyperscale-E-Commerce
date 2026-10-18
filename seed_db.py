"""
seed_db.py — Idempotent Database Seed Script for HyperScale Commerce
Seeds PostgreSQL with:
- 45 realistic products across 6 categories (Laptops, Phones, Electronics, Home & Living, Fashion, Beauty)
- Prices in Indian Rupees (INR), realistic stock, and high-quality Unsplash image URLs
- Seed users: 1 Admin ('admin'), 1 Customer ('alice_dev')
- Realistic order history for Alice and Admin
Run: python seed_db.py
"""

import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/hyperscale"
)

# 45 Realistic Products across 6 categories
PRODUCTS = [
    # --- 1. Laptops (8 products) ---
    {"id": 1, "name": 'MacBook Pro 16" M3 Max', "price": 149999.0, "category": "Laptops", "stock": 45, "rating": 4.9,
     "description": "Apple M3 Max chip with 16-core CPU, 40-core GPU, 36GB unified memory, 1TB SSD storage, Liquid Retina XDR.",
     "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"},
    {"id": 2, "name": "Dell XPS 15 OLED", "price": 119999.0, "category": "Laptops", "stock": 35, "rating": 4.7,
     "description": "Intel Core i9 13th Gen, 32GB DDR5 RAM, 1TB NVMe SSD, 15.6-inch 3.5K OLED InfinityEdge touch display.",
     "image_url": "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=800&q=80"},
    {"id": 3, "name": "ThinkPad X1 Carbon Gen 11", "price": 125000.0, "category": "Laptops", "stock": 30, "rating": 4.8,
     "description": "Ultralight business laptop with carbon-fiber chassis, Intel Evo Core i7, 16GB RAM, 512GB SSD, Dolby Vision.",
     "image_url": "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80"},
    {"id": 4, "name": "ASUS ROG Zephyrus G14", "price": 139999.0, "category": "Laptops", "stock": 20, "rating": 4.8,
     "description": "AMD Ryzen 9 8945HS, NVIDIA GeForce RTX 4070, 32GB LPDDR5X, 1TB SSD, 14-inch 3K 120Hz OLED gaming display.",
     "image_url": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80"},
    {"id": 5, "name": "HP Spectre x360 2-in-1", "price": 105000.0, "category": "Laptops", "stock": 25, "rating": 4.6,
     "description": "14-inch convertible touchscreen, Intel Core Ultra 7, 16GB RAM, 1TB SSD, Nightfall Black aluminum finish.",
     "image_url": "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=800&q=80"},
    {"id": 6, "name": "MacBook Air 15\" M3", "price": 114900.0, "category": "Laptops", "stock": 50, "rating": 4.8,
     "description": "Strikingly thin design with Apple M3 chip, 16GB unified memory, 512GB SSD, 18-hour battery life, Midnight.",
     "image_url": "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"},
    {"id": 7, "name": "Lenovo Legion Pro 7i", "price": 185000.0, "category": "Laptops", "stock": 15, "rating": 4.9,
     "description": "High-octane esports gaming laptop, Intel i9 14900HX, RTX 4080 12GB, 32GB DDR5, 1TB SSD, 240Hz WQXGA.",
     "image_url": "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80"},
    {"id": 8, "name": "LG Gram 17 SuperSlim", "price": 95000.0, "category": "Laptops", "stock": 28, "rating": 4.5,
     "description": "Weighs only 1.35kg with a massive 17-inch IPS WQXGA display, Intel Core i7, 16GB RAM, 1TB SSD, 80Wh battery.",
     "image_url": "https://images.unsplash.com/photo-1496181130204-755241544e35?auto=format&fit=crop&w=800&q=80"},

    # --- 2. Phones (8 products) ---
    {"id": 9, "name": "iPhone 15 Pro Titanium", "price": 124999.0, "category": "Phones", "stock": 60, "rating": 4.9,
     "description": "Aerospace-grade titanium design, A17 Pro chip, 48MP main camera system, Action button, USB-C 3.",
     "image_url": "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=800&q=80"},
    {"id": 10, "name": "Samsung Galaxy S24 Ultra", "price": 129999.0, "category": "Phones", "stock": 55, "rating": 4.8,
     "description": "Galaxy AI, 200MP camera, built-in S Pen, Titanium frame, Snapdragon 8 Gen 3, 12GB RAM, 256GB storage.",
     "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"},
    {"id": 11, "name": "Google Pixel 8 Pro", "price": 99999.0, "category": "Phones", "stock": 40, "rating": 4.7,
     "description": "Google Tensor G3, pro triple camera system with Super Res Zoom, Temperature sensor, 7 years OS updates.",
     "image_url": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=800&q=80"},
    {"id": 12, "name": "OnePlus 12 5G", "price": 64999.0, "category": "Phones", "stock": 70, "rating": 4.6,
     "description": "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 5400mAh battery with 100W SUPERVOOC charging.",
     "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"},
    {"id": 13, "name": "Samsung Galaxy Z Fold5", "price": 154999.0, "category": "Phones", "stock": 20, "rating": 4.6,
     "description": "Massive 7.6-inch Dynamic AMOLED 2X foldable inner display, multi-window multitasking, Flex mode hinge.",
     "image_url": "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=800&q=80"},
    {"id": 14, "name": "Nothing Phone (2)", "price": 39999.0, "category": "Phones", "stock": 85, "rating": 4.5,
     "description": "Unique transparent Glyph Interface, Snapdragon 8+ Gen 1, dual 50MP Sony sensors, Nothing OS 2.5.",
     "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"},
    {"id": 15, "name": "iPad Air M2 11\"", "price": 59900.0, "category": "Phones", "stock": 65, "rating": 4.8,
     "description": "Apple M2 processor, 11-inch Liquid Retina display, landscape 12MP front camera, Apple Pencil Pro support.",
     "image_url": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80"},
    {"id": 16, "name": "Xiaomi 14 Ultra Leica", "price": 99999.0, "category": "Phones", "stock": 30, "rating": 4.7,
     "description": "Quad 50MP Leica optics with variable aperture, Snapdragon 8 Gen 3, 120Hz LTPO AMOLED, ceramic back.",
     "image_url": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80"},

    # --- 3. Electronics (8 products) ---
    {"id": 17, "name": "Sony WH-1000XM5 Headphones", "price": 29999.0, "category": "Electronics", "stock": 80, "rating": 4.8,
     "description": "Industry-leading noise canceling with two processors and 8 microphones, LDAC Hi-Res Audio, 30hr battery.",
     "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"},
    {"id": 18, "name": "Apple Watch Ultra 2", "price": 79900.0, "category": "Electronics", "stock": 40, "rating": 4.9,
     "description": "Rugged 49mm titanium case, precision dual-frequency GPS, 3000 nits brightest display, 72h low power mode.",
     "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"},
    {"id": 19, "name": "AirPods Pro 2 USB-C", "price": 24900.0, "category": "Electronics", "stock": 120, "rating": 4.8,
     "description": "Active Noise Cancellation with Adaptive Audio, Transparency mode, Personalized Spatial Audio with head tracking.",
     "image_url": "https://images.unsplash.com/photo-1588449668338-d15168822481?auto=format&fit=crop&w=800&q=80"},
    {"id": 20, "name": "Logitech MX Master 3S", "price": 8995.0, "category": "Electronics", "stock": 150, "rating": 4.7,
     "description": "Performance wireless mouse with 8K DPI track-on-glass sensor, quiet clicks, MagSpeed electromagnetic scroll wheel.",
     "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80"},
    {"id": 21, "name": "Keychron Q1 Pro Mechanical Keyboard", "price": 17999.0, "category": "Electronics", "stock": 60, "rating": 4.7,
     "description": "Full aluminum CNC body, 75% layout, hot-swappable mechanical switches, wireless Bluetooth & wired QMK/VIA.",
     "image_url": "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80"},
    {"id": 22, "name": "Dell UltraSharp 27\" 4K Monitor", "price": 42999.0, "category": "Electronics", "stock": 45, "rating": 4.6,
     "description": "IPS Black technology with 2000:1 contrast ratio, 98% DCI-P3 color gamut, USB-C Hub with 90W power delivery.",
     "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80"},
    {"id": 23, "name": "Bose QuietComfort Ultra", "price": 35900.0, "category": "Electronics", "stock": 50, "rating": 4.7,
     "description": "World-class noise cancellation, breakthrough spatialized audio for immersive listening, CustomTune technology.",
     "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"},
    {"id": 24, "name": "DJI Mini 4 Pro Drone", "price": 89999.0, "category": "Electronics", "stock": 25, "rating": 4.9,
     "description": "Under 249g lightweight drone, 4K/60fps HDR True Vertical Shooting, omnidirectional obstacle sensing, 34-min flight.",
     "image_url": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=80"},

    # --- 4. Home & Living (7 products) ---
    {"id": 25, "name": 'Samsung 55" OLED 4K Smart TV', "price": 89990.0, "category": "Home & Living", "stock": 25, "rating": 4.8,
     "description": "Neural Quantum Processor 4K, LaserSlim design, Quantum HDR OLED, Dolby Atmos with Object Tracking Sound.",
     "image_url": "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&w=800&q=80"},
    {"id": 26, "name": "Dyson V15 Detect Cordless Vacuum", "price": 54900.0, "category": "Home & Living", "stock": 35, "rating": 4.7,
     "description": "Laser reveals invisible dust, piezo sensor measures particles, LCD screen shows real-time scientific clean proof.",
     "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"},
    {"id": 27, "name": "Instant Pot Duo 7-in-1", "price": 8999.0, "category": "Home & Living", "stock": 90, "rating": 4.6,
     "description": "Electric pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker and food warmer.",
     "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"},
    {"id": 28, "name": "Philips Airfryer XXL", "price": 14999.0, "category": "Home & Living", "stock": 70, "rating": 4.6,
     "description": "Twin TurboStar rapid air technology removes fat from food, 1.4kg capacity fits a whole chicken, digital display.",
     "image_url": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80"},
    {"id": 29, "name": "Nespresso Vertuo Pop Coffee Machine", "price": 16999.0, "category": "Home & Living", "stock": 60, "rating": 4.5,
     "description": "Centrifusion brewing technology reads barcode on each capsule, brews 4 cup sizes from espresso to mug.",
     "image_url": "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80"},
    {"id": 30, "name": "Sonos Era 100 Smart Speaker", "price": 27999.0, "category": "Home & Living", "stock": 45, "rating": 4.7,
     "description": "Next-gen acoustics with stereo sound and deep bass, Bluetooth and Wi-Fi streaming, Apple AirPlay 2.",
     "image_url": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"},
    {"id": 31, "name": "Dyson Pure Cool Air Purifier", "price": 39900.0, "category": "Home & Living", "stock": 30, "rating": 4.6,
     "description": "HEPA H13 standard sealed filtration captures 99.95% of ultrafine particles, Air Multiplier projection.",
     "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80"},

    # --- 5. Fashion (7 products) ---
    {"id": 32, "name": "Cashmere Knit Sweater", "price": 9999.0, "category": "Fashion", "stock": 80, "rating": 4.7,
     "description": "100% Mongolian pure grade-A cashmere, ultra-soft ribbed collar and cuffs, timeless tailored fit.",
     "image_url": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80"},
    {"id": 33, "name": "Italian Leather Biker Jacket", "price": 24999.0, "category": "Fashion", "stock": 30, "rating": 4.8,
     "description": "Full-grain Italian lambskin leather, asymmetric heavy metal zipper, handcrafted tailored silhouette.",
     "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80"},
    {"id": 34, "name": "Japanese Selvedge Denim Jeans", "price": 8499.0, "category": "Fashion", "stock": 65, "rating": 4.6,
     "description": "14oz raw indigo denim shuttle-loomed in Kojima Japan, copper rivet reinforcements, slim tapered cut.",
     "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"},
    {"id": 35, "name": "Merino Wool Trench Coat", "price": 19999.0, "category": "Fashion", "stock": 25, "rating": 4.9,
     "description": "Double-breasted water-resistant wool trench coat with horn buttons and storm flap, camel tan finish.",
     "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80"},
    {"id": 36, "name": "Nike Air Jordan 1 Retro High", "price": 16995.0, "category": "Fashion", "stock": 50, "rating": 4.8,
     "description": "Iconic basketball silhouette, genuine premium leather upper, encapsulated Air-Sole cushioning.",
     "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80"},
    {"id": 37, "name": "Classic Aviator Sunglasses", "price": 11500.0, "category": "Fashion", "stock": 100, "rating": 4.5,
     "description": "Polarized crystal green G-15 lenses, 24k gold-plated metal frame, 100% UV400 radiation protection.",
     "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80"},
    {"id": 38, "name": "Minimalist Leather Minimal Wallet", "price": 3499.0, "category": "Fashion", "stock": 140, "rating": 4.6,
     "description": "Full-grain vegetable-tanned leather, RFID blocking lining, holds up to 8 cards and folded cash.",
     "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"},

    # --- 6. Beauty (7 products) ---
    {"id": 39, "name": "Advanced Night Repair Serum 50ml", "price": 9200.0, "category": "Beauty", "stock": 75, "rating": 4.8,
     "description": "Patented Chronolux Power Signal Technology reduces signs of aging, deep 72-hour moisture hydration.",
     "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"},
    {"id": 40, "name": "Dior Sauvage Eau de Parfum 100ml", "price": 12500.0, "category": "Beauty", "stock": 60, "rating": 4.9,
     "description": "Calabrian bergamot with woody trail of Ambroxan and smoky Papua New Guinean vanilla absolute.",
     "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80"},
    {"id": 41, "name": "Chanel No. 5 Eau de Parfum 100ml", "price": 14500.0, "category": "Beauty", "stock": 40, "rating": 4.8,
     "description": "Legendary floral aldehyde fragrance bouquet featuring May rose and jasmine from Grasse.",
     "image_url": "https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=800&q=80"},
    {"id": 42, "name": "Dyson Supersonic Hair Dryer", "price": 37900.0, "category": "Beauty", "stock": 35, "rating": 4.8,
     "description": "Fast drying with no extreme heat, intelligent heat control protects shine, 5 magnetic styling attachments.",
     "image_url": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"},
    {"id": 43, "name": "Crème de la Mer Moisturizing Cream", "price": 28500.0, "category": "Beauty", "stock": 25, "rating": 4.7,
     "description": "Infused with cell-renewing Miracle Broth, visibly heals dryness and restores natural radiance.",
     "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80"},
    {"id": 44, "name": "Charlotte Tilbury Pillow Talk Lip Kit", "price": 4800.0, "category": "Beauty", "stock": 110, "rating": 4.7,
     "description": "Iconic universally flattering nude-pink Matte Revolution lipstick and Lip Cheat pencil duo.",
     "image_url": "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80"},
    {"id": 45, "name": "SK-II Facial Treatment Essence 230ml", "price": 19500.0, "category": "Beauty", "stock": 30, "rating": 4.8,
     "description": "Contains over 90% Pitera miracle ingredient to transform skin towards crystal clear perfection.",
     "image_url": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80"},
]

USERS = [
    {"id": 1, "username": "alice_dev", "email": "alice@example.com", "password": "pass123", "role": "customer"},
    {"id": 2, "username": "admin", "email": "admin@hyperscale.com", "password": "admin123", "role": "admin"},
]

ORDERS = [
    {"id": 1, "user_id": 1, "product_id": 1, "quantity": 1, "total_price": 149999.0, "priority": 1, "status": "delivered"},
    {"id": 2, "user_id": 1, "product_id": 9, "quantity": 1, "total_price": 124999.0, "priority": 2, "status": "paid"},
    {"id": 3, "user_id": 1, "product_id": 17, "quantity": 2, "total_price": 59998.0, "priority": 1, "status": "shipped"},
    {"id": 4, "user_id": 1, "product_id": 20, "quantity": 1, "total_price": 8995.0, "priority": 3, "status": "delivered"},
    {"id": 5, "user_id": 2, "product_id": 2, "quantity": 1, "total_price": 119999.0, "priority": 1, "status": "paid"},
    {"id": 6, "user_id": 1, "product_id": 25, "quantity": 1, "total_price": 89990.0, "priority": 2, "status": "pending"},
    {"id": 7, "user_id": 1, "product_id": 32, "quantity": 2, "total_price": 19998.0, "priority": 3, "status": "delivered"},
    {"id": 8, "user_id": 2, "product_id": 18, "quantity": 1, "total_price": 79900.0, "priority": 1, "status": "delivered"},
    {"id": 9, "user_id": 1, "product_id": 39, "quantity": 1, "total_price": 9200.0, "priority": 2, "status": "paid"},
    {"id": 10, "user_id": 1, "product_id": 40, "quantity": 1, "total_price": 12500.0, "priority": 1, "status": "delivered"},
]

def seed_database():
    print(f"Connecting to PostgreSQL at {DATABASE_URL}...")
    engine = create_engine(DATABASE_URL)
    
    with engine.begin() as conn:
        print("[1/5] Ensuring table schemas and necessary columns exist...")
        # Ensure base tables exist
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'customer',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price FLOAT NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                category VARCHAR(100),
                image_url VARCHAR,
                rating FLOAT DEFAULT 4.5,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                quantity INTEGER NOT NULL DEFAULT 1,
                total_price FLOAT NOT NULL DEFAULT 0.0,
                priority INTEGER DEFAULT 3,
                status VARCHAR(50) DEFAULT 'pending',
                items JSONB,
                idempotency_key VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );

            ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url VARCHAR;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS rating FLOAT DEFAULT 4.5;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR;
        """))
        
        print(f"[2/5] Seeding {len(PRODUCTS)} products across 6 categories...")
        for p in PRODUCTS:
            conn.execute(text("""
                INSERT INTO products (id, name, description, price, stock, category, image_url, rating)
                VALUES (:id, :name, :description, :price, :stock, :category, :image_url, :rating)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price = EXCLUDED.price,
                    stock = EXCLUDED.stock,
                    category = EXCLUDED.category,
                    image_url = EXCLUDED.image_url,
                    rating = EXCLUDED.rating;
            """), p)

        # Update product sequence to avoid conflict on new inserts
        conn.execute(text("SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE((SELECT MAX(id) FROM products), 1));"))
        
        print(f"[3/5] Seeding {len(USERS)} users (Admin & Customer)...")
        for u in USERS:
            conn.execute(text("""
                INSERT INTO users (id, username, email, hashed_password, role)
                VALUES (:id, :username, :email, :password, :role)
                ON CONFLICT (id) DO UPDATE SET
                    username = EXCLUDED.username,
                    email = EXCLUDED.email,
                    hashed_password = EXCLUDED.hashed_password,
                    role = EXCLUDED.role;
            """), u)
        conn.execute(text("SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));"))

        print(f"[4/5] Seeding {len(ORDERS)} orders...")
        for o in ORDERS:
            conn.execute(text("""
                INSERT INTO orders (id, user_id, product_id, quantity, total_price, priority, status)
                VALUES (:id, :user_id, :product_id, :quantity, :total_price, :priority, :status)
                ON CONFLICT (id) DO UPDATE SET
                    user_id = EXCLUDED.user_id,
                    product_id = EXCLUDED.product_id,
                    quantity = EXCLUDED.quantity,
                    total_price = EXCLUDED.total_price,
                    priority = EXCLUDED.priority,
                    status = EXCLUDED.status;
            """), o)
        conn.execute(text("SELECT setval(pg_get_serial_sequence('orders', 'id'), COALESCE((SELECT MAX(id) FROM orders), 1));"))

        print("[5/5] Verification of seeded rows:")
        prod_count = conn.execute(text("SELECT COUNT(*) FROM products;")).scalar()
        user_count = conn.execute(text("SELECT COUNT(*) FROM users;")).scalar()
        order_count = conn.execute(text("SELECT COUNT(*) FROM orders;")).scalar()
        print(f"  ✅ Products in DB: {prod_count}")
        print(f"  ✅ Users in DB:    {user_count}")
        print(f"  ✅ Orders in DB:   {order_count}")

    print("\n🚀 Database successfully seeded! All data is persistent and idempotent.")

if __name__ == "__main__":
    seed_database()
