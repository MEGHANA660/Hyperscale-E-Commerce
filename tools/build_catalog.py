#!/usr/bin/env python3
"""Single source of truth for the product catalog.

Edit the lists below, then run:   python tools/build_catalog.py

It writes:
  data/products.json               -> read by seed_db.py (backend database)
  frontend/src/data/catalog.js     -> read by the React app (offline/mock mode)

so the database and the frontend always show the same products, ids and prices.
Prices are in rupees. `off` is the discount % shown against the crossed-out price.
Add a real photo for any product by filling its "image" field (a URL or a path
under frontend/public/); products without one get a generated name tile.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (name, price, off%, short description)
CATALOG = {
    "Electronics": [
        ("Bluetooth Neckband Earphones with Mic", 799, 40, "Up to 30 hours playtime, magnetic buds, fast charge."),
        ("True Wireless Earbuds, 30h Battery", 1299, 55, "Bluetooth 5.3, touch controls, charging case."),
        ("Active Noise Cancelling Earbuds", 2499, 50, "Hybrid ANC, 6 mics for calls, low-latency gaming mode."),
        ("Over-Ear Wireless Headphones", 1999, 45, "40mm drivers, 50 hours playtime, foldable design."),
        ("Wired Earphones with Mic", 249, 50, "3.5mm jack, in-line remote, bass-boosted sound."),
        ("Portable Bluetooth Speaker 10W", 1199, 40, "Splash-proof, 12 hours playtime, built-in mic."),
        ("2.1 Soundbar with Wired Subwoofer", 4999, 45, "80W output, HDMI ARC, Bluetooth and AUX."),
        ("10000mAh Power Bank, 22.5W", 899, 40, "Slim, fast charging, dual output."),
        ("20000mAh Fast-Charge Power Bank", 1799, 45, "Two USB-A and one USB-C PD port, LED display."),
        ("65W GaN Fast Charger, 3 Ports", 1299, 40, "Charges a laptop, phone and earbuds together."),
        ("Braided USB-C Cable, Pack of 3", 399, 55, "1m, 60W charging, tangle-free."),
        ("Smartwatch with Bluetooth Calling", 1999, 65, "1.8 inch display, 100+ sports modes, heart-rate tracking."),
        ("Fitness Band with SpO2 Monitor", 1499, 50, "14-day battery, sleep tracking, water resistant."),
        ("Wireless Mouse, Silent Click", 449, 40, "2.4GHz, adjustable DPI, 12-month battery."),
        ("Mechanical Gaming Keyboard, RGB", 2299, 40, "Blue switches, anti-ghosting, USB wired."),
        ("Full HD 1080p Webcam with Mic", 1499, 40, "Auto light correction, plug and play."),
        ("32GB USB 3.0 Pen Drive", 449, 30, "Fast transfer, metal body, key ring loop."),
        ("1TB Portable SSD, 1000MB/s", 6499, 35, "Pocket size, shock resistant, USB-C."),
        ("64GB microSD Card, Class 10", 549, 35, "Ideal for phones, dashcams and security cameras."),
        ("Smart Wi-Fi LED Bulb 9W, Colour", 499, 40, "Works with Alexa and Google Assistant."),
        ("Smart Wi-Fi Plug 10A", 799, 35, "Schedule appliances and control them from your phone."),
        ("LED Desk Lamp with Wireless Charger", 1299, 45, "3 colour modes, touch dimming, foldable arm."),
        ("Ring Light 10 inch with Tripod", 899, 55, "Three light modes, phone holder, Bluetooth remote."),
        ("4K Action Camera with Waterproof Case", 3999, 50, "Wi-Fi, 170 degree lens, two batteries."),
        ("43 inch Full HD Smart LED TV", 21999, 35, "Built-in streaming apps, 20W speakers, 2 HDMI."),
        ("Wi-Fi 6 Dual Band Router AX1800", 2299, 40, "Covers up to 4 rooms, easy app setup."),
    ],
    "Phones": [
        ("Basic Keypad Phone, Dual SIM", 1299, 15, "Long battery life, torch, FM radio."),
        ("Feature Phone with Big Buttons", 1799, 15, "Loud speaker, SOS button, 1000mAh battery."),
        ("4G Smartphone 4GB/64GB", 6999, 25, "6.6 inch display, 5000mAh battery, 13MP camera."),
        ("5G Smartphone 6GB/128GB", 11999, 25, "Dimensity chipset, 90Hz display, 50MP camera."),
        ("5G Smartphone 8GB/128GB AMOLED", 15999, 20, "6.7 inch AMOLED, 33W charging, stereo speakers."),
        ("5G Smartphone 8GB/256GB", 19999, 20, "120Hz display, OIS camera, 5000mAh battery."),
        ("108MP Camera Phone 8GB/128GB", 17499, 20, "Large sensor, night mode, 67W fast charging."),
        ("Compact 5G Smartphone 8GB/128GB", 21999, 15, "Small and light, great for one-hand use."),
        ("Rugged 5G Smartphone 8GB/128GB", 24999, 15, "Drop and dust resistant, 6000mAh battery."),
        ("Mid-range 5G 12GB/256GB", 24999, 20, "Curved AMOLED, 80W charging, 50MP main camera."),
        ("Gaming Phone 12GB/256GB", 29999, 15, "144Hz display, cooling system, shoulder triggers."),
        ("Flagship 5G 12GB/256GB", 64999, 10, "Top-tier chip, 4 rear cameras, 120W charging."),
    ],
    "Laptops": [
        ("Chromebook 11.6 inch 4GB/64GB", 15990, 20, "Light, 12-hour battery, ideal for school."),
        ("Student Laptop 14 inch 8GB/256GB", 28990, 25, "Everyday browsing, classes and office work."),
        ("Everyday Laptop 15.6 inch Core i3 8GB/512GB", 33990, 25, "Full HD screen, numeric keypad, Windows 11."),
        ("Thin & Light 14 inch Ryzen 5 16GB/512GB", 44990, 20, "1.4kg, backlit keyboard, fast charging."),
        ("Core i5 Laptop 15.6 inch 16GB/512GB", 52990, 20, "Metal body, Full HD IPS, fingerprint reader."),
        ("2-in-1 Touchscreen Laptop 14 inch", 54990, 15, "360 degree hinge with pen support."),
        ("Gaming Laptop 15.6 inch RTX 4050", 79990, 15, "144Hz display, 16GB RAM, 512GB SSD."),
        ("Creator Laptop 16 inch OLED", 94990, 10, "3K OLED panel, 32GB RAM, 1TB SSD."),
    ],
    "Fashion": [
        ("Men's Cotton Round-Neck T-Shirt", 299, 55, "Soft 180 GSM cotton, regular fit."),
        ("Men's Polo T-Shirt", 499, 50, "Pique cotton with contrast collar."),
        ("Men's Printed Oversized T-Shirt", 449, 55, "Drop shoulder, relaxed fit."),
        ("Men's Slim Fit Stretch Jeans", 999, 50, "Mid-rise, comfortable stretch denim."),
        ("Men's Cotton Chino Trousers", 899, 45, "Wrinkle-resistant, tapered fit."),
        ("Men's Formal Shirt, Full Sleeve", 799, 55, "Easy-iron cotton blend."),
        ("Men's Casual Check Shirt", 699, 50, "Brushed cotton, button-down collar."),
        ("Men's Track Pants with Zip Pockets", 599, 45, "Quick-dry fabric for gym and daily wear."),
        ("Men's Hooded Sweatshirt", 899, 50, "Fleece lined, kangaroo pocket."),
        ("Men's Denim Jacket", 1799, 45, "Classic fit, washed finish."),
        ("Men's Cotton Briefs, Pack of 3", 399, 40, "Breathable with soft waistband."),
        ("Men's Cotton Kurta", 699, 50, "Straight fit, mandarin collar."),
        ("Women's Straight Cotton Kurti", 599, 55, "Printed, three-quarter sleeves."),
        ("Women's Printed Anarkali Kurta Set", 1299, 55, "Kurta, pant and dupatta set."),
        ("Cotton Saree with Blouse Piece", 899, 55, "Lightweight, easy to drape."),
        ("Silk Blend Saree with Zari Border", 1999, 50, "Festive wear with matching blouse."),
        ("Women's High-Waist Skinny Jeans", 1099, 50, "Stretch denim, 5 pockets."),
        ("Women's Floral Midi Dress", 1199, 55, "Flowy fabric with side pockets."),
        ("Women's Cotton Palazzo Pants", 449, 50, "Wide leg, elastic waist."),
        ("Women's Leggings, Pack of 2", 399, 45, "Stretchable ankle-length cotton lycra."),
        ("Women's Ribbed Crop Top", 349, 50, "Soft knit, fitted."),
        ("Embroidered Chanderi Dupatta", 599, 50, "Light and festive."),
        ("Women's Padded Sports Bra", 499, 45, "Medium support, moisture wicking."),
        ("Men's Running Shoes", 1499, 55, "Cushioned sole, breathable mesh."),
        ("Unisex Casual Sneakers", 1199, 50, "Everyday comfort, anti-slip sole."),
        ("Canvas Slip-On Shoes", 699, 50, "Lightweight, easy to wear."),
        ("Men's Formal Derby Shoes", 1799, 45, "Faux leather with cushioned insole."),
        ("Men's Flip-Flops", 249, 40, "Soft EVA, anti-skid sole."),
        ("Women's Kolhapuri Sandals", 799, 45, "Handcrafted, comfortable for walking."),
        ("Women's Block Heel Sandals", 899, 50, "Padded straps, 2 inch heel."),
        ("Kids' Cotton T-Shirts, Pack of 3", 599, 50, "Soft, colourful, ages 3 to 10."),
        ("Kids' Denim Dungarees", 799, 50, "Adjustable straps, ages 2 to 8."),
    ],
    "Beauty": [
        ("Vitamin C Face Serum 30ml", 449, 45, "Brightening serum for even skin tone."),
        ("Niacinamide 10% Face Serum 30ml", 399, 40, "Helps with oil control and open pores."),
        ("Hyaluronic Acid Serum 30ml", 499, 45, "Deep hydration for dry skin."),
        ("Pure Aloe Vera Gel 250ml", 199, 30, "Soothing gel for face, skin and hair."),
        ("Sunscreen SPF 50 PA+++ 50g", 349, 30, "Lightweight, no white cast."),
        ("Gentle Foaming Face Wash 150ml", 229, 25, "Daily cleanser for all skin types."),
        ("Salicylic Acid Face Wash 100ml", 249, 30, "For oily and acne-prone skin."),
        ("Daily Moisturiser Gel Cream 100g", 299, 35, "Non-greasy, 24 hour hydration."),
        ("Night Repair Cream 50g", 549, 40, "Rich overnight cream with peptides."),
        ("Under-Eye Cream 15g", 399, 40, "Reduces the look of dark circles."),
        ("Multani Clay Face Mask 100g", 299, 35, "Deep cleansing mask."),
        ("Sheet Face Mask, Pack of 5", 249, 40, "Hydrating, assorted."),
        ("SPF 15 Lip Balm, Pack of 2", 199, 30, "Soft lips, natural shine."),
        ("Matte Liquid Lipstick", 399, 45, "Long-wear, 12 shades."),
        ("Smudge-Proof Kajal", 149, 25, "Intense black, 24 hour wear."),
        ("Oil-Control Compact Powder", 249, 35, "Natural finish, travel mirror."),
        ("Liquid Foundation 30ml", 549, 40, "Buildable medium coverage."),
        ("Nail Polish Set, 6 Shades", 299, 50, "Quick-dry, chip resistant."),
        ("Onion Hair Oil 200ml", 349, 35, "Reduces hair fall, nourishes scalp."),
        ("Argan Oil Shampoo 340ml", 399, 35, "Smooth, frizz-free hair."),
        ("Hair Conditioner 250ml", 349, 30, "Deep conditioning for dry hair."),
        ("Hair Serum with Vitamin E 100ml", 299, 35, "Instant shine and frizz control."),
        ("Hair Dryer 1800W, 2 Heat Settings", 899, 55, "Cool shot button, foldable handle."),
        ("Hair Straightener, Ceramic Plates", 1199, 55, "Heats fast, 5 temperature levels."),
        ("Cordless Beard Trimmer", 799, 45, "USB charging, 40 length settings."),
        ("Electric Shaver for Men", 1299, 45, "Washable heads, 60 minutes run time."),
        ("Woody Eau de Parfum 50ml", 799, 40, "Long-lasting fragrance for everyday wear."),
        ("Body Mist, Pack of 2", 449, 40, "Light fresh fragrance."),
    ],
    "Home & Living": [
        ("Cotton Double Bedsheet with 2 Pillow Covers", 699, 55, "180 TC cotton, fade resistant."),
        ("Microfibre Comforter, Double", 1299, 50, "Soft and warm, machine washable."),
        ("Memory Foam Pillow", 599, 45, "Supports neck and shoulders."),
        ("Blackout Door Curtains, Pair", 799, 50, "Thermal insulated, 7 feet."),
        ("Cotton Bath Towels, Set of 3", 599, 50, "Quick dry, 400 GSM."),
        ("Anti-Slip Door Mat", 249, 40, "Absorbs water and dirt."),
        ("Non-Stick Cookware Set, 3 Pieces", 1299, 50, "Induction base, PFOA free."),
        ("Pressure Cooker 3 Litre", 1099, 40, "Stainless steel, induction compatible."),
        ("Stainless Steel Bottle 1 Litre", 399, 40, "Keeps drinks cold up to 12 hours."),
        ("Glass Storage Containers, Set of 3", 699, 40, "Microwave safe with airtight lids."),
        ("Stainless Steel Lunch Box, 3 Containers", 499, 40, "Leak-proof with bag."),
        ("Dinner Set, 18 Pieces", 1499, 45, "Ceramic, dishwasher safe."),
        ("Mixer Grinder 500W, 3 Jars", 2299, 40, "Powerful motor, overload protection."),
        ("Electric Kettle 1.5 Litre", 699, 45, "Auto shut-off, stainless steel."),
        ("Induction Cooktop 1800W", 1799, 40, "Touch panel, 8 preset menus."),
        ("Air Fryer 4 Litre", 3999, 45, "Uses little oil, digital controls."),
        ("Sandwich Maker, 2 Slice", 899, 40, "Non-stick plates, indicator light."),
        ("Wall Clock, Silent Sweep", 449, 40, "Modern round design."),
        ("Photo Frames, Set of 6", 599, 50, "Table and wall mount."),
        ("Scented Candles, Set of 4", 399, 45, "Lavender, vanilla and sandalwood."),
        ("Cushion Covers, Set of 5", 499, 50, "16 x 16 inch, zip closure."),
        ("LED String Lights 10m", 299, 50, "Warm white, plug-in."),
        ("Ceramic Planters, Set of 3", 599, 40, "With drainage trays."),
        ("Fabric Storage Boxes, Pack of 3", 449, 45, "Foldable, with handles."),
        ("Laundry Basket with Lid", 499, 40, "Large, breathable mesh."),
        ("Spin Mop with Bucket", 1199, 45, "360 degree rotation."),
        ("Table Fan 400mm", 999, 35, "3 speeds, oscillating."),
        ("Foldable Study Table", 2499, 40, "Laptop desk with adjustable height."),
    ],
    "Accessories": [
        ("Laptop Backpack 30L", 899, 55, "Water resistant, USB charging port."),
        ("Casual Sling Bag", 599, 50, "Cross-body, two compartments."),
        ("Women's Tote Handbag", 799, 55, "Spacious with zip closure."),
        ("Men's Leather Wallet", 499, 50, "Six card slots, coin pocket."),
        ("Slim Card Holder", 299, 45, "Holds up to 8 cards."),
        ("Men's Analog Watch", 1299, 50, "Stainless steel back, date display."),
        ("Women's Analog Watch", 1099, 50, "Rose gold dial with metal strap."),
        ("UV400 Sunglasses", 499, 55, "Polarised, lightweight frame."),
        ("Cotton Baseball Cap", 249, 40, "Adjustable strap."),
        ("Genuine Leather Belt", 449, 45, "Reversible with auto buckle."),
        ("Printed Scarf", 349, 45, "Soft and light, multiple colours."),
        ("Shockproof Phone Case", 249, 50, "Raised edges for camera protection."),
        ("Tempered Glass Screen Guard, Pack of 2", 149, 50, "9H hardness, easy install kit."),
        ("Laptop Sleeve 15.6 inch", 599, 45, "Padded and water resistant."),
        ("Travel Organiser Pouch Set", 399, 45, "Set of 5 packing pouches."),
        ("3-Fold Automatic Umbrella", 449, 40, "Windproof frame."),
        ("Blue Light Blocking Glasses", 599, 50, "Reduces eye strain on screens."),
        ("Artificial Jewellery Necklace Set", 699, 55, "With matching earrings."),
        ("Silver-Plated Stud Earrings", 349, 45, "Hypoallergenic."),
        ("Charm Bracelet", 399, 45, "Adjustable size."),
        ("Hair Accessories Set, 30 Pieces", 199, 40, "Clips, bands and scrunchies."),
        ("Gym Duffle Bag", 899, 50, "Separate shoe compartment."),
        ("Yoga Mat 6mm, Anti-Slip", 599, 50, "Comes with carry strap."),
        ("Resistance Bands, Set of 5", 449, 40, "Strength and stretching workouts."),
    ],
}


def _seeded(name: str, lo: float, hi: float) -> float:
    h = int(hashlib.md5(name.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    return lo + h * (hi - lo)


def build():
    out, seen, next_id = [], set(), 1
    for category, rows in CATALOG.items():
        for name, price, off, desc in rows:
            assert name not in seen, f"duplicate product name: {name}"
            seen.add(name)
            mrp = int(round(price / (1 - off / 100) / 10.0) * 10) - 1 if off else price
            if mrp <= price:
                mrp = price
            out.append({
                "id": next_id,
                "name": name,
                "description": desc,
                "category": category,
                "price": price,
                "originalPrice": mrp,
                "rating": round(_seeded(name, 3.9, 4.8), 1),
                "sold": int(_seeded(name + "s", 120, 4800)),
                "stock": int(_seeded(name + "k", 25, 400)),
                "image": None,
            })
            next_id += 1
    return out


if __name__ == "__main__":
    items = build()
    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "data" / "products.json").write_text(json.dumps(items, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    js = ("// GENERATED by tools/build_catalog.py. Do not edit by hand.\n"
          "export const CATALOG = " + json.dumps(items, indent=2, ensure_ascii=False) + "\n")
    (ROOT / "frontend" / "src" / "data").mkdir(parents=True, exist_ok=True)
    (ROOT / "frontend" / "src" / "data" / "catalog.js").write_text(js, encoding="utf-8")
    prices = sorted(i["price"] for i in items)
    by_cat = {}
    for i in items:
        by_cat[i["category"]] = by_cat.get(i["category"], 0) + 1
    print(f"{len(items)} products, price range Rs {prices[0]} to Rs {prices[-1]}, median Rs {prices[len(prices)//2]}")
    print(by_cat)
    print("under Rs 1,000:", sum(p < 1000 for p in prices), " under Rs 5,000:", sum(p < 5000 for p in prices))
