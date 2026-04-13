import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function TermsOfService() {
    return (
        <main className="min-h-screen mesh-gradient py-20 px-4 md:px-8">
            <div className="max-w-3xl mx-auto glass-card p-10 md:p-16 space-y-12">
                <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-xs uppercase tracking-widest mb-8">
                    <ChevronLeft size={16} /> Volver al Inicio
                </Link>

                <div className="space-y-4">
                    <h1 className={`${playfair.className} text-5xl md:text-6xl text-foreground`}>Condiciones del <span className="text-primary italic">Servicio</span></h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold">Última actualización: 13 de abril, 2026</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>1. Aceptación de los Términos</h2>
                        <p>
                            Al acceder y utilizar el sitio web y los servicios de reserva de <strong>La Sirena</strong>, aceptas cumplir con estas Condiciones del Servicio. Si no estás de acuerdo con alguno de estos términos, por favor abstente de utilizar nuestra plataforma.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>2. Servicios y Reservas</h2>
                        <p>
                            La Sirena ofrece servicios de diseño de pestañas y belleza. Las citas están sujetas a disponibilidad y deben ser confirmadas a través de nuestro sistema. Nos reservamos el derecho de modificar los precios o descripciones de los servicios en cualquier momento previa notificación.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>3. Política de Cancelación y Retrasos</h2>
                        <p>Para mantener la calidad de nuestro servicio:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Cancelaciones:</strong> Deben realizarse con al menos 24 horas de antelación.</li>
                            <li><strong>Retrasos:</strong> Si llegas más de 15 minutos tarde, es posible que debamos reasignar tu cita para no afectar a otras clientas.</li>
                            <li><strong>Inasistencias:</strong> Las inasistencias sin previo aviso pueden afectar tu capacidad de realizar futuras reservas.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>4. Uso de la Cuenta</h2>
                        <p>
                            Al registrarte mediante correo electrónico o Google Login, eres responsable de la confidencialidad de tu sesión. La Sirena se reserva el derecho de suspender cuentas que hagan un uso indebido del sistema de reservas (e.g., spam de citas).
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>5. Limitación de Responsabilidad</h2>
                        <p>
                            La Sirena no se hace responsable por daños indirectos derivados del uso de este sitio web. Nos esforzamos por garantizar que la información sea precisa, pero no garantizamos la disponibilidad ininterrumpida del sistema de reservas online.
                        </p>
                    </section>

                    <section className="space-y-4 font-bold text-center pt-8 border-t border-primary/10">
                        <p>Gracias por elegir La Sirena. Estamos comprometidos con realzar tu mirada con profesionalismo y elegancia.</p>
                    </section>
                </div>
            </div>
        </main>
    );
}
