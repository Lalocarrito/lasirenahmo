'use client';

import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Loader2 } from 'lucide-react';
import { playfair } from '@/lib/fonts';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { full_name: string };
}

export default function TestimonialsSection() {
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ['public-reviews'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return (data || []) as Review[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-24 px-4 md:px-8 text-center">
        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
      </section>
    );
  }

  return (
    <section id="testimonios" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 text-foreground`}>
            Lo Que Dicen Nuestras <span className="text-primary italic">Clientas</span>
          </h2>
          <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold">
            Reseñas reales de quienes ya confiaron en nosotras
          </p>
        </motion.div>

        {reviews.length === 0 ? (
          <p className="text-center text-muted-foreground italic">
            Aún no hay reseñas. ¡Sé la primera en dejar la tuya!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviews.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card !p-8 flex flex-col justify-between"
              >
                {r.comment && (
                  <p className="text-muted-foreground leading-relaxed italic mb-6">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}

                <div>
                  <div className="flex gap-1 mb-3">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} size={16} className="fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="font-bold text-sm">
                    {r.profiles?.full_name || 'Cliente Verificada'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
    </section>
  );
}
