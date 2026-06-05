'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Playfair_Display } from 'next/font/google';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Settings,
    LogOut,
    Loader2,
    Moon,
    Sun,
    List
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Appointment, Service, ServiceImage, BusinessAvailability, Profile } from '@/types';

import OverviewTab from '@/components/admin/tabs/OverviewTab';
import AppointmentsTab from '@/components/admin/tabs/AppointmentsTab';
import CatalogTab from '@/components/admin/tabs/CatalogTab';
import AvailabilityTab from '@/components/admin/tabs/AvailabilityTab';
import ServiceModal from '@/components/admin/modals/ServiceModal';
import ManageAppointmentModal from '@/components/admin/modals/ManageAppointmentModal';
import ConfirmModal from '@/components/admin/modals/ConfirmModal';
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

interface ServiceFormData {
    name: string;
    price: number;
    description: string;
    duration: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('Overview');
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [serviceImages, setServiceImages] = useState<ServiceImage[]>([]);
    const [managingAppointment, setManagingAppointment] = useState<Appointment | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const queryClient = useQueryClient();

    // Restore activeTab from URL on mount — no hydration mismatch because useState default is 'Overview'
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab && TABS.some(t => t.name === tab)) {
            setActiveTab(tab);
        }
    }, []);

    const handleTabChange = (tabName: string) => {
        setActiveTab(tabName);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tabName);
        window.history.replaceState({}, '', url.toString());
    };

    useEffect(() => {
        setMounted(true);

        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/admin'); return; }

            const { data: profileData, error } = await supabase
                .from('profiles').select('*').eq('id', user.id).single();

            if (error || !profileData || (profileData.role !== 'admin' && profileData.role !== 'staff')) {
                logger.error("Unauthorized access attempt:", error);
                router.replace('/'); return;
            }

            setProfile(profileData as Profile);
            setIsAuthorized(true);
            setIsProfileLoading(false);
        };

        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_OUT') router.replace('/admin');
            if (event === 'SIGNED_IN' && session) checkAuth();
        });

        const channel = supabase.channel('admin-appointments-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' },
                () => queryClient.invalidateQueries({ queryKey: ['appointments'] })
            ).subscribe();

        return () => {
            subscription.unsubscribe();
            supabase.removeChannel(channel);
        };
    }, [queryClient, router]);

    const { data: appointments = [] } = useQuery<Appointment[]>({
        queryKey: ['appointments'],
        queryFn: async () => {
            if (!isAuthorized) return [];
            const { data } = await supabase.from('appointments').select('*, services(*)').order('appointment_date', { ascending: true });
            return (data || []) as Appointment[];
        },
        enabled: !!isAuthorized,
        staleTime: 30000,
    });

    const { data: services = [] } = useQuery<Service[]>({
        queryKey: ['services'],
        queryFn: async () => {
            if (!isAuthorized) return [];
            const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
            return (data || []) as Service[];
        },
        enabled: !!isAuthorized,
        staleTime: 30000,
    });

    const fetchData = () => {
        queryClient.invalidateQueries({ queryKey: ['appointments'] });
        queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
        queryClient.invalidateQueries({ queryKey: ['services'] });
        queryClient.invalidateQueries({ queryKey: ['all-profiles'] });
    };

    useEffect(() => {
        if (!editingService?.id) { setServiceImages([]); return; }
        supabase.from('service_images').select('*').eq('service_id', editingService.id)
            .order('sort_order', { ascending: true })
            .then(({ data }) => setServiceImages((data || []) as ServiceImage[]));
    }, [editingService]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace('/admin');
    };

    const [renameWarning, setRenameWarning] = useState<string | null>(null);
    const [pendingServiceData, setPendingServiceData] = useState<ServiceFormData | null>(null);

    const executeSaveService = async (data: ServiceFormData) => {
        if (!editingService) return;
        setIsLoading(true);
        const serviceData = {
            name: data.name, price: data.price, description: data.description,
            image_url: editingService.image_url, duration: data.duration,
            is_active: editingService.is_active ?? true
        };
        const { error } = editingService.id
            ? await supabase.from('services').update(serviceData).eq('id', editingService.id)
            : await supabase.from('services').insert([serviceData]);
        setIsLoading(false);
        if (!error) { setEditingService(null); setRenameWarning(null); setPendingServiceData(null); fetchData(); }
    };

    const handleSaveService = async (data: ServiceFormData) => {
        if (!editingService) return;
        if (editingService.id && data.name !== editingService.name) {
            const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('service_id', editingService.id);
            if (count && count > 0) { setRenameWarning(`Este servicio tiene ${count} cita(s) asociada(s). Renombrarlo cambiará el nombre en todas ellas.`); setPendingServiceData(data); return; }
        }
        await executeSaveService(data);
    };

    const handleToggleServiceActive = async (service: Service) => {
        const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
        if (error) toast.error('Error');
        else { toast.success(service.is_active ? 'Archivado' : 'Activado'); fetchData(); }
    };

    const handleDeleteService = async (service: Service) => {
        const { count } = await supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('service_id', service.id);
        if (count && count > 0) { toast.error(`No se puede eliminar: tiene ${count} cita(s).`); return; }
        const { error } = await supabase.from('services').delete().eq('id', service.id);
        if (error) toast.error('Error');
        else { toast.success('Eliminado'); fetchData(); }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        if (isLoading) return;
        setIsLoading(true);
        queryClient.setQueryData(['appointments'], (old: Appointment[] | undefined) => {
            if (!old) return old;
            return old.map(apt => apt.id === id ? { ...apt, status } : apt);
        });
        const previous = managingAppointment;
        setManagingAppointment(null);
        const { data, error } = await supabase.from('appointments').update({ status }).eq('id', id).select();
        if (error || !data?.length) {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            setManagingAppointment(previous);
            toast.error('Error al actualizar');
        } else { fetchData(); }
        setIsLoading(false);
    };

    const handleUpdateAvailability = async (id: string, startTime: string, endTime: string) => {
        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return old;
            return old.map(a => a.id === id ? { ...a, start_time: startTime, end_time: endTime } : a);
        });
        const { error } = await supabase.from('business_availability').update({ start_time: startTime, end_time: endTime }).eq('id', id);
        if (error) queryClient.invalidateQueries({ queryKey: ['availability'] });
        else fetchData();
    };

    const handleAddAvailability = async (dayOfWeek: number) => {
        const tempId = `temp-${Date.now()}`;
        const newAvail = { id: tempId, day_of_week: dayOfWeek, start_time: '09:00', end_time: '18:00', is_active: true, staff_id: profile?.id };
        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return [newAvail];
            return [...old, newAvail];
        });
        const { error } = await supabase.from('business_availability').insert([{ day_of_week: dayOfWeek, start_time: '09:00', end_time: '18:00', staff_id: profile?.id }]);
        if (error) queryClient.invalidateQueries({ queryKey: ['availability'] });
        else fetchData();
    };

    const handleDeleteAvailability = async (id: string) => {
        queryClient.setQueryData(['availability'], (old: BusinessAvailability[] | undefined) => {
            if (!old) return old;
            return old.filter(a => a.id !== id);
        });
        const { error } = await supabase.from('business_availability').delete().eq('id', id);
        if (error) queryClient.invalidateQueries({ queryKey: ['availability'] });
        else fetchData();
    };

    const handleUpdateOverride = async (date: string, startTime: string | null, endTime: string | null, isOffDay: boolean) => {
        setIsLoading(true);
        await supabase.from('business_availability_overrides').delete().eq('override_date', date);
        if (isOffDay || (startTime && endTime)) {
            await supabase.from('business_availability_overrides').insert([{ override_date: date, start_time: startTime, end_time: endTime, is_off_day: isOffDay, staff_id: profile?.id }]);
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

    const handleUploadServiceImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingService?.id) return;
        setIsUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `services/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('services').upload(filePath, file);
        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('services').getPublicUrl(filePath);
            const maxOrder = serviceImages.reduce((max, img) => Math.max(max, img.sort_order), -1);
            await supabase.from('service_images').insert([{ service_id: editingService.id, url: publicUrl, sort_order: maxOrder + 1, is_primary: serviceImages.length === 0 }]);
            const { data } = await supabase.from('service_images').select('*').eq('service_id', editingService.id).order('sort_order', { ascending: true });
            setServiceImages((data || []) as ServiceImage[]);
        }
        setIsUploading(false);
    };

    const handleDeleteServiceImage = async (image: ServiceImage) => {
        const fileName = image.url.split('/').pop();
        if (fileName) await supabase.storage.from('services').remove([`services/${fileName}`]);
        await supabase.from('service_images').delete().eq('id', image.id);
        const { data } = await supabase.from('service_images').select('*').eq('service_id', editingService!.id).order('sort_order', { ascending: true });
        setServiceImages((data || []) as ServiceImage[]);
    };

    const handleReorderServiceImage = async (image: ServiceImage, direction: 'up' | 'down') => {
        const sorted = [...serviceImages].sort((a, b) => a.sort_order - b.sort_order);
        const idx = sorted.findIndex(i => i.id === image.id);
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === sorted.length - 1) return;
        const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
        const swapImage = sorted[swapIdx];
        await supabase.from('service_images').update({ sort_order: swapImage.sort_order }).eq('id', image.id);
        await supabase.from('service_images').update({ sort_order: image.sort_order }).eq('id', swapImage.id);
        const { data } = await supabase.from('service_images').select('*').eq('service_id', editingService!.id).order('sort_order', { ascending: true });
        setServiceImages((data || []) as ServiceImage[]);
    };

    const handleSetPrimaryServiceImage = async (image: ServiceImage) => {
        await supabase.from('service_images').update({ is_primary: false }).eq('service_id', image.service_id);
        await supabase.from('service_images').update({ is_primary: true }).eq('id', image.id);
        await supabase.from('services').update({ image_url: image.url }).eq('id', image.service_id);
        const { data } = await supabase.from('service_images').select('*').eq('service_id', editingService!.id).order('sort_order', { ascending: true });
        setServiceImages((data || []) as ServiceImage[]);
    };

    const handleFrequentAppointment = async (appointment: Appointment, days: number) => {
        setIsLoading(true);
        const nextDate = addDays(new Date(appointment.appointment_date + 'T00:00:00'), days);
        const { error } = await supabase.from('appointments').insert([{
            customer_name: appointment.customer_name, customer_phone: appointment.customer_phone,
            user_id: appointment.user_id, service_id: appointment.service_id,
            price_at_booking: appointment.price_at_booking ?? appointment.services?.price,
            appointment_date: format(nextDate, 'yyyy-MM-dd'), appointment_time: appointment.appointment_time,
            status: 'pending'
        }]);
        if (error) { logger.error("Error al reagendar:", error); toast.error("No se pudo reagendar."); }
        else { toast.success("Cita reagendada con éxito"); setManagingAppointment(null); fetchData(); }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-card border-b md:border-r border-border p-6 flex flex-col gap-8 z-50">
                <div className="flex items-center gap-3">
                    <img src="/icon1.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg border border-primary/10 object-cover" />
                    <span className={`${playfair.className} text-xl tracking-tight text-primary`}>La <span className="italic">Sirena</span></span>
                </div>
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
                    {TABS.filter(t => profile?.role === 'staff' ? ['Overview', 'Citas', 'Disponibilidad'].includes(t.name) : true).map((tab) => (
                        <button key={tab.name} onClick={() => handleTabChange(tab.name)}
                            className={cn("flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap",
                                activeTab === tab.name ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
                            )}>
                            <tab.icon size={18} /> {tab.name}
                        </button>
                    ))}
                </nav>
                <div className="mt-auto hidden md:block pt-6 border-t border-border space-y-2">
                    <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-muted-foreground hover:bg-muted/50 transition-all w-full">
                        {mounted && resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        {mounted && resolvedTheme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
                    </button>
                    <button onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-500/10 transition-all w-full">
                        <LogOut size={18} /> Cerrar Sesión
                    </button>
                </div>
            </aside>

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

                <div className="relative">
                    {activeTab === 'Overview' && (
                        <OverviewTab appointments={appointments} setManagingAppointment={setManagingAppointment} setActiveTab={handleTabChange} />
                    )}
                    {activeTab === 'Catálogo' && profile?.role === 'admin' && (
                        <CatalogTab services={services} setEditingService={setEditingService} onToggleActive={handleToggleServiceActive} onDelete={handleDeleteService} />
                    )}
                    {activeTab === 'Citas' && (
                        <AppointmentsTab services={services} setManagingAppointment={setManagingAppointment} handleUpdateStatus={handleUpdateStatus} fetchData={fetchData} />
                    )}
                    {activeTab === 'Clientes' && profile?.role === 'admin' && (
                        <ClientsTab appointments={appointments} />
                    )}
                    {activeTab === 'Disponibilidad' && (
                        <AvailabilityTab profile={profile} />
                    )}
                    {activeTab === 'Equipo' && profile?.role === 'admin' && (
                        <StaffTab />
                    )}
                </div>
            </main>

            <AnimatePresence>
                {editingService && (
                    <ServiceModal service={editingService} setService={setEditingService} serviceImages={serviceImages}
                        onClose={() => setEditingService(null)} onSave={handleSaveService}
                        onUploadImage={handleUploadServiceImage} onDeleteImage={handleDeleteServiceImage}
                        onReorderImage={handleReorderServiceImage} onSetPrimary={handleSetPrimaryServiceImage}
                        isLoading={isLoading} isUploading={isUploading} />
                )}
            </AnimatePresence>
            <AnimatePresence>
                {managingAppointment && (
                    <ManageAppointmentModal appointment={managingAppointment} onClose={() => setManagingAppointment(null)}
                        onUpdateStatus={handleUpdateStatus} onFrequentAppointment={handleFrequentAppointment} isLoading={isLoading} />
                )}
            </AnimatePresence>
            <ConfirmModal isOpen={!!renameWarning} title="Renombrar Servicio" message={renameWarning || ''}
                onConfirm={() => { if (pendingServiceData) executeSaveService(pendingServiceData); }}
                onCancel={() => { setRenameWarning(null); setPendingServiceData(null); }} />
        </div>
    );
}
