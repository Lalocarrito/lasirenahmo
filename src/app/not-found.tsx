import { Playfair_Display } from 'next/font/google';
import Link from 'next/link';
import { Home } from 'lucide-react';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

export default function NotFound() {
    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
                <h1 className={`${playfair.className} text-4xl mb-4 text-foreground`}>
                    Página no encontrada
                </h1>
                <p className="text-muted-foreground mb-8 text-sm">
                    La página que buscas no existe o fue movida.
                </p>
                <Link
                    href="/"
                    className="siren-button inline-flex items-center gap-3"
                >
                    <Home size={18} />
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
