'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, LogOut, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { supabase } from '@/lib/supabase';

export default function ProfileNav() {
    const router = useRouter();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    return (
        <nav className="w-full fixed top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-3 group">
                    <img src="/icon1.png" alt="Logo" className="h-8 md:h-9 w-auto rounded-md shadow-sm group-hover:scale-105 transition-transform" />
                </Link>

                <div className="flex items-center gap-2">
                    <div className="w-px h-4 bg-border/50" />

                    <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        aria-label="Cambiar tema"
                        className="p-2 rounded-full bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                    >
                        {mounted && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    <Link
                        href="/"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold text-primary hover:bg-primary/10 transition-colors uppercase tracking-widest"
                    >
                        <Home size={12} />
                        Inicio
                    </Link>

                    <button
                        onClick={handleSignOut}
                        disabled={isLoggingOut}
                        className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Cerrar sesión"
                    >
                        {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                    </button>
                </div>
            </div>
        </nav>
    );
}
