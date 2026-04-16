'use client';

import { motion } from 'framer-motion';
import { useBooking } from '../BookingContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { Loader2, User, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function StaffSelection() {
    const { setSelectedStaff, selectedStaff, setSelectedTime, nextStep, prevStep } = useBooking();

    const { data: staffList = [], isLoading } = useQuery<Profile[]>({
        queryKey: ['staff'],
        queryFn: async () => {
            const { data } = await supabase.from('profiles').select('*').in('role', ['staff', 'admin']);
            return (data || []) as Profile[];
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-primary mb-4" size={32} />
                <p className="text-muted-foreground text-sm tracking-widest uppercase">Cargando equipo...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
        >
            <div className="text-center space-y-2">
                <h2 className={cn("text-4xl text-foreground", playfair.className)}>Elige a tu Profesional</h2>
                <p className="text-muted-foreground">¿Con quién te gustaría agendar tu cita?</p>
            </div>

            {staffList.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                        <User size={36} className="text-primary/30" />
                    </div>
                    <h3 className={cn("text-2xl text-foreground", playfair.className)}>Sin profesionales</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">No hay profesionales registrados en este momento. Intenta de nuevo más tarde.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staffList.map((staff) => (
                        <button
                            key={staff.id}
                            onClick={() => {
                                setSelectedStaff(staff);
                                setSelectedTime('');
                                nextStep();
                            }}
                            className={cn(
                                "flex items-center p-6 rounded-3xl border-2 transition-all duration-300 text-left gap-4",
                                selectedStaff?.id === staff.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/50 hover:bg-muted/50 bg-card"
                            )}
                        >
                            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0 overflow-hidden border border-primary/20">
                                {staff.avatar_url ? (
                                    <img src={staff.avatar_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>
                            <div>
                                <h3 className={cn("text-xl text-foreground", playfair.className)}>{staff.full_name || 'Lashista'}</h3>
                                <p className="text-muted-foreground text-sm mt-1">{staff.email}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="pt-8 flex justify-center">
                <button
                    onClick={prevStep}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all duration-300 group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver a servicios
                </button>
            </div>
        </motion.div>
    );
}
