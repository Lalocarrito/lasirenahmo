'use client';

import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Moon, Sun, Calendar, ChevronRight, LogOut, User } from 'lucide-react';
import BookingFlow from '@/components/BookingFlow';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { Post, Profile } from '@/types';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null); // Supabase session user is complex type, ANY is acceptable for raw session user but better to not touch Auth type here.
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showFloatingButton, setShowFloatingButton] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        setShowFloatingButton(!entry.isIntersecting);
      });
    }, { threshold: 0.1, rootMargin: "0px" });

    const target = document.getElementById('reservar');
    if (target) observer.observe(target);

    return () => observer.disconnect();
  }, []);

  const { data: posts = [] } = useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Post[];
    }
  });

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
    window.location.reload();
  };

  return (
    <main className="min-h-screen mesh-gradient dark:from-slate-900 dark:to-slate-800 transition-colors duration-500">
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
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema"
              className="p-2 rounded-full bg-white/20 dark:bg-black/20 hover:scale-110 transition-all text-primary"
            >
              {mounted && theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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

      {/* Stories Section */}
      <section className="pt-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar no-scrollbar">
          {posts.filter(p => p.type === 'story').map((story) => (
            <motion.div
              key={story.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-shrink-0 w-24 h-32 md:w-28 md:h-40 rounded-2xl p-0.5 bg-gradient-to-tr from-primary to-accent cursor-pointer group"
            >
              <div className="w-full h-full rounded-2xl bg-card overflow-hidden relative">
                {story.image_url ? (
                  <img src={story.image_url} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-primary/5 flex items-center justify-center p-3 text-center text-foreground">
                    <p className="text-[10px] md:text-xs font-medium leading-tight line-clamp-4">{story.content}</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-all" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Hero Section */}
      <section id="inicio" className="relative px-8 pt-20 pb-20 flex flex-col items-center text-center">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-40 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[100px] animate-pulse" />

        <h1 className={`${playfair.className} text-6xl md:text-8xl mb-6 text-foreground leading-tight`}>
          Tus ojos, <br />
          <span className="text-primary italic">nuestro arte.</span>
        </h1>

        <p className="max-w-xl text-lg text-gray-600 dark:text-slate-400 mb-10">
          Diseño premium de pestañas en Hermosillo. Realzamos tu mirada con estilo, lujo y perfección.
        </p>

        <div className="flex gap-4">
          <Link href="#reservar" className="siren-button">
            Agendar Ahora
          </Link>
        </div>
      </section>

      {/* Stories/News Feed Section */}
      {posts.filter(p => p.type === 'feed').length > 0 && (
        <section className="px-8 py-20 bg-primary/5">
          <div className="max-w-7xl mx-auto">
            <h2 className={`${playfair.className} text-4xl mb-12 text-center`}>Nuestras Novedades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.filter(p => p.type === 'feed').slice(0, 3).map((post) => (
                <div key={post.id} className="glass-card flex flex-col h-full bg-white/40 dark:bg-black/20">
                  {post.image_url && (
                    <div className="h-52 w-full mb-6 overflow-hidden rounded-2xl">
                      <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-3">{post.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-6">{post.content}</p>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-primary/10">
                    <span className="text-xs text-primary font-bold">{new Date(post.created_at).toLocaleDateString()}</span>
                    <button className="text-xs font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors flex items-center gap-1">
                      Leer más <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Booking Section */}
      <section id="reservar" className="px-8 py-20 bg-card/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className={`${playfair.className} text-5xl mb-4`}>Reserva tu cita</h2>
          <p className="text-gray-500 italic">Misticismo y elegancia en cada sesión.</p>
        </div>
        <BookingFlow />
      </section>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Floating Reserve Button for Mobile */}
      <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-40 md:hidden transition-all duration-500 ${showFloatingButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
        <Link href="#reservar" className="siren-button flex items-center gap-2 whitespace-nowrap px-10">
          <Calendar size={20} />
          Reservar Ahora
        </Link>
      </div>

      <footer className="py-20 text-center border-t border-primary/10 bg-card/20 backdrop-blur-md">
        <div className={`${playfair.className} text-2xl text-primary mb-4`}>La Sirena</div>
        <p className="text-muted-foreground text-sm">© 2024 La Sirena. Todos los derechos reservados.</p>
      </footer>
    </main>
  );
}
