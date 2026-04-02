export interface Profile {
  id: string;
  full_name?: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'user';
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: string;
  image_url?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  services?: Service; // For joined queries
}

export interface Post {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  type: 'feed' | 'story';
  created_at: string;
}

export interface BusinessAvailability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface BusinessAvailabilityOverride {
  override_date: string;
  start_time?: string;
  end_time?: string;
  is_off_day: boolean;
}

export interface BusinessSettings {
  key: string;
  value: any;
  updated_at: string;
}
