'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, User, Crown, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { playfair } from '@/lib/fonts';

// Views
import AppointmentsView from './AppointmentsView';
import SettingsView from './SettingsView';
import LoyaltyView from './LoyaltyView';

type TabType = 'appointments' | 'settings' | 'loyalty';

export default function ClientProfile({ userEmail }: { userEmail: string }) {
    const [activeTab, setActiveTab] = useState<TabType>('appointments');

    const tabs: { id: TabType; label: string; icon: React.FC<any> }[] = [
        { id: 'appointments', label: 'Mis Citas', icon: CalendarIcon },
        { id: 'settings', label: 'Mis Datos', icon: User },
        { id: 'loyalty', label: 'Siren Club', icon: Crown },
    ];

    const getTabTitle = () => {
        switch (activeTab) {
            case 'appointments': return 'Historial';
            case 'settings': return 'Perfil';
            case 'loyalty': return 'Lealtad';
            default: return '';
        }
    };

    const renderActiveView = () => {
        switch (activeTab) {
            case 'appointments': return <AppointmentsView userEmail={userEmail} />;
            case 'settings': return <SettingsView userEmail={userEmail} />;
            case 'loyalty': return <LoyaltyView />;
            default: return null;
        }
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 md:gap-12">
            
            {/* Sidebar Desktop / Navbar Mobile */}
            <aside className="w-full md:w-64 flex-shrink-0">
                <div className="md:sticky md:top-32 space-y-6">

                    <div className="hidden md:block">
                        <h2 className={`${playfair.className} text-4xl text-foreground mb-1`}>Mi <span className="text-primary italic">Cuenta</span></h2>
                        <p className="text-muted-foreground text-sm">Gestiona tus preferencias.</p>
                    </div>

                    <nav className="flex md:flex-col overflow-x-auto md:overflow-visible gap-2 pb-2 md:pb-0 scrollbar-hide">
                        {tabs.map((tab) => {
                            const active = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 md:px-5 py-3 md:py-4 rounded-2xl whitespace-nowrap transition-all font-bold text-xs md:text-sm text-left relative overflow-hidden",
                                        active ? "text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                    )}
                                >
                                    {active && (
                                        <motion.div 
                                            layoutId="activeTabBg" 
                                            className="absolute inset-0 bg-primary/10 rounded-2xl" 
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                    <Icon size={active ? 18 : 16} className={cn("relative z-10 transition-transform", active && "scale-110")} />
                                    <span className="relative z-10 uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="hidden md:block pt-8 border-t border-border">
                        <Link
                            href="/#reservar"
                            className="w-full flex items-center justify-center gap-2 py-3 px-6 text-xs whitespace-nowrap text-white font-bold uppercase tracking-widest bg-primary rounded-full hover:bg-primary/90 transition-colors shadow-xl shadow-primary/20"
                        >
                            Nueva Reserva <ArrowLeft size={14} className="rotate-180" />
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="md:hidden flex justify-between items-center mb-6">
                    <h2 className={`${playfair.className} text-3xl text-foreground`}>
                        Mi <span className="text-primary italic">{getTabTitle()}</span>
                    </h2>
                    <Link
                        href="/#reservar"
                        className="siren-button flex items-center gap-2 px-4 py-2 text-[10px] whitespace-nowrap !bg-background !text-primary border border-primary hover:!bg-primary/10 shadow-sm rounded-full"
                    >
                        Nueva Cita
                    </Link>
                </div>

                <AnimatePresence mode="wait">
                    {renderActiveView()}
                </AnimatePresence>
            </main>
        </div>
    );
}
