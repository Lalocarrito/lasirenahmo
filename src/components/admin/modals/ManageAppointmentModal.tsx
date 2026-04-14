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
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-background w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-border flex flex-col max-h-[90vh]"
            >
                {/* Header Section with gradient background */}
                <div className="p-6 pb-8 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border-b border-border relative">
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-2 bg-background/50 backdrop-blur-sm hover:bg-background text-foreground rounded-full transition-colors z-10"
                    >
                        <X size={18} />
                    </button>
                    
                    <div className="flex flex-col items-center text-center mt-2">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 shadow-inner">
                            <Users size={32} />
                        </div>
                        <h2 className={`${playfair.className} text-2xl font-bold`}>{appointment.customer_name}</h2>
                        <a href={`tel:${appointment.customer_phone}`} className="text-sm text-primary font-bold hover:underline mt-1 bg-primary/10 px-3 py-1 rounded-full">
                            {appointment.customer_phone || 'Sin teléfono'}
                        </a>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {/* Appointment Details Card */}
                    <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3">
                            <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest",
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

                        <div>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Servicio</p>
                            <p className="font-bold text-lg text-primary dark:text-pink-400">{appointment.services?.name}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/50">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Fecha</p>
                                <p className="font-medium text-sm flex items-center gap-2">
                                    <Calendar size={14} className="text-primary" />
                                    {new Date(appointment.appointment_date).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Hora</p>
                                <p className="font-medium text-sm">
                                    {appointment.appointment_time}
                                </p>
                            </div>
                        </div>

                        {appointment.notes && (
                            <div className="pt-3 border-t border-border/50">
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Notas del cliente</p>
                                <div className="bg-muted/30 p-3 rounded-xl border border-border/50 relative">
                                    <p className="text-xs italic leading-relaxed text-muted-foreground">"{appointment.notes}"</p>
                                </div>
                            </div>
                        )}
                        
                        <p className="text-[9px] text-muted-foreground/50 font-bold uppercase text-right pt-2">ID: {appointment.id.slice(0, 8)}</p>
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-4">
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest px-2">Acciones</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {appointment.status !== 'confirmed' && (
                                        <button
                                            onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas confirmar esta cita?', action: () => onUpdateStatus(appointment.id, 'confirmed') })}
                                            disabled={isLoading}
                                            className="flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-green-500/10 text-green-600 hover:bg-green-500 hover:text-white transition-all text-[11px] font-bold uppercase shadow-sm"
                                        >
                                            <Calendar size={20} className="mb-1" /> Confirmar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas cancelar esta cita?', action: () => onUpdateStatus(appointment.id, 'cancelled') })}
                                        disabled={isLoading}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[11px] font-bold uppercase shadow-sm",
                                            appointment.status === 'confirmed' ? "col-span-2" : "col-span-1"
                                        )}
                                    >
                                        <X size={20} className="mb-1" /> Cancelar
                                    </button>
                                    <button
                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas marcar esta cita como completada?', action: () => onUpdateStatus(appointment.id, 'completed') })}
                                        disabled={isLoading}
                                        className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-primary text-white hover:scale-[1.02] transition-all text-[11px] font-bold uppercase col-span-2 shadow-lg shadow-primary/20"
                                    >
                                        {isLoading ? <Loader2 size={24} className="animate-spin mb-1" /> : <Users size={24} className="mb-1" />}
                                        Marcar como Completada
                                    </button>
                                </div>
                            </div>
                        )}

                        {appointment.status === 'completed' && (
                            <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-2xl space-y-3">
                                <p className="text-[10px] font-bold uppercase text-purple-600 tracking-widest text-center">Reagendar para Retoque</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {[15, 20, 30].map(days => (
                                        <button
                                            key={days}
                                            onClick={() => onFrequentAppointment(appointment, days)}
                                            className="flex flex-col items-center justify-center p-3 rounded-xl bg-background hover:bg-purple-500 border border-purple-500/20 hover:text-white text-purple-600 transition-all text-[10px] font-bold uppercase shadow-sm"
                                        >
                                            <Calendar size={16} className="mb-1" />
                                            {days} Días
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
