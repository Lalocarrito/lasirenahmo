'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Loader2, User } from 'lucide-react';
import { playfair } from '@/lib/fonts';
import TeamMemberModal from '@/components/TeamMemberModal';
import type { Profile } from '@/types';

export default function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null);

  const { data: team = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['public-team'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['admin', 'staff'])
        .eq('is_visible', true)
        .order('role', { ascending: true });
      if (error) throw error;
      return (data || []) as Profile[];
    },
  });

  if (isLoading) {
    return (
      <section className="py-24 px-4 md:px-8 text-center">
        <Loader2 className="animate-spin text-primary mx-auto mb-4" size={32} />
      </section>
    );
  }

  if (team.length === 0) return null;

  return (
    <section id="equipo" className="py-24 px-4 md:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 text-foreground`}>
          Conoce a Nuestro <span className="text-primary italic">Equipo</span>
        </h2>
        <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold">
          Profesionales apasionadas por realzar tu mirada
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-8">
        {team.map((member, i) => (
          <motion.button
            key={member.id}
            onClick={() => setSelectedMember(member)}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="group relative bg-card border border-border rounded-3xl p-8 text-center hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer w-full sm:w-72"
          >
            <div className="relative w-28 h-28 mx-auto mb-6 rounded-full overflow-hidden border-2 border-border/50 group-hover:border-primary/50 transition-all">
              {member.avatar_url ? (
                <Image
                  src={member.avatar_url}
                  alt={member.full_name || ''}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                  <User size={36} />
                </div>
              )}
            </div>

            <h3 className="font-bold text-lg mb-1">{member.full_name || 'Sin nombre'}</h3>

            {member.specialty && (
              <p className="text-sm font-bold text-primary mt-2">{member.specialty}</p>
            )}

            {member.bio && (
              <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2 leading-relaxed">
                {member.bio}
              </p>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMember && (
          <TeamMemberModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
