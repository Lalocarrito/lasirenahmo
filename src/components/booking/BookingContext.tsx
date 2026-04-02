'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Appointment, Service, Profile } from '@/types';

interface BookingContextType {
    step: number;
    setStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;

    selectedService: Service | null;
    setSelectedService: (service: Service | null) => void;
    selectedDate: Date | null;
    setSelectedDate: (date: Date | null) => void;
    selectedTime: string;
    setSelectedTime: (time: string) => void;
    notes: string;
    setNotes: (notes: string) => void;

    user: any; // Keep any for raw Auth user from Supabase since it's deeply nested
    setUser: (user: any) => void;
    userAppointments: Appointment[];
    fetchUserAppointments: () => void;

    viewMode: 'booking' | 'my-appointments';
    setViewMode: (mode: 'booking' | 'my-appointments') => void;

    toast: { message: string, type: 'error' | 'success' } | null;
    setToast: (toast: { message: string, type: 'error' | 'success' } | null) => void;

    createAppointment: () => Promise<boolean>;
    isSubmitting: boolean;
    setIsSubmitting: (val: boolean) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children, initialStep = 1 }: { children: ReactNode, initialStep?: number }) {
    const [step, setStep] = useState(initialStep);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [user, setUser] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'booking' | 'my-appointments'>('booking');
    const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

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

    const createAppointment = async () => {
        if (!selectedService || !selectedDate || !selectedTime || !user) return false;

        const appointmentDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

        const { error } = await supabase.from('appointments').insert({
            service_id: selectedService.id,
            customer_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Cliente',
            customer_email: user.email,
            customer_phone: user.user_metadata?.phone || '',
            appointment_date: appointmentDateStr,
            appointment_time: selectedTime,
            notes: notes,
            status: 'pending'
        });

        setIsSubmitting(false);
        if (error) {
            console.error("DEBUG - Error al crear cita:", error);
            if (error.code === '23505') {
                setToast({ message: 'Ups, este horario acaba de ser reservado por alguien más. Por favor, elige otro.', type: 'error' });
            } else {
                setToast({ message: `Error (${error.code || '400'}): ${error.message}. ${error.hint || ''}`, type: 'error' });
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
