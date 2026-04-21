'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playfair } from '@/lib/fonts';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';
import type { Service } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import Image from 'next/image';

const MotionImage = motion.create(Image);

export default function ServiceSelection() {
    const { setSelectedService, nextStep, availableServices, isLoadingServices } = useBooking();

    if (isLoadingServices) {
        return (
            <div className="grid md:grid-cols-2 gap-10">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-[450px] w-full bg-muted/20 animate-pulse rounded-[3.5rem]" />
                ))}
            </div>
        );
    }

    if (availableServices.length === 0) {
        return (
            <div className="py-24 text-center space-y-8 glass-card border-dashed">
                <Sparkles size={64} className="mx-auto text-primary/30 animate-pulse" />
                <div className="space-y-2">
                    <h3 className={`${playfair.className} text-3xl text-foreground`}>Sin servicios disponibles</h3>
                    <p className="text-muted-foreground text-sm italic max-w-xs mx-auto">Nuestro catálogo se está actualizando. Por favor intenta más tarde.</p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-8 py-3 bg-primary/10 text-primary font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/10"
                >
                    Recargar Catálogo
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-12" id="service-selection-view">
            <div className="text-center max-w-xl mx-auto space-y-4">
                <h2 className={`${playfair.className} text-5xl md:text-6xl text-foreground`}>Servicios</h2>
                <div className="h-1 w-12 bg-primary mx-auto rounded-full opacity-30" />
            </div>

            <div className="grid md:grid-cols-2 gap-10">
                {availableServices.map((service) => (
                    <motion.button
                        key={service.id}
                        whileHover="hover"
                        whileTap="tap"
                        initial="initial"
                        animate="initial"
                        onClick={() => { setSelectedService(service); nextStep(); }}
                        className="group relative h-[480px] w-full text-left rounded-[3.5rem] overflow-hidden shadow-2xl shadow-black/10 border border-white/10"
                    >
                        {/* Background Image */}
                        <div className="absolute inset-0 overflow-hidden">
                            <MotionImage
                                variants={{
                                    initial: { scale: 1 },
                                    hover: { scale: 1.1 }
                                }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                src={service.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80'}
                                alt={service.name}
                                fill
                                sizes="(max-width: 768px) 100vw, 50vw"
                                className="w-full h-full object-cover"
                            />
                            {/* Adaptive Gradient Overlay */}
                            <motion.div 
                                variants={{
                                    initial: { opacity: 0.6 },
                                    hover: { opacity: 0.85 }
                                }}
                                className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" 
                            />
                        </div>

                        {/* Floating Price Badge */}
                        <div className="absolute top-8 right-8 z-20">
                            <div className="backdrop-blur-xl bg-white/10 border border-white/20 px-6 py-2.5 rounded-2xl shadow-2xl">
                                <span className={cn("text-xl md:text-2xl font-black text-white", playfair.className)}>
                                    ${service.price}
                                </span>
                            </div>
                        </div>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex flex-col justify-end p-10 z-10 text-white">
                            <div className="relative">
                                {/* Title and Duration - Always Visible at the Bottom */}
                                <div className="space-y-0.5">
                                    <h3 className={cn("text-2xl md:text-5xl text-white uppercase tracking-tighter font-bold drop-shadow-lg", playfair.className)}>
                                        {service.name}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={12} className="text-primary" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                                            {service.duration}
                                        </span>
                                    </div>
                                </div>

                                {/* Interactive Section: Revealed on Hover only on Desktop */}
                                <motion.div 
                                    variants={{
                                        initial: { opacity: 0, y: 20, height: 0, marginTop: 0, pointerEvents: 'none' },
                                        hover: { opacity: 1, y: 0, height: "auto", marginTop: 24, pointerEvents: 'auto' }
                                    }}
                                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                    className="hidden md:block overflow-visible"
                                >
                                    <div className="pb-2">
                                        <p className="text-white/80 text-sm italic font-medium leading-relaxed mb-8 max-w-[90%]">
                                            {service.description}
                                        </p>

                                        <div className="flex items-center gap-4 bg-primary text-white px-10 py-4 rounded-full font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-primary/20 hover:shadow-primary/40 w-fit active:scale-95 transition-all">
                                            Reservar <ArrowRight size={16} />
                                        </div>
                                    </div>
                                </motion.div>


                                {/* Mobile Only: Ultra-minimalist - No description, tiny button */}
                                <div className="md:hidden mt-4 flex items-center justify-between">
                                    <div className="bg-primary p-3 rounded-full text-white shadow-lg shadow-primary/30">
                                        <ArrowRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        
                        {/* Glow Effect */}
                        <div className="absolute inset-0 border-[3px] border-primary/0 group-hover:border-primary/20 rounded-[3.5rem] transition-all duration-500 z-30 pointer-events-none" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
