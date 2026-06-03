'use client';

import { motion } from 'framer-motion';
import { ChevronDown, Instagram } from 'lucide-react';
import { playfair } from '@/lib/fonts';

export default function HeroSection() {
  return (
    <section className="relative min-h-[90vh] lg:min-h-[80vh] flex flex-col items-center justify-center text-center overflow-hidden">

      <div className="relative z-10 px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className={`${playfair.className} text-6xl md:text-8xl mb-4 text-foreground tracking-tight`}>
            La <span className="text-primary italic font-bold">Sirena</span>
          </h1>
          <p className="text-sm md:text-base uppercase tracking-[0.5em] text-muted-foreground mb-10 font-bold">
            Beauty Studio
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => document.getElementById('reservar')?.scrollIntoView({ behavior: 'smooth' })}
            className="siren-button py-4 px-10 text-sm shadow-2xl shadow-primary/30 hover:shadow-primary/50"
          >
            Reservar Ahora
          </button>
          <a
            href="https://www.instagram.com/lasirenahermosillo/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 py-4 px-10 text-sm font-bold text-primary border-2 border-primary/30 rounded-2xl hover:bg-primary/5 hover:border-primary/50 transition-all"
          >
            <Instagram size={18} />
            Ver Trabajos
          </a>
        </motion.div>
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        onClick={() => document.getElementById('equipo')?.scrollIntoView({ behavior: 'smooth' })}
        className="absolute bottom-8 z-10 animate-bounce text-muted-foreground/60 hover:text-foreground transition-colors"
      >
        <ChevronDown size={28} />
      </motion.button>
    </section>
  );
}
