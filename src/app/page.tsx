'use client';

import { playfair } from '@/lib/fonts';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Moon, Sun, Calendar, LogOut, User, MapPin } from 'lucide-react';
import BookingFlow from '@/components/BookingFlow';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import { useTheme } from 'next-themes';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import Image from 'next/image';
import HeroSection from '@/components/HeroSection';
import TeamSection from '@/components/TeamSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import FAQSection from '@/components/FAQSection';


export default function Home() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        setUser(null);
      } else {
        setUser(user);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
    <main className="min-h-screen transition-colors duration-500 relative">
      <div className="absolute inset-0 mesh-gradient pointer-events-none -z-10" />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-4 md:px-8 py-6 backdrop-blur-md bg-white/10 dark:bg-black/10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image 
            src="/icon1.png" 
            alt="La Sirena Logo" 
            width={40} 
            height={40} 
            className="h-10 w-auto rounded-lg shadow-sm"
            priority
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4 border-l border-white/10 pl-4 md:pl-6">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
            className="p-2 rounded-full bg-white/20 dark:bg-black/20 hover:scale-110 transition-all text-primary"
          >
            {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/perfil"
                className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-primary border border-primary/20 bg-white/10 px-3 md:px-4 py-2 rounded-full hover:bg-primary/10 transition-colors shadow-sm"
              >
                <Calendar size={14} /> Mis Citas
              </Link>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-primary border border-primary/20 bg-white/10 px-3 md:px-4 py-2 rounded-full hover:bg-primary/10 transition-colors shadow-sm"
            >
              <User size={14} /> Entrar / Citas
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <HeroSection />

      {/* Team Section */}
      <TeamSection />

      {/* Booking Flow */}
      <div id="reservar" className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-card rounded-[2.5rem] shadow-2xl overflow-hidden border-white/20 bg-white/5 backdrop-blur-md">
          <BookingFlow />
        </div>
      </div>

      {/* Testimonials */}
      <TestimonialsSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Ubicacion Section (Adapted to original style) */}
      <section id="ubicacion" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
                <h2 className={`${playfair.className} text-4xl mb-4 italic text-primary`}>Nuestra Ubicación</h2>
                <div className="flex gap-4 items-start">
                    <MapPin className="text-primary shrink-0" size={24} />
                    <div>
                        <p className="text-foreground font-bold text-lg leading-tight">C. Juan de Dios Bojórquez 128b</p>
                        <p className="text-muted-foreground text-sm italic mt-1 leading-relaxed">
                            Sonacer, 83174 Hermosillo, <br/>
                            Sonora, México.
                        </p>
                    </div>
                </div>
            </div>
            <div className="w-full md:w-1/2 aspect-square rounded-[2rem] overflow-hidden border border-white/20 shadow-xl relative group">
                <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1743.0824296146386!2d-111.01188260160522!3d29.100813899999988!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86ce81e87a0fcc95%3A0x1a261340df03f79f!2sLA%20SIRENA%20%7C%20Lash%20Studio%20%26%20Academy!5e0!3m2!1ses-419!2sus!4v1776190435370!5m2!1ses-419!2sus" 
                    className="absolute inset-0 w-full h-full border-0 grayscale hover:grayscale-0 transition-all duration-1000"
                    allowFullScreen={true}
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                />
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 text-center border-t border-primary/10 bg-card/20 backdrop-blur-md px-4">
        <p className="text-muted-foreground text-xs mb-6">© 2026 La Sirena. Todos los derechos reservados. <span className="opacity-20">v2.1</span></p>
        <div className="flex flex-wrap justify-center gap-6 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
          <Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidad</Link>
          <Link href="/terms" className="hover:text-primary transition-colors">Términos del Servicio</Link>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </main>
  );
}
