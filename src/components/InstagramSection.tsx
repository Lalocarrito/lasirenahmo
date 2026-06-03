'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Instagram } from 'lucide-react';
import { playfair } from '@/lib/fonts';

const INSTAGRAM_HANDLE = 'lasirenahermosillo';
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

export default function InstagramSection() {
  return (
    <section id="instagram" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card rounded-[2.5rem] overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-secondary/50"
      >
        <div className="flex flex-col items-center text-center p-12 md:p-20">
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 via-purple-500 to-yellow-500 flex items-center justify-center mb-8 shadow-xl shadow-primary/20"
          >
            <Instagram size={36} className="text-white" />
          </motion.div>

          <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 text-foreground`}>
            Síguenos en <span className="text-primary italic">Instagram</span>
          </h2>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold mb-8">
            Descubre nuestros trabajos, promociones y el día a día en La Sirena
          </p>

          <motion.a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-3 siren-button !py-4 !px-10"
          >
            <Instagram size={20} />
            @{INSTAGRAM_HANDLE}
            <ExternalLink size={16} />
          </motion.a>
        </div>
      </motion.div>
    </section>
  );
}
