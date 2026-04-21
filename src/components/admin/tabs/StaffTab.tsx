'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types';
import { Loader2, Shield, UserCheck, Search, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import Image from 'next/image';

export default function StaffTab() {
    const queryClient = useQueryClient();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState<string | null>(null);

    // Fetch ONLY staff/admins for the main view
    const { data: staffProfiles = [], isLoading } = useQuery<Profile[]>({
        queryKey: ['staff-profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']).order('role', { ascending: true });
            if (error) throw error;
            return (data || []) as Profile[];
        }
    });

    // Fetch users for searching
    const { data: searchResults = [] } = useQuery<Profile[]>({
        queryKey: ['search-users', searchTerm],
        queryFn: async () => {
            if (searchTerm.length < 3) return [];
            const { data, error } = await supabase.from('profiles')
                .select('*')
                .eq('role', 'user')
                .or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`)
                .limit(5);
            if (error) throw error;
            return (data || []) as Profile[];
        },
        enabled: searchTerm.length >= 3
    });

    const updateRoleMutation = useMutation({
        mutationFn: async ({ id, role }: { id: string, role: 'admin' | 'staff' | 'user' }) => {
            setIsUpdating(id);
            const { error } = await supabase.from('profiles').update({ role }).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            queryClient.invalidateQueries({ queryKey: ['search-users'] });
            setSearchTerm('');
            toast.success('Rol actualizado con éxito');
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
        onSettled: () => {
            setIsUpdating(null);
        }
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation based on AUDITORIA_SEGURIDAD.md (SVE-002)
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Solo se permiten JPEG, PNG o WebP');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            toast.error('La imagen no puede superar 5MB');
            return;
        }

        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const mimeToExt: Record<string, string[]> = {
            'image/jpeg': ['jpg', 'jpeg'],
            'image/png': ['png'],
            'image/webp': ['webp'],
        };
        
        if (!mimeToExt[file.type]?.includes(ext)) {
            toast.error('Extensión de archivo inválida');
            return;
        }

        setUploadingAvatar(profileId);
        const random = crypto.randomUUID();
        const fileName = `${profileId}-${random}.${ext}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true, contentType: file.type });
            
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            
            const { error: updateError } = await supabase.from('profiles')
                .update({ avatar_url: publicUrl }).eq('id', profileId);
            
            if (updateError) throw updateError;

            toast.success('Foto actualizada');
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
        } catch (error: unknown) {
            logger.error(error);
            toast.error('Error al subir la foto');
        } finally {
            setUploadingAvatar(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = (id: string) => {
        // We use a custom attribute to track which ID we are uploading for
        if (fileInputRef.current) {
            fileInputRef.current.dataset.targetId = id;
            fileInputRef.current.click();
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-muted-foreground text-sm tracking-widest uppercase">Cargando equipo...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Search and Add Area */}
            <div className="admin-card bg-primary/5 border-primary/10">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4">Añadir al Equipo</h3>
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar cliente registrado por correo o nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-card border border-border rounded-xl w-full outline-none focus:border-primary transition-all text-sm"
                    />
                </div>
                
                {searchResults.length > 0 && (
                    <div className="mt-4 grid gap-2">
                        {searchResults.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border">
                                <div>
                                    <p className="font-bold text-sm">{user.full_name || 'Sin nombre'}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                </div>
                                <button
                                    onClick={() => updateRoleMutation.mutate({ id: user.id, role: 'staff' })}
                                    disabled={isUpdating === user.id}
                                    className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold transition-all hover:scale-105 shadow-md shadow-primary/20"
                                >
                                    {isUpdating === user.id ? <Loader2 size={14} className="animate-spin" /> : 'Hacer Lashista'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Staff List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffProfiles.map((p) => (
                    <div 
                        key={p.id} 
                        className="bg-card border border-border p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all hover:border-primary/20 shadow-sm relative overflow-hidden"
                    >
                        <div className="flex items-start gap-4">
                            <div 
                                onClick={() => triggerFileInput(p.id)}
                                className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer group shrink-0 overflow-hidden border-2 border-border/50 hover:border-primary transition-all"
                            >
                                {p.avatar_url ? (
                                    <Image 
                                        src={p.avatar_url} 
                                        alt={p.full_name || 'Staff'} 
                                        fill 
                                        sizes="64px"
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className={cn(
                                        "w-full h-full flex items-center justify-center",
                                        p.role === 'admin' ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                                    )}>
                                        {p.role === 'admin' ? <Shield size={24} /> : <UserCheck size={24} />}
                                    </div>
                                )}
                                
                                <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center transition-all backdrop-blur-sm">
                                    {uploadingAvatar === p.id ? <Loader2 className="animate-spin text-white" size={20} /> : <ImagePlus className="text-white" size={20} />}
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg leading-tight">{p.full_name || 'Sin nombre'}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground truncate max-w-[200px] mb-2">{p.email}</p>
                                
                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest border",
                                    p.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                )}>
                                    {p.role}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-4 border-t border-border/50">
                            {p.role === 'staff' && (
                                <button
                                    onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'admin' })}
                                    disabled={isUpdating === p.id}
                                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-red-500/5 text-red-500 hover:bg-red-500/10 transition-all text-center"
                                >
                                    Hacer Admin
                                </button>
                            )}
                            {p.role === 'admin' && (
                                <button
                                    onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'staff' })}
                                    disabled={isUpdating === p.id}
                                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-primary/5 text-primary hover:bg-primary/10 transition-all text-center"
                                >
                                    Remover Admin
                                </button>
                            )}
                            <button
                                onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'user' })}
                                disabled={isUpdating === p.id}
                                className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-muted/30 text-muted-foreground hover:bg-red-500 hover:text-white transition-all text-center col-[inherit]"
                            >
                                Mover a Clientes
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                    const id = fileInputRef.current?.dataset.targetId;
                    if (id) handleAvatarUpload(e, id);
                }} 
                accept="image/*" 
                className="hidden" 
            />
        </div>
    );
}
