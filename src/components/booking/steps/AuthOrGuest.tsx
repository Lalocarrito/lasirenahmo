'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AuthOrGuest() {
    const {
        setStep,
        user, setUser,
        setToast,
        selectedService, selectedTime, notes,
    } = useBooking();

    // Auto-advance if user logged in (e.g. after Google redirect)
    useState(() => {
        if (user) {
            setStep(5);
        }
    });

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) setToast({ message: error.message, type: 'error' });
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        setIsSubmitting(false);
        if (error) {
            console.error("DEBUG - Error en Auth:", error);
            let msg = error.message;
            if (msg.includes("Invalid login credentials")) msg = "No se encontró la cuenta o la contraseña es incorrecta.";
            if (msg.includes("weak_password")) msg = "La contraseña es muy corta (mínimo 6 caracteres).";
            if (msg.includes("User already registered")) msg = "Este correo ya está registrado. Por favor, inicia sesión.";
            setToast({ message: msg, type: 'error' });
        } else {
            const authUser = data.user;
            if (authUser) {
                setToast({ message: isLogin ? '¡Bienvenida de nuevo!' : '¡Cuenta creada!', type: 'success' });
                setUser(authUser);

                // Small delay to ensure state updates before moving to step 5 or making booking
                setTimeout(async () => {
                    const now = new Date();
                    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                    const { error: bookingError } = await supabase.from('appointments').insert({
                        service_id: selectedService?.id,
                        customer_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Cliente',
                        customer_email: authUser.email,
                        customer_phone: authUser.user_metadata?.phone || '',
                        appointment_date: today,
                        appointment_time: selectedTime,
                        notes: notes,
                        status: 'pending'
                    });

                    if (!bookingError) {
                        setStep(6);
                    } else {
                        console.error("DEBUG - Error al guardar cita tras login:", bookingError);
                        setToast({ message: `Error al guardar cita (${bookingError.code}): ${bookingError.message}`, type: 'error' });
                    }
                }, 500);
            }
        }
    };

    return (
        <motion.div
            key="auth"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="max-w-md mx-auto"
        >
            <div className="text-center mb-10">
                <h2 className={`${playfair.className} text-5xl mb-3 italic`}>Tu Cuenta</h2>
            </div>

            <div className="siren-card !p-8 shadow-3xl">
                <div className="flex p-1.5 bg-muted/30 rounded-2xl mb-8 border border-border/50">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", isLogin ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                    >
                        Login
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", !isLogin ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                    >
                        Registro
                    </button>
                </div>

                <form onSubmit={handleEmailAuth} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Email Corporativo</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none"
                            placeholder="ejemplo@correo.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Contraseña Segura</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm shadow-xl shadow-primary/20"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <div className="relative py-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em]"><span className="bg-card px-4 text-muted-foreground/40">Ó</span></div>
                </div>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full p-4 rounded-2xl border border-border flex items-center justify-center gap-4 font-bold text-xs uppercase tracking-widest hover:bg-muted/30 transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
                    Entrar con Google
                </button>
            </div>
            <button onClick={() => setStep(3)} className="w-full mt-8 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary tracking-[0.2em] transition-all">← Volver al calendario</button>
        </motion.div>
    );
}
