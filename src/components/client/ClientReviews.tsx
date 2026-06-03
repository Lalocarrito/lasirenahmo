'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  appointment_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  appointment_time: string;
  services?: { name: string };
  status: string;
}

export default function ClientReviews() {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null);

  const userIdQuery = useQuery({
    queryKey: ['user-id'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id || null;
    },
  });

  const { data: completedAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['completed-appointments', userIdQuery.data],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: appts } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .eq('customer_email', user.email)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      return (appts || []) as Appointment[];
    },
    enabled: !!userIdQuery.data,
  });

  const { data: existingReviews = [] } = useQuery<Review[]>({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return (data || []) as Review[];
    },
    enabled: !!userIdQuery.data,
  });

  const reviewedAppointmentIds = new Set(existingReviews.map(r => r.appointment_id));
  const availableForReview = completedAppointments.filter(a => !reviewedAppointmentIds.has(a.id));

  const submitReview = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');
      if (!selectedAppointment) throw new Error('Selecciona una cita');
      if (rating === 0) throw new Error('Selecciona una calificación');

      const { error } = await supabase.from('reviews').insert({
        user_id: user.id,
        appointment_id: selectedAppointment,
        rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['public-reviews'] });
      setRating(0);
      setComment('');
      setSelectedAppointment(null);
      toast.success('¡Gracias por tu reseña!');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const unratedExists = availableForReview.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Tus Reseñas</h3>
        <p className="text-xs text-muted-foreground">
          Ayuda a otras clientas a conocernos. Califica tus citas completadas.
        </p>
      </div>

      {unratedExists && (
        <div className="glass-card !p-6 space-y-4 bg-primary/5 border-primary/10">
          <h4 className="font-bold text-sm uppercase tracking-widest text-primary">
            Califica tu última visita
          </h4>

          <select
            value={selectedAppointment || ''}
            onChange={e => setSelectedAppointment(e.target.value || null)}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary"
          >
            <option value="">Selecciona una cita</option>
            {availableForReview.map(a => (
              <option key={a.id} value={a.id}>
                {a.appointment_date} - {a.appointment_time} {a.services?.name ? `(${a.services.name})` : ''}
              </option>
            ))}
          </select>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-all hover:scale-110"
              >
                <Star
                  size={28}
                  className={n <= (hoverRating || rating)
                    ? 'fill-accent text-accent'
                    : 'text-muted-foreground/30'
                  }
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Cuéntanos tu experiencia (opcional)"
            rows={3}
            maxLength={500}
            className="w-full p-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary resize-none"
          />

          <button
            onClick={() => submitReview.mutate()}
            disabled={submitReview.isPending || !selectedAppointment || rating === 0}
            className="siren-button w-full py-3 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitReview.isPending ? <Loader2 size={16} className="animate-spin" /> : <MessageCircle size={16} />}
            Enviar Reseña
          </button>
        </div>
      )}

      {existingReviews.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">
            Tus reseñas anteriores
          </h4>
          {existingReviews.map(r => (
            <div key={r.id} className="admin-card !p-5">
              <div className="flex gap-1 mb-2">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} size={14} className="fill-accent text-accent" />
                ))}
              </div>
              {r.comment && (
                <p className="text-sm text-muted-foreground">{r.comment}</p>
              )}
              <p className="text-[10px] text-muted-foreground/50 mt-2">
                {new Date(r.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}

      {!unratedExists && existingReviews.length === 0 && (
        <p className="text-sm text-muted-foreground italic">
          Aún no tienes reseñas. Cuando completes una cita, podrás calificarla aquí.
        </p>
      )}
    </motion.div>
  );
}
