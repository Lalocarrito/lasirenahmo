'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, LogOut, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BookingProvider, useBooking } from './booking/BookingContext';
import { supabase } from '@/lib/supabase';
import { playfair } from '@/lib/fonts';

// Steps
import ServiceSelection from './booking/steps/ServiceSelection';
import StaffSelection from './booking/steps/StaffSelection';
import DateSelection from './booking/steps/DateSelection';
import AuthOrGuest from './booking/steps/AuthOrGuest';
import BookingSummary from './booking/steps/BookingSummary';
import Link from 'next/link';

function BookingFlowContent() {
    const router = useRouter();
    const { step, setStep, user } = useBooking();

    const isInitialMount1 = useRef(true);

    // Auto-scroll al encabezado cuando cambia el paso
    useEffect(() => {
        if (isInitialMount1.current) {
            isInitialMount1.current = false;
            return;
        }
        const header = document.getElementById('booking-flow-header');
        if (header) {
            setTimeout(() => {
                header.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 150);
        }
    }, [step]);

    useEffect(() => {
        if (step > 1) {
            const el = document.getElementById('booking-step-content');
            if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 100; // Account for navbar height
                window.scrollTo({ top: y, behavior: 'smooth' });
            }
        }
    }, [step]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-12">
            {/* Header & Navigation */}
            <div className="flex flex-col gap-6 mb-12" id="booking-flow-header">
                <div className="flex justify-end items-center h-2" />

                {/* Progress Indicator */}
                <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5, 6].map((i, idx) => (
                        <div
                            key={i}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-700",
                                step === i ? "w-12 bg-primary" : (idx < [1, 2, 3, 4, 5, 6].indexOf(step) ? "w-4 bg-primary/40" : "w-4 bg-muted/30")
                            )}
                        />
                    ))}
                </div>
            </div>

            <div id="booking-step-content">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <ServiceSelection />
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <StaffSelection />
                        </motion.div>
                    )}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <DateSelection />
                        </motion.div>
                    )}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <AuthOrGuest />
                        </motion.div>
                    )}
                    {(step === 5 || step === 6) && (
                        <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <BookingSummary />
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
}

export default function BookingFlow() {
    return (
        <BookingProvider>
            <BookingFlowContent />
        </BookingProvider>
    );
}
