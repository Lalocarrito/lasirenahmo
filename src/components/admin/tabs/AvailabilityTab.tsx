'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ChevronLeft, ChevronRight, Plus, Check, Loader2, User } from 'lucide-react';
import { addMonths, subMonths, getDaysInMonth, startOfMonth, getDay, startOfDay, isBefore, isSameDay, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { Profile, BusinessAvailability, BusinessAvailabilityOverride } from '@/types';
import { toast } from 'sonner';

interface AvailabilityTabProps {
    profile: Profile | null;
}

export default function AvailabilityTab({ profile }: AvailabilityTabProps) {
    const today = startOfDay(new Date());
    const [viewDate, setViewDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'weekly'>('calendar');
    
    // Staff Selection (for admins)
    const [staffList, setStaffList] = useState<Profile[]>([]);
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    
    // Data states
    const [availability, setAvailability] = useState<BusinessAvailability[]>([]);
    const [overrides, setOverrides] = useState<BusinessAvailabilityOverride[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial load: Staff list and default selection
    useEffect(() => {
        const loadStaff = async () => {
            const { data } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']);
            const list = (data || []) as Profile[];
            setStaffList(list);
            
            // Default to current user if they are staff/admin, otherwise first in list
            if (profile && (profile.role === 'admin' || profile.role === 'staff')) {
                setSelectedStaffId(profile.id);
            } else if (list.length > 0) {
                setSelectedStaffId(list[0].id);
            }
        };
        loadStaff();
    }, [profile]);

    // Fetch availability for selected staff
    const fetchAvailability = async () => {
        if (!selectedStaffId) return;
        setIsLoading(true);
        const [availRes, overridesRes] = await Promise.all([
            supabase.from('business_availability').select('*').eq('staff_id', selectedStaffId).order('day_of_week', { ascending: true }),
            supabase.from('business_availability_overrides').select('*').eq('staff_id', selectedStaffId).order('override_date', { ascending: true })
        ]);
        setAvailability((availRes.data || []) as BusinessAvailability[]);
        setOverrides((overridesRes.data || []) as BusinessAvailabilityOverride[]);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAvailability();
    }, [selectedStaffId]);

    // Calendar logic
    const monthName = viewDate.toLocaleString('es-MX', { month: 'long', year: 'numeric' });
    const daysInMonth = getDaysInMonth(viewDate);
    const firstDay = getDay(startOfMonth(viewDate));

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

    // Exception Editor State
    const [isOffDay, setIsOffDay] = useState(false);
    const [customStart, setCustomStart] = useState('09:00');
    const [customEnd, setCustomEnd] = useState('18:00');

    const selectedDateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;
    const currentOverride = overrides.find(o => o.override_date === selectedDateStr);
    const dayOfWeekAvails = selectedDate ? availability.filter(a => a.day_of_week === selectedDate.getDay()) : [];

    const handleDateSelect = (d: Date) => {
        setSelectedDate(d);
        const dateStr = format(d, 'yyyy-MM-dd');
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

    // Actions
    const handleUpdateAvailability = async (id: string, startTime: string, endTime: string) => {
        const { error } = await supabase.from('business_availability').update({ start_time: startTime, end_time: endTime }).eq('id', id);
        if (!error) fetchAvailability();
    };

    const handleAddAvailability = async (dayOfWeek: number) => {
        if (!selectedStaffId) return;
        const { error } = await supabase.from('business_availability').insert([{
            day_of_week: dayOfWeek,
            start_time: '09:00',
            end_time: '18:00',
            staff_id: selectedStaffId,
            is_active: true
        }]);
        if (!error) fetchAvailability();
    };

    const handleDeleteAvailability = async (id: string) => {
        const { error } = await supabase.from('business_availability').delete().eq('id', id);
        if (!error) fetchAvailability();
    };

    const saveOverride = async () => {
        if (!selectedDateStr || !selectedStaffId) return;
        
        // Clean existing
        await supabase.from('business_availability_overrides').delete().eq('override_date', selectedDateStr).eq('staff_id', selectedStaffId);
        
        const { error } = await supabase.from('business_availability_overrides').insert([{
            override_date: selectedDateStr,
            start_time: isOffDay ? null : customStart,
            end_time: isOffDay ? null : customEnd,
            is_off_day: isOffDay,
            staff_id: selectedStaffId
        }]);

        if (!error) {
            toast.success('Excepción guardada');
            fetchAvailability();
            setSelectedDate(null);
        }
    };

    const removeOverride = async () => {
        if (!selectedDateStr || !selectedStaffId) return;
        await supabase.from('business_availability_overrides').delete().eq('override_date', selectedDateStr).eq('staff_id', selectedStaffId);
        toast.info('Horario base restaurado');
        fetchAvailability();
        setSelectedDate(null);
    };

    const seedDefaultAvailability = async () => {
        if (!selectedStaffId) return;
        const defaults = [1, 2, 3, 4, 5].map(day => ({
            day_of_week: day,
            start_time: '10:00',
            end_time: '18:00',
            staff_id: selectedStaffId,
            is_active: true
        }));
        const { error } = await supabase.from('business_availability').insert(defaults);
        if (!error) {
            toast.success('Horario base creado (Lun-Vie 10-18h)');
            fetchAvailability();
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Staff Selection */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border">
                <div className="flex bg-muted/30 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                            viewMode === 'calendar' ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Calendario Específico
                    </button>
                    <button
                        onClick={() => setViewMode('weekly')}
                        className={cn(
                            "px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                            viewMode === 'weekly' ? "bg-card text-primary shadow" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Horario Base
                    </button>
                </div>

                {profile?.role === 'admin' && (
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Gestionando a:</span>
                        <select 
                            value={selectedStaffId || ''} 
                            onChange={(e) => setSelectedStaffId(e.target.value)}
                            className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary outline-none"
                        >
                            {staffList.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="animate-spin text-primary mb-4" size={32} />
                    <p className="text-muted-foreground text-xs uppercase tracking-widest leading-none">Actualizando Agenda...</p>
                </div>
            ) : (
                <>
                    {viewMode === 'weekly' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="admin-card">
                                <h3 className="font-bold text-xl mb-6">Horarios Base (Semanal)</h3>
                                
                                {availability.length === 0 && (
                                    <div className="p-8 text-center bg-primary/5 rounded-3xl border border-dashed border-primary/20 space-y-4 mb-6">
                                        <p className="text-sm text-muted-foreground italic">Este profesional no tiene un horario base configurado.</p>
                                        <button 
                                            onClick={seedDefaultAvailability}
                                            className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase"
                                        >
                                            Cargar Horario (Lun-Vie 10-18h)
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day, idx) => {
                                        const dayAvails = availability.filter(a => a.day_of_week === idx);
                                        return (
                                            <div key={idx} className="p-4 bg-muted/20 rounded-2xl border border-border space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm">{day}</span>
                                                    <button
                                                        onClick={() => handleAddAvailability(idx)}
                                                        className="text-[10px] font-bold text-primary hover:underline uppercase"
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
                            <div className="admin-card !p-8">
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="capitalize font-bold text-3xl font-playfair">{monthName}</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Selecciona excepciones para {staffList.find(s => s.id === selectedStaffId)?.full_name}.</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setViewDate(subMonths(viewDate, 1))} className="p-3 bg-primary/5 hover:bg-primary/10 rounded-xl text-primary transition-colors"><ChevronLeft size={20} /></button>
                                        <button onClick={() => setViewDate(addMonths(viewDate, 1))} className="p-3 bg-primary/5 hover:bg-primary/10 rounded-xl text-primary transition-colors"><ChevronRight size={20} /></button>
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
                                                    isSelected ? "border-primary bg-primary/5 scale-105 shadow-primary/10 z-10" : "border-transparent hover:border-primary/30",
                                                    isToday && !isSelected && "bg-primary/10 text-primary font-bold",
                                                    override?.is_off_day && !isSelected && "border-red-500/30 bg-red-500/5 text-red-600"
                                                )}
                                            >
                                                <span>{day.getDate()}</span>
                                                <div className="absolute bottom-2 flex gap-1">
                                                    {override?.is_off_day && <div className="text-[10px] font-bold text-red-500 uppercase tracking-tighter">Libre</div>}
                                                    {override && !override.is_off_day && <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

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
                                                <h4 className="text-[10px] font-bold uppercase text-primary tracking-widest mb-1">Día Seleccionado</h4>
                                                <h3 className="font-bold text-xl capitalize">{format(selectedDate, 'EEEE d MMMM', { locale: es })}</h3>
                                            </div>
                                            <button onClick={() => setSelectedDate(null)} className="p-1.5 hover:bg-muted rounded-full"><X size={16} /></button>
                                        </div>

                                        <div className="space-y-6 flex-1">
                                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                                <p className="text-[10px] uppercase font-bold text-primary mb-2">Horario Base</p>
                                                {dayOfWeekAvails.length > 0 ? dayOfWeekAvails.map(a => <div key={a.id} className="text-sm font-medium">{a.start_time.substring(0, 5)} - {a.end_time.substring(0, 5)}</div>) : <div className="text-sm font-medium italic text-muted-foreground">Cerrado</div>}
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-xs font-bold uppercase py-2 border-b border-border">Excepción</h4>
                                                <label className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-primary/5 transition-colors">
                                                    <input type="checkbox" checked={isOffDay} onChange={(e) => setIsOffDay(e.target.checked)} className="w-4 h-4 accent-primary rounded" />
                                                    <span className="text-sm font-bold">Día Libre</span>
                                                </label>

                                                {!isOffDay && (
                                                    <div className="space-y-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                                                        <div className="flex gap-3">
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
                                                )}
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-border flex flex-col gap-3">
                                            <button onClick={saveOverride} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">Guardar</button>
                                            {currentOverride && <button onClick={removeOverride} className="w-full py-3 bg-muted text-red-500 rounded-xl font-bold text-sm uppercase transition-all">Eliminar Excepción</button>}
                                        </div>
                                    </motion.div>
                                ) : (
                                    <div className="admin-card border-dashed flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                                        <Calendar size={48} className="mb-4 opacity-20" />
                                        <p className="text-xs">Selecciona un día para crear una excepción.</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
