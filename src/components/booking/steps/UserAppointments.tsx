'use client';

import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { ArrowRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { isAfter, isBefore, endOfDay, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function UserAppointments() {
    const { userAppointments, setViewMode, fetchUserAppointments, setToast } = useBooking();

    const upcomingAppointments = userAppointments.filter(apt => apt.status !== 'cancelled' && isAfter(endOfDay(parseISO(apt.appointment_date)), new Date())).slice().reverse();
    const pastOrCancelledAppointments = userAppointments.filter(apt => apt.status === 'cancelled' || isBefore(endOfDay(parseISO(apt.appointment_date)), new Date()));

    const nextAppointment = upcomingAppointments[0];
    const otherUpcoming = upcomingAppointments.slice(1);

    const handleCancelAppointment = async (id: string) => {
        if (!confirm("¿Estás segura de que deseas cancelar esta cita?")) return;
        try {
            const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
            if (error) throw error;
            setToast({ message: "Cita cancelada con éxito", type: 'success' });
            fetchUserAppointments();
        } catch (error: any) {
            setToast({ message: `No se pudo cancelar: ${error.message || 'Error desconocido'}`, type: 'error' });
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-4 py-8"
        >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className={`${playfair.className} text-4xl text-foreground`}>Mis <span className="text-primary italic">Citas</span></h2>
                    <p className="text-muted-foreground mt-1 text-sm">Gestiona tus reservas y observa tu historial.</p>
                </div>
                <button
                    onClick={() => setViewMode('booking')}
                    className="siren-button flex items-center gap-2 py-3 px-6 text-xs whitespace-nowrap"
                >
                    <ArrowRight size={14} className="rotate-180" /> Nueva Cita
                </button>
            </div>

            {userAppointments.length === 0 ? (
                <div className="text-center py-24 glass-card italic text-muted-foreground bg-muted/20 rounded-3xl border-dashed border-2">
                    <CalendarIcon size={48} className="mx-auto mb-4 opacity-20" />
                    Aún no tienes citas registradas en tu historial.
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Next Appointment Hero */}
                    {nextAppointment && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Próxima Cita
                            </h3>
                            <div className="glass-card relative overflow-hidden bg-primary text-white border-0 shadow-xl shadow-primary/20 p-6 md:p-8 rounded-3xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20" />
                                <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
                                    <div className="space-y-2">
                                        <h4 className={`${playfair.className} text-3xl md:text-4xl`}>{nextAppointment.services?.name}</h4>
                                        <div className="flex flex-col md:flex-row gap-3 pt-2 opacity-90 text-sm font-medium">
                                            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full w-fit">
                                                <CalendarIcon size={16} /> {format(parseISO(nextAppointment.appointment_date), "EEEE d 'de' MMMM")}
                                            </div>
                                            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full w-fit">
                                                <Clock size={16} /> {nextAppointment.appointment_time}
                                            </div>
                                        </div>
                                        {nextAppointment.notes && <p className="text-xs italic bg-black/10 p-3 rounded-xl mt-4 max-w-md">"{nextAppointment.notes}"</p>}
                                    </div>
                                    <div className="flex flex-col items-start md:items-end gap-3 min-w-[140px]">
                                        <div className={cn(
                                            "text-xs font-bold uppercase px-4 py-1.5 rounded-full",
                                            nextAppointment.status === 'confirmed' ? "bg-white text-green-600" : "bg-white/20 text-white"
                                        )}>
                                            {nextAppointment.status === 'confirmed' ? '✓ Confirmada' : '⏳ Pendiente'}
                                        </div>
                                        <button
                                            onClick={() => handleCancelAppointment(nextAppointment.id)}
                                            className="text-xs font-bold uppercase text-white/50 hover:text-white hover:underline transition-all mt-2"
                                        >
                                            Cancelar Cita
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Other Upcoming */}
                    {otherUpcoming.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Programadas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {otherUpcoming.map((apt) => (
                                    <div key={apt.id} className="glass-card flex flex-col justify-between gap-4 p-5 rounded-2xl border hover:border-primary/30 transition-all bg-card/50">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div className="text-foreground font-bold text-lg">{apt.services?.name}</div>
                                                <div className="text-[10px] uppercase font-bold text-yellow-600 py-1 px-2 rounded-full bg-yellow-500/10">Pendiente</div>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                                                <div className="flex items-center gap-1.5"><CalendarIcon size={14} /> {format(parseISO(apt.appointment_date), 'dd/MM/yyyy')}</div>
                                                <div className="flex items-center gap-1.5"><Clock size={14} /> {apt.appointment_time}</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCancelAppointment(apt.id)}
                                            className="text-[10px] w-fit font-bold uppercase text-red-500/60 hover:text-red-500 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Past or Cancelled */}
                    {pastOrCancelledAppointments.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">Historial</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {pastOrCancelledAppointments.map((apt) => (
                                    <div key={apt.id} className="flex justify-between items-center p-4 rounded-xl border border-border bg-muted/10 opacity-75 grayscale-[30%] hover:grayscale-0 transition-all">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                                            <div className="font-bold text-sm">{apt.services?.name}</div>
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                                <span>{format(parseISO(apt.appointment_date), 'dd/MM/yyyy')}</span>
                                                <span>{apt.appointment_time}</span>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "text-[10px] uppercase font-bold px-2 py-1 rounded-full",
                                            apt.status === 'cancelled' ? "text-red-500 bg-red-500/10" : "text-primary bg-primary/10"
                                        )}>
                                            {apt.status === 'cancelled' ? 'Cancelada' : 'Realizada'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
