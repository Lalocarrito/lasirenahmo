'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, User, Crown, Star, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { playfair } from '@/lib/fonts';

// Views
import AppointmentsView from './AppointmentsView';
import SettingsView from './SettingsView';
import LoyaltyView from './LoyaltyView';
import ClientReviews from './ClientReviews';

type TabType = 'appointments' | 'settings' | 'loyalty' | 'reviews';

export default function ClientProfile({ userEmail }: { userEmail: string }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>('appointments');
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleSignOut = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    const tabs: { id: TabType; label: string; icon: typeof CalendarIcon }[] = [
        { id: 'appointments', label: 'Citas', icon: CalendarIcon },
        { id: 'reviews', label: 'Reseñas', icon: Star },
        { id: 'settings', label: 'Datos', icon: User },
        { id: 'loyalty', label: 'Siren Club', icon: Crown },
    ];

    const getTabTitle = () => {
        switch (activeTab) {
            case 'appointments': return 'Historial';
            case 'reviews': return 'Reseñas';
            case 'settings': return 'Perfil';
            case 'loyalty': return 'Lealtad';
            default: return '';
        }
    };

    const renderActiveView = () => {
        switch (activeTab) {
            case 'appointments': return <AppointmentsView userEmail={userEmail} />;
            case 'reviews': return <ClientReviews />;
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
                        <h2 className={`${playfair.className} text-3xl text-foreground`}>Mi <span className="text-primary italic">Cuenta</span></h2>
                    </div>

                    <nav className="flex md:flex-col gap-1 pb-2 md:pb-0 scrollbar-hide overflow-x-auto md:overflow-visible">
                        {tabs.map((tab) => {
                            const active = activeTab === tab.id;
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-2 px-3 md:px-5 py-2.5 md:py-4 rounded-2xl whitespace-nowrap transition-all font-bold text-xs md:text-sm text-left relative overflow-hidden shrink-0",
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
                                    <Icon size={active ? 18 : 16} className={cn("relative z-10 shrink-0", active && "scale-110")} />
                                    <span className="relative z-10 uppercase tracking-widest">{tab.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="pt-8 border-t border-border">
                        <button
                            onClick={handleSignOut}
                            disabled={isLoggingOut}
                            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-red-500/5 text-red-500 border border-red-500/20 font-bold text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all group"
                        >
                            <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0">
                <div className="md:hidden flex justify-between items-center mb-6">
                    <h2 className={`${playfair.className} text-3xl text-foreground`}>
                        Mi <span className="text-primary italic">{getTabTitle()}</span>
                    </h2>
                </div>

                <AnimatePresence mode="wait">
                    {renderActiveView()}
                </AnimatePresence>
            </main>
        </div>
    );
}
