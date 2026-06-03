'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { playfair } from '@/lib/fonts';

interface FAQ {
  q: string;
  a: string;
}

const faqs: FAQ[] = [
  {
    q: '¿Cuánto duran las extensiones de pestañas?',
    a: 'Depende del cuidado y el ciclo natural de tus pestañas, pero en promedio duran de 3 a 4 semanas. Recomendamos un retoque cada 2-3 semanas para mantenerlas perfectas.',
  },
  {
    q: '¿Duele el procedimiento?',
    a: 'No, es un proceso indoloro. La mayoría de nuestras clientas se relajan e incluso se duermen durante la aplicación. Solo sentirás una suave sensación durante el proceso.',
  },
  {
    q: '¿Puedo bañarme o lavarme la cara?',
    a: 'Sí, pero debes evitar mojar las pestañas las primeras 24-48 horas después de la aplicación para que el adhesivo se cure correctamente. Después de eso, puedes lavarte con normalidad.',
  },
  {
    q: '¿Dañan mis pestañas naturales?',
    a: 'No, cuando se aplican correctamente por un profesional certificado. Usamos adhesivos de alta calidad y extensiones ligeras que no dañan el folículo. Es importante no jalarlas y acudir a retiros profesionales.',
  },
  {
    q: '¿Cómo reservo una cita?',
    a: 'Puedes agendar directamente desde nuestra página en la sección "Reservar Ahora". Selecciona el servicio que desees, elige fecha y hora, y confirma tu cita. ¡Es muy sencillo!',
  },
  {
    q: '¿Aceptan pagos con tarjeta?',
    a: 'Sí, aceptamos efectivo y transferencia. Estamos trabajando para integrar pagos con tarjeta y depósito en línea muy pronto.',
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4 md:px-8 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <h2 className={`${playfair.className} text-4xl md:text-5xl mb-4 text-foreground`}>
          Preguntas <span className="text-primary italic">Frecuentes</span>
        </h2>
        <p className="text-muted-foreground text-sm uppercase tracking-[0.3em] font-bold">
          Todo lo que necesitas saber antes de tu cita
        </p>
      </motion.div>

      <div className="space-y-3">
        {faqs.map((faq, i) => {
          const isOpen = openIndex === i;

          return (
            <div
              key={i}
              className="border border-border rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between p-5 md:p-6 text-left bg-card hover:bg-primary/5 transition-colors"
              >
                <span className="font-bold text-sm md:text-base pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 md:px-6 pb-5 md:pb-6 pt-2 text-muted-foreground text-sm leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
