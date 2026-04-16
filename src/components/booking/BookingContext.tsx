'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Service, Profile } from '@/types';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

    createAppointment: (extraData?: { phone?: string }) => Promise<boolean>;
    resetBooking: () => void;
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
    const [isSubmitting, setIsSubmitting] = useState(false);

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
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user ?? null);
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const createAppointment = async (extraData?: { phone?: string }) => {
        if (!selectedService || !selectedStaff || !selectedDate || !selectedTime || !user) return false;

        const appointmentDateStr = format(selectedDate, 'yyyy-MM-dd');

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
            
            // Re-fetch user to update local state
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) setUser(updatedUser);
        }

        setIsSubmitting(false);
        if (error) {
            const errorDetails = {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
                status: (error as any).status
            };
            
            logger.error("Error al crear cita (Servidor):", JSON.stringify(errorDetails, null, 2));
            
            const payload = { 
                service_id: selectedService?.id, 
                staff_id: selectedStaff?.id, 
                customer_email: user?.email, 
                customer_phone: customerPhone, 
                appointment_date: appointmentDateStr, 
                appointment_time: selectedTime 
            };
            logger.error("Payload enviado:", JSON.stringify(payload, null, 2));

            if (error.code === '23505') {
                toast.error('Ups, este horario ya está reservado. Por favor elige otro.');
            } else if (error.code === 'P0001') {
                toast.error('Límite de citas excedido: ' + error.message);
            } else {
                toast.error(`Error de reserva (${error.code || '?'})`);
            }
            return false;
        }
        return true;
    };

    const resetBooking = () => {
        setStep(1);
        setSelectedService(null);
        setSelectedStaff(null);
        setSelectedDate(null);
        setSelectedTime('');
        setNotes('');
        setIsSubmitting(false);
        localStorage.removeItem('la-sirena-booking-state');
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
                createAppointment,
                resetBooking,
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
