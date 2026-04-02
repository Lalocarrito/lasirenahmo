'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({ isOpen, title = 'Confirmar Acción', message, onConfirm, onCancel }: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative bg-card w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-border"
                    >
                        <h3 className={`${playfair.className} text-xl uppercase tracking-tight mb-2`}>{title}</h3>
                        <p className="text-muted-foreground text-sm mb-6">{message}</p>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                className="flex-1 px-4 py-2 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-bold text-xs uppercase"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onCancel();
                                }}
                                className="flex-1 px-4 py-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all font-bold text-xs uppercase flex items-center justify-center gap-2"
                            >
                                <Check size={16} /> Aceptar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
