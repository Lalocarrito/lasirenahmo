'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata) {
                setFormData({
                    full_name: user.user_metadata.full_name || '',
                    phone: user.user_metadata.phone || '',
                    dob: user.user_metadata.dob || '',
                });
            }
            setIsLoading(false);
        };
        fetchUserData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    phone: formData.phone,
                    dob: formData.dob,
                }
            });
            
            if (error) throw error;

            // Optional: Also sync to public.profiles if needed
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').update({
                    full_name: formData.full_name,
                    phone: formData.phone
                }).eq('id', user.id);
            }

            toast.success("Tus datos han sido actualizados exitosamente.");
        } catch (error: any) {
            toast.error(`Error al guardar: ${error.message}`);
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
                            placeholder="Tu nombre"
                            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teléfono (WhatsApp)</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="10 dígitos"
                            maxLength={10}
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
