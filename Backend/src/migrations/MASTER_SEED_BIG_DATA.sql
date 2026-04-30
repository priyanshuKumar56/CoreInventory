-- ============================================================
-- CoreInventory Enterprise MASTER BIG DATA SEED
-- ============================================================
-- CoreInventory Enterprise MASTER BIG DATA SEED (Single-Statement Mode)
-- ============================================================

-- 1. USERS (Password for all: Admin@123)
-- Hash: $2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.
INSERT INTO users (name, email, password, role) VALUES
('Global Admin', 'superadmin@coreinventory.com', '$2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.', 'admin'),
('Warehouse Manager NYC', 'nyc.mgr@coreinventory.com', '$2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.', 'manager'),
('Inventory Staff A', 'staff.a@coreinventory.com', '$2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.', 'staff'),
('Logistics Lead', 'logistics@coreinventory.com', '$2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.', 'manager'),
('Procurement Officer', 'procure@coreinventory.com', '$2a$10$6QgWMVbJOEakJyQIlMHqkeAJEEVqBM0KciAA1ahi8M5y84QdsBY6.', 'staff')
ON CONFLICT (email) DO NOTHING;

-- 2. CONTACTS (Suppliers & Customers)
INSERT INTO contacts (name, email, phone, address, type) VALUES
('TechNova Solutions', 'sales@technova.com', '+1-555-0123', 'Silicon Valley, CA', 'supplier'),
('Global Logistics Corp', 'contact@globallog.com', '+44-20-7946', 'London, UK', 'supplier'),
('Prime Retailers Inc', 'buying@primeretail.com', '+1-212-555', 'New York, NY', 'customer'),
('EuroGoods Import', 'info@eurogoods.eu', '+49-30-1234', 'Berlin, Germany', 'supplier'),
('Apex Manufacturing', 'ops@apex.com', '+81-3-3210', 'Tokyo, Japan', 'supplier'),
('Swift Express', 'delivery@swift.com', '+971-4-123', 'Dubai, UAE', 'customer'),
('Oceanic Supplies', 'sales@oceanic.au', '+61-2-9876', 'Sydney, Australia', 'supplier')
ON CONFLICT DO NOTHING;

-- 3. WAREHOUSES
INSERT INTO warehouses (name, code, address) VALUES
('North America Hub', 'NA-NYC-01', '100 Broadway, New York, NY'),
('European Gateway', 'EU-AMS-02', 'Haven 101, Amsterdam, NL'),
('Asia Pacific Center', 'AP-SGP-03', '10 Jurong Port Rd, Singapore'),
('Middle East Depot', 'ME-DXB-04', 'Jebel Ali Free Zone, Dubai, UAE'),
('South America Branch', 'SA-GRU-05', 'Av. Paulista, Sao Paulo, BR')
ON CONFLICT (code) DO NOTHING;

-- 4. CATEGORIES
INSERT INTO product_categories (name, description) VALUES
('Computing & Servers', 'High-performance servers, workstations, and laptops'),
('Networking Gear', 'Routers, switches, and enterprise networking hardware'),
('Industrial Components', 'Sensors, actuators, and PLC modules'),
('Office Furnishing', 'Ergonomic chairs, desks, and workspace solutions'),
('Safety & PPE', 'Industrial safety gear and personal protection'),
('Logistics Supplies', 'Pallets, crates, and shipping materials'),
('Maintenance Tools', 'Precision tools and heavy machinery maintenance'),
('Storage Media', 'Enterprise SSDs, HDD arrays, and tape backups'),
('Smart Devices', 'IoT sensors and industrial tablets'),
('Cabling & Power', 'Power distribution units and fiber optic cables')
ON CONFLICT (name) DO NOTHING;

-- 5. LOCATIONS (Generate 20 locations across warehouses)
DO $$
DECLARE
    wh_record RECORD;
    i INT;
