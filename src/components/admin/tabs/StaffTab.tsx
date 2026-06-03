'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Profile } from '@/types';
import { Loader2, Shield, UserCheck, Search, ImagePlus, Eye, EyeOff, Pencil, Check, X } from 'lucide-react';
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
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<{ bio: string; specialty: string }>({ bio: '', specialty: '' });

    const { data: staffProfiles = [], isLoading } = useQuery<Profile[]>({
        queryKey: ['staff-profiles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']).order('role', { ascending: true });
            if (error) throw error;
            return (data || []) as Profile[];
        }
    });

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

    const updateProfileMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Profile> }) => {
            const { error } = await supabase.from('profiles').update(data).eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
            toast.success('Perfil actualizado');
        },
        onError: (error: Error) => {
            toast.error(`Error: ${error.message}`);
        },
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Solo se permiten JPEG, PNG o WebP');
            return;
        }

        const MAX_SIZE = 5 * 1024 * 1024;
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

    const startEditing = (p: Profile) => {
        setEditingId(p.id);
        setEditForm({ bio: p.bio || '', specialty: p.specialty || '' });
    };

    const saveEdit = (id: string) => {
        updateProfileMutation.mutate({ id, data: editForm });
        setEditingId(null);
    };

    const toggleVisibility = (p: Profile) => {
        updateProfileMutation.mutate({ id: p.id, data: { is_visible: !p.is_visible } });
    };

    const triggerFileInput = (id: string) => {
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

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-lg leading-tight truncate">{p.full_name || 'Sin nombre'}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground truncate mb-2">{p.email}</p>

                                <span className={cn(
                                    "text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-widest border",
                                    p.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-primary/10 text-primary border-primary/20"
                                )}>
                                    {p.role}
                                </span>

                                {editingId === p.id ? (
                                    <div className="mt-3 space-y-2">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Especialidad</label>
                                            <input
                                                type="text"
                                                value={editForm.specialty}
                                                onChange={(e) => setEditForm(f => ({ ...f, specialty: e.target.value }))}
                                                className="w-full p-2 rounded-lg border border-border bg-background text-xs mt-1 outline-none focus:border-primary"
                                                placeholder="Ej: Lashista profesional"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Biografía</label>
                                            <textarea
                                                value={editForm.bio}
                                                onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                                                rows={2}
                                                className="w-full p-2 rounded-lg border border-border bg-background text-xs mt-1 outline-none focus:border-primary resize-none"
                                                placeholder="Descripción breve..."
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={() => saveEdit(p.id)}
                                                className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500 transition-all"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-2 space-y-1">
                                        {p.specialty && (
                                            <p className="text-xs font-medium text-muted-foreground">{p.specialty}</p>
                                        )}
                                        {p.bio && (
                                            <p className="text-xs text-muted-foreground/70 line-clamp-2">{p.bio}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => toggleVisibility(p)}
                                className={cn(
                                    "p-2 rounded-xl transition-all shrink-0",
                                    p.is_visible !== false
                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                        : "bg-muted/30 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                                )}
                                title={p.is_visible !== false ? 'Visible en página' : 'Oculto en página'}
                            >
                                {p.is_visible !== false ? <Eye size={16} /> : <EyeOff size={16} />}
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-4 border-t border-border/50">
                            <button
                                onClick={() => startEditing(p)}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-primary/5 text-primary hover:bg-primary/10 transition-all"
                            >
                                <Pencil size={12} />
                                Editar Perfil
                            </button>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateRoleMutation.mutate({ id: p.id, role: 'user' })}
                                    disabled={isUpdating === p.id}
                                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase bg-muted/30 text-muted-foreground hover:bg-red-500 hover:text-white transition-all"
                                >
                                    Mover a Clientes
                                </button>
                            </div>
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
