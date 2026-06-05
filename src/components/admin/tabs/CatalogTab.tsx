'use client';

import { useState } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Archive, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfirmModal from '../modals/ConfirmModal';
import type { Service } from '@/types';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface CatalogTabProps {
    services: Service[];
    setEditingService: (service: Service | null) => void;
    onToggleActive: (service: Service) => void;
    onDelete: (service: Service) => void;
}

export default function CatalogTab({ services, setEditingService, onToggleActive, onDelete }: CatalogTabProps) {
    const [filter, setFilter] = useState<'active' | 'archived'>('active');
    const [confirmAction, setConfirmAction] = useState<{ service: Service; type: 'archive' | 'delete' } | null>(null);

    const activeServices = services.filter(s => s.is_active !== false);
    const archivedServices = services.filter(s => s.is_active === false);

    const displayedServices = filter === 'active' ? activeServices : archivedServices;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className={`${playfair.className} text-3xl`}>Catálogo de Servicios</h2>
                <button
                    onClick={() => setEditingService({ name: '', price: 0, description: '', duration: '', image_url: '', is_active: true } as unknown as Service)}
                    className="siren-button !py-2 !px-6 text-sm flex items-center gap-2"
                >
                    + Nuevo Servicio
                </button>
            </div>

            {/* Tabs: Activos / Archivados */}
            <div className="flex bg-primary/5 border border-primary/10 p-1 rounded-2xl w-fit">
                <button
                    onClick={() => setFilter('active')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                        filter === 'active' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Activos ({activeServices.length})
                </button>
                <button
                    onClick={() => setFilter('archived')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                        filter === 'archived' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Archivados ({archivedServices.length})
                </button>
            </div>

            {displayedServices.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground italic">
                    {filter === 'active' ? 'No hay servicios activos. Crea uno nuevo.' : 'No hay servicios archivados.'}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {displayedServices.map((service) => (
                        <div key={service.id} className={cn(
                            "admin-card group hover:border-primary/50 transition-all flex flex-col h-full",
                            filter === 'archived' && "opacity-60"
                        )}>
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
                                <div className="flex gap-2">
                                    {filter === 'active' ? (
                                        <button
                                            onClick={() => setConfirmAction({ service, type: 'archive' })}
                                            className="text-xs font-bold text-muted-foreground hover:text-red-500 uppercase flex items-center gap-1"
                                            title="Archivar"
                                        >
                                            <Archive size={14} /> Archivar
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => onToggleActive(service)}
                                                className="text-xs font-bold text-green-600 hover:text-green-500 uppercase flex items-center gap-1"
                                                title="Reactivar"
                                            >
                                                <RefreshCw size={14} /> Reactivar
                                            </button>
                                            <button
                                                onClick={() => setConfirmAction({ service, type: 'delete' })}
                                                className="text-xs font-bold text-red-500 hover:text-red-400 uppercase flex items-center gap-1"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={14} /> Eliminar
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => setEditingService(service)}
                                        className="text-xs font-bold text-primary dark:text-pink-400 hover:underline uppercase ml-2"
                                    >
                                        EDITAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={!!confirmAction}
                title={confirmAction?.type === 'archive' ? 'Archivar Servicio' : 'Eliminar Servicio'}
                message={
                    confirmAction?.type === 'archive'
                        ? `¿Archivar "${confirmAction?.service.name}"? No aparecerá en la página de reservas.`
                        : `¿Eliminar "${confirmAction?.service.name}" permanentemente? Solo posible si no tiene citas asociadas.`
                }
                onConfirm={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === 'archive') onToggleActive(confirmAction.service);
                    else onDelete(confirmAction.service);
                    setConfirmAction(null);
                }}
                onCancel={() => setConfirmAction(null)}
            />
        </div>
    );
}
