'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types';
import { Loader2, Shield, User, UserCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function StaffTab() {
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const { data: profiles = [], isLoading } = useQuery<Profile[]>({
        queryKey: ['all-profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').order('role', { ascending: true });
            if (error) throw error;
            return (data || []) as Profile[];
        }
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string, role: 'admin' | 'staff' | 'user' }) => {
            setIsUpdating(id);
            const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
            toast.success('Rol actualizado con éxito');
        },
        onError: (error: any) => {
            toast.error(`Error: ${error.message}`);
        },
        onSettled: () => {
            setIsUpdating(null);
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-muted-foreground text-sm tracking-widest uppercase">Cargando perfiles...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 gap-4">
                {profiles.map((p) => (
                    <div 
                        key={p.id} 
                        className="bg-card border border-border p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-primary/20 shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center",
                                p.role === 'admin' ? "bg-red-500/10 text-red-500" : (p.role === 'staff' ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")
                            )}>
                                {p.role === 'admin' ? <Shield size={24} /> : (p.role === 'staff' ? <UserCheck size={24} /> : <User size={24} />)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{p.full_name || 'Sin nombre'}</h3>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border",
                                        p.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : (p.role === 'staff' ? "bg-primary/10 text-primary border-primary/20" : "bg-muted/50 text-muted-foreground border-border")
                                    )}>
                                        {p.role}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{p.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mr-2">Cambiar Rol:</span>
                            
                            <button
                                onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'user' })}
                                disabled={isUpdating === p.id}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                    p.role === 'user' ? "bg-muted text-muted-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                                )}
                            >
                                Cliente
                            </button>
                            
                            <button
                                onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'staff' })}
                                disabled={isUpdating === p.id}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                    p.role === 'staff' ? "bg-primary text-white" : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                            >
                                Lashista
                            </button>

                            <button
                                onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'admin' })}
                                disabled={isUpdating === p.id}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                                    p.role === 'admin' ? "bg-red-500 text-white" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                )}
                            >
                                Admin
                            </button>

                            {isUpdating === p.id && <Loader2 className="animate-spin text-primary ml-2" size={16} />}
                        </div>
                    </div>
                ))}

                {profiles.length === 0 && (
                    <div className="text-center py-20 bg-muted/5 rounded-3xl border border-dashed border-border flex flex-col items-center">
                        <User size={48} className="text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground">No se encontraron perfiles registrados.</p>
                    </div>
                )}
            </div>
            
            <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                <h4 className="text-primary font-bold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Shield size={16} /> Nota de Administración
                </h4>
                <p className="text-sm text-balance text-muted-foreground leading-relaxed">
                    Desde esta pestaña puedes gestionar los permisos de tu equipo. Al cambiar a alguien a <strong>Lashista</strong>, aparecerá en el flujo de reserva de los clientes y podrá gestionar su propia disponibilidad.
                </p>
            </div>
        </div>
    );
}
