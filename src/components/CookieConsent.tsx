'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'la-sirena-cookie-consent';

type ConsentValue = 'accepted' | 'rejected' | null;

/**
 * COMPLIANCE: Non-intrusive cookie consent banner.
 * Persists preference in localStorage. When rejected, third-party
 * analytics scripts should NOT be injected (check via getCookieConsent()).
 */
export function getCookieConsent(): ConsentValue {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(COOKIE_CONSENT_KEY) as ConsentValue;
}

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Only show if user hasn't made a choice yet
        const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (!consent) {
            // Small delay so it doesn't compete with initial page load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
        setVisible(false);
    };

    const handleReject = () => {
        localStorage.setItem(COOKIE_CONSENT_KEY, 'rejected');
        setVisible(false);
    };

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[90]"
                >
                    <div className="bg-card border border-border rounded-3xl shadow-2xl p-6 backdrop-blur-xl relative">
                        <button
                            onClick={handleReject}
                            className="absolute top-4 right-4 p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                            aria-label="Cerrar"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5">
                                <Cookie size={20} className="text-primary" />
                            </div>
                            <div className="space-y-3 pr-6">
                                <h3 className="font-bold text-sm">Usamos cookies 🍪</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Utilizamos cookies esenciales para el funcionamiento del sitio y la gestión de tu sesión.
                                    Consulta nuestro{' '}
                                    <Link href="/privacy" className="text-primary hover:underline font-bold">
                                        Aviso de Privacidad
                                    </Link>
                                    .
                                </p>
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={handleAccept}
                                        className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                    >
                                        Aceptar
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        className="px-5 py-2 bg-muted/20 border border-border rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-muted/40 transition-all text-muted-foreground"
                                    >
                                        Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
