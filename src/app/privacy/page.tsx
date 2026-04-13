import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function PrivacyPolicy() {
    return (
        <main className="min-h-screen mesh-gradient py-20 px-4 md:px-8">
            <div className="max-w-3xl mx-auto glass-card p-10 md:p-16 space-y-12">
                <Link href="/" className="inline-flex items-center gap-2 text-primary hover:underline font-bold text-xs uppercase tracking-widest mb-8">
                    <ChevronLeft size={16} /> Volver al Inicio
                </Link>

                <div className="space-y-4">
                    <h1 className={`${playfair.className} text-5xl md:text-6xl text-foreground`}>Política de <span className="text-primary italic">Privacidad</span></h1>
                    <p className="text-muted-foreground text-sm uppercase tracking-[0.2em] font-bold">Última actualización: 13 de abril, 2026</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-foreground/80 leading-relaxed">
                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>1. Introducción</h2>
                        <p>
                            En <strong>La Sirena</strong>, valoramos tu privacidad y nos comprometemos a proteger tus datos personales. Esta política describe cómo recopilamos, usamos y resguardamos tu información cuando utilizas nuestros servicios de reserva y navegación.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>2. Información que Recopilamos</h2>
                        <p>Recopilamos información necesaria para la prestación de nuestros servicios de belleza, incluyendo:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Datos de Identificación:</strong> Nombre completo.</li>
                            <li><strong>Datos de Contacto:</strong> Correo electrónico y número de teléfono.</li>
                            <li><strong>Información de Reserva:</strong> Tipo de servicio, fecha, hora y notas adicionales.</li>
                            <li><strong>Datos de Autenticación:</strong> Si utilizas Google Login, recibimos tu nombre y correo electrónico vinculados a tu cuenta de Google.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>3. Uso de la Información</h2>
                        <p>Utilizamos tus datos exclusivamente para:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Gestionar y confirmar tus citas de belleza.</li>
                            <li>Enviarte recordatorios y notificaciones sobre tus reservas.</li>
                            <li>Mejorar nuestra atención y personalizar tu experiencia en el estudio.</li>
                            <li>Contactarte en caso de cambios imprevistos en tu reserva.</li>
                        </ul>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>4. Protección de Datos</h2>
                        <p>
                            Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos contra acceso no autorizado, alteración o pérdida. No vendemos ni compartimos tu información personal con terceros para fines comerciales ajenos a La Sirena.
                        </p>
                    </section>

                    <section className="space-y-4">
                        <h2 className={`${playfair.className} text-2xl text-primary`}>5. Tus Derechos</h2>
                        <p>
                            Tienes derecho a acceder, rectificar o solicitar la eliminación de tus datos personales de nuestra base de datos en cualquier momento. Puedes ejercer estos derechos contactándonos a través de nuestros canales oficiales.
                        </p>
                    </section>

                    <section className="space-y-4 font-bold text-center pt-8 border-t border-primary/10">
                        <p>Si tienes dudas sobre esta política, contáctanos en nuestro estudio en Hermosillo, Sonora.</p>
                    </section>
                </div>
            </div>
        </main>
    );
}
