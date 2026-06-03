'use client';

import { motion } from 'framer-motion';
import { X, User } from 'lucide-react';
import { playfair } from '@/lib/fonts';
import Image from 'next/image';
import type { Profile } from '@/types';

interface Props {
  member: Profile;
  onClose: () => void;
}

export default function TeamMemberModal({ member, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="relative h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/10">
          {member.avatar_url && (
            <Image
              src={member.avatar_url}
              alt={member.full_name || ''}
              fill
              sizes="500px"
              className="object-cover opacity-30"
            />
          )}
        </div>

        <div className="relative -mt-16 px-6">
          <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-card shadow-xl mx-auto">
            {member.avatar_url ? (
              <Image
                src={member.avatar_url}
                alt={member.full_name || ''}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                <User size={48} />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 text-center">
          <h3 className={`${playfair.className} text-2xl mb-1`}>{member.full_name || 'Sin nombre'}</h3>

          {member.specialty && (
            <p className="text-sm font-bold text-primary mb-4">{member.specialty}</p>
          )}

          {member.bio && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {member.bio}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
