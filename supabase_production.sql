-- ============================================
-- SCHEMA PRODUCCIÓN - La Sirena HMO
-- Extraído directamente de Supabase via API
-- Fecha: 2026-06-02
-- ============================================

-- =====================
-- ENUMS (NO existen en producción — se usan TEXT)
-- Se dejan comentados por si se quieren migrar en el futuro
-- =====================

-- =====================
-- TABLAS
-- =====================

-- Profiles: Stores user/admin roles (TEXT, no enum)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  avatar_url TEXT,
  bio TEXT,
  specialty TEXT,
  is_visible BOOLEAN DEFAULT true
);

-- Services: Catalog of eyelash services
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Appointments: Customer bookings
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id),
  price_at_booking DECIMAL(10,2),
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Availability: Weekly schedule
CREATE TABLE IF NOT EXISTS business_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  staff_id UUID REFERENCES profiles(id) ON DELETE CASCADE
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

-- Service Images: Multiple photos per service
CREATE TABLE IF NOT EXISTS service_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_images_primary
ON service_images (service_id) WHERE is_primary = true;

-- Reviews: Client testimonials on completed appointments
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =====================
-- CONSTRAINTS
-- =====================

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS no_double_booking;
ALTER TABLE appointments ADD CONSTRAINT no_double_booking UNIQUE (appointment_date, appointment_time, staff_id);

ALTER TABLE business_availability DROP CONSTRAINT IF EXISTS unique_staff_availability;
ALTER TABLE business_availability ADD CONSTRAINT unique_staff_availability UNIQUE (day_of_week, start_time, end_time, staff_id);

ALTER TABLE business_availability_overrides ADD CONSTRAINT business_availability_overrides_override_date_key UNIQUE (override_date);

-- =====================
-- FUNCTIONS
-- =====================

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user')
  ON CONFLICT DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Spam prevention: max 3 pending appointments per day per user/email/phone
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
        (NEW.user_id IS NOT NULL AND user_id = NEW.user_id)
        OR
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

-- =====================
-- TRIGGERS
-- =====================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS prevent_appointment_spam ON appointments;
CREATE TRIGGER prevent_appointment_spam
  BEFORE INSERT ON appointments
  FOR EACH ROW EXECUTE FUNCTION check_appointment_spam();

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;

-- =====================
-- RLS: PROFILES
-- =====================

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

-- =====================
-- RLS: APPOINTMENTS
-- =====================

DROP POLICY IF EXISTS "Insert citas con email válido" ON appointments;
CREATE POLICY "Insert citas con email válido"
ON appointments FOR INSERT TO public
WITH CHECK (
    auth.uid() IS NOT NULL
    OR (
        customer_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND length(customer_name) BETWEEN 2 AND 100
        AND customer_phone ~ '^[+]?[0-9\s()\-.]{7,20}$'
    )
);

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

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias citas" ON appointments;
CREATE POLICY "Usuarios pueden ver sus propias citas"
ON appointments FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR customer_email = auth.jwt()->>'email');

DROP POLICY IF EXISTS "Admins y Staff pueden actualizar citas" ON appointments;
CREATE POLICY "Admins y Staff pueden actualizar citas"
ON appointments FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND appointments.staff_id = auth.uid()))
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND appointments.staff_id = auth.uid()))
  )
);

DROP POLICY IF EXISTS "Solo admins pueden borrar citas" ON appointments;
CREATE POLICY "Solo admins pueden borrar citas"
ON appointments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =====================
-- RLS: SERVICES
-- =====================

DROP POLICY IF EXISTS "Público puede ver servicios" ON services;
CREATE POLICY "Público puede ver servicios" ON services FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Solo admins pueden modificar servicios" ON services;
CREATE POLICY "Solo admins pueden modificar servicios" ON services FOR ALL TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================
-- RLS: SERVICE IMAGES
-- =====================

DROP POLICY IF EXISTS "Público puede ver imágenes de servicios" ON service_images;
CREATE POLICY "Público puede ver imágenes de servicios"
ON service_images FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Solo admins pueden modificar imágenes de servicios" ON service_images;
CREATE POLICY "Solo admins pueden modificar imágenes de servicios"
ON service_images FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================
-- RLS: BUSINESS AVAILABILITY
-- =====================

DROP POLICY IF EXISTS "Cualquiera puede ver disponibilidad" ON business_availability;
CREATE POLICY "Cualquiera puede ver disponibilidad" ON business_availability FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins pueden todo en disponibilidad" ON business_availability;
CREATE POLICY "Admins pueden todo en disponibilidad"
ON business_availability FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

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

-- =====================
-- RLS: BUSINESS AVAILABILITY OVERRIDES
-- =====================

DROP POLICY IF EXISTS "Cualquiera puede ver disponibilidad específica" ON business_availability_overrides;
CREATE POLICY "Cualquiera puede ver disponibilidad específica" ON business_availability_overrides FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins pueden todo en disponibilidad específica" ON business_availability_overrides;
CREATE POLICY "Admins pueden todo en disponibilidad específica"
ON business_availability_overrides FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins y Staff pueden todo en sus excepciones" ON business_availability_overrides;
CREATE POLICY "Admins y Staff pueden todo en sus excepciones"
ON business_availability_overrides FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role = 'admin' OR (profiles.role = 'staff' AND business_availability_overrides.staff_id = auth.uid()))
  )
);

-- =====================
-- RLS: BUSINESS SETTINGS
-- =====================

DROP POLICY IF EXISTS "Cualquiera puede ver configuración pública" ON business_settings;
CREATE POLICY "Cualquiera puede ver configuración pública" ON business_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins pueden todo en configuración" ON business_settings;
CREATE POLICY "Admins pueden todo en configuración" ON business_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================
-- RLS: REVIEWS
-- =====================

DROP POLICY IF EXISTS "Pública puede ver reseñas" ON reviews;
CREATE POLICY "Pública puede ver reseñas" ON reviews FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Usuarios pueden crear sus reseñas" ON reviews;
CREATE POLICY "Usuarios pueden crear sus reseñas" ON reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuarios pueden ver sus reseñas" ON reviews;
CREATE POLICY "Usuarios pueden ver sus reseñas" ON reviews FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins pueden todo en reseñas" ON reviews;
CREATE POLICY "Admins pueden todo en reseñas" ON reviews FOR ALL TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- =====================
-- STORAGE POLICIES
-- =====================

-- Avatars bucket
DROP POLICY IF EXISTS "Public_Access_Avatars" ON storage.objects;
CREATE POLICY "Public_Access_Avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth_Modifications_Avatars" ON storage.objects;
CREATE POLICY "Auth_Modifications_Avatars"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- Services bucket
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

-- =====================
-- SEED DATA
-- =====================

INSERT INTO services (name, description, price, duration) VALUES
('Xtreme Volume', 'Mirada intensa y dramática para eventos especiales.', 850, '2.5h'),
('Híbridas', 'El equilibrio perfecto entre volumen y naturalidad.', 700, '2h'),
('Clásicas', 'Realce natural y elegante día a día.', 550, '1.5h')
ON CONFLICT (id) DO NOTHING;

INSERT INTO business_settings (key, value) VALUES
('emergency_reminder_template', '{"message": "¡Hola! Te recordamos tu cita de hoy en La Sirena. ¿Confirmas tu asistencia?"}')
ON CONFLICT (key) DO NOTHING;
