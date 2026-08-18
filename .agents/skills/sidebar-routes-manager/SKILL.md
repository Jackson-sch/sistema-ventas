---
name: sidebar-routes-manager
description: Audita, verifica y sincroniza automáticamente las rutas del sistema Next.js App Router con el menú lateral (Sidebar). Detecta enlaces rotos, páginas huérfanas (rutas sin enlace en el sidebar), rutas fantasma (enlaces sin página existente), iconos faltantes y estados activos.
---

# Sidebar Routes Manager Skill

Esta skill proporciona un protocolo automatizado para inspeccionar, mantener sincronizado y auditar en tiempo real la navegación del **Sidebar** (`src/components/app-sidebar.tsx` y `nav-main.tsx`) contra la estructura real de rutas de Next.js (`src/app/**/page.tsx`).

---

## 🎯 Cuándo Activar Esta Skill

Activa esta skill siempre que:
1. Se cree, renombre o elimine una nueva página o módulo en `src/app/` (ej. `/clientes`, `/compras`, `/sucursales`).
2. El usuario solicite revisar, reorganizar o actualizar las opciones y enlaces del sidebar.
3. Se detecten enlaces rotos (404), páginas huérfanas o rutas no accesibles desde el menú.
4. Se requiera auditar la coherencia de roles (RBAC) y badges de estado (`En Vivo`, `Turno Activo`, etc.).

---

## 🔍 Protocolo de Verificación en 4 Pasos

### Paso 1: Escaneo de Rutas Físicas (`src/app`)
Ejecuta el script de auditoría o escanea recursivamente el directorio `src/app` para encontrar todos los puntos de entrada:
```bash
node .agents/skills/sidebar-routes-manager/scripts/check-routes.mjs
```
El script compara las páginas `page.tsx` contra los grupos de `navigationGroups` en `src/components/app-sidebar.tsx`.

### Paso 2: Detección de Discrepancias
Verifica y clasifica los hallazgos en:
* ⚠️ **Páginas Huérfanas**: Archivos `page.tsx` creados que no tienen un ítem en el sidebar.
* ❌ **Rutas Fantasma**: URLs definidas en el sidebar que apuntan a rutas inexistentes en `src/app/`.
* 🔄 **Rutas Genéricas**: Enlaces que apuntan a `/dashboard` como fallback temporal en lugar de su ruta dedicada.

### Paso 3: Sincronización y Actualización de `app-sidebar.tsx`
Cuando se agregue un nuevo módulo:
1. Importa el icono semántico de `lucide-react` correspondiente.
2. Ubica la ruta dentro del grupo temático adecuado (`Punto de Venta`, `Inventario & Logística`, `Analítica & Control`, `Administración SaaS`).
3. Asigna un badge si amerita estado en vivo (`badgeVariant: "success" | "warning" | "default"`).
4. Asegura que `NavMain` gestione correctamente el estado activo con `usePathname()`.

### Paso 4: Validación de Compilación
Verifica que los cambios no introduzcan errores de tipado o compilación:
```bash
pnpm tsc --noEmit
```
