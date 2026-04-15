'use client';

import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Calendar, LogOut, User } from 'lucide-react';
import BookingFlow from '@/components/BookingFlow';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import { useTheme } from 'next-themes';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function Home() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);


  // Removed manual dark mode useEffect

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  return (
    <main className="min-h-screen mesh-gradient transition-colors duration-500">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-6 backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-white/10">
        <div className={`text-xl md:text-2xl font-bold text-primary ${playfair.className}`}>
          La Sirena
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex space-x-6 text-sm font-medium items-center">
            <Link href="#inicio" className="text-foreground hover:text-primary transition-colors">Inicio</Link>
            <Link href="#reservar" className="text-foreground hover:text-primary transition-colors">Reservar</Link>
            <Link href="/admin" className="text-foreground/20 dark:text-foreground/40 hover:text-primary transition-colors text-[10px] uppercase tracking-widest font-bold">
              Admin
            </Link>
          </div>

          <div className="flex items-center gap-2 border-l border-white/10 pl-4 md:pl-6">
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema"
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 hover:scale-110 transition-all text-primary"
            >
              {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end mr-4">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">Conectada</span>
                  <span className="text-[11px] text-foreground/60 max-w-[100px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => {
                    document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' });
                    window.dispatchEvent(new CustomEvent('open-appointments'));
                  }}
                  className="hidden md:flex items-center gap-2 text-xs font-bold text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors mr-2 cursor-pointer"
                >
                  <Calendar size={14} /> Mis Citas
                </button>
                <button
                  onClick={handleSignOut}
                  aria-label="Cerrar sesión"
                  className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                  title="Cerrar Sesión"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                aria-label="Iniciar sesión"
                className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                title="Iniciar Sesión"
              >
                <User size={18} />
              </button>
            )}
          </div>
        </div>
      </nav>


      {/* Hero Section */}
      <section id="inicio" className="relative px-8 pt-32 md:pt-40 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[100px] animate-pulse" />

        <h1 className={`${playfair.className} text-6xl md:text-8xl mb-6 text-foreground leading-tight`}>
          Tus ojos, <br />
          <span className="text-primary italic">nuestro arte.</span>
        </h1>

        <p className="max-w-xl text-lg text-gray-600 dark:text-slate-400 mb-10">
          Diseño premium de pestañas en Hermosillo. Realzamos tu mirada con estilo, lujo y perfección.
        </p>

      </section>




      {/* Galería Section */}
      <section className="px-8 py-24 bg-card/30 backdrop-blur-sm border-y border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 text-foreground`}>Nuestros <span className="text-primary italic">Estilos</span></h2>
              <p className="text-muted-foreground">Desde un look natural hasta el volumen más dramático.</p>
            </div>
            <Link href="#reservar" className="text-xs font-bold uppercase tracking-widest text-primary hover:text-foreground transition-colors border-b border-primary pb-1">Ver todos los servicios</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {["Clásicas", "Híbridas", "Volumen", "Mega Volumen"].map((style, i) => (
               <motion.div key={style} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="group relative aspect-square rounded-3xl overflow-hidden cursor-pointer">
                 <img src={`https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80`} alt={style} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 blur-[2px] group-hover:blur-0" />
                 <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                   <h4 className={`${playfair.className} text-white text-xl md:text-2xl font-bold tracking-wider`}>{style}</h4>
                 </div>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="reservar" className="px-8 py-20 bg-card/20 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />

        <BookingFlow />
      </section>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      <footer className="py-20 text-center border-t border-primary/10 bg-card/20 backdrop-blur-md">
        <div className={`${playfair.className} text-2xl text-primary mb-4`}>La Sirena</div>
        <p className="text-muted-foreground text-xs mb-6">© 2024 La Sirena. Todos los derechos reservados. <span className="opacity-20">v2.1</span></p>
        <div className="flex justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
          <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidad</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Términos del Servicio</Link>
        </div>
      </footer>
    </main>
  );
}
