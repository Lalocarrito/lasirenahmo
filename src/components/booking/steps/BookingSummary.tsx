'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { toast } from 'sonner';
import { Loader2, Sparkles, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';
import { formatPhone } from '@/lib/phone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';

const playfair = Playfair_Display({ subsets: ['latin'] });

/**
 * Zod schema for booking summary validation.
 * Replaces imperative if/alert validation.
 */
const bookingSummarySchema = z.object({
    phone: z.string().optional(),
    notes: z.string().max(500, 'Las notas no pueden exceder 500 caracteres').optional(),
    honeypot: z.string().max(0, '').optional(),
});

type BookingSummaryFormData = z.infer<typeof bookingSummarySchema>;

export default function BookingSummary() {
    const router = useRouter();
    const {
        step, setStep, prevStep,
        selectedService, selectedStaff, selectedDate, selectedTime,
        notes, setNotes,
        user,
        createAppointment,
        resetBooking,
        isSubmitting, setIsSubmitting,
    } = useBooking();

    // Guard: if the user signs out while on this step, send them back to login (step 4).
    // BookingSummary always requires an active session.
    useEffect(() => {
        if (!user && (step === 5 || step === 6)) {
            setStep(4);
        }
    }, [user, step, setStep]);

    const needsPhone = user && !user.user_metadata?.phone;

    // Build schema dynamically based on whether phone is needed
    const formSchema = needsPhone
        ? bookingSummarySchema.extend({
            phone: z.string()
                .min(10, 'El número de teléfono debe tener 10 dígitos.')
                .max(10, 'El número de teléfono debe tener 10 dígitos.')
                .regex(/^[0-9]+$/, 'Solo se permiten números.'),
        })
        : bookingSummarySchema;

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingSummaryFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            phone: '',
            notes: notes || '',
            honeypot: '',
        },
    });

    const onSubmit = async (data: BookingSummaryFormData) => {
        if (!user) {
            toast.error('Sesión inválida. Por favor, vuelve al paso anterior para iniciar sesión.');
            return;
        }

        setIsSubmitting(true);

        // Anti-spam check
        if (data.honeypot && data.honeypot.trim() !== '') {
            // Fake success after short delay to trick bots
            await new Promise(r => setTimeout(r, 800));
            setStep(6);
            setIsSubmitting(false);
            return;
        }

        // Sync notes to context
        if (data.notes !== undefined) setNotes(data.notes);

        const success = await createAppointment({ phone: needsPhone ? data.phone : undefined });
        if (success) setStep(6);
        setIsSubmitting(false);
    };

    if (step === 6) {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center"
            >
                <div className="bg-card w-full rounded-3xl border border-border/50 text-left mb-6 shadow-2xl shadow-primary/5 overflow-hidden relative">
                    {/* Header with Logo */}
                    <div className="p-6 flex flex-col items-center border-b border-border/50">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-md border-2 border-primary/20 relative overflow-hidden">
                            <Image 
                                src="/icon1.png" 
                                alt="La Sirena Logo" 
                                fill 
                                className="object-cover" 
                                priority
                            />
                        </div>
                        <h2 className={`${playfair.className} text-3xl italic text-center`}>¡Reserva Guardada!</h2>
                    </div>

                    {/* Details */}
                    <div className="px-6 py-8 flex flex-col items-center text-center">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-3">Servicio Agendado</p>
                        <h3 className={`${playfair.className} text-3xl text-primary mb-2 leading-tight`}>{selectedService?.name}</h3>
                        <p className="text-xs font-medium text-muted-foreground mb-8">
                            con <span className="text-foreground font-bold">{selectedStaff ? (selectedStaff.full_name || 'Lashista') : 'Cualquiera'}</span>
                        </p>

                        <div className="w-full flex justify-center items-center py-4 border-y border-border/50 bg-muted/10">
                            <div className="flex-1 text-center px-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 font-bold">Día</p>
                                <p className="font-bold text-sm capitalize">
                                    {selectedDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                                </p>
                            </div>
                            <div className="w-px bg-border/50 h-8"></div>
                            <div className="flex-1 text-center px-2">
                                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground mb-1.5 font-bold">Hora</p>
                                <p className="font-bold text-sm text-primary">{selectedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Ticket Footer */}
                    <div className="bg-primary/5 p-5 flex justify-between items-center text-primary border-t border-primary/10">
                        <span className="font-bold uppercase tracking-widest text-[9px] w-1/2 leading-tight">Total a liquidar en sucursal</span>
                        <span className="font-bold text-2xl">${selectedService?.price}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <Link 
                        href="/perfil"
                        onClick={() => resetBooking()}
                        className="block w-full siren-button !py-5 shadow-2xl shadow-primary/20 text-center"
                    >
                        Ver mis citas
                    </Link>

                    <button
                        onClick={() => document.getElementById('ubicacion')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full py-4 rounded-2xl border-2 border-primary/20 font-bold text-xs uppercase tracking-widest text-primary hover:bg-primary/5 transition-all"
                    >
                        Cómo llegar
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            key="summary"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-3xl mx-auto px-1 md:px-4"
        >
            <div className="text-center mb-10">
                <h2 className={`${playfair.className} text-5xl mb-3 italic`}>Finalizar</h2>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="siren-card !p-3 sm:!p-6 md:!p-10 shadow-3xl space-y-6">
                {selectedService?.image_url && (
                    <div className="w-full h-48 md:h-64 rounded-2xl overflow-hidden relative shadow-md border border-border/50">
                        <Image 
                            src={selectedService.image_url} 
                            alt={selectedService.name} 
                            fill 
                            className="object-cover" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                )}
                <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-center px-6 py-5 bg-card/50 rounded-2xl border border-border/40 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Profesional</span>
                        <p className="font-bold text-sm">{selectedStaff ? (selectedStaff.full_name || 'Lashista') : 'Cualquiera'}</p>
                    </div>
                    <div className="flex justify-between items-center px-6 py-5 bg-card/50 rounded-2xl border border-border/40 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Servicio</span>
                        <p className="font-bold text-sm text-primary uppercase tracking-wide">{selectedService?.name}</p>
                    </div>
                    <div className="flex justify-between items-center px-6 py-5 bg-primary/5 rounded-2xl border border-primary/20 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-primary tracking-widest">Inversión</span>
                        <p className="font-bold text-lg text-primary">${selectedService?.price}</p>
                    </div>
                    <div className="flex justify-between items-center px-6 py-5 bg-card/50 rounded-2xl border border-border/40 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cita</span>
                        <p className="font-bold text-sm text-right">
                            {selectedDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}<br/>
                            <span className="text-primary">{selectedTime}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Notas (Opcional)</label>
                    <textarea
                        {...register('notes')}
                        onChange={(e) => {
                            setNotes(e.target.value);
                        }}
                        className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none h-14 resize-none text-sm"
                        placeholder="Ej: Tengo ojos sensibles..."
                    />
                    {errors.notes && <p className="text-red-500 text-xs ml-1">{errors.notes.message}</p>}
                </div>

                {needsPhone && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 py-4"
                    >
                        <label className="text-[10px] uppercase font-bold text-primary tracking-widest ml-1">Número de Teléfono (Requerido)</label>
                        <input
                            type="tel"
                            value={formatPhone(watch('phone') || '')}
                            onChange={(e) => setValue('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            className="w-full p-4 rounded-2xl bg-primary/5 border border-primary/20 focus:border-primary transition-all outline-none text-sm font-bold"
                           
                        />
                        {errors.phone && <p className="text-red-500 text-xs ml-1">{errors.phone.message}</p>}
                        <p className="text-[9px] text-muted-foreground italic ml-1">Lo necesitamos para enviarte recordatorios de tu cita.</p>
                    </motion.div>
                )}

                {/* Honeypot anti-spam field */}
                <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Página Web</label>
                    <input 
                        type="text" 
                        id="website" 
                        tabIndex={-1} 
                        autoComplete="off"
                        {...register('honeypot')}
                    />
                </div>

                {/* COMPLIANCE: Terms & Privacy acceptance */}
                <div className="flex items-start gap-3 group">
                    <span className="text-[11px] text-muted-foreground leading-relaxed">
                        Al reservar, acepto los{' '}
                        <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">Términos y Condiciones</Link>
                        {' '}y el{' '}
                        <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Aviso de Privacidad</Link>.
                    </span>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar y Reservar'}
                </button>

                <div className="pt-4 flex justify-center border-t border-border/30">
                    <button
                        type="button"
                        onClick={() => {
                            if (user) setStep(3);
                            else prevStep();
                        }}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        {user ? 'Volver a fecha y hora' : 'Volver a mis datos'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}
