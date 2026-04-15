'use client';

import { Playfair_Display } from 'next/font/google';
import { Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface OverviewTabProps {
    appointments: Appointment[];
    setManagingAppointment: (appointment: Appointment) => void;
    setActiveTab: (tab: string) => void;
}

export default function OverviewTab({ appointments, setManagingAppointment, setActiveTab }: OverviewTabProps) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const todaysAppointments = appointments.filter(apt => apt.appointment_date === todayStr);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 admin-card bg-gradient-to-br from-primary to-primary/80 text-white border-none shadow-primary/30 shadow-xl overflow-hidden relative">
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <h3 className="font-bold text-sm uppercase tracking-widest opacity-80 mb-2">Resumen de Hoy</h3>
                        <div className="flex justify-between items-end">
                            <div>
                                <span className="text-sm opacity-90 block mb-1">Citas Totales</span>
                                <span className="text-6xl font-black tracking-tighter">{todaysAppointments.length}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm opacity-90 block mb-1">Por confirmar</span>
                                <span className="text-4xl font-bold">{todaysAppointments.filter(a => a.status === 'pending').length}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="admin-card flex flex-col justify-center space-y-3 relative overflow-hidden bg-gradient-to-b from-card to-muted/20">
                    <h3 className="font-bold text-xs uppercase tracking-widest text-muted-foreground mb-1">Acciones Rápidas</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setActiveTab('Citas')}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold"
                        >
                            <Calendar size={18} />
                            <span>Nueva Cita</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('Catálogo')}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-2xl bg-primary/5 text-primary/70 hover:bg-primary/20 transition-all text-xs font-bold"
                        >
                            <Users size={18} />
                            <span>Servicios</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Horizontal Timeline / Visual Schedule */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <Calendar size={20} className="text-primary" />
                    <h3 className="font-bold text-lg">Próximas horas</h3>
                </div>
                
                {todaysAppointments.length > 0 ? (
                    <div className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {todaysAppointments.map((apt) => (
                            <div key={apt.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                                <div className="admin-card h-full !p-5 hover:border-primary/40 transition-all flex flex-col justify-between bg-card hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform" />
                                    
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-1.5 text-primary text-sm font-black bg-primary/10 px-3 py-1 rounded-xl">
                                                {apt.appointment_time}
                                            </div>
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[10px] uppercase font-bold",
                                                apt.status === 'confirmed' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                                            )}>
                                                {apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                            </span>
                                        </div>

                                        <h4 className="font-bold text-xl leading-tight mb-1">{apt.customer_name}</h4>
                                        <p className="text-xs text-muted-foreground font-medium mb-4 flex items-center gap-1">
                                            <Users size={12} /> {apt.customer_phone || 'Sin teléfono'}
                                        </p>

                                        <div className="bg-muted/30 p-3 rounded-xl mb-4 border border-border/50">
                                            <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider mb-1">Servicio</p>
                                            <p className="font-medium text-sm">{apt.services?.name || 'Servicio General'}</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setManagingAppointment(apt)}
                                        className="w-full py-2.5 bg-primary/10 hover:bg-primary/20 text-primary dark:text-pink-300 rounded-xl text-xs font-bold uppercase transition-all mt-auto"
                                    >
                                        Gestionar Cita
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center space-y-4 bg-card rounded-3xl border border-border">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto text-primary/40">
                            <Calendar size={32} />
                        </div>
                        <p className="text-muted-foreground font-medium">No hay citas para hoy todavía.</p>
                        <p className="text-sm opacity-50">¡Aprovecha el tiempo para descansar!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
