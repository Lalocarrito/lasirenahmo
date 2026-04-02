'use client';

import { X } from 'lucide-react';

interface PostsTabProps {
    posts: any[];
    setEditingPost: (post: any) => void;
}

export default function PostsTab({ posts, setEditingPost }: PostsTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stories Bar */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground ml-2">Historias (Avisos Rápidos)</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
                    <button
                        onClick={() => setEditingPost({ title: 'Nueva Historia', content: '', type: 'story', image_url: '' })}
                        className="flex-shrink-0 w-24 h-32 rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-all text-muted-foreground hover:text-primary"
                    >
                        <X className="rotate-45" size={24} />
                        <span className="text-[10px] font-bold uppercase">Añadir</span>
                    </button>

                    {posts.filter(p => p.type === 'story').map(story => (
                        <div key={story.id} className="flex-shrink-0 w-24 h-32 rounded-2xl bg-card border border-border relative overflow-hidden group">
                            {story.image_url ? (
                                <img src={story.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-primary/10 flex items-center justify-center p-2 text-center">
                                    <p className="text-[10px] font-medium leading-tight line-clamp-4">{story.content}</p>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={() => setEditingPost(story)}
                                    className="p-1 px-2 bg-white text-black text-[10px] font-bold rounded-lg"
                                >
                                    EDITAR
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feed Posts */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Feed de Noticias</h3>
                    <button
                        onClick={() => setEditingPost({ title: '', content: '', type: 'feed', image_url: '' })}
                        className="text-xs font-bold text-primary dark:text-pink-400 hover:underline"
                    >
                        + NUEVO POST
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.filter(p => p.type === 'feed').map(post => (
                        <div key={post.id} className="admin-card group">
                            {post.image_url && (
                                <img src={post.image_url} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
                            )}
                            <h4 className="font-bold text-lg mb-2">{post.title}</h4>
                            <p className="text-muted-foreground text-sm line-clamp-3 mb-4">{post.content}</p>
                            <div className="flex justify-between items-center pt-4 border-t border-border">
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {new Date(post.created_at).toLocaleDateString()}
                                </span>
                                <button
                                    onClick={() => setEditingPost(post)}
                                    className="text-xs font-bold text-primary dark:text-pink-400 hover:underline"
                                >
                                    EDITAR
                                </button>
                            </div>
                        </div>
                    ))}

                    {posts.filter(p => p.type === 'feed').length === 0 && (
                        <div className="md:col-span-2 admin-card flex flex-col items-center justify-center py-12 text-center text-muted-foreground italic">
                            No hay publicaciones en el feed todavía.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
