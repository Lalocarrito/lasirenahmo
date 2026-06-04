'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { z } from 'zod';
import { formatPhone } from '@/lib/phone';

interface UserData {
    full_name: string;
    phone: string;
    dob: string;
}

export default function SettingsView({ userEmail }: { userEmail: string }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<UserData>({ full_name: '', phone: '', dob: '' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user && user.user_metadata) {
                    setFormData({
                        full_name: user.user_metadata.full_name || '',
                        phone: user.user_metadata.phone || '',
                        dob: user.user_metadata.dob || '',
                    });
                }
            } catch (error) {
                // Ignore missing session error on initial load
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const profileSchema = z.object({
        full_name: z.string().min(2, 'El nombre es demasiado corto').max(100, 'Máximo 100 caracteres')
            .regex(/^[a-zA-Z\s\-áéíóúñÁÉÍÓÚÑ]+$/, 'El nombre contiene caracteres inválidos'),
        phone: z.string()
            .regex(/^\d{10}$/, 'Debe ser un número de 10 dígitos')
            .optional().or(z.literal('')),
        dob: z.string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)')
            .refine((d) => {
                if (!d) return true;
                const age = new Date().getFullYear() - new Date(d).getFullYear();
                return age >= 13 && age <= 120;
            }, 'La edad debe estar entre 13 y 120 años')
            .optional().or(z.literal('')),
    });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const validatedData = profileSchema.parse(formData);
            const { error } = await supabase.auth.updateUser({
                data: validatedData
            });
            
            if (error) throw error;

            // Sync to public.profiles
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    full_name: validatedData.full_name,
                    phone: validatedData.phone
                }).eq('id', user.id);
            }

            toast.success("Tus datos han sido actualizados exitosamente.");
        } catch (error: unknown) {
            const errorMessage = error instanceof z.ZodError 
                ? error.issues[0].message 
                : error instanceof Error ? error.message : 'Error desconocido';
            toast.error(`Error al guardar: ${errorMessage}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20 px-4">
                <Loader2 className="animate-spin text-primary opacity-50" size={32} />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-6"
        >
            <div className="glass-card p-6 md:p-8 rounded-3xl bg-card border">
                <h3 className="text-lg font-bold text-foreground mb-6">Información Personal</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nombre Completo</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                           
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formatPhone(formData.phone)}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                           
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Fecha de Nacimiento</label>
                        <input
                            type="date"
                            name="dob"
                            value={formData.dob}
                            onChange={handleChange}
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">Queremos felicitarte y enviarte sorpresas en tu día especial 🎉</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Correo Electrónico</label>
                        <input
                            type="email"
                            value={userEmail}
                            disabled
                            className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm text-muted-foreground cursor-not-allowed"
                        />
                        <p className="text-[10px] text-muted-foreground mt-1">El correo está vinculado a tu cuenta para validación.</p>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="siren-button flex items-center justify-center gap-2 py-3 px-8 text-sm disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
