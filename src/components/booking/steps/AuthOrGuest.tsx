'use client';

import { useEffect } from 'react';
import { useBooking } from '../BookingContext';
import LoginModal from '@/components/auth/LoginModal';

export default function AuthOrGuest() {
    const { step, setStep, prevStep, user } = useBooking();

    useEffect(() => {
        if (user && step === 4) {
            setStep(5);
        }
    }, [user, step, setStep]);

    return (
        <>
            <LoginModal
                isOpen={step === 4 && !user}
                onClose={prevStep}
            />
        </>
    );
}
