'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function ServiceSelection() {
    const { setSelectedService, nextStep } = useBooking();
    const [services, setServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            const { data } = await supabase.from('services').select('*').order('price', { ascending: false });
            setServices(data || []);
            setIsLoadingServices(false);
        };
        fetchServices();
    }, []);

    return (
        <motion.div
            key="step1"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-8"
        >
            <div className="text-center max-w-lg mx-auto mb-12">
                <h2 className={`${playfair.className} text-5xl mb-4 italic`}>Servicios</h2>
                <p className="text-muted-foreground">Selecciona el tratamiento perfecto para realzar tu belleza natural.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
                {isLoadingServices ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 w-full bg-muted/50 animate-pulse rounded-3xl" />
                    ))
                ) : services.map((service) => (
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
                                <p className="text-muted-foreground text-sm line-clamp-2 italic mb-6">"{service.description}"</p>
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-primary">
                                    <span>Duración: {service.duration}</span>
                                    <div className="flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                                        Reservar Ahora <ArrowRight size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
