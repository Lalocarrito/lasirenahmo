'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Clock, Loader2, X, CheckCircle, UserCircle, MessageCircle } from 'lucide-react';
import { startOfDay, parseISO, isBefore, isAfter, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import ConfirmModal from '../modals/ConfirmModal';

import type { Appointment, Service } from '@/types';

import { useQuery } from '@tanstack/react-query';

interface AppointmentsTabProps {
    services: Service[];
    setManagingAppointment: (appointment: Appointment) => void;
    handleUpdateStatus: (id: string, status: string) => void;
    onSendReminder: (id: string) => Promise<void>;
    fetchData: (loader?: boolean) => void;
}

const PAGE_SIZE = 20;

export default function AppointmentsTab({
    services,
    setManagingAppointment,
    handleUpdateStatus,
    onSendReminder,
    fetchData
}: AppointmentsTabProps) {
    const [view, setView] = useState<'upcoming' | 'past'>('upcoming');
    const [page, setPage] = useState(0);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-appointments', view, page],
        queryFn: async () => {
            const today = format(new Date(), 'yyyy-MM-dd');
            let query = supabase.from('appointments').select('*, services(*)');
            
            if (view === 'upcoming') {
                query = query.gte('appointment_date', today).order('appointment_date', { ascending: true });
            } else {
                query = query.lt('appointment_date', today).order('appointment_date', { ascending: false });
            }

            const from = page * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            const { data, error } = await query.range(from, to);
            
            if (error) throw error;
            return data as Appointment[];
        }
    });

    const appointments = data || [];
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, message: string, action: () => void }>({ isOpen: false, message: '', action: () => { } });

    const now = new Date();
    const today = startOfDay(now);
    const todayStr = format(now, 'yyyy-MM-dd');
    const currentTimeStr = format(now, 'HH:mm');

    const terminalStatuses = ['cancelled', 'no_show'];

    function isAppointmentActive(apt: Appointment): boolean {
        if (terminalStatuses.includes(apt.status)) return false;
        if (apt.appointment_date === todayStr && apt.appointment_time < currentTimeStr) return false;
        return true;
    }

    const upcomingAppointments = appointments.filter(a => !isBefore(parseISO(a.appointment_date), today) && isAppointmentActive(a));
    const pastAppointments = appointments.filter(a => isBefore(parseISO(a.appointment_date), today) || !isAppointmentActive(a));

    const displayedAppointments = view === 'upcoming' ? upcomingAppointments : pastAppointments;

    // Grouping for visual display
    const grouped = displayedAppointments.reduce((acc: Record<string, Appointment[]>, curr) => {
        if (!acc[curr.appointment_date]) acc[curr.appointment_date] = [];
        acc[curr.appointment_date].push(curr);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();
    if (view === 'past') sortedDates.reverse();

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
            </div>
            <div className="grid gap-12">
                {sortedDates.length === 0 ? (
                    <div className="admin-card text-center py-20 text-muted-foreground italic">
                        {isLoading ? <Loader2 className="animate-spin mx-auto" /> : `No hay citas ${view === 'upcoming' ? 'próximas' : 'pasadas'}.`}
                    </div>
                ) : (
                    sortedDates.map(dateStr => {
                        const dateObj = parseISO(dateStr);
                        const dateLabel = format(dateObj, "EEEE d 'de' MMMM", { locale: es });
                        const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;

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
                                                                apt.status === 'completed' ? "bg-blue-500/10 text-blue-500" :
                                                                    apt.status === 'no_show' ? "bg-gray-500/10 text-gray-500" : "bg-yellow-500/10 text-yellow-500"
                                                )}>
                                                        {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'cancelled' ? 'Cancelada' : apt.status === 'completed' ? 'Completada' : apt.status === 'no_show' ? 'No Asistió' : 'Pendiente'}
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
                                                    {apt.price_at_booking && (
                                                        <p className="text-[10px] text-muted-foreground mt-1">${apt.price_at_booking}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => setManagingAppointment(apt)}
                                                    className="flex-1 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary dark:text-pink-300 rounded-xl text-xs font-bold uppercase transition-all text-center"
                                                >
                                                    Gestionar
                                                </button>
                                                {apt.status !== 'confirmed' && apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' && apt.confirmation_token && apt.customer_phone ? (
                                                    <button
                                                        onClick={() => onSendReminder(apt.id)}
                                                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl transition-all"
                                                        title="Enviar WhatsApp"
                                                    >
                                                        <MessageCircle size={18} />
                                                    </button>
                                                ) : apt.status !== 'confirmed' && apt.status !== 'cancelled' && apt.status !== 'completed' && apt.status !== 'no_show' ? (
                                                    <button
                                                        onClick={() => setConfirmModal({ isOpen: true, message: '¿Segura que deseas confirmar esta cita?', action: () => handleUpdateStatus(apt.id, 'confirmed') })}
                                                        className="px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 rounded-xl transition-all"
                                                        title="Confirmar rápido"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 py-8">
                <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0 || isLoading}
                    className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold uppercase transition-all hover:bg-primary/5 disabled:opacity-30"
                >
                    Anterior
                </button>
                <div className="text-xs font-bold text-muted-foreground bg-muted/20 px-3 py-1 rounded-full">
                    Página {page + 1}
                </div>
                <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={appointments.length < PAGE_SIZE || isLoading}
                    className="px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold uppercase transition-all hover:bg-primary/5 disabled:opacity-30"
                >
                    Siguiente
                </button>
            </div>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                message={confirmModal.message}
                onConfirm={confirmModal.action}
                onCancel={() => setConfirmModal({ isOpen: false, message: '', action: () => { } })}
            />
        </div>
    );
}
