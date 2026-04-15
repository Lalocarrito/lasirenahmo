'use client';

import { Playfair_Display } from 'next/font/google';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

const playfair = Playfair_Display({ subsets: ['latin'], weight: ['700'] });

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
    useEffect(() => {
        logger.error('Application error:', error);
    }, [error]);

    return (
        <div className="min-h-screen mesh-gradient flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                    <AlertTriangle size={48} className="text-red-500" />
                </div>
                <h1 className={`${playfair.className} text-4xl mb-4 text-foreground`}>
                    Algo salió mal
                </h1>
                <p className="text-muted-foreground mb-8 text-sm">
                    Ocurrió un error inesperado. Por favor, intenta de nuevo.
                </p>
                <button
                    onClick={reset}
                    className="siren-button flex items-center gap-3 mx-auto"
                >
                    <RefreshCw size={18} />
                    Intentar de nuevo
                </button>
            </div>
        </div>
    );
}
