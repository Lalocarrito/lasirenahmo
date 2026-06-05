import { useState, useMemo } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Phone, Search, Users, Calendar, XCircle } from 'lucide-react';
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
    appointmentsHistory: Appointment[];
}

interface ClientsTabProps {
    appointments: Appointment[];
}

export default function ClientsTab({ appointments }: ClientsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);

    const clients = useMemo(() => {
        const clientsMap = new Map<string, ClientData>();

        const sortedAppointments = [...appointments].sort(
            (a, b) => new Date(b.appointment_date).getTime() - new Date(a.appointment_date).getTime()
        );

        sortedAppointments.forEach(apt => {
            const key = apt.customer_email || apt.customer_phone || apt.customer_name;
            if (!key) return;

            if (!clientsMap.has(key)) {
                clientsMap.set(key, {
                    id: key,
                    name: apt.customer_name || 'Desconocido',
                    email: apt.customer_email || 'Sin email',
                    phone: apt.customer_phone || 'Sin teléfono',
                    totalAppointments: 0,
                    appointmentsHistory: []
                });
            }

            const client = clientsMap.get(key)!;
            client.totalAppointments++;
            client.appointmentsHistory.push(apt);
        });

        return Array.from(clientsMap.values()).sort((a, b) => b.totalAppointments - a.totalAppointments);
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
                    <p className="text-muted-foreground text-sm">Historial de citas por cliente.</p>
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
                    {filteredClients.length > 0 ? filteredClients.map((client, index) => (
                        <motion.div
                            key={client.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => setSelectedClient(client)}
                            className="glass-card p-6 flex flex-col justify-between cursor-pointer hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                        >
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase group-hover:bg-primary group-hover:text-white transition-colors">
                                        {client.name.charAt(0)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold">
                                        <Calendar size={14} className="text-primary" />
                                        {client.totalAppointments} citas
                                    </div>
                                </div>

                                <h3 className="font-bold text-lg leading-tight mb-3">{client.name}</h3>

                                {client.phone !== 'Sin teléfono' && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone size={14} className="text-primary" />
                                        <span className="font-medium text-foreground">{client.phone}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )) : (
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
                                <p className="text-sm text-muted-foreground">{selectedClient.totalAppointments} citas</p>
                                {selectedClient.phone !== 'Sin teléfono' && (
                                    <a href={`tel:${selectedClient.phone}`} className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-primary text-white rounded-full text-sm font-bold shadow-md hover:scale-105 transition-all">
                                        <Phone size={16} /> Llamar {selectedClient.phone}
                                    </a>
                                )}
                            </div>

                            <div className="p-6 space-y-3 flex-1">
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
                                                            apt.status === 'no_show' ? "bg-gray-500/10 text-gray-500" :
                                                                "bg-yellow-500/10 text-yellow-500"
                                            )}>
                                                {apt.status === 'confirmed' ? 'Confirmada' :
                                                    apt.status === 'cancelled' ? 'Cancelada' :
                                                        apt.status === 'completed' ? 'Completada' :
                                                            apt.status === 'no_show' ? 'No Asistió' : 'Pendiente'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
