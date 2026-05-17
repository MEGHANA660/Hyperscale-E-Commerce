-- =========================================================
-- demo_data.sql — HyperScale Commerce Sample Data
-- Run: psql -U postgres -d hyperscale -f demo_data.sql
-- =========================================================

-- Users
INSERT INTO users (id, username, email, hashed_password, role) VALUES
(1, 'alice_dev', 'alice@example.com', 'pass123', 'customer'),
(2, 'bob_admin', 'bob@example.com', 'pass123', 'admin'),
(3, 'carol_shop', 'carol@example.com', 'pass123', 'customer'),
(4, 'dave_pro', 'dave@example.com', 'pass123', 'customer'),
(5, 'eve_techie', 'eve@example.com', 'pass123', 'customer')
ON CONFLICT DO NOTHING;

-- Products
INSERT INTO products (id, name, description, price, category, stock, rating) VALUES
(1,  'MacBook Pro 16"',         'Apple M3 Pro, 18GB RAM, 512GB SSD',                 2499.99, 'Laptops',      50, 4.8),
(2,  'iPhone 15 Pro Max',       'A17 Pro chip, 256GB, Titanium finish',               1199.99, 'Smartphones',  120, 4.9),
(3,  'Sony WH-1000XM5',         'Industry-leading noise cancellation headphones',      349.99, 'Audio',        200, 4.7),
(4,  'iPad Pro 12.9"',          'M2 chip, Liquid Retina XDR, 256GB',                 1099.99, 'Tablets',       80, 4.6),
(5,  'Samsung Galaxy S24 Ultra','200MP camera, S Pen, Titanium frame',               1299.99, 'Smartphones',   90, 4.7),
(6,  'Dell XPS 15',             'Intel Core i9, 32GB RAM, OLED display',             1899.99, 'Laptops',       40, 4.5),
(7,  'AirPods Pro 2',           'Active Noise Cancellation, USB-C',                   249.99, 'Audio',        300, 4.8),
(8,  'Apple Watch Ultra 2',     '49mm case, precision GPS, 60hr battery',             799.99, 'Wearables',     60, 4.7),
(9,  'NVIDIA RTX 4090',         '24GB GDDR6X, 4K gaming powerhouse',                1599.99, 'GPU',           15, 4.9),
(10, 'LG OLED C3 65"',          '4K OLED, 120Hz, Dolby Vision & Atmos',             1799.99, 'TVs',           25, 4.8),
(11, 'Logitech MX Master 3S',   'Advanced wireless mouse, 8K DPI',                     99.99, 'Peripherals',  400, 4.7),
(12, 'Keychron Q1 Pro',         'QMK wireless mechanical keyboard, gasket mount',      199.99, 'Peripherals',  150, 4.6)
ON CONFLICT DO NOTHING;

-- Orders
INSERT INTO orders (id, user_id, total_amount, status, order_type) VALUES
(1, 1, 2499.99, 'delivered', 'standard'),
(2, 1, 1199.99, 'processing', 'express'),
(3, 2, 349.99, 'delivered', 'premium'),
(4, 3, 2099.98, 'shipped', 'standard'),
(5, 4, 1599.99, 'delivered', 'express')
ON CONFLICT DO NOTHING;

-- Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 2499.99),
(2, 2, 1, 1199.99),
(3, 3, 1, 349.99),
(4, 4, 1, 1099.99),
(4, 7, 1, 249.99),
(4, 8, 1, 799.99),
(5, 9, 1, 1599.99)
ON CONFLICT DO NOTHING;
