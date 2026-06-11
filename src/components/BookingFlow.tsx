'use client';

import { AnimatePresence, motion } from 'framer-motion';

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

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div id="booking-container" className="w-full max-w-4xl mx-auto px-4 py-12">
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

            <div id="booking-step-content" className="relative min-h-[400px]">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {step === 1 && <ServiceSelection />}
                        {step === 2 && <StaffSelection />}
                        {step === 3 && <DateSelection />}
                        {step === 4 && <AuthOrGuest />}
                        {(step === 5 || step === 6) && <BookingSummary />}
                    </motion.div>
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
