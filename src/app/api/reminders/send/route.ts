import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { sendWhatsApp } from '@/lib/ultramsg';

export async function POST(request: NextRequest) {
  const { appointmentId } = await request.json();
  if (!appointmentId) {
    return NextResponse.json({ error: 'Falta appointmentId' }, { status: 400 });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, profiles!staff_id(full_name), services(name)')
    .eq('id', appointmentId)
    .single();

  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  if (!appointment.confirmation_token) {
    return NextResponse.json({ error: 'Esta cita no tiene token de confirmación' }, { status: 400 });
  }

  const phoneDigits = appointment.customer_phone?.replace(/\D/g, '') || '';
  if (!phoneDigits) {
    return NextResponse.json({ error: 'La cita no tiene teléfono' }, { status: 400 });
  }

  const internationalPhone = `52${phoneDigits}`;
  const staffName = appointment.profiles?.full_name || 'tu lashista';
  const serviceName = appointment.services?.name || 'servicio';
  const date = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const confirmLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://lasirenahmo.com'}/confirmar?token=${appointment.confirmation_token}`;

  const message = `Hola ${appointment.customer_name.split(' ')[0]}! Te recordamos tu cita en La Sirena:

📅 ${date}
⏰ ${appointment.appointment_time}
💇 ${serviceName}
👩 ${staffName}

Para confirmar tu asistencia, haz clic aquí:
${confirmLink}

Si no puedes asistir, cancela desde el mismo enlace.`;

  const result = await sendWhatsApp({ to: internationalPhone, message });

  if (result.success) {
    await supabase.from('appointments').update({ reminder_sent_at: new Date().toISOString() }).eq('id', appointmentId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: result.error || 'Error al enviar' }, { status: 500 });
}
