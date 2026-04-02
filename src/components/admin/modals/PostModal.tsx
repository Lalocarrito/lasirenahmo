'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Upload } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useEffect } from 'react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface PostModalProps {
    post: any;
    onClose: () => void;
    onSave: (data: any) => void;
    onUploadImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setPost: (post: any) => void;
    isLoading: boolean;
    isUploading: boolean;
}

export default function PostModal({
    post,
    onClose,
    onSave,
    onUploadImage,
    setPost,
    isLoading,
    isUploading
}: PostModalProps) {
    const postSchema = z.object({
        title: post.type === 'feed' ? z.string().min(3, 'El título es obligatorio para posts del feed') : z.string().optional(),
        content: z.string().min(5, 'El contenido debe tener al menos 5 caracteres'),
    });

    type PostFormData = z.infer<typeof postSchema>;

    const { register, handleSubmit, reset, formState: { errors } } = useForm<PostFormData>({
        resolver: zodResolver(postSchema),
        defaultValues: {
            title: post?.title || '',
            content: post?.content || '',
        }
    });

    useEffect(() => {
        if (post) {
            reset({
                title: post.title || '',
                content: post.content || '',
            });
        }
    }, [post, reset]);

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
                    <h2 className={`${playfair.className} text-2xl`}>
                        {post.id ? 'Editar' : 'Nuevo'} {post.type === 'story' ? 'Aviso Rápido' : 'Post'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSave)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {post.type === 'feed' && (
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Título</label>
                            <input
                                {...register('title')}
                                type="text"
                                className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm"
                                placeholder="Título de la noticia..."
                            />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">
                            {post.type === 'story' ? 'Mensaje Corto' : 'Contenido'}
                        </label>
                        <textarea
                            {...register('content')}
                            className="w-full p-3 rounded-xl border border-border bg-primary/5 outline-none focus:border-primary transition-all text-sm h-32 resize-none"
                            placeholder={post.type === 'story' ? 'Ej: ¡Mañana tengo un espacio libre!' : 'Escribe aquí tu tip o noticia...'}
                        />
                        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content.message}</p>}
                    </div>

                    {/* Image Upload for Post */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground">Imagen (Opcional)</label>
                        <div className="relative group">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={onUploadImage}
                                className="hidden"
                                id="post-image-upload"
                            />
                            <label
                                htmlFor="post-image-upload"
                                className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer text-xs font-bold text-muted-foreground hover:text-primary"
                            >
                                {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                {post.image_url ? 'Cambiar Foto' : 'Subir Foto'}
                            </label>
                        </div>
                    </div>

                    {post.image_url && (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                            <img src={post.image_url} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => setPost({ ...post, image_url: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 px-6 rounded-2xl font-bold text-muted-foreground border border-border hover:bg-primary/5 hover:text-primary transition-all text-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isUploading}
                            className="flex-[2] siren-button !py-4 flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : (post.id ? 'Actualizar' : 'Publicar')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
