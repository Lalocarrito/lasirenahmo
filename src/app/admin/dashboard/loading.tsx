import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold animate-pulse">
                    Cargando dashboard...
                </p>
            </div>
        </div>
    );
}
