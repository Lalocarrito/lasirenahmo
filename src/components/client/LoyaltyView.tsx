import { Crown, Star, Gift, Sparkles, Loader2 } from 'lucide-react';
import { playfair } from '@/lib/fonts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function LoyaltyView() {
    const { data: profile, isLoading } = useQuery({
        queryKey: ['user-loyalty'],
        queryFn: async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;
            const { data } = await supabase.from('profiles').select('loyalty_points').eq('id', user.id).single();
            return data;
        }
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Consultando tus beneficios...</p>
            </div>
        );
    }

    const points = profile?.loyalty_points || 0;
    const level = points >= 1000 ? 'Diamante' : points >= 500 ? 'Platino' : points >= 100 ? 'Oro' : 'Sirena';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="w-full space-y-6"
        >
            {/* Loyalty Hero */}
            <div className="glass-card relative overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-[#D4AF37] text-white border-0 shadow-xl shadow-primary/20 p-8 md:p-10 rounded-3xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2 opacity-90">
                            <Crown size={16} className="text-[#FFE5B4]" />
                            <span className="text-xs font-bold uppercase tracking-widest text-[#FFE5B4]">Siren Club</span>
                        </div>
                        <h3 className={`${playfair.className} text-4xl md:text-5xl mb-2`}>Nivel {level}</h3>
                        <p className="text-sm opacity-80 max-w-sm">
                            Gracias por tu lealtad. Estás acumulando puntos por cada peso invertido en tu belleza.
                        </p>
                    </div>
                    
                    <div className="bg-white/10 backdrop-blur-md rounded-full p-8 md:p-10 border border-white/20 shadow-inner flex flex-col items-center justify-center min-w-[180px]">
                        <span className={`${playfair.className} text-5xl md:text-6xl text-[#FFE5B4] flex items-center gap-2`}>
                            {points} <Star size={24} className="fill-[#FFE5B4]" />
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-widest mt-2 opacity-80">Puntos Sirena</span>
                    </div>
                </div>
            </div>

            {/* Coming Soon Message */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-card p-6 rounded-2xl flex items-start gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Gift size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-foreground mb-1">Recompensas (Próximamente)</h4>
                        <p className="text-xs text-muted-foreground">Podrás canjear tus puntos por servicios gratis, descuentos y productos exclusivos.</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-2xl flex items-start gap-4 bg-muted/10">
                    <div className="p-3 rounded-full bg-primary/5 text-muted-foreground">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-muted-foreground mb-1">Días Especiales</h4>
                        <p className="text-xs text-muted-foreground">Puntos dobles en tu semana de cumpleaños y en nuestras "Siren Weeks" anuales.</p>
                    </div>
                </div>
            </div>
            
            <div className="text-center mt-12 opacity-50">
                <p className="text-xs italic text-muted-foreground">* Esta característica estará disponible muy pronto para todas nuestras clientas registradas.</p>
            </div>
        </motion.div>
    );
}
