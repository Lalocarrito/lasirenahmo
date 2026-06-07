export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'staff' | 'user';
  avatar_url?: string;
  bio?: string;
  specialty?: string;
  is_visible?: boolean;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: string;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
}

export interface ServiceImage {
  id: string;
  service_id: string;
  url: string;
  alt?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  user_id?: string;
  service_id: string;
  price_at_booking?: number;
  staff_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  confirmation_token?: string;
  reminder_sent_at?: string;
  created_at: string;
  services?: Service;
  profiles?: Profile;
}



export interface BusinessAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  staff_id?: string;
}

export interface BusinessAvailabilityOverride {
  override_date: string;
  start_time?: string;
  end_time?: string;
  is_off_day: boolean;
  staff_id?: string;
}

export interface BusinessSettings {
  key: string;
  value: string;
  updated_at: string;
}
