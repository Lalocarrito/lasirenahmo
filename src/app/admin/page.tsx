'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Loader2, CheckCircle } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

function AdminLoginContent() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();

    const isReset = searchParams.get('reset') === 'true';

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMsg('');

        if (isReset) {
            // Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                setError(updateError.message);
            } else {
                setSuccessMsg('Contraseña actualizada con éxito. Redirigiendo...');
                setTimeout(() => {
                    router.push('/admin/dashboard');
                }, 2000);
            }
        } else {
            // Normal login
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                setError(authError.message === 'Invalid login credentials' ? 'Credenciales incorrectas' : authError.message);
            } else {
                router.push('/admin/dashboard');
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
            <div className="glass-card w-full max-w-md p-10 space-y-8">
                <div className="text-center">
                    <h1 className={`${playfair.className} text-4xl text-primary`}>
                        {isReset ? 'Nueva Contraseña' : 'Acceso Admin'}
                    </h1>
                    <p className="text-muted-foreground mt-2 italic text-sm">
                        {isReset ? 'Ingresa tu nueva contraseña' : 'Gestiona La Sirena'}
                    </p>
                </div>

                <form onSubmit={handleAction} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-xs font-bold text-center animate-shake">
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
                                    <Mail size={12} /> Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 rounded-xl border-2 border-primary/10 bg-card focus:border-primary outline-none transition-all"
                                    placeholder="tu@admin.com"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground px-1 flex items-center gap-2">
                                <Lock size={12} /> {isReset ? 'Nueva Contraseña' : 'Contraseña'}
                            </label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-4 rounded-xl border-2 border-primary/10 bg-card focus:border-primary outline-none transition-all"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="siren-button w-full py-4 text-base tracking-widest flex items-center justify-center gap-3"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isReset ? 'ACTUALIZAR' : 'ENTRAR')}
                    </button>

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
