import { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return new Response(htmlResponse('Token inválido', 'El enlace no es válido.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
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

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, status, customer_name, appointment_date, appointment_time')
    .eq('confirmation_token', token)
    .single();

  if (!appointment) {
    return new Response(htmlResponse('Enlace inválido', 'Este enlace no es válido o ya expiró.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (appointment.status === 'cancelled') {
    return new Response(htmlResponse('Cita cancelada', 'Esta cita ya fue cancelada anteriormente.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (appointment.status === 'confirmed') {
    return new Response(htmlResponse('Ya confirmada', 'Tu cita ya estaba confirmada.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointment.id);

  if (updateError) {
    return new Response(htmlResponse('Error', 'Ocurrió un error al confirmar. Intenta de nuevo.'), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const date = new Date(appointment.appointment_date + 'T00:00:00').toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return new Response(
    successHTML(appointment.customer_name.split(' ')[0], date, appointment.appointment_time),
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  );
}

function htmlResponse(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>La Sirena</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;padding:1rem}
  .card{text-align:center;background:white;padding:2.5rem;border-radius:2rem;box-shadow:0 20px 40px rgba(0,0,0,0.05);max-width:420px;width:100%}
  .emoji{font-size:3rem;margin-bottom:1rem}
  h1{color:#111827;font-size:1.5rem;margin:0 0 0.5rem}
  p{color:#6b7280;line-height:1.6}
  .footer{color:#9ca3af;font-size:0.875rem;margin-top:1.5rem}
</style>
</head>
<body><div class="card"><div class="emoji">ℹ️</div><h1>${title}</h1><p>${body}</p><p class="footer">La Sirena Beauty Studio</p></div></body>
</html>`;
}

function successHTML(name: string, date: string, time: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Cita Confirmada - La Sirena</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{display:flex;align-items:center;justify-content:center;min-height:100vh;background:linear-gradient(135deg,#fce7f3,#fdf2f8);font-family:system-ui,-apple-system,sans-serif;padding:1rem}
  .card{text-align:center;background:white;padding:2.5rem;border-radius:2rem;box-shadow:0 20px 40px rgba(0,0,0,0.08);max-width:420px;width:100%}
  .check{width:4rem;height:4rem;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.5rem;font-size:2rem}
  h1{color:#111827;font-size:1.5rem;margin:0 0 0.5rem;font-weight:700}
  p{color:#6b7280;line-height:1.6;margin-bottom:1.5rem}
  .detail{background:#f9fafb;border-radius:1rem;padding:1rem;margin-bottom:1.5rem}
  .detail p{color:#374151;margin:0;font-size:0.95rem}
  .detail strong{color:#db2777}
</style>
</head>
<body>
  <div class="card">
    <div class="check">✅</div>
    <h1>¡Cita Confirmada!</h1>
    <p>Gracias por confirmar, ${name}.</p>
    <div class="detail">
      <p>Te esperamos el <strong>${date}</strong></p>
      <p>a las <strong>${time}</strong></p>
    </div>
    <p style="color:#9ca3af;font-size:0.875rem">La Sirena Beauty Studio</p>
  </div>
</body>
</html>`;
}
