import { useState, useMemo } from 'react';
import { Playfair_Display } from 'next/font/google';
import { Mail, Phone, Calendar as CalendarIcon, CheckCircle, XCircle, Search, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ClientsTabProps {
    appointments: any[];
}

export default function ClientsTab({ appointments }: ClientsTabProps) {
    const [searchTerm, setSearchTerm] = useState('');

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
                    servicesString: new Set<string>()
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
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
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
                                className="glass-card p-6 flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase">
                                            {client.name.charAt(0)}
                                        </div>
                                        {client.cancelled > 0 && (
                                            <div className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase rounded-full tracking-wider flex items-center gap-1">
                                                <XCircle size={12} /> {client.cancelled} Canceladas
                                            </div>
                                        )}
                                    </div>

                                    <h3 className="font-bold text-lg">{client.name}</h3>

                                    <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                                        {client.email !== 'Sin email' && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-primary" />
                                                <span className="truncate">{client.email}</span>
                                            </div>
                                        )}
                                        {client.phone !== 'Sin teléfono' && (
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} className="text-primary" />
                                                <span>{client.phone}</span>
                                            </div>
                                        )}
                                        {client.lastVisit && (
                                            <div className="flex items-center gap-2">
                                                <CalendarIcon size={14} className="text-primary" />
                                                <span>Última visita: {client.lastVisit.toLocaleDateString('es-MX')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-border/50">
                                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                                        <div className="flex flex-col items-center">
                                            <span className="text-muted-foreground mb-1">Total</span>
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
                                    {client.services && (
                                        <p className="mt-4 text-[10px] text-muted-foreground uppercase opacity-70 tracking-widest text-center truncate">
                                            {client.services}
                                        </p>
                                    )}
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
        </motion.div>
    );
}
