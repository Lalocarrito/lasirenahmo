'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react';
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, startOfDay, isBefore, isSameDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import ConfirmModal from '../modals/ConfirmModal';

interface AvailabilityTabProps {
    availability: any[];
    overrides: any[];
    handleUpdateAvailability: (id: string, startTime: string, endTime: string) => void;
    handleAddAvailability: (dayOfWeek: number) => void;
    handleDeleteAvailability: (id: string) => void;
    handleUpdateOverride: (date: string, startTime: string | null, endTime: string | null, isOffDay: boolean) => void;
    handleDeleteOverride: (date: string) => void;
    fetchData: () => void;
}

export default function AvailabilityTab({
    availability,
    overrides,
    handleUpdateAvailability,
    handleAddAvailability,
    handleDeleteAvailability,
    handleUpdateOverride,
    handleDeleteOverride,
    fetchData
}: AvailabilityTabProps) {
    const today = startOfDay(new Date());
    const [viewDate, setViewDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('calendar');

    // Calendar logic
    const monthName = viewDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getDay(startOfMonth(viewDate));

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

    // Get specific override for selected date
    const selectedDateStr = selectedDate ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}` : null;
    const currentOverride = overrides.find(o => o.override_date === selectedDateStr);
    const dayOfWeekAvails = selectedDate ? availability.filter(a => a.day_of_week === selectedDate.getDay()) : [];

    // State for override editor
    const [isOffDay, setIsOffDay] = useState(false);
    const [customStart, setCustomStart] = useState('09:00');
    const [customEnd, setCustomEnd] = useState('18:00');

    // When a date is selected, initialize editor state
    const handleDateSelect = (d: Date) => {
        setSelectedDate(d);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const override = overrides.find(o => o.override_date === dateStr);
        if (override) {
            setIsOffDay(override.is_off_day);
            if (override.start_time) setCustomStart(override.start_time.substring(0, 5));
            if (override.end_time) setCustomEnd(override.end_time.substring(0, 5));
        } else {
            setIsOffDay(false);
            setCustomStart('09:00');
            setCustomEnd('18:00');
        }
    };

    const saveOverride = () => {
        if (!selectedDateStr) return;
        handleUpdateOverride(selectedDateStr, isOffDay ? null : customStart, isOffDay ? null : customEnd, isOffDay);
        setSelectedDate(null);
    };

    const removeOverride = () => {
        if (!selectedDateStr) return;
        handleDeleteOverride(selectedDateStr);
        setSelectedDate(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* View Toggle */}
            <div className="flex bg-muted/30 p-1 rounded-2xl w-fit mb-6">
                <button
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                        viewMode === 'calendar' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Calendario Específico
                </button>
                <button
                    onClick={() => setViewMode('weekly')}
                    className={cn(
                        "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                        viewMode === 'weekly' ? "bg-card text-primary dark:text-pink-400 shadow" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Horario Base Semanal
                </button>
            </div>

            {viewMode === 'weekly' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="admin-card">
                        <h3 className="font-bold text-xl mb-6">Horarios Base (Todas las semanas)</h3>
                        <p className="text-xs text-muted-foreground mb-4">Este es el horario por defecto. Puedes agregar varios turnos por día.</p>
                        <div className="space-y-6">
                            {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, idx) => {
                                const dayAvails = availability.filter(a => a.day_of_week === idx);
                                return (
                                    <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm">{day}</span>
                                            <button
                                                onClick={() => handleAddAvailability(idx)}
                                                className="text-[10px] font-bold text-primary dark:text-pink-400 hover:underline uppercase"
                                            >
                                                + AGREGAR TURNO
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            {dayAvails.length > 0 ? dayAvails.map((avail) => (
                                                <div key={avail.id} className="flex items-center gap-2 group">
                                                    <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2">
                                                        <input
                                                            type="time"
                                                            defaultValue={avail.start_time.substring(0, 5)}
                                                            onBlur={(e) => handleUpdateAvailability(avail.id, e.target.value, avail.end_time)}
                                                            className="bg-transparent text-xs outline-none"
                                                        />
                                                        <span className="text-muted-foreground">-</span>
                                                        <input
                                                            type="time"
                                                            defaultValue={avail.end_time.substring(0, 5)}
                                                            onBlur={(e) => handleUpdateAvailability(avail.id, avail.start_time, e.target.value)}
                                                            className="bg-transparent text-xs outline-none"
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteAvailability(avail.id)}
                                                        className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            )) : (
                                                <p className="text-[10px] text-muted-foreground italic">No laborable</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {viewMode === 'calendar' && (
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
                    {/* Interactive Calendar */}
                    <div className="admin-card !p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="capitalize font-bold text-3xl font-playfair">{monthName}</h3>
                                <p className="text-xs text-muted-foreground mt-1">Selecciona un día para modificar su horario o marcarlo como libre.</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-3 bg-primary/5 border border-primary/10 hover:bg-primary/10 rounded-xl text-primary dark:text-pink-400 transition-colors"><ChevronLeft size={20} /></button>
                                <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-3 bg-primary/5 border border-primary/10 hover:bg-primary/10 rounded-xl text-primary dark:text-pink-400 transition-colors"><ChevronRight size={20} /></button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-4 text-center text-xs font-bold text-muted-foreground/60 mb-6 uppercase tracking-widest">
                            {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => <div key={d}>{d}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-4">
                            {days.map((day, i) => {
                                if (!day) return <div key={`empty-${i}`} />;
                                const dateStr = format(day, 'yyyy-MM-dd');
                                const override = overrides.find(o => o.override_date === dateStr);
                                const isSelected = selectedDate ? isSameDay(selectedDate, day) : false;
                                const isToday = isSameDay(today, day);

                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => handleDateSelect(day)}
                                        className={cn(
                                            "aspect-square flex flex-col items-center justify-center rounded-2xl text-sm font-bold transition-all relative border-2",
                                            isSelected ? "border-primary bg-primary/5 scale-105 shadow-xl shadow-primary/10 z-10" : "border-transparent hover:border-primary/30 hover:bg-muted/30",
                                            isToday && !isSelected && "bg-primary/10 text-primary dark:bg-primary/20 dark:text-pink-400 font-bold",
                                            override?.is_off_day && !isSelected && "border-red-500/30 bg-red-500/5 text-red-600 dark:text-red-400"
                                        )}
                                    >
                                        <span>{day.getDate()}</span>
                                        {/* Indicators */}
                                        <div className="absolute bottom-2 flex gap-1">
                                            {override?.is_off_day && <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter" title="Día Libre Especial">Libre</div>}
                                            {override && !override.is_off_day && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" title="Horario Especial" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex gap-6 mt-8 pt-6 border-t border-border text-xs text-muted-foreground font-bold">
                            <div className="flex items-center gap-2"><div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Libre</div> Día Libre (Excepción)</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Horario Especial</div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-muted border border-border" /> Horario Base</div>
                        </div>
                    </div>

                    {/* Date Editor Sidebar */}
                    <AnimatePresence mode="wait">
                        {selectedDate ? (
                            <motion.div
                                key="editor"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="admin-card flex flex-col h-fit sticky top-6"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase text-primary dark:text-pink-400 tracking-widest mb-1">Día Seleccionado</h4>
                                        <h3 className="font-bold text-xl capitalize">
                                            {selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </h3>
                                    </div>
                                    <button onClick={() => setSelectedDate(null)} className="p-1.5 hover:bg-muted rounded-full">
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="space-y-6 flex-1">
                                    {/* Current Base Status */}
                                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <p className="text-[10px] uppercase font-bold text-primary dark:text-pink-400 mb-2">Horario Base Correspondiente</p>
                                        {dayOfWeekAvails.length > 0 ? (
                                            dayOfWeekAvails.map(a => (
                                                <div key={a.id} className="text-sm font-medium">
                                                    {a.start_time.substring(0, 5)} - {a.end_time.substring(0, 5)}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm font-medium italic text-muted-foreground">Normalmente no laborable</div>
                                        )}
                                    </div>

                                    {/* Exception Editor */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-bold uppercase py-2 border-b border-border">Crear Excepción</h4>

                                        <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-primary/5 hover:border-primary/30 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={isOffDay}
                                                onChange={(e) => setIsOffDay(e.target.checked)}
                                                className="w-4 h-4 accent-primary rounded"
                                            />
                                            <span className="text-sm font-bold">Marcar como Día Libre</span>
                                        </label>

                                        <AnimatePresence>
                                            {!isOffDay && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                                        <p className="text-xs font-medium text-primary dark:text-pink-400 mb-2">Definir horario especial para este día:</p>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Inicio</label>
                                                                <input type="time" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-border bg-background" />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Fin</label>
                                                                <input type="time" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-full p-2 text-sm rounded-lg border border-border bg-background" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                                    <button
                                        onClick={saveOverride}
                                        className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                    >
                                        Guardar Excepción
                                    </button>
                                    {currentOverride && (
                                        <button
                                            onClick={removeOverride}
                                            className="w-full py-3 bg-secondary text-primary dark:bg-slate-800 dark:text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-xl font-bold text-sm uppercase transition-all"
                                        >
                                            Restaurar Base Normal
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="admin-card border-dashed flex flex-col items-center justify-center text-center p-8 text-muted-foreground"
                            >
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium">Selecciona un día en el calendario para editar sus horarios de forma individual.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
