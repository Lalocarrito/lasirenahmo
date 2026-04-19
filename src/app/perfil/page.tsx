import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ClientProfile from "@/components/client/ClientProfile";
import Link from "next/link";
import { Crown, Home } from "lucide-react";
import { playfair } from "@/lib/fonts";

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
    const supabase = await createSupabaseServerClient();

    // Check user session securely via server request
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (!user || error) {
        // Redirigir al home o abrir modal si se pudiera
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Nav Mínima */}
            <nav className="w-full fixed top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
                <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <img src="/icon1.png" alt="Logo" className="h-8 md:h-9 w-auto rounded-md shadow-sm group-hover:scale-105 transition-transform" />
                    </Link>
                    
                    <Link href="/" className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
                        <Home size={16} /> Volver al Inicio
                    </Link>
                </div>
            </nav>

            <main className="flex-1 pt-32 pb-24 px-4 sm:px-8 relative z-10 w-full max-w-6xl mx-auto">
                <ClientProfile userEmail={user.email || ""} />
            </main>
        </div>
    );
}
