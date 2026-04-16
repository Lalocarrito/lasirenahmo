'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Loader2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { getSafeRedirectUrl } from '@/lib/safe-redirect';
import { logger } from '@/lib/logger';
import { useBooking } from '../BookingContext';
import { toast } from 'sonner';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function AuthOrGuest() {
    const {
        step,
        setStep,
        prevStep,
        user, setUser
    } = useBooking();

    // Auto-advance if user logged in (e.g. after Google redirect)
    useEffect(() => {
        if (user && step === 4) {
            setStep(5);
        }
    }, [user, step, setStep]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            // SECURITY: Using server-side callback for PKCE code exchange.
            options: { redirectTo: getSafeRedirectUrl('/auth/callback') }
        });
        if (error) toast.error(error.message);
    };

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { data, error } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        setIsSubmitting(false);
        if (error) {
            let msg = error.message;
            if (msg.includes("Invalid login credentials")) {
                msg = "Contraseña incorrecta o cuenta no encontrada.";
            } else if (msg.includes("weak_password")) {
                msg = "La contraseña es muy corta (mínimo 6 caracteres).";
            } else if (msg.includes("User already registered")) {
                msg = "Este correo ya está registrado. Por favor, inicia sesión.";
            } else {
                logger.error("Error en Auth:", error);
            }
            
            toast.error(msg);
        } else {
            const authUser = data.user;
            if (authUser) {
                toast.success(isLogin ? '¡Bienvenida de nuevo!' : '¡Cuenta creada!');
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
                        onClick={() => setIsLogin(false)}
                        className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", !isLogin ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                    >
                        Registro
                    </button>
                    <button
                        onClick={() => setIsLogin(true)}
                        className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", isLogin ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                    >
                        Iniciar Sesión
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

                    {/* Privacy checkbox — registration only */}
                    {!isLogin && (
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-primary rounded shrink-0"
                            />
                            <span className="text-[11px] text-muted-foreground leading-relaxed">
                                Acepto los{' '}
                                <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">Términos y Condiciones</Link>
                                {' '}y el{' '}
                                <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Aviso de Privacidad</Link>.
                            </span>
                        </label>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting || (!isLogin && !acceptedTerms)}
                        className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
                    </button>
                </form>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full mt-6 p-4 rounded-2xl border border-border flex items-center justify-center gap-4 font-bold text-xs uppercase tracking-widest hover:bg-muted/30 transition-all"
                >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="" />
                    Continuar con Google
                </button>

                <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
                    <button
                        onClick={prevStep}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver a fecha y hora
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
