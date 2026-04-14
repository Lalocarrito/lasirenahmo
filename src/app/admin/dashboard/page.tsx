'use client';

import { useState, useEffect } from 'react';
import { Playfair_Display } from 'next/font/google';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    Plus,
    Loader2,
    Moon,
    Sun,
    List
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Appointment, Service, BusinessAvailability, BusinessAvailabilityOverride, Profile } from '@/types';

import OverviewTab from '@/components/admin/tabs/OverviewTab';
import AppointmentsTab from '@/components/admin/tabs/AppointmentsTab';
import CatalogTab from '@/components/admin/tabs/CatalogTab';
import AvailabilityTab from '@/components/admin/tabs/AvailabilityTab';
import ServiceModal from '@/components/admin/modals/ServiceModal';
import ManageAppointmentModal from '@/components/admin/modals/ManageAppointmentModal';
import ClientsTab from '@/components/admin/tabs/ClientsTab';
import StaffTab from '@/components/admin/tabs/StaffTab';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

const TABS = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Citas', icon: Calendar },
    { name: 'Clientes', icon: Users },
    { name: 'Catálogo', icon: List },
    { name: 'Equipo', icon: Users },
    { name: 'Disponibilidad', icon: Settings },
];

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('Overview');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [managingAppointment, setManagingAppointment] = useState<Appointment | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const queryClient = useQueryClient();

    const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
        queryKey: ['appointments'],
        queryFn: async () => {
            if (!isAuthorized) return [];
            const { data } = await supabase.from('appointments').select('*, services(*)').order('appointment_date', { ascending: true });
            return (data || []) as Appointment[];
        },
        enabled: !!isAuthorized
    });

    const { data: services = [], isLoading: isLoadingServices } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => {
             if (!isAuthorized) return [];
             const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
             return (data || []) as Service[];
        },
        enabled: !!isAuthorized
    });

    const isDataLoading = isLoadingAppointments || isLoadingServices || isProfileLoading;

    const fetchData = async () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
    };

    useEffect(() => {
        setMounted(true);
        
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                window.location.href = '/admin';
                return;
            }

            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            if (error || !profileData || (profileData.role !== 'admin' && profileData.role !== 'staff')) {
                console.error("Unauthorized access attempt:", error);
                window.location.href = '/';
                return;
            }

            setProfile(profileData as Profile);
            setIsAuthorized(true);
            setIsProfileLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') window.location.href = '/admin';
            if (event === 'SIGNED_IN' && session) {
                checkAuth();
            }
        });

        // Setup real-time subscription for appointments
        const channel = supabase.channel('admin-appointments-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'appointments' },
                () => {
                    queryClient.invalidateQueries({ queryKey: ['appointments'] });
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [queryClient]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/admin';
    };

    const handleSaveService = async (data: any) => {
        if (!editingService) return;
        setIsLoading(true);

        const serviceData = {
            name: data.name,
            price: data.price,
            description: data.description,
            image_url: editingService.image_url,
            duration: data.duration
        };

        const { error } = editingService.id
            ? await supabase.from('services').update(serviceData).eq('id', editingService.id)
            : await supabase.from('services').insert([serviceData]);

        setIsLoading(false);
        if (!error) {
            setEditingService(null);
            fetchData(); // Background refresh
        }
    };


    const handleUpdateStatus = async (id: string, status: string) => {
        // Guard against double clicks
        if (isLoading) return;

        setIsLoading(true);

        // Optimistic update
        queryClient.setQueryData(['appointments'], (old: Appointment[] | undefined) => {
            if (!old) return old;
            return old.map(apt => apt.id === id ? { ...apt, status } : apt);
        });

        // Optimistically close modal if open
        const previousManagingAppointment = managingAppointment;
        setManagingAppointment(null);

        const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select();

        if (error) {
            // Revert on error manually (by invalidating to refetch true state)
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setManagingAppointment(previousManagingAppointment);
            console.error("DEBUG - Error updating appointment status:", error);
            toast.error("Hubo un error al actualizar el estado de la cita. Las credenciales o los permisos pueden estar fallando.");
        } else if (!data || data.length === 0) {
            // RLS blocked it
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setManagingAppointment(previousManagingAppointment);
            toast.error("⚠️ BLOQUEO DE SEGURIDAD: Supabase denegó tu cambio porque faltan permisos de UPDATE.");
        } else {
            // Re-fetch to guarantee sync
            fetchData();
        }
        setIsLoading(false);
    };

    const handleUpdateAvailability = async (id: string, startTime: string, endTime: string) => {
        // Optimistic 
        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return old;
            return old.map(a => a.id === id ? { ...a, start_time: startTime, end_time: endTime } : a);
        });

        const { error } = await supabase.from('business_availability')
            .update({ start_time: startTime, end_time: endTime })
            .eq('id', id);

        if (error) {
            queryClient.invalidateQueries({ queryKey: ['availability'] });
            console.error("DEBUG - Error updating availability:", error);
        } else {
            fetchData();
        }
    };

    const handleAddAvailability = async (dayOfWeek: number) => {
        // Optimistic insert
        const tempId = `temp-${Date.now()}`;
        const newAvail = { id: tempId, day_of_week: dayOfWeek, start_time: '09:00', end_time: '18:00', is_active: true, staff_id: profile?.id };

        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return [newAvail];
            return [...old, newAvail];
        });

        const { error } = await supabase.from('business_availability')
            .insert([{ day_of_week: dayOfWeek, start_time: '09:00', end_time: '18:00', staff_id: profile?.id }]);

        if (error) {
            queryClient.invalidateQueries({ queryKey: ['availability'] });
            console.error("DEBUG - Error adding availability:", error);
        } else {
            fetchData();
        }
    };

    const handleDeleteAvailability = async (id: string) => {
        // Optimistic delete
        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return old;
            return old.filter(a => a.id !== id);
        });

        const { error } = await supabase.from('business_availability').delete().eq('id', id);

        if (error) {
            queryClient.invalidateQueries({ queryKey: ['availability'] });
            console.error("DEBUG - Error deleting availability:", error);
        } else {
            fetchData();
        }
    };

    const handleUpdateOverride = async (date: string, startTime: string | null, endTime: string | null, isOffDay: boolean) => {
        setIsLoading(true);
        // Delete if exists to recreate
        await supabase.from('business_availability_overrides').delete().eq('override_date', date);

        if (isOffDay || (startTime && endTime)) {
            const { error } = await supabase.from('business_availability_overrides').insert([{
                override_date: date,
                start_time: startTime,
                end_time: endTime,
                is_off_day: isOffDay,
                staff_id: profile?.id
            }]);

            if (error) {
                console.error("DEBUG - Error updating override:", error);
                toast.error("Error al actualizar la fecha específica.");
            }
        }

        await fetchData();
        setIsLoading(false);
    };

    const handleDeleteOverride = async (date: string) => {
        setIsLoading(true);
        await supabase.from('business_availability_overrides').delete().eq('override_date', date);
        await fetchData();
        setIsLoading(false);
    };

    const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, type: 'service') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${type}s/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('images')
            .upload(filePath, file);

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
                .from('images')
                .getPublicUrl(filePath);

            if (type === 'service') setEditingService({ ...editingService, image_url: publicUrl } as Service);
        }
        setIsUploading(false);
    };

    const handleFrequentAppointment = async (appointment: any, days: number) => {
        setIsLoading(true);
        const nextDate = addDays(new Date(appointment.appointment_date + 'T00:00:00'), days);

        const { error } = await supabase.from('appointments').insert([{
            customer_name: appointment.customer_name,
            customer_phone: appointment.customer_phone,
            service_id: appointment.service_id,
            appointment_date: format(nextDate, 'yyyy-MM-dd'),
            appointment_time: appointment.appointment_time,
            status: 'pending' // Re-agendado queda pendiente
        }]);

        if (error) {
            console.error("DEBUG - Error al reagendar:", error);
            toast.error("No se pudo reagendar. Verifica la disponibilidad o conexión con Supabase.");
        } else {
            toast.success("Cita reagendada con éxito");
            setManagingAppointment(null);
            fetchData();
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-card border-b md:border-r border-border p-6 flex flex-col gap-8 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                        <LayoutDashboard size={20} />
                    </div>
                    <span className={`${playfair.className} text-xl tracking-tight`}>Sirena Admin</span>
                </div>

                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                    {TABS.filter(t => profile?.role === 'staff' ? ['Overview', 'Citas', 'Disponibilidad'].includes(t.name) : true).map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                                activeTab === tab.name
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50"
                            )}
                        >
                            <tab.icon size={18} />
                            {tab.name}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto hidden md:block pt-6 border-t border-border space-y-2">
                    <button
                        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all w-full"
                    >
                        {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {mounted && resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all w-full"
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-10 space-y-10 md:max-h-screen md:overflow-y-auto custom-scrollbar">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className={`${playfair.className} text-4xl md:text-5xl mb-2`}>
                            {activeTab === 'Overview' ? 'Agenda de Hoy' : activeTab}
                        </h1>
                        <p className="text-muted-foreground italic">
                            {activeTab === 'Citas' && 'Gestiona todas las reservas de tus clientes.'}
                            {activeTab === 'Catálogo' && 'Personaliza tus servicios y precios.'}
                        </p>
                    </div>

                    {activeTab === 'Overview' && (
                        <div className="flex bg-card p-1 rounded-2xl border border-border w-fit">
                            <div className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold uppercase tracking-wider">
                                {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Dynamic Content */}
                <div className="relative">
                    {(isLoading || isDataLoading) && !editingService && !managingAppointment && (
                        <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-3xl">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    )}

                    {activeTab === 'Overview' && (
                        <OverviewTab
                            appointments={appointments}
                            setManagingAppointment={setManagingAppointment}
                            setActiveTab={setActiveTab}
                        />
                    )}

                    {activeTab === 'Catálogo' && profile?.role === 'admin' && (
                        <CatalogTab
                            services={services}
                            setEditingService={setEditingService}
                        />
                    )}

                    {activeTab === 'Citas' && (
                        <AppointmentsTab
                            appointments={appointments}
                            services={services}
                            setManagingAppointment={setManagingAppointment}
                            handleUpdateStatus={handleUpdateStatus}
                            fetchData={fetchData}
                        />
                    )}

                    {activeTab === 'Clientes' && profile?.role === 'admin' && (
                        <ClientsTab
                            appointments={appointments}
                        />
                    )}

                    {activeTab === 'Disponibilidad' && (
                        <AvailabilityTab
                            profile={profile}
                        />
                    )}

                    {activeTab === 'Equipo' && profile?.role === 'admin' && (
                        <StaffTab />
                    )}

                </div>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {editingService && (
                    <ServiceModal
                        service={editingService}
                        setService={setEditingService}
                        onClose={() => setEditingService(null)}
                        onSave={handleSaveService}
                        onUploadImage={(e) => handleUploadImage(e, 'service')}
                        isLoading={isLoading}
                        isUploading={isUploading}
                    />
                )}
            </AnimatePresence>


            <AnimatePresence>
                {managingAppointment && (
                    <ManageAppointmentModal
                        appointment={managingAppointment}
                        onClose={() => setManagingAppointment(null)}
                        onUpdateStatus={handleUpdateStatus}
                        onFrequentAppointment={handleFrequentAppointment}
                        isLoading={isLoading}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
