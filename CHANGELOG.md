# Changelog

## [Unreleased] — 2026-06-03

### Hero & Layout
- Rediseño completo del Hero: sin carrusel de imágenes, fondo con gradiente continuo + mesh
- Cambio de tagline: "Extensiones de Pestañas" → "Beauty Studio"
- Mesh-gradient unificado en el `<main>` para fondo continuo sin cortes entre secciones
- Eliminado auto-scroll al cargar la página y al cambiar de paso en reserva

### Nuevas Secciones en Homepage
- **Conoce a Nuestro Equipo** — tarjetas dinámicas desde Supabase con avatar, especialidad y bio. Al hacer clic → modal con info completa. Solo perfiles con `is_visible = true`
- **Reseñas/Testimonios** — sección dinámica desde la tabla `reviews` de Supabase. Las clientas pueden dejar reseñas desde `/perfil`
- **Preguntas Frecuentes (FAQ)** — acordeón con 6 preguntas comunes
- **Instagram** — sección oculta temporalmente, pendiente de integración con LightWidget

### Autenticación
- LoginModal rediseñado: sin tabs, default a Inicio de Sesión, link "¿No tienes cuenta? Regístrate"
- Campo de teléfono en registro
- Toggle para ver/ocultar contraseña
- Botón de Google con divider "o continúa con"
- "¿Olvidaste tu contraseña?" alineado a la derecha debajo del input
- AuthOrGuest simplificado: solo abre el modal (sin formulario inline), evitando duplicación
- Eliminada opción "Continuar como invitada" para evitar citas fantasma
- LoginModal usa `createPortal` para renderizar en `document.body` (soluciona problema de `backdrop-blur` que rompía el `fixed`)

### Booking Flow
- Step 4 abre el modal de login automáticamente al llegar
- Profesionales filtran solo `role: 'staff'` y `is_visible: true` (admins no aparecen)
- Email eliminado de las tarjetas de profesionales; ahora muestra especialidad
- "Volver a profesional" movido arriba del calendario (siempre visible)
- Días sin disponibilidad ocultos por defecto + botón "Ver calendario completo"
- Mes en pequeño debajo del número del día en el calendario
- Pantalla de éxito: eliminado "Agendar otro servicio", "Ver mis citas" como botón principal

### Admin Panel
- StaffTab: eliminados botones "Hacer Admin" / "Remover Admin"
- Solo "Mover a Clientes" y "Editar Perfil" (con toggle de visibilidad)
- Rol admin solo asignable desde BD

### Perfil de Cliente
- Nuevo tab "Reseñas" donde las clientas pueden calificar citas completadas

### Base de Datos (Supabase)
- Nuevas columnas en `profiles`: `bio TEXT`, `specialty TEXT`, `is_visible BOOLEAN DEFAULT true`
- Nueva tabla `reviews` con RLS policies
- Schema actualizado en `supabase_production.sql`

### Admin
- Login con Google en `/admin` usando `redirectTo: /auth/callback?next=/admin/dashboard`
- Título cambiado a "Iniciar Sesión", sin subtítulo
- "¿Olvidaste tu contraseña?" con formulario de recuperación
- Toggle ver/ocultar contraseña
- Placeholders eliminados

### Perfil de Cliente
- Nav rediseñada: toggle tema | Inicio | logout (círculo rojo)
- "Cerrar sesión" movido a la nav (antes en sidebar)
- "Finalizar Sesión" → "Cerrar sesión"
- Subtítulo "Gestiona tus preferencias" eliminado
- Tabs más compactas en mobile (iconos siempre visibles)
- `staleTime: 0` para que las citas aparezcan sin F5

### Teléfono con máscara
- Nueva función `formatPhone()` en `src/lib/phone.ts`
- Máscara visual `(662) 123-4567` en registro, perfil, booking y admin
- Validación de 10 dígitos
- Placeholder cambiado a "Teléfono"

### Booking Flow
- "Ver calendario completo" abre modal con grid mensual + navegación
- Animación crossfade en cambio de meses
- Días no disponibles en gris (`bg-muted/20`)
- No permite navegar a meses pasados
- Carrusel extendido a 120 días, auto-scroll al día seleccionado
- Mapa de éxito reemplazado por botón "Cómo llegar" con borde rosa
- "Volver a profesional" movido abajo centrado

### Varios
- "Email" → "Correo" en labels
- "Login" → "Iniciar Sesión" en admin
