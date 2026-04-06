-- Tables for LaSirenaHMO

-- Profiles: Stores user/admin roles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user' -- 'admin', 'staff', or 'user'
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
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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
ON CONFLICT (id) DO NOTHING;

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

-- RLS Policies for Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins pueden ver todos los perfiles" ON profiles;
CREATE POLICY "Admins pueden ver todos los perfiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins pueden actualizar perfiles" ON profiles;
CREATE POLICY "Admins pueden actualizar perfiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Público puede ver perfiles de staff" ON profiles;
CREATE POLICY "Público puede ver perfiles de staff"
ON profiles FOR SELECT
TO public
USING (role = 'staff' OR role = 'admin');

-- RLS Policies for Appointments
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede crear citas" ON appointments;
CREATE POLICY "Cualquiera puede crear citas"
ON appointments FOR INSERT
TO public
WITH CHECK (true);

DROP POLICY IF EXISTS "Staff y Admins pueden ver citas" ON appointments;
CREATE POLICY "Staff y Admins pueden ver citas"
ON appointments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND appointments.staff_id = auth.uid()))
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
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(day_of_week, start_time, end_time, staff_id)
);

-- Availability Overrides
CREATE TABLE IF NOT EXISTS business_availability_overrides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_off_day BOOLEAN DEFAULT false,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Business Settings: General configurations
CREATE TABLE IF NOT EXISTS business_settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for new tables
ALTER TABLE business_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cualquiera puede ver disponibilidad" ON business_availability;
CREATE POLICY "Cualquiera puede ver disponibilidad" ON business_availability FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Cualquiera puede ver configuración pública" ON business_settings;
CREATE POLICY "Cualquiera puede ver configuración pública" ON business_settings FOR SELECT TO public USING (true);

-- Admin policies
DROP POLICY IF EXISTS "Admins y Staff pueden todo en su disponibilidad" ON business_availability;
CREATE POLICY "Admins y Staff pueden todo en su disponibilidad" 
ON business_availability FOR ALL TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND business_availability.staff_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Admins pueden todo en configuración" ON business_settings;
CREATE POLICY "Admins pueden todo en configuración" ON business_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Seed default settings
INSERT INTO business_settings (key, value) VALUES
('emergency_reminder_template', '{"message": "¡Hola! Te recordamos tu cita de hoy en La Sirena. ¿Confirmas tu asistencia?"}')
ON CONFLICT (key) DO NOTHING;

-- Constraints for Appointments
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_double_booking;
ALTER TABLE appointments ADD CONSTRAINT no_double_booking UNIQUE (appointment_date, appointment_time, staff_id);

-- Function to check for spam
CREATE OR REPLACE FUNCTION check_appointment_spam()
RETURNS TRIGGER AS $$
DECLARE
  recent_pending_count INTEGER;
BEGIN
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

    IF recent_pending_count >= 3 THEN
      RAISE EXCEPTION 'Has excedido el límite de citas pendientes (máx 3/día). Por favor, contacta soporte.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_appointment_spam ON appointments;
CREATE TRIGGER prevent_appointment_spam
BEFORE INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION check_appointment_spam();
