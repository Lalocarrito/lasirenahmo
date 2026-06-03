'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { Clock, CalendarOff, ChevronLeft } from 'lucide-react';
import { addDays, startOfDay, isSameDay, format } from 'date-fns';
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

    // Fetch basic availability and overrides
    useEffect(() => {
        const fetchData = async () => {
            setIsLoadingAvailability(true);
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const thirtyDaysLaterStr = format(addDays(new Date(), 30), 'yyyy-MM-dd');

            let availQuery = supabase.from('business_availability').select('*').eq('is_active', true);
            let overrideQuery = supabase.from('business_availability_overrides').select('*')
                .gte('override_date', todayStr)
                .lte('override_date', thirtyDaysLaterStr);
            let apptQuery = supabase.from('appointments').select('appointment_date, appointment_time')
                .gte('appointment_date', todayStr)
                .lte('appointment_date', thirtyDaysLaterStr)
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

        for (let i = 0; i < 30; i++) {
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
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={prevStep}
                            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Volver a profesional
                        </button>
                        <button
                            onClick={() => setShowAllDays(!showAllDays)}
                            className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest transition-all"
                        >
                            {showAllDays ? 'Mostrar solo disponibles' : 'Ver calendario completo'}
                        </button>
                    </div>
                    <DayCarousel 
                        selectedDate={selectedDate} 
                        onSelect={(d) => setSelectedDate(d)} 
                        overrides={overrides} 
                        availabilityMap={availabilityMap}
                        showAllDays={showAllDays}
                    />
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
            </div>
        </motion.div>
    );
}

function DayCarousel({ selectedDate, onSelect, overrides, availabilityMap, showAllDays }: { 
    selectedDate: Date | null, 
    onSelect: (d: Date) => void, 
    overrides: BusinessAvailabilityOverride[],
    availabilityMap: Record<string, boolean>,
    showAllDays?: boolean
}) {
    const today = startOfDay(new Date());
    
    // Generate next 30 days
    const allDays = Array.from({ length: 30 }, (_, i) => addDays(today, i));
    const days = showAllDays ? allDays : allDays.filter(d => availabilityMap[format(d, 'yyyy-MM-dd')] !== false);

    return (
        <div className="space-y-4">
            <div className="mb-4">
            </div>
            
            <div className="-mx-2 px-2 flex gap-3 overflow-x-auto pb-4 pt-2 snap-x scroll-smooth custom-scrollbar no-scrollbar scroll-pl-2">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isSelected = selectedDate ? isSameDay(selectedDate, day) : false;
                    const isToday = isSameDay(today, day);
                    
                    // A day is disabled if explicitly marked as off_day OR if it has no available slots in the pre-calculated map
                    const isOffDayOverride = overrides.find(o => o.override_date === dateStr)?.is_off_day;
                    const hasNoAvailability = availabilityMap[dateStr] === false;
                    const isDisabled = isOffDayOverride || hasNoAvailability;
                    
                    return (
                        <button
                            key={day.toISOString()}
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
