'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { playfair } from '@/lib/fonts';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';
import type { Service } from '@/types';
import { toast } from 'sonner';



export default function ServiceSelection() {
    const { setSelectedService, nextStep, availableServices, isLoadingServices } = useBooking();

    if (isLoadingServices) {
        return (
            <div className="grid md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-64 w-full bg-muted/50 animate-pulse rounded-3xl" />
                ))}
            </div>
        );
    }

    if (availableServices.length === 0) {
        return (
            <div className="py-20 text-center space-y-6">
                <Sparkles size={48} className="mx-auto text-primary/20" />
                <h3 className={`${playfair.className} text-2xl`}>Cargando servicios...</h3>
                <p className="text-muted-foreground text-sm italic">Si el problema persiste, por favor recarga la página.</p>
                <button onClick={() => window.location.reload()} className="text-primary hover:underline font-bold uppercase tracking-widest text-[10px]">
                    Recargar Página
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8" id="service-selection-view">
            <div className="text-center max-w-lg mx-auto mb-12">
                <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 italic`}>Servicios</h2>
                <p className="text-muted-foreground text-sm italic">Selecciona el tratamiento ideal para resaltar tu mirada</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                {availableServices.length > 0 ? (
                    availableServices.map((service) => (
                        <button
                            key={service.id}
                            onClick={() => { setSelectedService(service); nextStep(); }}
                            className="group text-left"
                        >
                            <div className="siren-card h-full flex flex-col hover:border-primary transition-all duration-500 !p-0 overflow-hidden group-hover:shadow-2xl group-hover:shadow-primary/10">
                                <div className="h-48 overflow-hidden relative">
                                    <img
                                        src={service.image_url || 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&q=80'}
                                        alt={service.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                        <span className="text-white font-bold tracking-widest text-2xl">${service.price}</span>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <h3 className={`${playfair.className} text-2xl mb-2 group-hover:text-primary transition-colors uppercase tracking-tight`}>{service.name}</h3>
                                    <p className="text-muted-foreground text-sm line-clamp-2 italic mb-6">{service.description}</p>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[10px] font-bold uppercase tracking-widest gap-4">
                                        <span className="text-muted-foreground">Duración: {service.duration}</span>
                                        <div className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full shadow-lg shadow-primary/30 group-hover:-translate-y-1 group-hover:shadow-primary/50 transition-all">
                                            Reservar Ahora <ArrowRight size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground italic">
                        No se encontraron servicios disponibles en este momento.
                    </div>
                )}
            </div>
        </div>
    );
}
