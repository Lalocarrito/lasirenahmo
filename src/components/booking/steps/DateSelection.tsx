'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Playfair_Display } from 'next/font/google';
import { ChevronLeft, Clock, CalendarOff } from 'lucide-react';
import { addDays, startOfDay, isSameDay, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { useBooking } from '../BookingContext';

const playfair = Playfair_Display({ subsets: ['latin'] });

export default function DateSelection() {
    const {
        selectedDate, setSelectedDate,
        selectedTime, setSelectedTime,
        selectedStaff,
        user, setStep, prevStep
    } = useBooking();

    const [businessAvailability, setBusinessAvailability] = useState<any[]>([]);
    const [overrides, setOverrides] = useState<any[]>([]);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    useEffect(() => {
        const fetchAvailability = async () => {
            let availQuery = supabase.from('business_availability').select('*');
            let overrideQuery = supabase.from('business_availability_overrides').select('*');

            if (selectedStaff) {
                availQuery = availQuery.eq('staff_id', selectedStaff.id);
                overrideQuery = overrideQuery.eq('staff_id', selectedStaff.id);
            }

            const [availRes, overridesRes] = await Promise.all([
                availQuery,
                overrideQuery
            ]);
            
            // If they have no specific schedules configured, maybe they inherit global?
            // For now let's strict to their schedule.
            setBusinessAvailability(availRes.data || []);
            setOverrides(overridesRes.data || []);
        };
        fetchAvailability();
    }, [selectedStaff]);

    useEffect(() => {
        if (!selectedDate || businessAvailability.length === 0) {
            setAvailableSlots([]);
            return;
        }

        const calculateSlots = async () => {
            const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

            // 1. Fetch existing appointments for this date and staff
            let apptQuery = supabase
                .from('appointments')
                .select('appointment_time')
                .eq('appointment_date', dateStr)
                .neq('status', 'cancelled');

            if (selectedStaff) {
                apptQuery = apptQuery.eq('staff_id', selectedStaff.id);
            }

            const { data: existingAppts } = await apptQuery;

            const bookedTimes = (existingAppts || []).map(a => a.appointment_time);

            const override = overrides.find(o => o.override_date === dateStr);
            let dayConfigs = [];

            if (override) {
                if (override.is_off_day) {
                    setAvailableSlots([]);
                    return;
                }
                if (override.start_time && override.end_time) {
                    dayConfigs = [{ start_time: override.start_time, end_time: override.end_time }];
                } else {
                    dayConfigs = businessAvailability.filter(a => a.day_of_week === selectedDate.getDay());
                }
            } else {
                dayConfigs = businessAvailability.filter(a => a.day_of_week === selectedDate.getDay());
            }

            if (dayConfigs.length === 0) {
                setAvailableSlots([]);
                return;
            }

            const allSlots: string[] = [];
            dayConfigs.sort((a, b) => a.start_time.localeCompare(b.start_time));

            dayConfigs.forEach(config => {
                const [startH, startM] = config.start_time.split(':').map(Number);
                const [endH, endM] = config.end_time.split(':').map(Number);

                let currentH = startH;
                let currentM = startM;

                while (currentH < endH || (currentH === endH && currentM < endM)) {
                    const period = currentH >= 12 ? 'PM' : 'AM';
                    const displayH = currentH > 12 ? currentH - 12 : (currentH === 0 ? 12 : currentH);
                    const slot = `${String(displayH).padStart(2, '0')}:${String(currentM).padStart(2, '0')} ${period}`;

                    // Only add the slot if it's not already booked
                    if (!allSlots.includes(slot) && !bookedTimes.includes(slot)) {
                        allSlots.push(slot);
                    }

                    currentM += 60;
                    if (currentM >= 60) {
                        currentM = 0;
                        currentH += 1;
                    }
                }
            });

            setAvailableSlots(allSlots);
        };

        calculateSlots();
    }, [selectedDate, businessAvailability, overrides]);

    useEffect(() => {
        if (selectedDate) {
            setTimeout(() => {
                const el = document.getElementById('time-slots-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
        }
    }, [selectedDate]);

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

            <div className="flex flex-col gap-12">
                <div className="glass-card !p-8 shadow-2xl shadow-primary/5">
                    <DayCarousel selectedDate={selectedDate} onSelect={(d) => setSelectedDate(d)} overrides={overrides} />
                </div>

                {selectedDate && (
                    <motion.div 
                        id="time-slots-container"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        <div className="space-y-1">
                            <h3 className="text-xs uppercase font-bold tracking-[0.2em] text-muted-foreground border-l-4 border-primary pl-4 py-1">Horarios Sugeridos</h3>
                            <p className="text-[10px] font-bold text-primary ml-5 uppercase">
                                {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                            </p>
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

function DayCarousel({ selectedDate, onSelect, overrides }: { selectedDate: Date | null, onSelect: (d: Date) => void, overrides: any[] }) {
    const today = startOfDay(new Date());
    
    // Generate next 30 days
    const days = Array.from({ length: 30 }, (_, i) => addDays(today, i));

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end mb-4">
                <h3 className={`${playfair.className} capitalize font-bold text-2xl`}>Fechas Disponibles</h3>
                <button 
                  onClick={() => onSelect(today)} 
                  className="text-xs font-bold text-primary hover:bg-primary/10 px-3 py-1 rounded-full transition-colors"
                >
                  Hoy
                </button>
            </div>
            
            <div className="-mx-2 px-2 flex gap-3 overflow-x-auto pb-4 pt-2 snap-x scroll-smooth custom-scrollbar no-scrollbar scroll-pl-2">
                {days.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const override = overrides.find(o => o.override_date === dateStr);
                    const isOffDay = override?.is_off_day;
                    
                    const isSelected = selectedDate ? isSameDay(selectedDate, day) : false;
                    const isToday = isSameDay(today, day);
                    const isDisabled = isOffDay;
                    
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
                                        ? "opacity-30 bg-muted/5 cursor-not-allowed" 
                                        : "bg-white dark:bg-slate-800 border border-border/50 hover:border-primary/50 text-foreground hover:text-primary"),
                                isToday && !isSelected && "border-primary/50 text-primary bg-primary/5"
                            )}
                        >
                            <span className={cn("text-[10px] uppercase font-bold tracking-widest", isSelected ? "text-white/80" : "text-muted-foreground/60")}>
                                {day.toLocaleDateString('es-MX', { weekday: 'short' }).substring(0, 3)}
                            </span>
                            <span className="text-xl font-bold mt-0.5">{day.getDate()}</span>
                            
                            {isSelected && <motion.div layoutId="activeDay" className="absolute -bottom-1.5 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />}
                            {!isSelected && isOffDay && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-400 rounded-full" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
