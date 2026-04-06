'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function BookingSummary() {
    const {
        step, setStep,
        selectedService, selectedStaff, selectedDate, selectedTime,
        notes, setNotes,
        user,
        createAppointment,
        isSubmitting, setIsSubmitting
    } = useBooking();
    const [honeypot, setHoneypot] = useState('');

    if (step === 6) {
        return (
            <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md mx-auto text-center"
            >
                <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-10 relative">
                    <Sparkles size={64} className="text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                </div>
                <h2 className={`${playfair.className} text-5xl mb-6 italic`}>¡Reserva Guardada!</h2>
                <p className="text-muted-foreground mb-12 text-lg">Tu espacio ha sido asegurado. Nos vemos pronto en La Sirena HMO.</p>

                <div className="space-y-4">
                    <button
                        onClick={() => {
                            setStep(1);
                        }}
                        className="w-full siren-button !py-5 shadow-2xl shadow-primary/20"
                    >
                        Agendar otro servicio
                    </button>
                    <div className="pt-6 border-t border-border flex flex-col gap-4">
                        <button
                            onClick={() => window.location.reload()}
                            className="text-xs font-bold uppercase tracking-[0.3em] text-primary hover:underline transition-all"
                        >
                            Volver al inicio
                        </button>
                        <button
                            onClick={async () => {
                                await supabase.auth.signOut();
                                window.location.reload();
                            }}
                            className="text-[10px] uppercase font-bold text-muted-foreground hover:text-red-400 transition-colors"
                        >
                            Cerrar sesión
                        </button>
                    </div>
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
            className="max-w-xl mx-auto"
        >
            <div className="text-center mb-10">
                <h2 className={`${playfair.className} text-5xl mb-3 italic`}>Finalizar</h2>
                <p className="text-muted-foreground">Revisa los detalles y reserva tu espacio.</p>
                {user && (
                    <p className="text-[10px] mt-2 text-muted-foreground uppercase font-bold tracking-widest">
                        Reserva para: <span className="text-primary">{user.email}</span>
                        <button
                            onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
                            className="ml-2 text-red-400 hover:text-red-500 underline lowercase font-normal italic"
                        >
                            (¿No eres tú? Cerrar sesión)
                        </button>
                    </p>
                )}
            </div>

            <div className="siren-card !p-8 shadow-3xl space-y-8">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Profesional</span>
                        <p className="font-bold text-lg leading-tight">{selectedStaff?.full_name || 'Agendado'}</p>
                    </div>
                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Servicio</span>
                        <p className="font-bold text-primary text-lg leading-tight">{selectedService?.name}</p>
                    </div>
                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Inversión</span>
                        <p className="font-bold text-lg">${selectedService?.price}</p>
                    </div>
                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Fecha</span>
                        <p className="font-bold">{selectedDate?.toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}</p>
                    </div>
                    <div className="p-6 bg-muted/20 rounded-3xl border border-border/50 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Hora</span>
                        <p className="font-bold">{selectedTime}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Notas para el especialista (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none h-32 resize-none text-sm"
                        placeholder="Ej: Tengo piel sensible, prefiero música ambiental suave..."
                    />
                </div>

                {/* Honeypot anti-spam field */}
                <div className="absolute opacity-0 -z-10 w-0 h-0 overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Página Web</label>
                    <input 
                        type="text" 
                        id="website" 
                        name="website" 
                        tabIndex={-1} 
                        autoComplete="off"
                        value={honeypot}
                        onChange={(e) => setHoneypot(e.target.value)}
                    />
                </div>

                <button
                    onClick={async () => {
                        setIsSubmitting(true);
                        // Anti-spam check
                        if (honeypot.trim() !== '') {
                            // Fake success after short delay to trick bots
                            await new Promise(r => setTimeout(r, 800));
                            setStep(6);
                            setIsSubmitting(false);
                            return;
                        }

                        const success = await createAppointment();
                        if (success) setStep(6); // Go to success step (6)
                        setIsSubmitting(false);
                    }}
                    disabled={isSubmitting}
                    className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm shadow-xl shadow-primary/20"
                >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar y Reservar'}
                </button>

                <button onClick={() => setStep(3)} className="w-full text-[10px] uppercase font-bold text-muted-foreground hover:text-primary tracking-[0.2em] transition-colors">Volver a editar fecha/hora</button>
            </div>
        </motion.div>
    );
}
