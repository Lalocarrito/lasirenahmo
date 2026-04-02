'use client';

import { Playfair_Display } from 'next/font/google';
import { Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface OverviewTabProps {
    appointments: any[];
    setManagingAppointment: (appointment: any) => void;
    setActiveTab: (tab: string) => void;
}

export default function OverviewTab({ appointments, setManagingAppointment, setActiveTab }: OverviewTabProps) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todaysAppointments = appointments.filter(apt => apt.appointment_date === todayStr);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            {/* Timeline / Visual Schedule */}
            <div className="lg:col-span-2 space-y-6">
                <div className="admin-card !p-0 overflow-hidden">
                    <div className="p-6 border-b border-border">
                        <h3 className="font-bold flex items-center gap-2">
                            <Calendar size={18} className="text-primary" />
                            Próximas horas
                        </h3>
                    </div>
                    <div className="p-6 space-y-8 relative">
                        {/* Vertical line connector */}
                        <div className="absolute left-10 top-10 bottom-10 w-0.5 bg-border md:left-14" />

                        {todaysAppointments.length > 0 ? todaysAppointments.map((apt) => (
                            <div key={apt.id} className="flex gap-4 md:gap-8 relative z-10 group">
                                <div className="flex flex-col items-center w-8 md:w-16">
                                    <div className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase">{apt.appointment_time}</div>
                                    <div className="w-4 h-4 rounded-full bg-primary border-4 border-card mt-2 group-hover:scale-125 transition-transform" />
                                </div>
                                <div className="flex-1 admin-card !p-4 hover:border-primary/50 transition-colors shadow-none bg-primary/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-bold text-lg leading-tight">{apt.customer_name}</h4>
                                            <p className="text-primary dark:text-pink-300 text-xs font-bold uppercase tracking-tighter">
                                                {apt.services?.name || 'Servicio General'}
                                            </p>
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                                            apt.status === 'confirmed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                                        )}>
                                            {apt.status === 'confirmed' ? '✓' : '...'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                                            <Users size={12} /> {apt.customer_phone}
                                        </span>
                                        <button
                                            onClick={() => setManagingAppointment(apt)}
                                            className="text-[10px] text-primary dark:text-pink-300 font-bold uppercase hover:underline"
                                        >
                                            Gestionar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center space-y-4">
                                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary dark:text-pink-400">
                                    <Calendar size={32} />
                                </div>
                                <p className="text-muted-foreground">No hay citas para hoy todavía.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats & Actions */}
            <div className="space-y-6">
                <div className="admin-card bg-primary text-white border-none shadow-primary/20 shadow-lg">
                    <h3 className="font-bold text-sm uppercase tracking-widest opacity-80 mb-6">Resumen del Día</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end border-b border-white/10 pb-4">
                            <span className="text-xs">Citas Totales</span>
                            <span className="text-6xl font-bold">{todaysAppointments.length}</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-xs">Por confirmar</span>
                            <span className="text-5xl font-bold">{todaysAppointments.filter(a => a.status === 'pending').length}</span>
                        </div>
                    </div>
                </div>

                <div className="admin-card">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-4">Acciones Rápidas</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setActiveTab('Citas')}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/10 hover:text-primary dark:hover:text-pink-300 transition-all text-sm font-bold"
                        >
                            <Calendar size={20} />
                            <span>Nueva Cita</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('Catálogo')}
                            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/30 hover:bg-accent/10 hover:text-accent dark:hover:text-yellow-300 transition-all text-sm font-bold"
                        >
                            <Users size={20} />
                            <span>Servicios</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
