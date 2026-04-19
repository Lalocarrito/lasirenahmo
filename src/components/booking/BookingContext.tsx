'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
    availableServices: Service[];
    isLoadingServices: boolean;
    loadServices: () => Promise<void>;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children, initialStep = 1 }: { children: ReactNode, initialStep?: number }) {
    const [bookingState, setBookingState] = useState({
        step: initialStep,
        selectedService: null as Service | null,
        selectedStaff: null as Profile | null,
        selectedDate: null as Date | null,
        selectedTime: '',
        notes: '',
        isSubmitting: false,
    });

    const [isInitialized, setIsInitialized] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [availableServices, setAvailableServices] = useState<Service[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);

    const loadServices = async () => {
        setIsLoadingServices(true);
        try {
            const { data } = await supabase.from('services').select('*').order('price', { ascending: false });
            setAvailableServices((data || []) as Service[]);
        } catch (e) {
            console.error('Error fetching services in provider:', e);
        } finally {
            setIsLoadingServices(false);
        }
    };

    useEffect(() => {
        loadServices();
    }, []);

    // Load from sessionStorage on mount.
    // sessionStorage survives page reloads within the same tab (e.g. OAuth redirect)
    // but is NOT shared across tabs — new tabs always start from step 1.
    useEffect(() => {
        const saved = sessionStorage.getItem('la-sirena-booking-state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const timestamp = parsed._timestamp || 0;
                // If it's step 6 (Success), we don't resume. We start fresh on next visit.
                // This fulfills the user requirement: "si recarga o regresa debe iniciar desde 0"
                if (Date.now() - timestamp < 1000 * 60 * 60 * 2 && parsed.step !== 6) {
                    setBookingState(prev => ({
                        ...prev,
                        step: parsed.step || 1,
                        selectedService: parsed.selectedService || null,
                        selectedStaff: parsed.selectedStaff || null,
                        selectedDate: parsed.selectedDate ? new Date(parsed.selectedDate) : null,
                        selectedTime: parsed.selectedTime || '',
                        notes: parsed.notes || '',
                    }));
                }
            } catch (e) {
                console.error("Error loading booking state:", e);
            }
        }
        setIsInitialized(true);
    }, []);

    const router = useRouter();

    // Aggressive initial session detection
    useEffect(() => {
        const checkInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user ?? null);
            }
        };

        checkInitialSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                if (event === 'SIGNED_IN') {
                    router.refresh();
                }
            } else {
                setUser(null);
                if (event === 'SIGNED_OUT') {
                    // Clear booking state so next login starts fresh
                    sessionStorage.removeItem('la-sirena-booking-state');
                    router.refresh();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [router]);

    // Save to sessionStorage on changes
    useEffect(() => {
        if (!isInitialized) return;
        const stateToSave = {
            ...bookingState,
            selectedDate: bookingState.selectedDate?.toISOString(),
            _timestamp: Date.now()
        };
        sessionStorage.setItem('la-sirena-booking-state', JSON.stringify(stateToSave));
    }, [bookingState, isInitialized]);

    const setStep = useCallback((step: number) => setBookingState(prev => ({ ...prev, step })), []);
    const setSelectedService = useCallback((selectedService: Service | null) => setBookingState(prev => ({ ...prev, selectedService })), []);
    const setSelectedStaff = useCallback((selectedStaff: Profile | null) => setBookingState(prev => ({ ...prev, selectedStaff })), []);
    const setSelectedDate = useCallback((selectedDate: Date | null) => setBookingState(prev => ({ ...prev, selectedDate })), []);
    const setSelectedTime = useCallback((selectedTime: string) => setBookingState(prev => ({ ...prev, selectedTime })), []);
    const setNotes = useCallback((notes: string) => setBookingState(prev => ({ ...prev, notes })), []);
    const setIsSubmitting = useCallback((isSubmitting: boolean) => setBookingState(prev => ({ ...prev, isSubmitting })), []);

    const nextStep = useCallback(() => setBookingState(prev => ({ ...prev, step: prev.step + 1 })), []);
    const prevStep = useCallback(() => setBookingState(prev => ({ ...prev, step: prev.step - 1 })), []);

    const createAppointment = async (extraData?: { phone?: string }) => {
        const { selectedService, selectedStaff, selectedDate, selectedTime, notes } = bookingState;
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
            await supabase.from('profiles').update({ phone: extraData.phone }).eq('id', user.id);
            await supabase.auth.updateUser({ data: { phone: extraData.phone } });
            const { data: { user: updatedUser } } = await supabase.auth.getUser();
            if (updatedUser) setUser(updatedUser);
        }

        setIsSubmitting(false);
        if (error) {
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

    const resetBooking = useCallback(() => {
        sessionStorage.removeItem('la-sirena-booking-state');
        setBookingState({
            step: 1,
            selectedService: null,
            selectedStaff: null,
            selectedDate: null,
            selectedTime: '',
            notes: '',
            isSubmitting: false,
        });
    }, []);

    return (
        <BookingContext.Provider value={{
            step: bookingState.step,
            setStep,
            nextStep,
            prevStep,
            selectedService: bookingState.selectedService,
            setSelectedService,
            selectedStaff: bookingState.selectedStaff,
            setSelectedStaff,
            selectedDate: bookingState.selectedDate,
            setSelectedDate,
            selectedTime: bookingState.selectedTime,
            setSelectedTime,
            notes: bookingState.notes,
            setNotes,
            user,
            setUser,
            createAppointment,
            resetBooking,
            isSubmitting: bookingState.isSubmitting,
            setIsSubmitting,
            availableServices,
            isLoadingServices,
            loadServices,
        }}>
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
