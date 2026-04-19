# Auditoría de Seguridad y Calidad — La Sirena HMO

**Proyecto:** Next.js 16 + React 19 + Supabase + TypeScript + TailwindCSS 4
**Fecha:** 2026-04-17
**Ruta:** `/mnt/c/Users/Rigo/Desktop/Josué/unison/lasirenahmo-main/lasirenahmo-main`

---

## RESUMEN EJECUTIVO

| ID | Severidad | Archivo | Descripción |
|----|-----------|---------|-------------|
| SVE-001 | 🔴 CRÍTICA | `next.config.ts:62` | CSP con `'unsafe-eval'` y `'unsafe-inline'` |
| SVE-002 | 🔴 CRÍTICA | `src/components/admin/tabs/StaffTab.tsx:65` | Upload sin validación MIME/tamaño |
| SVE-003 | 🟠 ALTA | `supabase_schema.sql:109-113` | RLS permite INSERT público sin restricción |
| SVE-004 | 🟠 ALTA | `src/components/admin/modals/ServiceModal.tsx:40` | Schema Zod sin `.max()` (DoS) |
| SVE-005 | 🟠 ALTA | `src/components/client/SettingsView.tsx:39` | `updateUser` sin validar teléfono/fecha |
| BUG-001 | 🟡 MEDIA | `src/app/page.tsx:26` | Promesa `getUser()` sin `.catch()` |
| BUG-002 | 🟡 MEDIA | `src/components/client/ClientProfile.tsx:20` | Uso de `React.FC<any>` |
| BUG-003 | 🟡 MEDIA | `src/components/client/SettingsView.tsx:62` | `catch (error: any)` |
| PERF-001 | 🟡 MEDIA | varios | Uso de `<img>` en vez de `next/image` |
| PERF-002 | 🟡 MEDIA | `AppointmentsTab.tsx` | Sin paginación en listados |
| SEC-002 | 🟡 MEDIA | `src/lib/logger.ts:10` | Logs sin sanitizar pueden exponer tokens |
| SEC-003 | 🟢 BAJA | `admin/dashboard/page.tsx:210` | Mensaje de error menciona credenciales |

---

## 1. FALLAS DE SEGURIDAD CRÍTICAS

### 🔴 SVE-001 — CSP con `unsafe-eval` + `unsafe-inline`

**Archivo:** `next.config.ts:62`
**Código actual:**
```typescript
"script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com",
```
**Problema:** habilita XSS si un atacante logra inyectar HTML (bypass de React).
**Corrección:**
```typescript
"script-src 'self' https://accounts.google.com",
// Si Next requiere inline, usar nonce generado en middleware:
// "script-src 'self' 'nonce-{RANDOM}' https://accounts.google.com",
```

---

### 🔴 SVE-002 — Upload de avatar sin validar

**Archivo:** `src/components/admin/tabs/StaffTab.tsx:65-78`
**Problema:** acepta `.exe`, `.js`, tamaños arbitrarios, nombre predecible.
**Corrección completa:**
```typescript
const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, profileId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error('Solo se permiten JPEG, PNG o WebP');
        return;
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
        toast.error('La imagen no puede superar 5MB');
        return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mimeToExt: Record<string, string[]> = {
        'image/jpeg': ['jpg', 'jpeg'],
        'image/png': ['png'],
        'image/webp': ['webp'],
    };
    if (!mimeToExt[file.type]?.includes(ext)) {
        toast.error('Extensión de archivo inválida');
        return;
    }

    setUploadingAvatar(profileId);
    const random = crypto.randomUUID();
    const fileName = `${profileId}-${random}.${ext}`;

    try {
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        const { error: updateError } = await supabase.from('profiles')
            .update({ avatar_url: publicUrl }).eq('id', profileId);
        if (updateError) throw updateError;

        toast.success('Foto actualizada');
        queryClient.invalidateQueries({ queryKey: ['staff-profiles'] });
    } catch (error: unknown) {
        logger.error(error);
        toast.error('Error al subir la foto');
    } finally {
        setUploadingAvatar(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
};
```

---

### 🟠 SVE-003 — RLS permite INSERT público sin restricción

**Archivo:** `supabase_schema.sql:109-113`
**Actual:**
```sql
CREATE POLICY "Cualquiera puede crear citas"
ON appointments FOR INSERT TO public
WITH CHECK (true);
```
**Corrección:**
```sql
DROP POLICY IF EXISTS "Cualquiera puede crear citas" ON appointments;
CREATE POLICY "Insert citas con email válido"
ON appointments FOR INSERT TO public
WITH CHECK (
    auth.uid() IS NOT NULL
    OR (
        customer_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND length(customer_name) BETWEEN 2 AND 100
        AND customer_phone ~ '^[+]?[0-9\s()\-.]{7,20}$'
    )
);
```

---

### 🟠 SVE-004 — Schema Zod sin límites máximos

**Archivo:** `src/components/admin/modals/ServiceModal.tsx:40-45`
**Corrección:**
```typescript
const serviceSchema = z.object({
    name: z.string().min(3).max(100)
        .regex(/^[a-zA-Z0-9\s\-áéíóúñÁÉÍÓÚÑ]+$/, 'Caracteres inválidos'),
    price: z.number().min(0).max(999999).multipleOf(0.01),
    description: z.string().min(10).max(500),
    duration: z.string().min(1).max(20),
    image_url: z.string().url().optional().or(z.literal('')),
});
```

---

### 🟠 SVE-005 — `updateUser` sin validación

