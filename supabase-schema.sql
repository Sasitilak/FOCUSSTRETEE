-- ============================================================
-- StudySpot Booking Portal — Supabase Schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. TABLES ---------------------------------------------------

CREATE TABLE IF NOT EXISTS branches (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS floors (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
  floor_number INT NOT NULL
);

CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  floor_id INT REFERENCES floors(id) ON DELETE CASCADE,
  seat_no TEXT NOT NULL,
  is_blocked BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_days INT NOT NULL,
  price INT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  slot_id UUID REFERENCES slots(id),
  branch_id INT REFERENCES branches(id),
  floor_id INT REFERENCES floors(id),
  seat_id INT REFERENCES seats(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  amount INT NOT NULL,
  payment_screenshot_url TEXT,
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','rejected','cancelled','revoked','expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL
);

-- 2. AVAILABLE SEATS VIEW (conflict prevention) ---------------

CREATE OR REPLACE VIEW available_seats AS
SELECT
  s.id,
  s.seat_no,
  s.is_blocked,
  s.floor_id,
  f.branch_id,
  f.floor_number,
  CASE
    WHEN s.is_blocked THEN false
    WHEN EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.seat_id = s.id
        AND b.status IN ('confirmed', 'pending')
        AND b.start_date <= CURRENT_DATE
        AND b.end_date >= CURRENT_DATE
    ) THEN false
    ELSE true
  END AS is_available
FROM seats s
JOIN floors f ON s.floor_id = f.id;

-- 3. ROW LEVEL SECURITY ---------------------------------------

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Public read for branches, floors, seats, slots
CREATE POLICY "public_read_branches" ON branches FOR SELECT USING (true);
CREATE POLICY "public_read_floors" ON floors FOR SELECT USING (true);
CREATE POLICY "public_read_seats" ON seats FOR SELECT USING (true);
CREATE POLICY "public_read_slots" ON slots FOR SELECT USING (true);

-- Anyone can create a booking
CREATE POLICY "public_insert_bookings" ON bookings FOR INSERT WITH CHECK (true);
-- Anyone can read bookings (for confirmation page)
CREATE POLICY "public_read_bookings" ON bookings FOR SELECT USING (true);

-- Only authenticated (admin) can update bookings, seats, slots
CREATE POLICY "admin_update_bookings" ON bookings FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "admin_update_seats" ON seats FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "admin_update_slots" ON slots FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "admin_insert_slots" ON slots FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "admin_read_admins" ON admins FOR SELECT
  USING (auth.role() = 'authenticated');

-- 4. AUTO-EXPIRE CRON JOB ------------------------------------
-- Enable pg_cron extension first: Dashboard → Database → Extensions → pg_cron

-- SELECT cron.schedule(
--   'expire-bookings',
--   '0 0 * * *',
--   $$UPDATE bookings SET status = 'expired' WHERE status = 'confirmed' AND end_date < CURRENT_DATE;$$
-- );
--
-- SELECT cron.schedule(
--   'cleanup-screenshots',
--   '0 3 * * *',
--   $$UPDATE bookings SET payment_screenshot_url = NULL WHERE status = 'confirmed' AND payment_screenshot_url IS NOT NULL AND updated_at < NOW() - INTERVAL '2 days';$$
-- );

-- 5. SEED DATA ------------------------------------------------

-- Branches
INSERT INTO branches (id, name, address) VALUES
  (1, 'Branch 1 — Koramangala', '4th Block, Koramangala'),
  (2, 'Branch 2 — Indiranagar', '100 Feet Road, Indiranagar')
ON CONFLICT DO NOTHING;

-- Floors
INSERT INTO floors (id, branch_id, floor_number) VALUES
  (1, 1, 1), (2, 1, 2),
  (3, 2, 1), (4, 2, 2), (5, 2, 3)
ON CONFLICT DO NOTHING;

-- Seats (B1-F1: 24 seats, B1-F2: 18 seats, B2-F1: 30, B2-F2: 20, B2-F3: 15)
INSERT INTO seats (floor_id, seat_no)
SELECT 1, 'S' || generate_series(1, 24)
ON CONFLICT DO NOTHING;
INSERT INTO seats (floor_id, seat_no)
SELECT 2, 'S' || generate_series(1, 18)
ON CONFLICT DO NOTHING;
INSERT INTO seats (floor_id, seat_no)
SELECT 3, 'S' || generate_series(1, 30)
ON CONFLICT DO NOTHING;
INSERT INTO seats (floor_id, seat_no)
SELECT 4, 'S' || generate_series(1, 20)
ON CONFLICT DO NOTHING;
INSERT INTO seats (floor_id, seat_no)
SELECT 5, 'S' || generate_series(1, 15)
ON CONFLICT DO NOTHING;

-- Slots
INSERT INTO slots (name, duration_days, price) VALUES
  ('1 Week', 7, 350),
  ('2 Weeks', 14, 600),
  ('1 Month', 30, 1000),
  ('3 Months', 90, 2700)
ON CONFLICT DO NOTHING;

-- Admin (add your phone number here)
INSERT INTO admins (phone, name) VALUES
  ('+91XXXXXXXXXX', 'Admin')
ON CONFLICT DO NOTHING;
