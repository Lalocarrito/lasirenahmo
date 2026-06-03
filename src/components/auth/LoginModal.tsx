'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSafeRedirectUrl } from '@/lib/safe-redirect';
import { logger } from '@/lib/logger';
import { playfair } from '@/lib/fonts';
import { toast } from 'sonner';
import Link from 'next/link';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const router = useRouter();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (mode === 'register') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { phone } },
            });
            setIsLoading(false);
            if (error) {
                let msg = error.message;
                if (msg.includes("weak_password")) {
                    msg = "La contraseña es muy corta (mínimo 6 caracteres).";
                } else if (msg.includes("User already registered")) {
                    msg = "Este correo ya está registrado. Por favor, inicia sesión.";
                } else {
                    logger.error("Error en Auth:", error);
                }
                toast.error(msg);
            } else {
                toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
                setTimeout(() => { onClose(); router.refresh(); }, 1500);
            }
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) {
            let msg = error.message;
            if (msg.includes("Invalid login credentials")) {
                msg = "Contraseña incorrecta o cuenta no encontrada.";
            } else {
                logger.error("Error en Auth:", error);
            }
            toast.error(msg);
        } else {
            toast.success('¡Bienvenida de nuevo!');
            setTimeout(() => { onClose(); router.refresh(); }, 1000);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: getSafeRedirectUrl('/admin?reset=true'),
        });
        setIsLoading(false);
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Se ha enviado un correo para restablecer tu contraseña.');
            setTimeout(() => setMode('login'), 2000);
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: getSafeRedirectUrl('/auth/callback') }
        });
        if (error) toast.error(error.message);
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const headerTitle = mode === 'forgot' ? 'Recuperar Contraseña' : mode === 'register' ? 'Crear Cuenta' : 'Iniciar Sesión';
    const isAuthMode = mode === 'login' || mode === 'register';

    if (!mounted) return null;

    return createPortal(
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
                            <h2 className={`${playfair.className} text-3xl mb-2 italic`}>{headerTitle}</h2>
                        </div>

                        <form onSubmit={mode === 'forgot' ? handleForgotPassword : handleEmailAuth} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm"
                                    required
                                />
                            </div>

                            {mode !== 'forgot' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Contraseña</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm pr-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {mode === 'login' && (
                                        <button
                                            type="button"
                                            onClick={() => setMode('forgot')}
                                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest w-full text-right"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    )}
                                </div>
                            )}

                            {mode === 'register' && (
                                <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Teléfono (WhatsApp)</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full p-4 rounded-2xl bg-muted/20 border border-border focus:border-primary transition-all outline-none text-sm"
                                    />
                                </div>
                            )}

                            <div className="space-y-4 pt-2">
                                {mode === 'register' && (
                                    <p className="text-[11px] text-muted-foreground leading-relaxed text-center pb-2">
                                        Al crear una cuenta, aceptas los{' '}
                                        <Link href="/terms" target="_blank" className="text-primary hover:underline font-bold">Términos y Condiciones</Link>
                                        {' '}y el{' '}
                                        <Link href="/privacy" target="_blank" className="text-primary hover:underline font-bold">Aviso de Privacidad</Link>.
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full siren-button !py-5 flex items-center justify-center gap-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                                        mode === 'forgot' ? 'Enviar correo' : (mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta')
                                    )}
                                </button>
                            </div>
                        </form>

                        {mode === 'forgot' ? (
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className="w-full mt-4 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest text-center"
                            >
                                Volver al inicio de sesión
                            </button>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 my-6">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-xs text-muted-foreground shrink-0">o continúa con</span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>

                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full p-4 rounded-2xl border border-border flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest transition-all hover:bg-muted/30 active:scale-[0.98]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                        <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                                        <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                                        <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                                        <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                                    </svg>
                                    Google
                                </button>

                                <p className="mt-6 text-center text-xs text-muted-foreground">
                                    {mode === 'login' ? (
                                        <>¿No tienes cuenta?{' '}
                                            <button onClick={() => setMode('register')} className="text-primary font-bold hover:underline">
                                                Regístrate
                                            </button>
                                        </>
                                    ) : (
                                        <>¿Ya tienes cuenta?{' '}
                                            <button onClick={() => setMode('login')} className="text-primary font-bold hover:underline">
                                                Inicia sesión
                                            </button>
                                        </>
                                    )}
                                </p>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