**Archivo:** `src/components/client/SettingsView.tsx:39-59`
**Corrección:**
```typescript
const profileSchema = z.object({
    full_name: z.string().min(2).max(100)
        .regex(/^[a-zA-Z\s\-áéíóúñÁÉÍÓÚÑ]+$/, 'Nombre inválido'),
    phone: z.string()
        .regex(/^[+]?[0-9\s()\-.]{7,20}$/, 'Teléfono inválido')
        .optional().or(z.literal('')),
    dob: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha YYYY-MM-DD')
        .refine((d) => {
            const age = new Date().getFullYear() - new Date(d).getFullYear();
            return age >= 13 && age <= 120;
        }, 'Edad fuera de rango')
        .optional().or(z.literal('')),
});

const handleSave = async () => {
    setIsSaving(true);
    try {
        const validated = profileSchema.parse(formData);
        const { error } = await supabase.auth.updateUser({ data: validated });
        if (error) throw error;
        toast.success('Perfil actualizado');
    } catch (error: unknown) {
        const msg = error instanceof z.ZodError
            ? error.issues[0].message
            : error instanceof Error ? error.message : 'Error desconocido';
        toast.error(msg);
    } finally {
        setIsSaving(false);
    }
};
```

---

## 2. BUGS Y CALIDAD DE CÓDIGO

### 🟡 BUG-001 — Promesa sin `.catch`

**`src/app/page.tsx:26`**
```typescript
useEffect(() => {
    const fetchUser = async () => {
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error) throw error;
            setUser(user ?? null);
        } catch (err) {
            logger.error('getUser failed:', err);
            setUser(null);
        }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
}, []);
```

### 🟡 BUG-002 — `React.FC<any>`

**`src/components/client/ClientProfile.tsx:20`**
```typescript
import type { LucideIcon } from 'lucide-react';
const tabs: { id: TabType; label: string; icon: LucideIcon }[] = [...];
```

### 🟡 BUG-003 — `catch (error: any)`

**`src/components/client/SettingsView.tsx:62`**
```typescript
} catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    toast.error(`Error al guardar: ${msg}`);
}
```

### 🟡 SEC-002 — Logger sin sanitizar

**`src/lib/logger.ts`** — agregar redacción de campos sensibles:
```typescript
const SENSITIVE_KEYS = ['password', 'token', 'access_token', 'refresh_token', 'key', 'secret', 'authorization'];

function redact(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(redact);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
        out[k] = SENSITIVE_KEYS.some(s => k.toLowerCase().includes(s)) ? '[REDACTED]' : redact(v);
    }
    return out;
}

export const logger = {
    error: (...args: unknown[]) => { if (isDev) console.error(...args.map(redact)); },
    warn:  (...args: unknown[]) => { if (isDev) console.warn(...args.map(redact)); },
    info:  (...args: unknown[]) => { if (isDev) console.info(...args.map(redact)); },
};
```

---

## 3. RENDIMIENTO

### 🟡 PERF-001 — Reemplazar `<img>` por `next/image`

Archivos afectados:
- `src/app/page.tsx:54`
- `src/app/admin/dashboard/page.tsx:363`
- `src/app/perfil/page.tsx:27`
- `src/components/admin/tabs/CatalogTab.tsx:32`
- `src/components/admin/tabs/StaffTab.tsx:168`
- `src/components/admin/modals/ServiceModal.tsx:156`
- `src/components/booking/steps/BookingSummary.tsx:109, 186`

**Patrón de reemplazo:**
```typescript
import Image from 'next/image';

<Image
    src={service.image_url}
    alt={service.name}
    width={400}
    height={300}
    className="w-full h-full object-cover"
/>
```

### 🟡 PERF-002 — Paginación en `AppointmentsTab.tsx`

```typescript
const [page, setPage] = useState(0);
const PAGE_SIZE = 50;

const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['appointments', page],
    queryFn: async () => {
        const from = page * PAGE_SIZE;
        const { data } = await supabase.from('appointments')
            .select('*, services(*)')
            .order('appointment_date', { ascending: false })
            .range(from, from + PAGE_SIZE - 1);
        return (data || []) as Appointment[];
    },
    placeholderData: (prev) => prev,
});
```

---

## 4. FEATURES SUGERIDAS

1. **Notificaciones email/SMS al confirmar cita** — Resend o Twilio + edge function de Supabase
2. **Recordatorios automáticos 24h antes** — pg_cron + edge function → WhatsApp (ya usan Green API en otros proyectos)
3. **Cancelación inteligente** — cancelar hasta 48h antes, sino redirigir a WhatsApp
4. **Dashboard de estadísticas** — ingresos/mes, servicio top, staff top, tasa de no-show
5. **Programa de fidelización** — tabla `loyalty_points`, descuentos cada N citas
6. **Galería antes/después** — tabla `service_gallery`, integración con storage
7. **Reviews y ratings** — tabla `reviews` con moderación, promedio en perfil de staff
8. **Pagos online** — Mercado Pago o Stripe, depósito reembolsable
9. **Flag de no-show** + historial → baneo temporal tras 3 ausencias
10. **Chat en tiempo real con staff** — Supabase Realtime para mensajes pre-cita
11. **Export de reportes** — CSV/PDF de citas por rango de fechas
12. **PWA + push notifications** — manifest.json + service worker
13. **Multi-idioma** (es/en) — next-intl
14. **Modo mantenimiento** en admin — flag en `business_settings`
15. **Auditoría (audit_log)** — tabla con quién modificó qué y cuándo

---

## 5. ORDEN DE IMPLEMENTACIÓN SUGERIDO

**Sprint 1 (crítico, 1-2 días):** SVE-001, SVE-002, SVE-003
**Sprint 2 (alto, 2-3 días):** SVE-004, SVE-005, BUG-001, BUG-003, SEC-002
**Sprint 3 (calidad, 1-2 días):** BUG-002, PERF-001, PERF-002
**Sprint 4 (features):** recordatorios + notificaciones + loyalty (mayor valor de negocio)
