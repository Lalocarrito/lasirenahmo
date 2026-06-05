'use client';

import { motion } from 'framer-motion';
import { X, Loader2, Upload, Star, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import type { Service, ServiceImage } from '@/types';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ServiceFormData {
    name: string;
    price: number;
    description: string;
    duration: string;
}

interface ServiceModalProps {
    service: Service;
    serviceImages: ServiceImage[];
    onClose: () => void;
    onSave: (data: ServiceFormData) => void;
    onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDeleteImage: (image: ServiceImage) => void;
    onReorderImage: (image: ServiceImage, direction: 'up' | 'down') => void;
    onSetPrimary: (image: ServiceImage) => void;
    setService: (service: Service | null) => void;
    isLoading: boolean;
    isUploading: boolean;
}

export default function ServiceModal({
    service,
    serviceImages,
    onClose,
    onSave,
    onUploadImage,
    onDeleteImage,
    onReorderImage,
    onSetPrimary,
    setService,
    isLoading,
    isUploading
}: ServiceModalProps) {
    const serviceSchema = z.object({
        name: z.string().min(3, 'Mínimo 3 caracteres').max(100, 'Máximo 100 caracteres')
            .regex(/^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ]+$/, 'Caracteres inválidos'),
        price: z.number().min(0, 'El precio debe ser 0 o mayor').max(999999, 'Precio excedido').multipleOf(0.01),
        description: z.string().min(10, 'La descripción es muy corta').max(500, 'Máximo 500 caracteres'),
        duration: z.string().min(1, 'Especifica la duración').max(20, 'Duración demasiado larga'),
    });

    type ServiceFormData = z.infer<typeof serviceSchema>;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<ServiceFormData>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: service?.name || '',
            price: service?.price || 0,
            description: service?.description || '',
            duration: service?.duration || '',
        }
    });

    useEffect(() => {
        if (service) {
            reset({
                name: service.name || '',
                price: service.price || 0,
                description: service.description || '',
                duration: service.duration || '',
            });
        }
    }, [service, reset]);

    const sortedImages = [...serviceImages].sort((a, b) => a.sort_order - b.sort_order);

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
                <div className="p-6 border-b border-border flex justify-between items-center bg-primary/5">
                    <h2 className={`${playfair.className} text-2xl`}>{service.id ? 'Editar Servicio' : 'Nuevo Servicio'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Nombre</label>
                            <input
                                {...register('name')}
                                type="text"
                                className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm"
                            />
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Precio ($)</label>
                            <input
                                {...register('price', { valueAsNumber: true })}
                                type="number"
                                className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm"
                            />
                            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Descripción</label>
                        <textarea
                            {...register('description')}
                            className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm h-24 resize-none"
                        />
                        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Duración (ej: 2h)</label>
                        <input
                            {...register('duration')}
                            type="text"
                            className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm"
                            placeholder="1.5h"
                        />
                        {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration.message}</p>}
                    </div>

                    {/* Gallery */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                            Galería de Fotos {sortedImages.length > 0 && `(${sortedImages.length})`}
                        </label>

                        {/* Upload button */}
                        <div className="relative group">
                            <input
                                type="file"
                                onChange={onUploadImage}
                                className="hidden"
                                id="service-image-upload"
                                accept="image/*"
                            />
                            <label
                                htmlFor="service-image-upload"
                                className="w-full h-[46px] flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all text-[10px] font-bold uppercase cursor-pointer text-muted-foreground hover:text-primary"
                            >
                                {isUploading ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={16} /> {sortedImages.length === 0 ? 'Subir primera imagen' : 'Agregar más fotos'}</>}
                            </label>
                        </div>

                        {/* Image grid */}
                        {sortedImages.length > 0 ? (
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                {sortedImages.map((img, i) => (
                                    <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-border">
                                        <img src={img.url} alt={img.alt || ''} className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                            {i > 0 && (
                                                <button type="button" onClick={() => onReorderImage(img, 'up')} className="p-1 bg-white/90 rounded-full text-black hover:bg-white transition-colors">
                                                    <ChevronUp size={14} />
                                                </button>
                                            )}
                                            {i < sortedImages.length - 1 && (
                                                <button type="button" onClick={() => onReorderImage(img, 'down')} className="p-1 bg-white/90 rounded-full text-black hover:bg-white transition-colors">
                                                    <ChevronDown size={14} />
                                                </button>
                                            )}
                                            {!img.is_primary && (
                                                <button type="button" onClick={() => onSetPrimary(img)} className="p-1 bg-yellow-400/90 rounded-full text-black hover:bg-yellow-400 transition-colors" title="Marcar como principal">
                                                    <Star size={14} />
                                                </button>
                                            )}
                                            <button type="button" onClick={() => onDeleteImage(img)} className="p-1 bg-red-500/90 rounded-full text-white hover:bg-red-500 transition-colors" title="Eliminar">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        {img.is_primary && (
                                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-yellow-400 text-[9px] font-bold uppercase rounded-md text-black shadow">
                                                Principal
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-muted-foreground text-xs italic border border-dashed border-border rounded-xl">
                                Aún sin fotos. Sube la primera imagen del servicio.
                            </div>
                        )}
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full siren-button !py-4 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Guardar Servicio'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
