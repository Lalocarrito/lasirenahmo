import { useState, useMemo } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Phone, Calendar as CalendarIcon, CheckCircle, XCircle, Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Appointment } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ClientData {
    id: string;
    name: string;
    email: string;
    phone: string;
    totalAppointments: number;
    completed: number;
    cancelled: number;
    pending: number;
    lastVisit: Date | null;
    servicesString: Set<string>;
    services: string;
    appointmentsHistory: Appointment[];
    reliabilityScore?: number;
}

interface ClientsTabProps {
    appointments: Appointment[];
}

export default function ClientsTab({ appointments }: ClientsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

    const clients = useMemo(() => {
        const clientsMap = new Map();

        // Sort appointments from old to new so lastVisit always gets updated to the latest
        const sortedAppointments = [...appointments].sort(
            (a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
        );

        sortedAppointments.forEach(apt => {
            const key = apt.customer_email || apt.customer_phone || apt.customer_name;
            if (!key) return; // Skip if completely anonymous somehow

            if (!clientsMap.has(key)) {
                clientsMap.set(key, {
                    id: key,
                    name: apt.customer_name || 'Desconocido',
                    email: apt.customer_email || 'Sin email',
                    phone: apt.customer_phone || 'Sin teléfono',
                    totalAppointments: 0,
                    completed: 0,
                    cancelled: 0,
                    pending: 0,
                    lastVisit: null,
                    servicesString: new Set<string>(),
                    appointmentsHistory: []
                });
            }

            const client = clientsMap.get(key);
            client.totalAppointments++;

            if (apt.status === 'completed') client.completed++;
            else if (apt.status === 'cancelled') client.cancelled++;
            else client.pending++;

            const aptDate = new Date(apt.appointment_date + 'T' + apt.appointment_time);
            if (!client.lastVisit || aptDate > client.lastVisit) {
                client.lastVisit = aptDate;
            }

            if (apt.services?.name) {
                client.servicesString.add(apt.services.name);
            }

            // Unshift so newer are first
            client.appointmentsHistory.unshift(apt);
        });

        const rawClients = Array.from(clientsMap.values()).map(c => ({
            ...c,
            services: Array.from(c.servicesString).join(', ')
        }));

        // Sort by total appointments descending implicitly
        rawClients.sort((a, b) => b.totalAppointments - a.totalAppointments);

        return rawClients;
    }, [appointments]);

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        c.phone.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 relative"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className={`${playfair.className} text-3xl mb-2`}>Directorio de Clientes</h2>
                    <p className="text-muted-foreground text-sm">Gestiona y analiza el historial de tus clientes.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, correo o teléfono..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 pr-4 py-3 bg-card border border-border rounded-2xl w-full md:w-80 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredClients.length > 0 ? filteredClients.map((client, index) => {
                        const reliabilityScore = client.totalAppointments > 0
                            ? Math.round((client.completed / (client.totalAppointments - client.pending)) * 100) || 100
                            : 100;

                        return (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => setSelectedClient({ ...client, reliabilityScore })}
                                className="glass-card p-6 flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                                            {client.name.charAt(0)}
                                        </div>
                                        {client.cancelled > 0 && (
                                            <div className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded-full tracking-wider flex items-center gap-1">
                                                <XCircle size={12} /> {client.cancelled} Canceladas
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-lg leading-tight mb-3">{client.name}</h3>

                                    <div className="space-y-2 mt-2 text-sm text-muted-foreground">
                                        {client.phone !== 'Sin teléfono' && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-primary" />
                                                <span className="font-medium text-foreground">{client.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="flex flex-col items-center">
                                            <span className="text-muted-foreground mb-1">Citas</span>
                                            <span className="font-bold text-lg">{client.totalAppointments}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-green-500">
                                            <span className="mb-1 opacity-80">Asistidas</span>
                                            <span className="font-bold text-lg flex gap-1"><CheckCircle size={14} className="mt-1" />{client.completed}</span>
                                        </div>
                                        <div className="flex flex-col items-center text-primary">
                                            <span className="mb-1 opacity-80">Fiabilidad</span>
                                            <span className="font-bold text-lg">{client.cancelled > 0 ? `${reliabilityScore}%` : '100%'}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    }) : (
                        <div className="col-span-full py-12 text-center">
                            <Users size={48} className="mx-auto text-muted-foreground opacity-20 mb-4" />
                            <h3 className="text-xl font-medium text-muted-foreground">No se encontraron clientes.</h3>
                            <p className="opacity-70 text-sm mt-2">Intenta buscar con otros términos.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Client Detail Slide-over Panel */}
            <AnimatePresence>
                {selectedClient && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedClient(null)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 bottom-0 w-full md:w-[400px] bg-background border-l border-border shadow-2xl z-[70] flex flex-col overflow-y-auto custom-scrollbar"
                        >
                            <div className="bg-primary/5 p-6 border-b border-border flex flex-col items-center text-center relative">
                                <button className="absolute top-4 right-4 p-2 bg-background hover:bg-muted text-foreground rounded-full transition-colors" onClick={() => setSelectedClient(null)}>
                                    <XCircle size={20} className="text-muted-foreground" />
                                </button>
                                
                                <div className="w-24 h-24 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl uppercase mb-4 shadow-inner">
                                    {selectedClient.name.charAt(0)}
                                </div>
                                <h2 className={`${playfair.className} text-2xl mb-1`}>{selectedClient.name}</h2>
                                {selectedClient.phone !== 'Sin teléfono' && (
                                    <a href={`tel:${selectedClient.phone}`} className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-md hover:scale-105 transition-all">
                                        <Phone size={16} /> Llamar {selectedClient.phone}
                                    </a>
                                )}
                            </div>

                            <div className="p-6 space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Fiabilidad</p>
                                        <p className={cn("text-2xl font-black", (selectedClient.reliabilityScore ?? 100) >= 80 ? "text-green-500" : (selectedClient.reliabilityScore ?? 100) >= 50 ? "text-yellow-500" : "text-red-500")}>
                                            {selectedClient.reliabilityScore ?? 100}%
                                        </p>
                                    </div>
                                    <div className="bg-muted/30 border border-border p-4 rounded-2xl">
                                        <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest mb-1">Última Visita</p>
                                        <p className="text-sm font-bold flex items-center gap-1">
                                            <CalendarIcon size={14} className="text-primary"/> 
                                            {selectedClient.lastVisit ? selectedClient.lastVisit.toLocaleDateString('es-MX') : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest border-b border-border pb-2">Historial de Citas</p>
                                    <div className="space-y-3">
                                        {selectedClient.appointmentsHistory.map((apt) => (
                                            <div key={apt.id} className="bg-card border border-border p-3 rounded-xl flex justify-between items-center relative overflow-hidden">
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/20" />
                                                <div className="pl-2">
                                                    <p className="font-bold text-sm">{apt.services?.name || 'Servicio'}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(apt.appointment_date).toLocaleDateString('es-MX')} • {apt.appointment_time}</p>
                                                </div>
                                                <span className={cn(
                                                    "px-2 py-1 rounded-md text-[9px] uppercase font-bold",
                                                    apt.status === 'confirmed' ? "bg-green-500/10 text-green-500" :
                                                        apt.status === 'cancelled' ? "bg-red-500/10 text-red-500" :
                                                            apt.status === 'completed' ? "bg-blue-500/10 text-blue-500" :
                                                                "bg-yellow-500/10 text-yellow-500"
                                                )}>
                                                    {apt.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
