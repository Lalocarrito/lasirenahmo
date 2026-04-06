'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { useEffect } from 'react';
import { CheckCircle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingProvider, useBooking } from './booking/BookingContext';
import { supabase } from '@/lib/supabase';

// Steps
import ServiceSelection from './booking/steps/ServiceSelection';
import StaffSelection from './booking/steps/StaffSelection';
import DateSelection from './booking/steps/DateSelection';
import AuthOrGuest from './booking/steps/AuthOrGuest';
import BookingSummary from './booking/steps/BookingSummary';
import UserAppointments from './booking/steps/UserAppointments';

const playfair = Playfair_Display({ subsets: ['latin'] });

function BookingFlowContent() {
    const { step, viewMode, setViewMode, user, toast } = useBooking();

    useEffect(() => {
        const handleOpen = () => setViewMode('my-appointments');
        window.addEventListener('open-appointments', handleOpen);
        return () => window.removeEventListener('open-appointments', handleOpen);
    }, [setViewMode]);

    useEffect(() => {
        if (step > 1 && viewMode !== 'my-appointments') {
            const el = document.getElementById('booking-step-content');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100; // Account for navbar height
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    }, [step, viewMode]);

    if (viewMode === 'my-appointments') {
        return <UserAppointments />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-12">
            {/* Header & Step Indicator */}
            <div className="flex justify-between items-center mb-12">
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-700",
                                step === i ? "w-12 bg-primary" : (idx < [1, 2, 3, 4, 5, 6].indexOf(step) ? "w-4 bg-primary/40" : "w-4 bg-muted")
                            )}
                        />
                    ))}
                </div>
                {user && (
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setViewMode('my-appointments')}
                            className="text-[10px] font-bold uppercase tracking-widest text-primary hover:scale-105 transition-all flex items-center gap-2 border border-primary/20 px-4 py-2 rounded-full"
                        >
                            <Users size={14} /> Mis Reservas
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.reload();
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors"
                            title="Cerrar Sesión"
                        >
                            Salir
                        </button>
                    </div>
                )}
            </div>

            <div id="booking-step-content">
                <AnimatePresence mode="wait">
                    {step === 1 && <ServiceSelection />}
                    {step === 2 && <StaffSelection />}
                    {step === 3 && <DateSelection />}
                    {step === 4 && <AuthOrGuest />}
                    {(step === 5 || step === 6) && <BookingSummary />}
                </AnimatePresence>
            </div>

            {/* Premium Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        className={cn(
                            "fixed bottom-12 left-1/2 z-[100] px-8 py-4 rounded-3xl shadow-3xl font-bold flex items-center gap-4 backdrop-blur-xl border",
                            toast.type === 'error' ? "bg-red-500/90 text-white border-red-500/20" : "bg-primary/90 text-white border-primary/20"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            {toast.type === 'error' ? '!' : <CheckCircle size={18} />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest opacity-70">{toast.type === 'error' ? 'Error' : 'Notificación'}</span>
                            <span className="text-sm font-medium">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function BookingFlow({ initialStep = 1 }: { initialStep?: number }) {
    return (
        <BookingProvider initialStep={initialStep}>
            <BookingFlowContent />
        </BookingProvider>
    );
}
