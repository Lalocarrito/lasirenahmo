'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Appointment, Service, Profile } from '@/types';
import { logger } from '@/lib/logger';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface BookingContextType {
    step: number;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    selectedService: Service | null;
    setSelectedService: (service: Service | null) => void;
    selectedStaff: Profile | null;
    setSelectedStaff: (staff: Profile | null) => void;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    selectedTime: string;
    setSelectedTime: (time: string) => void;
    notes: string;
    setNotes: (notes: string) => void;

    user: SupabaseUser | null;
    setUser: (user: SupabaseUser | null) => void;
    userAppointments: Appointment[];
    fetchUserAppointments: () => void;

    viewMode: 'booking' | 'my-appointments';
    setViewMode: (mode: 'booking' | 'my-appointments') => void;

    toast: { message: string, type: 'error' | 'success' } | null;
    setToast: (toast: { message: string, type: 'error' | 'success' } | null) => void;

    createAppointment: (extraData?: { phone?: string }) => Promise<boolean>;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children, initialStep = 1 }: { children: ReactNode, initialStep?: number }) {
    const [step, setStep] = useState(initialStep);
    const [isInitialized, setIsInitialized] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Profile | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [viewMode, setViewMode] = useState<'booking' | 'my-appointments'>('booking');
    const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('la-sirena-booking-state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as {
                    _timestamp?: number;
                    step?: number;
                    selectedService?: Service;
                    selectedStaff?: Profile;
                    selectedDate?: string;
                    selectedTime?: string;
                    notes?: string;
                };
                // Only load if not too old (e.g., 2 hours)
                const timestamp = parsed._timestamp || 0;
                if (Date.now() - timestamp < 1000 * 60 * 60 * 2) {
                    if (parsed.step) setStep(parsed.step);
                    if (parsed.selectedService) setSelectedService(parsed.selectedService);
                    if (parsed.selectedStaff) setSelectedStaff(parsed.selectedStaff);
                    if (parsed.selectedDate) setSelectedDate(new Date(parsed.selectedDate));
                    if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
                    if (parsed.notes) setNotes(parsed.notes);
                }
            } catch (e) {
                logger.error("Error loading booking state:", e);
            }
        }
        setIsInitialized(true);
    }, []);

    // Save to localStorage on changes
    useEffect(() => {
        if (!isInitialized) return;
        const state = {
            step,
            selectedService,
            selectedStaff,
            selectedDate: selectedDate?.toISOString(),
            selectedTime,
            notes,
            _timestamp: Date.now()
        };
        localStorage.setItem('la-sirena-booking-state', JSON.stringify(state));
    }, [step, selectedService, selectedStaff, selectedDate, selectedTime, notes, isInitialized]);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const { data: userAppointments = [], refetch } = useQuery<Appointment[]>({
        queryKey: ['userAppointments', user?.email],
        queryFn: async () => {
            if (!user?.email) return [];
            const { data } = await supabase
                .from('appointments')
                .select('*, services(*)')
                .eq('customer_email', user.email)
                .order('appointment_date', { ascending: false });
            return (data || []) as Appointment[];
        },
        enabled: !!user && viewMode === 'my-appointments',
    });

    const fetchUserAppointments = () => refetch();

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const createAppointment = async (extraData?: { phone?: string }) => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !user) return false;

        const appointmentDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        const customerPhone = extraData?.phone || user.user_metadata?.phone || '';

        const { error } = await supabase.from('appointments').insert({
            service_id: selectedService.id,
            staff_id: selectedStaff.id,
            customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
            customer_email: user.email,
            customer_phone: customerPhone,
            appointment_date: appointmentDateStr,
            appointment_time: selectedTime,
            notes: notes,
            status: 'pending'
        });

        if (!error && extraData?.phone) {
            // Update profile with the new phone if provided
            await supabase.from('profiles').update({ phone: extraData.phone }).eq('id', user.id);
            // Also sync it to auth metadata so next loads detect it immediately
            await supabase.auth.updateUser({ data: { phone: extraData.phone } });
            
            // Re-fetch session to update local user state
            const { data: { session } } = await supabase.auth.getSession();
            if (session) setUser(session.user);
        }

        setIsSubmitting(false);
        if (error) {
            logger.error("Error al crear cita:", error, "Payload:", { service_id: selectedService.id, staff_id: selectedStaff.id, customer_email: user.email, customer_phone: customerPhone, appointment_date: appointmentDateStr, appointment_time: selectedTime });
            const errorStr = JSON.stringify(error, Object.getOwnPropertyNames(error));
            if (error.code === '23505') {
                setToast({ message: 'Ups, este horario acaba de ser reservado por alguien más. Por favor, elige otro.', type: 'error' });
            } else {
                setToast({ message: `Error (${error?.code || 'Desconocido'}): ${error?.message || errorStr}`, type: 'error' });
            }
            return false;
        }
        return true;
    };

    return (
        <BookingContext.Provider
            value={{
                step, setStep, nextStep, prevStep,
                selectedService, setSelectedService,
                selectedStaff, setSelectedStaff,
                selectedDate, setSelectedDate,
                selectedTime, setSelectedTime,
                notes, setNotes,
                user, setUser,
                userAppointments, fetchUserAppointments,
                viewMode, setViewMode,
                toast, setToast,
                createAppointment,
                isSubmitting, setIsSubmitting
            }}
        >
            {children}
        </BookingContext.Provider>
    );
}

export function useBooking() {
    const context = useContext(BookingContext);
    if (context === undefined) {
        throw new Error('useBooking must be used within a BookingProvider');
    }
    return context;
}
