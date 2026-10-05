# La Sirena — Beauty Studio

> Plataforma web de **reservas y gestión** para un estudio de pestañas, con sitio público,
> área de clientas y panel de administración.

Aplicación **Next.js 16** + **Supabase** desplegada en [lasirenahmo.com](https://lasirenahmo.com).
Incluye una landing pública, un flujo de reserva de citas paso a paso, un perfil para las
clientas y un dashboard administrativo con control de servicios, personal, agenda y
disponibilidad.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38BDF8)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000)

---

## Tabla de contenido

- [Características](#características)
- [Capturas de pantalla](#capturas-de-pantalla)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos](#requisitos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Despliegue](#despliegue)
- [Autor](#autor)

---

## Características

### Sitio público
- **Landing** con hero, sección **Equipo** (dinámica desde Supabase), **reseñas**,
  **preguntas frecuentes** y **ubicación** con Google Maps.
- **Flujo de reserva en 6 pasos**: servicio → profesional → fecha → inicio de sesión o
  invitada → resumen → confirmación.
- Calendario con disponibilidad real por profesional y días sin cupo ocultos.
- Tema claro/oscuro y diseño responsive. **PWA** instalable.
- Páginas de **Política de Privacidad** y **Términos del Servicio**.

### Área de clientas (`/perfil`)
- **Mis citas** (próximas e historial).
- **Programa de lealtad** (puntos).
- **Reseñas** de citas completadas.
- **Ajustes** de perfil (nombre, teléfono con máscara, avatar).

### Panel de administración (`/admin/dashboard`)
- **Overview** con métricas del negocio.
- **Clientes**, **Catálogo** de servicios (con imágenes), **Personal**,
  **Citas** y **Disponibilidad** (horarios por día y excepciones).
- Modales para crear/editar servicios, gestionar citas y editar perfiles.

### Notificaciones e integraciones
- **Recordatorios por WhatsApp** (GreenAPI) con enlace de confirmación de un solo uso.
- **Autenticación** con Supabase (correo y **Google OAuth**).

## Capturas de pantalla

| Sitio público — Equipo | Reserva — selección de fecha |
|------------------------|------------------------------|
| ![Conoce a Nuestro Equipo](docs/screenshots/public-equipo.png) | ![Agenda tu cita](docs/screenshots/reserva-fecha.png) |

| Reserva confirmada | Panel de administración |
|--------------------|-------------------------|
| ![Reserva guardada](docs/screenshots/reserva-confirmada.png) | ![Panel de administración](docs/screenshots/admin-overview.png) |

## Stack tecnológico

| Capa            | Tecnología                                                        |
|-----------------|-------------------------------------------------------------------|
| Framework       | Next.js 16 (App Router)                                            |
| UI              | React 19, Tailwind CSS 4, Framer Motion, Lucide, `next-themes`    |
| Formularios     | React Hook Form + Zod                                             |
| Datos en cliente| TanStack Query, Supabase JS                                        |
| Backend / DB    | Supabase (PostgreSQL, Auth, Storage, RLS)                         |
| Notificaciones  | GreenAPI (WhatsApp)                                               |
| Despliegue      | Vercel                                                            |
| Calidad         | ESLint 9, TypeScript 5                                            |

## Requisitos

- **Node.js 20+** y **npm**.
- Una cuenta/proyecto de **Supabase**.
- (Opcional para recordatorios) credenciales de **GreenAPI**.

## Instalación y ejecución

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crea `.env.local` en la raíz:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu-url-de-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Solo servidor (operaciones administrativas)
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# URL pública de la app (para enlaces de confirmación)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Recordatorios por WhatsApp (GreenAPI)
GREEN_API_ID_INSTANCE=tu-id-instance
GREEN_API_API_TOKEN=tu-api-token
GREEN_API_URL=https://api.greenapi.com
```

### 3. Preparar la base de datos

En el **SQL Editor** de Supabase, ejecuta
[`supabase_schema.sql`](supabase_schema.sql) (esquema base + RLS) o
[`supabase_production.sql`](supabase_production.sql) (esquema completo de producción, con
`service_images` y `reviews`). Crea también los buckets de almacenamiento `services` y
`avatars`.

### 4. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### 5. Build de producción

```bash
npm run build
npm run start
```


## Despliegue

El proyecto está pensado para **Vercel**:

1. Importa el repositorio en Vercel.
2. Configura las mismas variables de entorno del paso 2.
3. Despliega. El `middleware` redirige `lasirenahmo.com` → `www.lasirenahmo.com`.


## Autor

**Josué Martínez** — [@Lalocarrito](https://github.com/Lalocarrito)
