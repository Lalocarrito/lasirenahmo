-- Tables for LaSirenaHMO

-- Profiles: Stores user/admin roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' -- 'admin' or 'user'
);

-- Services: The catalog of eyelash services
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT, -- e.g., '2.5h'
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Appointments: Customer bookings
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  service_id UUID REFERENCES services(id),
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Posts: Blog/News for the business
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  type TEXT DEFAULT 'feed', -- 'story' or 'feed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial Services Seed
INSERT INTO services (name, description, price, duration) VALUES
('Xtreme Volume', 'Mirada intensa y dramática para eventos especiales.', 850, '2.5h'),
('Híbridas', 'El equilibrio perfecto entre volumen y naturalidad.', 700, '2h'),
('Clásicas', 'Realce natural y elegante día a día.', 550, '1.5h')
ON CONFLICT DO NOTHING;

-- Storage Policies for Services Bucket
DROP POLICY IF EXISTS "Cualquiera puede ver imágenes de servicios" ON storage.objects;
CREATE POLICY "Cualquiera puede ver imágenes de servicios"
ON storage.objects FOR SELECT
USING (bucket_id = 'services');

DROP POLICY IF EXISTS "Solo autenticados pueden subir imágenes" ON storage.objects;
CREATE POLICY "Solo autenticados pueden subir imágenes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'services');

DROP POLICY IF EXISTS "Solo autenticados pueden actualizar imágenes" ON storage.objects;
CREATE POLICY "Solo autenticados pueden actualizar imágenes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'services');

-- RLS Policies for Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede crear citas" ON appointments;
CREATE POLICY "Cualquiera puede crear citas"
ON appointments FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins pueden ver todas las citas" ON appointments;
CREATE POLICY "Admins pueden ver todas las citas"
ON appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Availability: Weekly schedule for the business
CREATE TABLE IF NOT EXISTS business_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL, -- 0 (Sun) to 6 (Sat)
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(day_of_week, start_time, end_time)
);


-- Business Settings: General configurations
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for new tables
ALTER TABLE business_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver disponibilidad" ON business_availability;
CREATE POLICY "Cualquiera puede ver disponibilidad" ON business_availability FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Cualquiera puede ver configuración pública" ON business_settings;
CREATE POLICY "Cualquiera puede ver configuración pública" ON business_settings FOR SELECT TO public USING (true);

-- Admin policies
DROP POLICY IF EXISTS "Admins pueden todo en disponibilidad" ON business_availability;
CREATE POLICY "Admins pueden todo en disponibilidad" ON business_availability FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

DROP POLICY IF EXISTS "Admins pueden todo en configuración" ON business_settings;
CREATE POLICY "Admins pueden todo en configuración" ON business_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default availability (Split shifts example)
INSERT INTO business_availability (day_of_week, start_time, end_time) VALUES
(1, '10:00', '14:00'), (1, '16:00', '20:00'), -- Lunes Turno partido
(2, '10:00', '18:00'),
(3, '10:00', '18:00'),
(4, '10:00', '18:00'),
(5, '10:00', '18:00')
ON CONFLICT (day_of_week, start_time, end_time) DO NOTHING;

-- Seed default settings
INSERT INTO business_settings (key, value) VALUES
('emergency_reminder_template', '{"message": "¡Hola! Te recordamos tu cita de hoy en La Sirena. ¿Confirmas tu asistencia?"}')
ON CONFLICT (key) DO NOTHING;

-- Script para agregar restricción de unicidad en fecha y hora a las citas
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_double_booking;
ALTER TABLE appointments ADD CONSTRAINT no_double_booking UNIQUE (appointment_date, appointment_time);

-- Function to check for spam before inserting a new appointment
CREATE OR REPLACE FUNCTION check_appointment_spam()
RETURNS TRIGGER AS $$
DECLARE
  recent_pending_count INTEGER;
BEGIN
  -- Only check if the incoming status is 'pending' (the default for user bookings)
  IF NEW.status = 'pending' THEN
    SELECT COUNT(*) INTO recent_pending_count
    FROM appointments
    WHERE status = 'pending'
      AND created_at >= NOW() - INTERVAL '1 day'
      AND (
        (NEW.customer_email IS NOT NULL AND customer_email = NEW.customer_email)
        OR 
        (NEW.customer_phone IS NOT NULL AND customer_phone = NEW.customer_phone)
      );

    -- If there are 3 or more pending appointments in the last 24 hours, block it.
    IF recent_pending_count >= 3 THEN
      RAISE EXCEPTION 'Has excedido el límite de citas pendientes (máx 3/día). Por favor, contacta soporte.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function before insert
DROP TRIGGER IF EXISTS prevent_appointment_spam ON appointments;

CREATE TRIGGER prevent_appointment_spam
BEFORE INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION check_appointment_spam();