BEGIN
    FOR wh_record IN SELECT id, code FROM warehouses LOOP
        FOR i IN 1..5 LOOP
            INSERT INTO locations (warehouse_id, name, code, type)
            VALUES (wh_record.id, 'Aisle ' || i || ' Shelf 1', wh_record.code || '-A' || i || '-S1', 'internal')
            ON CONFLICT DO NOTHING;
            
            INSERT INTO locations (warehouse_id, name, code, type)
            VALUES (wh_record.id, 'Receiving Area ' || i, wh_record.code || '-RECV-' || i, 'input')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- 6. PRODUCTS (Realistic Deep Data - 30 items for initial run, expandable)
DO $$
DECLARE
    admin_id UUID;
    cat_id UUID;
    i INT;
BEGIN
    SELECT id INTO admin_id FROM users WHERE email = 'superadmin@coreinventory.com' LIMIT 1;
    
    -- Category: Computing
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Computing & Servers' LIMIT 1;
    FOR i IN 1..20 LOOP
        INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, cost_price, sale_price, description, created_by, image_url)
        VALUES (
            'Titan Node v' || i, 
            'SRV-TITAN-' || LPAD(i::text, 3, '0'), 
            cat_id, 'unit', 5, 
            3200.00 + (i * 50), 4800.00 + (i * 75), 
            'Next-gen enterprise server node with high-density compute.', 
            admin_id, 
            'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?w=800'
        ) ON CONFLICT (sku) DO NOTHING;
    END LOOP;

    -- Category: Networking
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Networking Gear' LIMIT 1;
    FOR i IN 1..20 LOOP
        INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, cost_price, sale_price, description, created_by, image_url)
        VALUES (
            'Nexus Switch Pro ' || i || 'G', 
            'NET-NEX-' || LPAD(i::text, 3, '0'), 
            cat_id, 'unit', 10, 
            800.00 + (i * 20), 1400.00 + (i * 40), 
            'Layer 3 managed switch for high-traffic environments.', 
            admin_id,
            'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800'
        ) ON CONFLICT (sku) DO NOTHING;
    END LOOP;

    -- Category: Logistics
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Logistics Supplies' LIMIT 1;
    FOR i IN 1..15 LOOP
        INSERT INTO products (name, sku, category_id, unit_of_measure, reorder_point, cost_price, sale_price, description, created_by, image_url)
        VALUES (
            'Reinforced EuroPallet ' || i, 
            'LOG-PAL-' || LPAD(i::text, 3, '0'), 
            cat_id, 'unit', 50, 
            25.00, 45.00, 
            'Heavy-duty industrial pallet with 1500kg load capacity.', 
            admin_id,
            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800'
        ) ON CONFLICT (sku) DO NOTHING;
    END LOOP;
END $$;

-- 7. INITIAL STOCK (Populate for all products)
DO $$
DECLARE
    prod RECORD;
    loc RECORD;
BEGIN
    FOR prod IN SELECT id FROM products LOOP
        -- Select a random location
        SELECT id INTO loc FROM locations ORDER BY random() LIMIT 1;
        
        INSERT INTO stock (product_id, location_id, quantity)
        VALUES (prod.id, loc.id, (floor(random() * 100) + 10))
        ON CONFLICT (product_id, location_id) DO UPDATE SET quantity = stock.quantity + EXCLUDED.quantity;
    END LOOP;
END $$;

-- 8. HISTORICAL MOVEMENTS (Generate 50 random moves for showcase)
DO $$
DECLARE
    prod_id UUID;
    loc_from UUID;
    loc_to UUID;
    i INT;
BEGIN
    FOR i IN 1..50 LOOP
        SELECT id INTO prod_id FROM products ORDER BY random() LIMIT 1;
        SELECT id INTO loc_to FROM locations ORDER BY random() LIMIT 1;
        
        INSERT INTO inventory_moves (product_id, to_location_id, quantity, move_type, status, reference, created_at)
        VALUES (prod_id, loc_to, (floor(random() * 5) + 1), 'receipt', 'done', 'INITIAL-SEED-' || i, NOW() - (i || ' days')::interval);
    END LOOP;
END $$;

-- END OF SEED
