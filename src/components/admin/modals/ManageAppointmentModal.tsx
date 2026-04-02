'use client';

import { useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Loader2, Users } from 'lucide-react';
import { Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ManageAppointmentModalProps {
    appointment: any;
    onClose: () => void;
    onUpdateStatus: (id: string, status: string) => void;
    onFrequentAppointment: (appointment: any, days: number) => void;
    isLoading: boolean;
}

export default function ManageAppointmentModal({
    appointment,
    onClose,
    onUpdateStatus,
    onFrequentAppointment,
    isLoading
}: ManageAppointmentModalProps) {
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, action: () => void }>({ isOpen: false, message: '', action: () => { } });

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
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
                <div className="p-6 border-b border-border flex justify-between items-center bg-primary/5">
                    <div>
                        <h2 className={`${playfair.className} text-xl uppercase tracking-tight`}>Gestionar Cita</h2>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">ID: {appointment.id.slice(0, 8)}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-primary/10 hover:text-primary rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="text-xs text-muted-foreground font-bold uppercase mb-1">Cliente</div>
                                <div className="font-bold">{appointment.customer_name}</div>
                                <div className="text-sm text-muted-foreground">{appointment.customer_phone}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-muted-foreground font-bold uppercase mb-1">Estado Actual</div>
                                <span className={cn(
                                    "px-2 py-1 rounded-full text-[10px] uppercase font-bold",
                                    appointment.status === 'confirmed' ? "bg-green-500/10 text-green-500" :
                                        appointment.status === 'cancelled' ? "bg-red-500/10 text-red-500" :
                                            appointment.status === 'completed' ? "bg-blue-500/10 text-blue-500" :
                                                "bg-yellow-500/10 text-yellow-500"
                                )}>
                                    {appointment.status === 'confirmed' ? 'Confirmada' :
                                        appointment.status === 'cancelled' ? 'Cancelada' :
                                            appointment.status === 'completed' ? 'Completada' : 'Pendiente'}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Servicio:</span>
                                <span className="font-bold text-primary dark:text-pink-400">{appointment.services?.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Fecha:</span>
                                <span className="font-bold">{new Date(appointment.appointment_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Hora:</span>
                                <span className="font-bold">{appointment.appointment_time}</span>
                            </div>
                            {appointment.notes && (
                                <div className="pt-2 border-t border-border mt-2">
                                    <span className="text-[10px] text-muted-foreground font-bold uppercase block mb-1">Notas del cliente:</span>
                                    <p className="text-xs italic">"{appointment.notes}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <>
                                <p className="text-center text-xs font-bold uppercase text-muted-foreground tracking-widest">Cambiar Estado</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {appointment.status !== 'confirmed' && (
                                        <button
                                            onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas confirmar esta cita?', action: () => onUpdateStatus(appointment.id, 'confirmed') })}
                                            disabled={isLoading}
                                            className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all text-xs font-bold uppercase"
                                        >
                                            <Calendar size={16} /> Confirmar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas cancelar esta cita?', action: () => onUpdateStatus(appointment.id, 'cancelled') })}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all text-xs font-bold uppercase",
                                            appointment.status === 'confirmed' ? "col-span-2" : "col-span-1"
                                        )}
                                    >
                                        <X size={16} /> Cancelar
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas marcar esta cita como completada?', action: () => onUpdateStatus(appointment.id, 'completed') })}
                                        disabled={isLoading}
                                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 text-primary dark:text-pink-400 hover:bg-primary/20 transition-all text-xs font-bold uppercase col-span-2"
                                    >
                                        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
                                        Marcar como Completada
                                    </button>
                                </div>
                            </>
                        )}

                        {appointment.status === 'completed' && (
                            <div className="pt-2 space-y-3">
                                <p className="text-center text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Re-agendamiento Rápido</p>

                                <div className="grid grid-cols-3 gap-2">
                                    {[15, 20, 30].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => onFrequentAppointment(appointment, days)}
                                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 transition-all text-[10px] font-bold uppercase"
                                        >
                                            <Calendar size={14} />
                                            {days} días
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', action: () => { } })}
            />
        </div>
    );
}
