import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ClientProfile from "@/components/client/ClientProfile";
import ProfileNav from "@/components/ProfileNav";

export const dynamic = 'force-dynamic';

export default async function PerfilPage() {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error } = await supabase.auth.getUser();

    if (!user || error) {
        redirect("/");
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            <ProfileNav />

            <main className="flex-1 pt-32 pb-24 px-4 sm:px-8 relative z-10 w-full max-w-6xl mx-auto">
                <ClientProfile userEmail={user.email || ""} />
            </main>
        </div>
    );
}
