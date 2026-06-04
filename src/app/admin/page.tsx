'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { getSafeRedirectUrl } from '@/lib/safe-redirect';
import { Lock, Mail, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

function AdminLoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isForgot, setIsForgot] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    const isReset = searchParams.get('reset') === 'true';

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: getSafeRedirectUrl('/auth/callback?next=/admin/dashboard') }
        });
        if (error) setError(error.message);
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        if (isReset) {
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(updateError.message);
            } else {
                setSuccessMsg('Contraseña actualizada. Redirigiendo...');
                setTimeout(() => router.push('/admin/dashboard'), 2000);
            }
        } else if (isForgot) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: getSafeRedirectUrl('/admin?reset=true'),
            });
            if (error) {
                setError(error.message);
            } else {
                setSuccessMsg('Revisa tu correo para restablecer tu contraseña.');
                setTimeout(() => setIsForgot(false), 2000);
            }
        } else {
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) {
                setError(authError.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : authError.message);
            } else {
                window.location.href = '/admin/dashboard';
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
            <div className="glass-card w-full max-w-md p-10 space-y-8">
                <div className="text-center">
                    <h1 className={`${playfair.className} text-4xl text-primary`}>
                        {isReset ? 'Nueva Contraseña' : isForgot ? 'Recuperar' : 'Iniciar Sesión'}
                    </h1>
                </div>

                <form onSubmit={handleAction} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-bold text-center">
                            {error}
                        </div>
                    )}
                    {successMsg && (
                        <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2">
                            <CheckCircle size={14} /> {successMsg}
                        </div>
                    )}

                    <div className="space-y-4">
                        {!isReset && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1 flex items-center gap-2">
                                    <Mail size={12} /> Correo
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-primary/10 bg-card focus:border-primary outline-none transition-all"
                                />
                            </div>
                        )}

                        {(isReset || (!isForgot && !isReset)) && (
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground px-1 flex items-center gap-2">
                                    <Lock size={12} /> {isReset ? 'Nueva Contraseña' : 'Contraseña'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        minLength={6}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-4 rounded-xl border-2 border-primary/10 bg-card focus:border-primary outline-none transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {!isReset && !isForgot && (
                                    <button
                                        type="button"
                                        onClick={() => setIsForgot(true)}
                                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest w-full text-right"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="siren-button w-full py-4 text-base tracking-widest flex items-center justify-center gap-3"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                            isReset ? 'Actualizar' : isForgot ? 'Enviar correo' : 'Entrar'
                        )}
                    </button>

                    {isForgot && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setIsForgot(false)}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold"
                            >
                                Volver al login
                            </button>
                        </div>
                    )}

                    {isReset && (
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => router.push('/admin')}
                                className="text-xs text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest font-bold"
                            >
                                Volver al login
                            </button>
                        </div>
                    )}
                </form>

                {!isReset && !isForgot && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground shrink-0">o accede con</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        <button
                            onClick={handleGoogleLogin}
                            className="w-full p-4 rounded-xl border-2 border-primary/10 flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest hover:bg-primary/5 hover:border-primary/20 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                                <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                                <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                                <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                                <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                            </svg>
                            Google
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function AdminLogin() {
    return (
        <Suspense fallback={
            <div className="min-h-screen mesh-gradient flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        }>
            <AdminLoginContent />
        </Suspense>
    );
}
