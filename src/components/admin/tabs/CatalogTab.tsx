'use client';

import { Playfair_Display } from 'next/font/google';
import { Users } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface CatalogTabProps {
    services: any[];
    setEditingService: (service: any) => void;
}

export default function CatalogTab({ services, setEditingService }: CatalogTabProps) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className={`${playfair.className} text-3xl`}>Catálogo de Servicios</h2>
                <button
                    onClick={() => setEditingService({ name: '', price: 0, description: '', duration: '', image_url: '' })}
                    className="siren-button !py-2 !px-6 text-sm flex items-center gap-2"
                >
                    + Nuevo Servicio
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {services.map((service) => (
                    <div key={service.id} className="admin-card group hover:border-primary/50 transition-all flex flex-col h-full">
                        {service.image_url ? (
                            <div className="relative h-48 w-full mb-4 rounded-xl overflow-hidden">
                                <img src={service.image_url} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                        ) : (
                            <div className="h-48 w-full mb-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center text-muted-foreground italic text-xs">
                                Sin imagen
                            </div>
                        )}
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`${playfair.className} text-2xl`}>{service.name}</h3>
                            <div className="text-primary dark:text-pink-400 font-bold">${service.price}</div>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6 line-clamp-3 flex-1">{service.description}</p>
                        <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                            <span className="text-xs text-muted-foreground font-bold">{service.duration}</span>
                            <button
                                onClick={() => setEditingService(service)}
                                className="text-xs font-bold text-primary dark:text-pink-400 hover:underline uppercase"
                            >
                                EDITAR SERVICIO
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
