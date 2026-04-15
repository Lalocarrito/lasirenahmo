'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Calendar, Clock, Plus, Loader2, X, CheckCircle, ChevronRight, UserCircle } from 'lucide-react';
import { startOfDay, parseISO, isBefore, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ConfirmModal from '../modals/ConfirmModal';

import type { Appointment, Service } from '@/types';

interface AppointmentsTabProps {
    appointments: Appointment[];
    services: Service[];
    setManagingAppointment: (appointment: Appointment) => void;
    handleUpdateStatus: (id: string, status: string) => void;
    fetchData: (loader?: boolean) => void;
}

export default function AppointmentsTab({
    appointments,
    services,
    setManagingAppointment,
    handleUpdateStatus,
    fetchData
}: AppointmentsTabProps) {
    const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
    const [isAdding, setIsAdding] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, action: () => void }>({ isOpen: false, message: '', action: () => { } });

    // Form state
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formServiceId, setFormServiceId] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formTime, setFormTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = startOfDay(new Date());

    const upcomingAppointments = appointments.filter(a => !isBefore(parseISO(a.appointment_date), today));
    const pastAppointments = appointments.filter(a => isBefore(parseISO(a.appointment_date), today));

    const displayedAppointments = view === 'upcoming' ? upcomingAppointments : pastAppointments;

    // Grouping for visual display
    const grouped = displayedAppointments.reduce((acc: Record<string, Appointment[]>, curr) => {
        if (!acc[curr.appointment_date]) acc[curr.appointment_date] = [];
        acc[curr.appointment_date].push(curr);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();
    if (view === 'past') sortedDates.reverse();

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const { error } = await supabase.from('appointments').insert([{
            customer_name: formName,
            customer_phone: formPhone,
            service_id: formServiceId,
            appointment_date: formDate,
            appointment_time: formTime,
            status: 'confirmed', // Admin manual booking auto-confirms
            notes: 'Registrada manualmente por admin'
        }]);

        setIsSubmitting(false);
        if (!error) {
            setIsAdding(false);
            setFormName('');
            setFormPhone('');
            setFormDate('');
            setFormTime('');
            setFormServiceId('');
            toast.success('Cita creada exitosamente');
            fetchData(false);
        } else {
            toast.error('Error al crear la cita');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-primary/5 border border-primary/10 p-1 rounded-2xl w-full md:w-auto">
                    <button
                        onClick={() => setView('upcoming')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                            view === 'upcoming' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Próximas
                    </button>
                    <button
                        onClick={() => setView('past')}
                        className={cn(
                            "flex-1 md:flex-none px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                            view === 'past' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Historial
                    </button>
                </div>

                <button
                    onClick={() => setIsAdding(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:scale-105 transition-all text-sm shadow-xl shadow-primary/20"
                >
                    <Plus size={18} /> Nueva Cita
                </button>
            </div>

            <div className="grid gap-12">
                {sortedDates.length === 0 ? (
                    <div className="admin-card text-center py-20 text-muted-foreground italic">
                        No hay citas {view === 'upcoming' ? 'próximas' : 'pasadas'}.
                    </div>
                ) : (
                    sortedDates.map(dateStr => {
                        const dateObj = parseISO(dateStr);
                        const dateLabel = format(dateObj, "EEEE d 'de' MMMM", { locale: es });
                        const isToday = today.getTime() === dateObj.getTime();

                        return (
                            <div key={dateStr} className="space-y-4 relative">
                                <div className="flex items-center gap-4 sticky top-0 z-10 bg-background/80 backdrop-blur-md py-4">
                                    <h3 className={cn("text-lg font-bold capitalize", isToday ? "text-primary dark:text-pink-400" : "")}>
                                        {isToday ? "Hoy, " : ""}{dateLabel}
                                    </h3>
                                    <div className="h-px bg-border flex-1" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {grouped[dateStr].map(apt => (
                                        <div key={apt.id} className="admin-card !p-5 group hover:border-primary/40 transition-all flex flex-col justify-between h-full bg-card hover:shadow-xl hover:shadow-primary/5">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className={cn(
                                                        "px-2 py-1 rounded-full text-[10px] uppercase font-bold",
                                                        apt.status === 'confirmed' ? "bg-green-500/10 text-green-500" :
                                                            apt.status === 'cancelled' ? "bg-red-500/10 text-red-500" :
                                                                apt.status === 'completed' ? "bg-blue-500/10 text-blue-500" : "bg-yellow-500/10 text-yellow-500"
                                                    )}>
                                                        {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'cancelled' ? 'Cancelada' : apt.status === 'completed' ? 'Completada' : 'Pendiente'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 text-primary dark:text-pink-400 text-sm font-bold bg-primary/5 px-2 py-1 rounded-lg">
                                                        <Clock size={14} /> {apt.appointment_time}
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-3 mb-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex flex-shrink-0 items-center justify-center text-primary dark:text-pink-400">
                                                        <UserCircle size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold leading-tight line-clamp-1">{apt.customer_name}</div>
                                                        <div className="text-xs text-muted-foreground">{apt.customer_phone || 'Sin teléfono'}</div>
                                                    </div>
                                                </div>

                                                <div className="bg-primary/5 p-3 rounded-xl mb-4 border border-primary/10">
                                                    <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Servicio</p>
                                                    <p className="font-medium text-sm text-primary dark:text-pink-300">{apt.services?.name}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => setManagingAppointment(apt)}
                                                    className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-pink-300 rounded-xl text-xs font-bold uppercase transition-all text-center"
                                                >
                                                    Gestionar
                                                </button>
                                                {apt.status !== 'confirmed' && apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas confirmar esta cita?', action: () => handleUpdateStatus(apt.id, 'confirmed') })}
                                                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl transition-all"
                                                        title="Confirmar rápido"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {apt.status !== 'cancelled' && apt.status !== 'completed' && (
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas cancelar esta cita?', action: () => handleUpdateStatus(apt.id, 'cancelled') })}
                                                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl transition-all"
                                                        title="Cancelar rápido"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-card w-full max-w-md rounded-3xl shadow-2xl p-6 border border-border"
                        >
                            <h2 className="text-2xl font-bold font-playfair mb-6">Registrar Cita Manual</h2>
                            <form onSubmit={handleCreateAppointment} className="space-y-4">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Cliente</label>
                                    <input required value={formName} onChange={e => setFormName(e.target.value)} type="text" className="w-full p-3 rounded-xl border border-border bg-background" placeholder="Nombre completo" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Teléfono</label>
                                    <input value={formPhone} onChange={e => setFormPhone(e.target.value)} type="tel" className="w-full p-3 rounded-xl border border-border bg-background" placeholder="Opcional" />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Servicio</label>
                                    <select required value={formServiceId} onChange={e => setFormServiceId(e.target.value)} className="w-full p-3 rounded-xl border border-border bg-background">
                                        <option value="">Selecciona un servicio</option>
                                        {services.map(s => <option key={s.id} value={s.id}>{s.name} (${s.price})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Fecha</label>
                                        <input required value={formDate} onChange={e => setFormDate(e.target.value)} type="date" className="w-full p-3 rounded-xl border border-border bg-background" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">Hora</label>
                                        <input required value={formTime} onChange={e => setFormTime(e.target.value)} type="time" className="w-full p-3 rounded-xl border border-border bg-background" />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-3 text-sm font-bold uppercase hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-all">Cancelar</button>
                                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-primary text-white text-sm font-bold uppercase rounded-xl transition-all hover:scale-105 shadow-lg shadow-primary/20 flex items-center justify-center">
                                        {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', action: () => { } })}
            />
        </div>
    );
}
