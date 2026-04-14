'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Loader2, ChevronLeft } from 'lucide-react';
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
    useEffect(() => {
        if (user) {
            setStep(5);
        }
    }, [user, setStep]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin + '/#reservar' }
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

                // Small delay to ensure state updates before moving
                setTimeout(() => {
                    setStep(5);
                }, 100);
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
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Correo Electrónico</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none"
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

                <button
                    onClick={handleGoogleLogin}
                    className="w-full mt-4 p-4 rounded-2xl border border-border flex items-center justify-center gap-4 font-bold text-xs uppercase tracking-widest hover:bg-muted/30 transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
                    Continuar con Google
                </button>
            </div>

        </motion.div>
    );
}
