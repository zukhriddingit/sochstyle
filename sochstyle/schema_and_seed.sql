-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Tables

-- Barbers Table
CREATE TABLE barbers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    cover_url TEXT,
    phone TEXT,
    district TEXT,
    address TEXT,
    lat NUMERIC(9, 6),
    lng NUMERIC(9, 6),
    min_price INTEGER,
    max_price INTEGER,
    rating NUMERIC(2, 1),
    review_count INTEGER,
    is_home_service BOOLEAN DEFAULT FALSE
);

-- Styles Table
CREATE TABLE styles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- Barber-Styles Junction Table
CREATE TABLE barber_styles (
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE,
    style_id UUID REFERENCES styles(id) ON DELETE CASCADE,
    PRIMARY KEY (barber_id, style_id)
);

-- Slots Table
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_booked BOOLEAN DEFAULT FALSE,
    UNIQUE(barber_id, starts_at) -- A barber can't have two slots starting at the same time
);

-- Bookings Table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL,
    slot_id UUID REFERENCES slots(id) ON DELETE CASCADE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    style_id UUID REFERENCES styles(id),
    status TEXT CHECK (status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    barber_id UUID REFERENCES barbers(id) ON DELETE CASCADE NOT NULL, -- Denormalized for easier access
    rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Seed Data

-- Seed Styles
INSERT INTO styles (name) VALUES
('Fade'),
('Buzz Cut'),
('Pompadour'),
('Bob'),
('Layered Cut'),
('Undercut'),
('Crew Cut'),
('Slick Back');

-- Seed Barbers
INSERT INTO barbers (name, avatar_url, cover_url, phone, district, address, lat, lng, min_price, max_price, rating, review_count, is_home_service)
VALUES
('Artur''s Barbershop', 'https://i.pravatar.cc/150?u=artur', 'https://picsum.photos/seed/artur/800/400', '+998 90 123 45 67', 'Yakkasaroy', 'Shota Rustaveli St 45', 41.2855, 69.2558, 50000, 120000, 4.8, 112, true),
('Bekzod''s Cuts', 'https://i.pravatar.cc/150?u=bekzod', 'https://picsum.photos/seed/bekzod/800/400', '+998 91 234 56 78', 'Chilonzor', 'Chilonzor-3, 21', 41.275, 69.201, 40000, 90000, 4.5, 88, false),
('Sardor Style', 'https://i.pravatar.cc/150?u=sardor', 'https://picsum.photos/seed/sardor/800/400', '+998 93 345 67 89', 'Shayxontohur', 'Navoi Avenue 12', 41.319, 69.251, 60000, 150000, 4.9, 205, true),
('Mirzo Grand', 'https://i.pravatar.cc/150?u=mirzo', 'https://picsum.photos/seed/mirzo/800/400', '+998 94 456 78 90', 'Mirzo-Ulug''bek', 'Buyuk Ipak Yuli St 88', 41.325, 69.335, 70000, 140000, 4.7, 150, false),
('Yunusobod Gents', 'https://i.pravatar.cc/150?u=yunusobod', 'https://picsum.photos/seed/yunusobod/800/400', '+998 95 567 89 01', 'Yunusobod', 'Amir Temur Avenue 101', 41.365, 69.288, 45000, 100000, 4.6, 95, false),
('The Loft', 'https://i.pravatar.cc/150?u=loft', 'https://picsum.photos/seed/loft/800/400', '+998 97 678 90 12', 'Yakkasaroy', 'Kichik Beshagach St 10', 41.291, 69.263, 80000, 150000, 5.0, 310, true),
('Chilonzor Modern', 'https://i.pravatar.cc/150?u=chilonzor', 'https://picsum.photos/seed/chilonzor/800/400', '+998 98 789 01 23', 'Chilonzor', 'Lutfi St 5', 41.269, 69.195, 40000, 80000, 4.4, 72, true),
('Old City Barbers', 'https://i.pravatar.cc/150?u=oldcity', 'https://picsum.photos/seed/oldcity/800/400', '+998 99 890 12 34', 'Shayxontohur', 'Zarqaynar St 1', 41.322, 69.238, 55000, 110000, 4.8, 180, false),
('Prestige Cuts', 'https://i.pravatar.cc/150?u=prestige', 'https://picsum.photos/seed/prestige/800/400', '+998 71 123 45 67', 'Mirzo-Ulug''bek', 'Mustaqillik Avenue 50', 41.311, 69.301, 75000, 130000, 4.7, 132, false),
('Urban Style', 'https://i.pravatar.cc/150?u=urban', 'https://picsum.photos/seed/urban/800/400', '+998 77 234 56 78', 'Yunusobod', 'Osiyo St 15', 41.355, 69.295, 50000, 95000, 4.5, 67, true),
('Gentlemen''s Choice', 'https://i.pravatar.cc/150?u=choice', 'https://picsum.photos/seed/choice/800/400', '+998 90 345 67 89', 'Yakkasaroy', 'Bobur St 22', 41.282, 69.248, 65000, 125000, 4.9, 250, false),
('The Blade Masters', 'https://i.pravatar.cc/150?u=blade', 'https://picsum.photos/seed/blade/800/400', '+998 91 456 78 90', 'Chilonzor', 'Al-Xorazmiy St 40', 41.278, 69.215, 45000, 85000, 4.6, 105, false);

-- Seed Barber Styles (Many-to-Many)
DO $$
DECLARE
    b_id UUID;
    s_id UUID;
    style_names TEXT[] := ARRAY['Fade', 'Buzz Cut', 'Pompadour', 'Bob', 'Layered Cut', 'Undercut', 'Crew Cut', 'Slick Back'];
BEGIN
    FOR b_id IN (SELECT id FROM barbers) LOOP
        -- Assign 4 to 6 random styles to each barber
        FOR s_id IN (
            SELECT id FROM styles WHERE name = ANY(style_names) ORDER BY random() LIMIT (4 + floor(random() * 3))::int
        ) LOOP
            INSERT INTO barber_styles (barber_id, style_id) VALUES (b_id, s_id) ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Seed Slots for the next 7 days
DO $$
DECLARE
    b_id UUID;
    day_offset INT;
    hour_offset INT;
    slot_start TIMESTAMPTZ;
    slot_end TIMESTAMPTZ;
BEGIN
    FOR b_id IN (SELECT id FROM barbers) LOOP
        FOR day_offset IN 0..6 LOOP
            FOR hour_offset IN 10..19 LOOP -- 10:00 to 19:00, creating slots that end at 20:00
                slot_start := date_trunc('day', now()) + (day_offset || ' days')::interval + (hour_offset || ' hours')::interval;
                slot_end := slot_start + '1 hour'::interval;
                
                INSERT INTO slots (barber_id, starts_at, ends_at, is_booked)
                VALUES (b_id, slot_start, slot_end, (random() < 0.1)); -- 10% chance of being pre-booked
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- Optional: Seed a few reviews for demonstration
-- In a real app, reviews would be tied to actual bookings
-- This is a simplified version for seeding.
-- To make this runnable, we'll create dummy bookings first.

DO $$
DECLARE
    b_id UUID;
    s_id UUID;
    booking_id UUID;
BEGIN
    -- Create a dummy booking for 'Artur''s Barbershop'
    b_id := (SELECT id FROM barbers WHERE name = 'Artur''s Barbershop');
    s_id := (SELECT id FROM slots WHERE barber_id = b_id AND is_booked = false ORDER BY starts_at LIMIT 1);
    
    IF s_id IS NOT NULL THEN
        INSERT INTO bookings (barber_id, slot_id, customer_name, customer_phone, status)
        VALUES (b_id, s_id, 'John Doe', '+123456789', 'confirmed')
        RETURNING id INTO booking_id;

        INSERT INTO reviews (booking_id, barber_id, rating, text)
        VALUES (booking_id, b_id, 5, 'Absolutely fantastic service! Best haircut I''ve had in years.');

        UPDATE slots SET is_booked = true WHERE id = s_id;
    END IF;

    -- Create a dummy booking for 'Sardor Style'
    b_id := (SELECT id FROM barbers WHERE name = 'Sardor Style');
    s_id := (SELECT id FROM slots WHERE barber_id = b_id AND is_booked = false ORDER BY starts_at LIMIT 1);

    IF s_id IS NOT NULL THEN
        INSERT INTO bookings (barber_id, slot_id, customer_name, customer_phone, status)
        VALUES (b_id, s_id, 'Jane Smith', '+987654321', 'confirmed')
        RETURNING id INTO booking_id;

        INSERT INTO reviews (booking_id, barber_id, rating, text)
        VALUES (booking_id, b_id, 4, 'Great style and very professional. A bit pricey but worth it.');

        UPDATE slots SET is_booked = true WHERE id = s_id;
    END IF;
END $$;

-- Function to create a booking and update the slot in a transaction
CREATE OR REPLACE FUNCTION create_booking_and_update_slot(
    p_barber_id UUID,
    p_style_id UUID,
    p_slot_id UUID,
    p_customer_name TEXT,
    p_customer_phone TEXT
)
RETURNS bookings
LANGUAGE plpgsql
AS $$
DECLARE
    v_slot slots;
    v_booking bookings;
BEGIN
    -- Find and lock the slot to prevent race conditions
    SELECT * INTO v_slot FROM slots
    WHERE id = p_slot_id AND barber_id = p_barber_id AND is_booked = FALSE
    FOR UPDATE;

    -- If slot is not found or already booked, raise an exception
    IF v_slot IS NULL THEN
        RAISE EXCEPTION 'Slot not found or already booked';
    END IF;

    -- Update the slot to be booked
    UPDATE slots
    SET is_booked = TRUE
    WHERE id = p_slot_id;

    -- Create the new booking
    INSERT INTO bookings (barber_id, style_id, slot_id, customer_name, customer_phone, status)
    VALUES (p_barber_id, p_style_id, p_slot_id, p_customer_name, p_customer_phone, 'confirmed')
    RETURNING * INTO v_booking;

    RETURN v_booking;
END;
$$;
