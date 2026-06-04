'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Clock, CalendarOff, ChevronLeft } from 'lucide-react';
import { addDays, startOfDay, isSameDay, isBefore, format, startOfMonth, endOfMonth, getDay, getDaysInMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';
import type { BusinessAvailability, BusinessAvailabilityOverride } from '@/types';

const playfair = Playfair_Display({ subsets: ['latin'] });

// Helper to normalize time strings for comparison (handles "9:00 AM", "09:00 AM", "09:00:00", etc)
const standardizeTime = (timeStr: string) => {
    if (!timeStr) return '';
    const parts = timeStr.trim().toUpperCase().split(' ');
    const [time, period] = parts;
    const [hStr, mStr] = time.split(':');
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export default function DateSelection() {
    const {
        selectedDate, setSelectedDate,
        selectedTime, setSelectedTime,
        selectedStaff,
        user, setStep, prevStep
    } = useBooking();

    const [businessAvailability, setBusinessAvailability] = useState<BusinessAvailability[]>([]);
    const [overrides, setOverrides] = useState<BusinessAvailabilityOverride[]>([]);
    const [appointments30Days, setAppointments30Days] = useState<string[]>([]);
    const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>({});
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(true);
    const [showAllDays, setShowAllDays] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));

    // Fetch basic availability and overrides
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingAvailability(true);
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const rangeEnd = format(addDays(new Date(), 120), 'yyyy-MM-dd');

            let availQuery = supabase.from('business_availability').select('*').eq('is_active', true);
            let overrideQuery = supabase.from('business_availability_overrides').select('*')
                .gte('override_date', todayStr)
                .lte('override_date', rangeEnd);
            let apptQuery = supabase.from('appointments').select('appointment_date, appointment_time')
                .gte('appointment_date', todayStr)
                .lte('appointment_date', rangeEnd)
                .neq('status', 'cancelled');

            if (selectedStaff) {
                availQuery = availQuery.eq('staff_id', selectedStaff.id);
                overrideQuery = overrideQuery.eq('staff_id', selectedStaff.id);
                apptQuery = apptQuery.eq('staff_id', selectedStaff.id);
            }

            const [availRes, overridesRes, apptsRes] = await Promise.all([
                availQuery,
                overrideQuery,
                apptQuery
            ]);
            
            setBusinessAvailability(availRes.data || []);
            setOverrides(overridesRes.data || []);
            
            // Format appointments for easy lookup: "YYYY-MM-DD|HH:MM"
            const formattedAppts = (apptsRes.data || []).map(a => 
                `${a.appointment_date}|${standardizeTime(a.appointment_time)}`
            );
            setAppointments30Days(formattedAppts);
            setIsLoadingAvailability(false);
        };
        fetchData();
    }, [selectedStaff]);

    // Pre-calculate 30 days availability map
    useEffect(() => {
        if (isLoadingAvailability || businessAvailability.length === 0) return;

        const map: Record<string, boolean> = {};
        const today = startOfDay(new Date());
        const now = new Date();

        for (let i = 0; i < 120; i++) {
            const day = addDays(today, i);
            const dateStr = format(day, 'yyyy-MM-dd');
            const isToday = i === 0;

            const override = overrides.find(o => o.override_date === dateStr);
            let dayConfigs = [];

            if (override) {
                if (override.is_off_day) {
                    map[dateStr] = false;
                    continue;
                }
                dayConfigs = (override.start_time && override.end_time) 
                    ? [{ start_time: override.start_time, end_time: override.end_time }]
                    : businessAvailability.filter(a => a.day_of_week === day.getDay());
            } else {
                dayConfigs = businessAvailability.filter(a => a.day_of_week === day.getDay());
            }

            if (dayConfigs.length === 0) {
                map[dateStr] = false;
                continue;
            }

            // Check if at least one slot is free
            let hasAnySlot = false;
            for (const config of dayConfigs) {
                const [startH, startM] = config.start_time.split(':').map(Number);
                const [endH, endM] = config.end_time.split(':').map(Number);

                let currentH = startH;
                let currentM = startM;

                while (currentH < endH || (currentH === endH && currentM < endM)) {
                    const period = currentH >= 12 ? 'PM' : 'AM';
                    const displayH = currentH > 12 ? currentH - 12 : (currentH === 0 ? 12 : currentH);
                    const slot = `${displayH}:${String(currentM).padStart(2, '0')} ${period}`;
                    const normalizedSlot = standardizeTime(slot);
                    
                    const isBooked = appointments30Days.includes(`${dateStr}|${normalizedSlot}`);
                    let isForward = true;
                    if (isToday) {
                        const [slotH, slotM] = normalizedSlot.split(':').map(Number);
                        if (slotH < now.getHours() || (slotH === now.getHours() && slotM <= now.getMinutes())) {
                            isForward = false;
                        }
                    }

                    if (!isBooked && isForward) {
                        hasAnySlot = true;
                        break;
                    }

                    currentM += 60;
                    if (currentM >= 60) { currentM = 0; currentH += 1; }
                }
                if (hasAnySlot) break;
            }
            map[dateStr] = hasAnySlot;
        }
        setAvailabilityMap(map);
    }, [businessAvailability, overrides, appointments30Days, isLoadingAvailability]);

    // Calculate slots for specifically SELECTED date
    useEffect(() => {
        if (!selectedDate || businessAvailability.length === 0) {
            setAvailableSlots([]);
            return;
        }

        const calculateSlots = () => {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const now = new Date();
            const isToday = isSameDay(selectedDate, now);

            const override = overrides.find(o => o.override_date === dateStr);
            let dayConfigs = [];

            if (override) {
                if (override.is_off_day) { setAvailableSlots([]); return; }
                dayConfigs = (override.start_time && override.end_time)
                    ? [{ start_time: override.start_time, end_time: override.end_time }]
                    : businessAvailability.filter(a => a.day_of_week === selectedDate.getDay());
            } else {
                dayConfigs = businessAvailability.filter(a => a.day_of_week === selectedDate.getDay());
            }

            const allSlots: string[] = [];
            dayConfigs.sort((a, b) => a.start_time.localeCompare(b.start_time));

            dayConfigs.forEach(config => {
                const [startH, startM] = config.start_time.split(':').map(Number);
                const [endH, endM] = config.end_time.split(':').map(Number);
                let currentH = startH; let currentM = startM;

                while (currentH < endH || (currentH === endH && currentM < endM)) {
                    const period = currentH >= 12 ? 'PM' : 'AM';
                    const displayH = currentH > 12 ? currentH - 12 : (currentH === 0 ? 12 : currentH);
                    const slot = `${displayH}:${String(currentM).padStart(2, '0')} ${period}`;
                    const normalizedSlot = standardizeTime(slot);
                    
                    const isBooked = appointments30Days.includes(`${dateStr}|${normalizedSlot}`);
                    let isForward = true;
                    if (isToday) {
                        const [slotH, slotM] = normalizedSlot.split(':').map(Number);
                        if (slotH < now.getHours() || (slotH === now.getHours() && slotM <= now.getMinutes())) {
                            isForward = false;
                        }
                    }

                    if (!isBooked && isForward) allSlots.push(slot);

                    currentM += 60;
                    if (currentM >= 60) { currentM = 0; currentH += 1; }
                }
            });

            setAvailableSlots(allSlots);
        };

        calculateSlots();
    }, [selectedDate, businessAvailability, overrides, appointments30Days]);



    return (
        <motion.div
            key="step2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="space-y-8"
        >
            <div className="flex flex-col gap-2 mb-8 text-center">
                <h2 className={`${playfair.className} text-5xl mb-3 italic`}>Agenda tu cita</h2>
            </div>

            <div className="flex flex-col gap-4">
                <div className="glass-card !p-8 shadow-2xl shadow-primary/5">
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowAllDays(true)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest transition-all"
                        >
                            Ver calendario completo
                        </button>
                    </div>
                    <DayCarousel 
                        selectedDate={selectedDate} 
                        onSelect={(d) => setSelectedDate(d)} 
                        overrides={overrides} 
                        availabilityMap={availabilityMap}
                    />

                    <AnimatePresence>
                        {showAllDays && (
                            <MonthCalendar
                                selectedDate={selectedDate}
                                onSelect={(d) => { setSelectedDate(d); setShowAllDays(false); }}
                                onClose={() => setShowAllDays(false)}
                                availabilityMap={availabilityMap}
                                calendarMonth={calendarMonth}
                                setCalendarMonth={setCalendarMonth}
                                overrides={overrides}
                            />
                        )}
                    </AnimatePresence>
                </div>

                {selectedDate && (
                    <motion.div 
                        id="time-slots-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        <div className="space-y-1">
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {availableSlots.length > 0 ? availableSlots.map((time) => (
                                <button
                                    key={time}
                                    onClick={() => {
                                        setSelectedTime(time);
                                        if (!user) setStep(4);
                                        else setStep(5);
                                    }}
                                    className={cn(
                                        "p-5 rounded-2xl border-2 transition-all text-sm font-bold flex flex-col gap-1 items-center justify-center group",
                                        selectedTime === time
                                            ? "bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-[1.02]"
                                            : "bg-muted/10 border-transparent hover:border-primary/30 hover:bg-muted/30"
                                    )}
                                >
                                    <Clock size={18} className={cn(selectedTime === time ? "text-white" : "text-primary")} />
                                    {time}
                                </button>
                            )) : (
                                <div className="col-span-2 py-16 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/5 rounded-3xl border border-dashed border-border/50">
                                    <CalendarOff size={48} className="text-primary/20 mb-4" />
                                    <span className="font-bold text-lg mb-1">Sin disponibilidad</span>
                                    <span className="text-xs max-w-[250px]">Intenta buscando en el siguiente día o la próxima semana.</span>
                                </div>
                            )}
                        </div>
                </motion.div>
                )}

                <div className="pt-8 flex justify-center">
                    <button
                        onClick={prevStep}
                        className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver a profesional
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function DayCarousel({ selectedDate, onSelect, overrides, availabilityMap }: { 
    selectedDate: Date | null, 
    onSelect: (d: Date) => void, 
    overrides: BusinessAvailabilityOverride[],
    availabilityMap: Record<string, boolean>
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const today = startOfDay(new Date());
    
    const allDays = Array.from({ length: 120 }, (_, i) => addDays(today, i));
    const days = allDays.filter(d => availabilityMap[format(d, 'yyyy-MM-dd')] !== false);

    useEffect(() => {
        if (!selectedDate || !scrollRef.current) return;
        const el = scrollRef.current.querySelector(`[data-day="${format(selectedDate, 'yyyy-MM-dd')}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [selectedDate]);

    return (
        <div className="space-y-4">
            <div ref={scrollRef} className="-mx-2 px-2 flex gap-3 overflow-x-auto pb-4 pt-2 snap-x scroll-smooth custom-scrollbar no-scrollbar scroll-pl-2">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate ? isSameDay(selectedDate, day) : false;
                    const isToday = isSameDay(today, day);
                    
                    const isOffDayOverride = overrides.find(o => o.override_date === dateStr)?.is_off_day;
                    const hasNoAvailability = availabilityMap[dateStr] === false;
                    const isDisabled = isOffDayOverride || hasNoAvailability;
                    
                    return (
                        <button
                            key={dateStr}
                            data-day={dateStr}
                            disabled={isDisabled}
                            onClick={() => onSelect(day)}
                            className={cn(
                                "snap-start shrink-0 w-[4.5rem] h-[5rem] flex flex-col items-center justify-center rounded-2xl transition-all relative group",
                                isSelected 
                                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105" 
                                    : (isDisabled 
                                        ? "opacity-20 grayscale bg-muted/5 cursor-not-allowed" 
                                        : "bg-white dark:bg-slate-800 border border-border/50 hover:border-primary/50 text-foreground hover:text-primary"),
                                isToday && !isSelected && "border-primary/50 text-primary bg-primary/5"
                            )}
                        >
                            <span className={cn("text-[10px] uppercase font-bold tracking-widest", isSelected ? "text-white/80" : "text-muted-foreground/60")}>
                                {day.toLocaleDateString('es-MX', { weekday: 'short' }).substring(0, 3)}
                            </span>
                            <span className="text-xl font-bold mt-0.5">{day.getDate()}</span>
                            <span className="text-[8px] uppercase text-muted-foreground/60 mt-0.5">
                                {day.toLocaleDateString('es-MX', { month: 'short' })}
                            </span>
                            {isSelected && <motion.div layoutId="activeDay" className="absolute -bottom-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function MonthCalendar({ selectedDate, onSelect, onClose, availabilityMap, calendarMonth, setCalendarMonth, overrides }: {
    selectedDate: Date | null,
    onSelect: (d: Date) => void,
    onClose: () => void,
    availabilityMap: Record<string, boolean>,
    calendarMonth: Date,
    setCalendarMonth: (d: Date) => void,
    overrides: BusinessAvailabilityOverride[]
}) {
    const [mounted, setMounted] = useState(false);
    const dirRef = useRef(0);
    useEffect(() => setMounted(true), []);
    const daysInMonth = getDaysInMonth(calendarMonth);
    const startDay = getDay(startOfMonth(calendarMonth));
    const today = startOfDay(new Date());
    const currentMonth = startOfMonth(today);

    const days: (Date | null)[] = Array(startDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        days.push(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);

    const weekdays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
    const targetPrev = subMonths(calendarMonth, 1);
    const cantGoBack = isBefore(startOfMonth(targetPrev), currentMonth);

    if (!mounted) return null;

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6"
            >
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                        disabled={cantGoBack}
                        className="p-2 rounded-xl hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-base uppercase tracking-widest">
                        {format(calendarMonth, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button
                        onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                        className="p-2 rounded-xl hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
                    >
                        <ChevronLeft size={20} className="rotate-180" />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekdays.map(wd => (
                        <div key={wd} className="text-[10px] font-bold uppercase text-muted-foreground/40 text-center py-1">
                            {wd}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={format(calendarMonth, 'yyyy-MM')}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="grid grid-cols-7 gap-1"
                    >
                        {days.map((day, i) => {
                            if (!day) return <div key={`e-${i}`} />;
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const isAvailable = availabilityMap[dateStr] !== false && !overrides.find(o => o.override_date === dateStr)?.is_off_day;
                            const isSelected = selectedDate && isSameDay(selectedDate, day);
                            const isPast = isBefore(day, today) && !isSameDay(day, today);
                            const isDisabled = !isAvailable || isPast;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => { if (!isDisabled) onSelect(day); }}
                                    disabled={isDisabled}
                                    className={cn(
                                        "aspect-square rounded-xl text-sm font-bold transition-all flex flex-col items-center justify-center",
                                        isSelected
                                            ? "bg-primary text-white shadow-lg shadow-primary/30 scale-105"
                                            : isDisabled
                                                ? "text-muted-foreground/30 bg-muted/20 cursor-not-allowed"
                                                : "hover:bg-primary/10 hover:text-primary text-foreground"
                                    )}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </motion.div>
        </motion.div>,
        document.body
    );
}
