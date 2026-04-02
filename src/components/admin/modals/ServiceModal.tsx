'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ServiceModalProps {
    service: any;
    onClose: () => void;
    onSave: (data: any) => void;
    onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setService: (service: any) => void;
    isLoading: boolean;
    isUploading: boolean;
}

export default function ServiceModal({
    service,
    onClose,
    onSave,
    onUploadImage,
    setService,
    isLoading,
    isUploading
}: ServiceModalProps) {
    const serviceSchema = z.object({
        name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
        price: z.number().min(0, 'El precio debe ser 0 o mayor'),
        description: z.string().min(10, 'La descripción es muy corta'),
        duration: z.string().min(1, 'Especifica la duración'),
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

                    <div className="grid grid-cols-2 gap-4">
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
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Imagen</label>
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
                                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <><Upload size={16} /> Subir Imagen</>}
                                </label>
                            </div>
                        </div>
                    </div>

                    {service.image_url && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                            <img src={service.image_url} alt="Vista previa" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setService({ ...service, image_url: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

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
