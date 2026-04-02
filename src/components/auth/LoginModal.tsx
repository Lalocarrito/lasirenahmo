'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const { error, data } = isLogin
            ? await supabase.auth.signInWithPassword({ email, password })
            : await supabase.auth.signUp({ email, password });

        setIsLoading(false);
        if (error) {
            console.error("DEBUG - Error en Auth:", error);
            let msg = error.message;
            if (msg.includes("Invalid login credentials")) msg = "No se encontró la cuenta o la contraseña es incorrecta.";
            if (msg.includes("weak_password")) msg = "La contraseña es muy corta (mínimo 6 caracteres).";
            if (msg.includes("User already registered")) msg = "Este correo ya está registrado. Por favor, inicia sesión.";
            setToast({ message: msg, type: 'error' });
        } else {
            setToast({ message: isLogin ? '¡Bienvenida de nuevo!' : '¡Cuenta creada!', type: 'success' });
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 1000);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/admin?reset=true',
        });
        setIsLoading(false);
        if (error) {
            setToast({ message: error.message, type: 'error' });
        } else {
            setToast({ message: 'Se ha enviado un correo para restablecer tu contraseña.', type: 'success' });
            setTimeout(() => setIsForgotPassword(false), 2000);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) setToast({ message: error.message, type: 'error' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-card border border-border w-full max-w-md rounded-3xl shadow-3xl overflow-hidden p-8"
                    >
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                            <X size={20} />
                        </button>

                        <div className="text-center mb-8">
                            <h2 className={`${playfair.className} text-4xl mb-2 italic`}>
                                {isForgotPassword ? 'Recuperar' : 'Tu Cuenta'}
                            </h2>
                            <p className="text-muted-foreground text-sm font-medium">
                                {isForgotPassword ? 'Enviaremos instrucciones a tu correo.' : 'Gestiona tus citas con elegancia.'}
                            </p>
                        </div>

                        {!isForgotPassword && (
                            <div className="flex p-1 bg-muted/30 rounded-2xl mb-8 border border-border/50">
                                <button
                                    onClick={() => { setIsLogin(true); setIsForgotPassword(false); }}
                                    className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", (isLogin && !isForgotPassword) ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                                >
                                    Login
                                </button>
                                <button
                                    onClick={() => { setIsLogin(false); setIsForgotPassword(false); }}
                                    className={cn("flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all", (!isLogin && !isForgotPassword) ? "bg-card shadow-lg text-primary" : "text-muted-foreground")}
                                >
                                    Registro
                                </button>
                            </div>
                        )}

                        <form onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm"
                                    placeholder="ejemplo@correo.com"
                                    required
                                />
                            </div>
                            {!isForgotPassword && (
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Contraseña</label>
                                        {isLogin && (
                                            <button
                                                type="button"
                                                onClick={() => setIsForgotPassword(true)}
                                                className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                                            >
                                                ¿Olvidaste tu contraseña?
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm"
                                        placeholder="••••••••"
                                        required={!isForgotPassword}
                                    />
                                </div>
                            )}

                            <div className="space-y-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                        isForgotPassword ? 'Enviar correo de recuperación' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')
                                    )}
                                </button>

                                {isForgotPassword && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgotPassword(false)}
                                        className="w-full text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-center"
                                    >
                                        Volver al inicio de sesión
                                    </button>
                                )}
                            </div>
                        </form>

                        {!isForgotPassword && (
                            <>
                                <div className="relative py-8">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50"></div></div>
                                    <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.3em]"><span className="bg-card px-4 text-muted-foreground/40">Ó</span></div>
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full p-4 rounded-2xl border border-border flex items-center justify-center gap-4 font-bold text-[10px] uppercase tracking-widest hover:bg-muted/30 transition-all"
                                >
                                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="" />
                                    Entrar con Google
                                </button>
                            </>
                        )}

                        {/* Toast inside modal */}
                        <AnimatePresence>
                            {toast && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className={cn(
                                        "absolute bottom-4 left-4 right-4 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-white text-xs font-bold z-10",
                                        toast.type === 'error' ? "bg-red-500" : "bg-primary"
                                    )}
                                >
                                    {toast.type === 'success' && <CheckCircle size={16} />}
                                    {toast.message}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
