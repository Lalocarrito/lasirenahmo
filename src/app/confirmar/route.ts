import { NextRequest } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    return await handleRequest(request);
  } catch (e) {
    console.error('Error en /confirmar:', e);
    return new Response(page({
      title: 'Error',
      body: 'Ocurrió un error al procesar tu solicitud. Intenta de nuevo más tarde.',
      icon: 'error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}

async function handleRequest(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  const action = request.nextUrl.searchParams.get('action');

  if (!token) {
    return new Response(page({ title: 'Enlace inválido', body: 'Este enlace no es válido.', icon: 'error' }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const supabase = createSupabaseAdmin();

  const { data: appointment } = await supabase
    .from('appointments')
    .select('id, status, customer_name, appointment_date, appointment_time')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (!appointment) {
    return new Response(page({ title: 'Enlace inválido', body: 'Este enlace no es válido o ya expiró.', icon: 'error' }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (appointment.status === 'cancelled') {
    return new Response(page({ title: 'Cita cancelada', body: 'Esta cita ya fue cancelada anteriormente.', icon: 'error' }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (appointment.status === 'confirmed') {
    return new Response(page({
      title: 'Cita confirmada',
      body: `${appointment.customer_name?.split(' ')[0] || 'Tu'}, ya habías confirmado esta cita.`,
      detail: formatDate(appointment.appointment_date, appointment.appointment_time),
      icon: 'check',
    }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (action === 'confirm') {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'confirmed' })
      .eq('id', appointment.id);

    if (error) {
      console.error('Error al confirmar:', error);
      return new Response(page({ title: 'Error', body: 'Ocurrió un error al confirmar. Intenta de nuevo.', icon: 'error' }), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(page({
      title: '¡Cita confirmada!',
      body: `Gracias por confirmar, ${appointment.customer_name?.split(' ')[0] || ''}.`,
      detail: formatDate(appointment.appointment_date, appointment.appointment_time),
      icon: 'check',
    }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  if (action === 'cancel') {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', appointment.id);

    if (error) {
      console.error('Error al cancelar:', error);
      return new Response(page({ title: 'Error', body: 'Ocurrió un error al cancelar. Intenta de nuevo.', icon: 'error' }), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }

    return new Response(page({
      title: 'Cita cancelada',
      body: `${appointment.customer_name?.split(' ')[0] || 'Tu'}, tu cita ha sido cancelada.`,
      icon: 'cancel',
    }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return new Response(page({
    title: 'Confirmación de cita',
    body: `${appointment.customer_name?.split(' ')[0] || ''}, confirma o cancela tu cita en La Sirena.`,
    detail: formatDate(appointment.appointment_date, appointment.appointment_time),
    token,
    icon: 'pending',
  }), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function formatDate(dateStr: string | undefined, timeStr: string | undefined): string {
  if (!dateStr || !timeStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return `${d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })} a las ${timeStr}`;
  } catch {
    return '';
  }
}

interface PageProps {
  title: string;
  body: string;
  detail?: string;
  token?: string;
  icon: 'check' | 'error' | 'cancel' | 'pending';
}

function page(props: PageProps): string {
  const icons: Record<string, string> = {
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
    error: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
    cancel: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    pending: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  };

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lasirenahmo.com';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmacion de Cita - La Sirena</title>
  <meta property="og:title" content="La Sirena - Confirmacion de Cita">
  <meta property="og:description" content="Confirma o cancela tu cita en La Sirena Beauty Studio.">
  <meta property="og:image" content="${baseUrl}/icon1.png">
  <meta property="og:type" content="website">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    :root{--bg:#ffffff;--fg:#111827;--primary:#db2777;--pink:#f472b6;--card:#ffffff;--border:#e2e8f0;--muted:#64748b;--mesh-1:hsla(328,100%,95%,1);--mesh-2:hsla(328,70%,90%,1);--mesh-3:hsla(45,100%,90%,1)}
    @media(prefers-color-scheme:dark){:root{--bg:#0f172a;--fg:#f8fafc;--card:#1e293b;--border:#334155;--muted:#94a3b8;--mesh-1:hsla(328,50%,10%,1);--mesh-2:hsla(328,30%,15%,1);--mesh-3:hsla(220,50%,10%,1)}}
    body{background:var(--bg);color:var(--fg);font-family:'Outfit',system-ui,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:1.5rem;background-image:radial-gradient(at 0% 0%,var(--mesh-1) 0px,transparent 50%),radial-gradient(at 50% 0%,var(--mesh-2) 0px,transparent 50%),radial-gradient(at 100% 0%,var(--mesh-3) 0px,transparent 50%);background-color:var(--bg);transition:background-color .3s}
    .card{background:rgba(255,255,255,.3);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.2);border-radius:2rem;padding:2.5rem;max-width:440px;width:100%;box-shadow:0 20px 40px rgba(0,0,0,.06);text-align:center;transition:all .3s}
    @media(prefers-color-scheme:dark){.card{background:rgba(30,41,59,.4);border-color:rgba(51,65,85,.3)}}
    .logo{width:3.5rem;height:3.5rem;border-radius:.75rem;margin:0 auto 1.5rem;display:block}
    .icon-wrap{width:4.5rem;height:4.5rem;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1.25rem}
    .icon-wrap.bg-pink{background:rgba(219,39,119,.1)}
    .icon-wrap.bg-green{background:rgba(22,163,74,.1)}
    .icon-wrap.bg-red{background:rgba(220,38,38,.1)}
    h1{font-family:'Playfair Display',Georgia,serif;font-size:1.75rem;font-weight:700;margin-bottom:.5rem;color:var(--fg)}
    h1.i{font-style:italic}
    p{color:var(--muted);line-height:1.6;font-size:.9375rem;margin-bottom:1.5rem}
    .dc{background:rgba(219,39,119,.05);border:1px solid rgba(219,39,119,.15);border-radius:1.25rem;padding:1.25rem;margin-bottom:1.5rem;text-align:left}
    .dc .r{display:flex;align-items:center;gap:.75rem;padding:.35rem 0;font-size:.9375rem;color:var(--fg)}
    .dc .r svg{flex-shrink:0;color:var(--primary)}
    .dc .l{color:var(--muted);font-size:.8125rem;font-weight:500}
    .bg{display:flex;flex-direction:column;gap:.75rem;margin-top:1.5rem}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;padding:.875rem 1.5rem;border-radius:1rem;font-size:.8125rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;text-decoration:none;transition:all .3s;border:none;cursor:pointer;font-family:'Outfit',system-ui,sans-serif}
    .btn-p{background:linear-gradient(135deg,#db2777,#f472b6);color:#fff;box-shadow:0 4px 15px rgba(219,39,119,.3)}
    .btn-p:hover{transform:scale(1.03);box-shadow:0 8px 25px rgba(219,39,119,.5)}
    .btn-o{background:transparent;border:2px solid rgba(220,38,38,.2);color:#dc2626}
    .btn-o:hover{background:rgba(220,38,38,.08)}
    .f{color:var(--muted);font-size:.8125rem;margin-top:1.5rem;opacity:.6}
  </style>
</head>
<body>
  <div class="card">
    <img src="${baseUrl}/icon1.png" alt="La Sirena" class="logo">
    <div class="icon-wrap ${props.icon === 'check' ? 'bg-green' : props.icon === 'error' || props.icon === 'cancel' ? 'bg-red' : 'bg-pink'}">${icons[props.icon]}</div>
    <h1 class="${props.icon === 'pending' ? 'i' : ''}">${props.title}</h1>
    <p>${props.body}</p>
    ${props.detail ? `<div class="dc"><div class="r"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><div><div class="l">Cita</div><div>${props.detail}</div></div></div></div>` : ''}
    ${props.token ? `<div class="bg"><a href="${baseUrl}/confirmar?token=${props.token}&action=confirm" class="btn btn-p"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Confirmar mi cita</a><a href="${baseUrl}/confirmar?token=${props.token}&action=cancel" class="btn btn-o"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>Cancelar cita</a></div>` : ''}
    <p class="f">La Sirena Beauty Studio</p>
  </div>
</body>
</html>`;
}
