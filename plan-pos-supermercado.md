# Plan de Proyecto: Sistema POS Multi-Tenant para Supermercados

## 0. Resumen ejecutivo

Sistema de punto de venta (POS) para supermercados, diseñado desde el inicio como **multi-tenant**: una sola instalación de la aplicación sirve a múltiples supermercados (tenants), cada uno con sus propias sucursales, cajas, productos, usuarios y datos, completamente aislados entre sí.

**Stack técnico** (consistente con tus proyectos anteriores — WashMaster Pro, Sistema Joyería):

- **Frontend/Backend**: Next.js (App Router, Server Actions)
- **Base de datos**: Supabase (PostgreSQL) con Row Level Security (RLS) para aislamiento por tenant y sucursal
- **ORM**: Drizzle ORM
- **Auth**: Supabase Auth con Custom Access Token Hook (inyecta `tenant_id`, `sucursal_id` y `rol` en el JWT, integrándose de forma nativa con las políticas RLS)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Tablas de datos**: TanStack Table
- **Reportes/gráficos**: D3.js
- **PDFs** (boletas, reportes, kardex): react-pdf-renderer
- **Realtime**: Supabase Realtime (sincronización de caja, stock en vivo, alertas)
- **Facturación electrónica**: integración diferida contra tu API centralizada de facturación SUNAT ([[facturacion-electronica-api]]), igual que en Joyería

Todo el dominio y la UI en español.

---

## 1. Alcance y objetivos del sistema

### 1.1 Objetivo general
Reemplazar cajas registradoras/POS aislados por un sistema centralizado, multi-sucursal y multi-empresa, que permita vender, controlar inventario en tiempo real, cerrar caja, y facturar electrónicamente, funcionando incluso con cortes de internet intermitentes (venta en supermercado no puede detenerse).

### 1.2 Objetivos específicos
- Venta rápida en caja (< 3 segundos por ítem escaneado)
- Control de inventario en tiempo real por sucursal, con alertas de stock mínimo
- Gestión de precios, promociones, descuentos y combos
- Cierre de caja con arqueo y cuadre automático
- Reportes gerenciales (ventas, márgenes, productos más vendidos, mermas)
- Multi-tenant: un supermercado (tenant) puede tener múltiples sucursales, y cada sucursal múltiples cajas
- Roles diferenciados: cajero, supervisor, administrador de sucursal, administrador general (dueño del tenant), soporte (super-admin de la plataforma)
- Modo offline con sincronización posterior (contingencia)
- Facturación electrónica SUNAT (boleta/factura) vía API centralizada

### 1.3 Fuera de alcance (fase inicial)
- E-commerce / venta online integrada (se deja como módulo futuro)
- Logística de rutas de reparto
- Integración con balanzas electrónicas de pesaje avanzado (se contempla el modelo de datos, pero no la integración de hardware en el MVP)

---

## 2. Arquitectura Multi-Tenant

### 2.1 Estrategia de aislamiento
**Enfoque recomendado: base de datos compartida, esquema compartido, con `tenant_id` en cada tabla + RLS estricto por tenant.**

Justificación: es el mismo patrón que ya usas en WashMaster Pro (RLS por sucursal) y en Joyería (multi-sucursal). Escala bien hasta cientos/miles de tenants sin la complejidad operativa de una base de datos por cliente, y Supabase RLS lo soporta de forma nativa.

Jerarquía de datos:

```
Plataforma (super-admin)
 └── Tenant (supermercado / cadena)
      └── Sucursal (tienda física)
           └── Caja (punto de venta físico)
                └── Sesión de caja (turno de un cajero)
```

### 2.2 Reglas de aislamiento (RLS)
- Toda tabla operativa lleva `tenant_id` (y donde aplique, `sucursal_id`)
- Política RLS base: `tenant_id = current_setting('app.current_tenant_id')`
- Política adicional por sucursal para roles de cajero/supervisor (solo ven su sucursal)
- El rol `super_admin` (soporte de la plataforma) usa un `service_role` separado, nunca el mismo JWT que los tenants
- Los `subdomain` o `slug` del tenant determinan el contexto (`{tenant}.tuapp.com` o selector de empresa tras login si el usuario pertenece a varios tenants)

### 2.3 Identificación del tenant en cada request
Opciones (se recomienda combinar 1 y 2):
1. **Subdominio**: `mercadolospinos.tuapp.com` → resuelve `tenant_id` en middleware de Next.js
2. **JWT claim**: mediante un *Custom Access Token Hook* de Supabase Auth, el JWT incluye `tenant_id`, `sucursal_id` y `rol` en el momento del login — las políticas RLS los leen directamente vía `auth.jwt()`, sin queries adicionales
3. Middleware inyecta el `tenant_id` en cada Server Action antes de tocar la base de datos (nunca confiar en el `tenant_id` que venga del cliente)

### 2.4 Planes y límites por tenant
Tabla `tenant_planes` con límites configurables (número de sucursales, cajas, usuarios, productos, si incluye facturación electrónica, etc.), para soportar un modelo de suscripción SaaS (Starter / Pro / Enterprise).

---

## 3. Roles y permisos

| Rol | Alcance | Permisos clave |
|---|---|---|
| `super_admin` | Plataforma | Administra tenants, planes, soporte técnico |
| `admin_tenant` | Todo el tenant | Configura sucursales, usuarios, precios globales, ve todos los reportes |
| `admin_sucursal` | Una sucursal | Gestiona inventario, usuarios de su sucursal, aprueba mermas/anulaciones |
| `supervisor_caja` | Una sucursal | Autoriza anulaciones, descuentos especiales, apertura/cierre de caja |
| `cajero` | Una caja / turno | Solo registra ventas, cobra, imprime comprobantes |
| `almacenero` | Una sucursal | Ingresos de mercadería, ajustes de inventario, transferencias |

RBAC implementado con tablas `roles`, `permisos`, `rol_permisos`, y verificación tanto en Server Actions como en políticas RLS.

---

## 4. Modelo de datos (nivel detallado)

### 4.1 Núcleo multi-tenant
- `tenants` (id, razon_social, ruc, slug, plan_id, estado, fecha_creacion)
- `sucursales` (id, tenant_id, nombre, direccion, ubigeo, telefono, estado)
- `cajas` (id, sucursal_id, nombre/número, tipo — física/autoservicio, estado)
- `usuarios` (id, tenant_id, nombre, email, rol_id, sucursales_asignadas)

### 4.2 Catálogo de productos
- `categorias` (id, tenant_id, nombre, categoria_padre_id) — árbol de categorías
- `productos` (id, tenant_id, sku, codigo_barras, nombre, descripcion, categoria_id, marca, unidad_medida, tipo — unidad/peso, precio_venta, precio_costo, afecto_igv, imagen_url, estado)
- `productos_codigos_barras` (producto_id, codigo) — soporta múltiples códigos por producto (distintas presentaciones)
- `productos_precios_sucursal` (producto_id, sucursal_id, precio_venta) — override de precio por sucursal (opcional)
- `combos` / `combos_detalle` — productos vendidos como paquete con precio especial
- `productos_variantes` (para productos con variantes: sabor, tamaño, etc.)

### 4.3 Inventario
- `inventario` (producto_id, sucursal_id, stock_actual, stock_minimo, stock_maximo, ubicacion_almacen)
- `movimientos_inventario` (id, tenant_id, sucursal_id, producto_id, tipo — ingreso/salida/ajuste/merma/transferencia, cantidad, motivo, usuario_id, fecha, referencia_documento)
- `transferencias_stock` (sucursal_origen_id, sucursal_destino_id, estado, detalle)
- `lotes` y `fecha_vencimiento` (crítico en supermercado — perecibles)
- `proveedores` (id, tenant_id, razon_social, ruc, contacto)
- `ordenes_compra` / `ordenes_compra_detalle`
- `recepciones_mercaderia` (vincula orden de compra con ingreso real a inventario)

### 4.4 Ventas y caja
- `sesiones_caja` (id, caja_id, cajero_id, fecha_apertura, monto_apertura, fecha_cierre, monto_cierre_declarado, monto_cierre_sistema, diferencia, estado)
- `ventas` (id, tenant_id, sucursal_id, caja_id, sesion_caja_id, cliente_id?, subtotal, descuento, igv, total, medio_pago, estado — completada/anulada, comprobante_tipo, comprobante_serie_numero, fecha)
- `ventas_detalle` (venta_id, producto_id, cantidad, precio_unitario, descuento, subtotal)
- `ventas_pagos` (venta_id, medio_pago — efectivo/tarjeta/yape/plin/transferencia, monto, referencia)
- `anulaciones` (venta_id, motivo, autorizado_por, fecha)
- `movimientos_caja` (sesion_caja_id, tipo — ingreso/egreso/venta, monto, motivo) — para retiros de efectivo, vueltos, etc.

### 4.5 Clientes y fidelización (opcional desde MVP+1)
- `clientes` (id, tenant_id, tipo_documento, numero_documento, nombre, telefono, email)
- `programa_puntos` / `movimientos_puntos`
- `promociones` (id, tenant_id, tipo — % descuento, 2x1, monto fijo, vigencia_desde/hasta, condiciones)
- `promociones_productos` (relación producto ↔ promoción)

### 4.6 Facturación electrónica
- `comprobantes` (venta_id, tipo — boleta/factura/nota_credito, serie, numero, estado_sunat, xml_url, cdr_url, hash)
- Integración vía llamada a tu **API centralizada de facturación SUNAT** ([[facturacion-electronica-api]]) — el POS no habla directo con SUNAT, delega en esa API compartida con Joyería y WashMaster Pro

### 4.7 Auditoría
- `auditoria_log` (tenant_id, usuario_id, tabla_afectada, accion, datos_anteriores, datos_nuevos, fecha) — trazabilidad completa, importante para investigar diferencias de caja o mermas

---

## 5. Flujo operativo del cajero (UX del POS)

1. **Login de cajero** → autenticación vía Supabase Auth (sesión de caja) + PIN adicional del cajero validado en Server Action para cambio rápido de turno en la misma caja física, sin recargar sesión completa → selección de caja disponible en su sucursal
2. **Apertura de caja** → registra monto inicial de efectivo (obligatorio antes de vender)
3. **Venta**:
   - Escaneo de código de barras (lector USB/bluetooth) → autocompletar producto
   - Búsqueda manual por nombre/SKU si falla el escaneo
   - Productos por peso: ingreso manual de peso o integración con balanza (fase 2)
   - Aplicación automática de promociones vigentes
   - Selección de cliente (opcional, para boleta con datos o factura)
   - Selección de medio(s) de pago (soporta pago mixto: parte efectivo + parte tarjeta)
   - Cálculo de vuelto
   - Emisión de comprobante (impresión térmica + comprobante electrónico)
4. **Anulación de venta**: requiere autorización de supervisor (PIN o segundo factor)
5. **Cierre de caja**: sistema calcula el monto esperado (apertura + ventas efectivo − retiros), cajero declara el conteo físico, se registra la diferencia (faltante/sobrante)
6. **Modo offline**: si se pierde conexión, la venta se guarda localmente (IndexedDB) y se sincroniza al recuperar conexión; el comprobante electrónico se emite en cuanto haya conexión

---

## 6. Integraciones de hardware (POS físico)

- **Lector de código de barras**: USB HID (funciona como teclado, sin driver especial) — soporte inmediato
- **Impresora térmica de tickets**: integración vía WebUSB/WebSerial o servicio local intermediario (recomendado: un pequeño servicio local — "print agent" — que reciba el JSON de la venta y controle la impresora ESC/POS, ya que el navegador no tiene acceso directo confiable a impresoras térmicas)
- **Cajón de dinero (cash drawer)**: se abre por comando desde la impresora térmica (pulso eléctrico), mismo print agent
- **Balanza electrónica** (fase 2): integración por puerto serie a través del print agent local, o balanzas con salida de código de barras (más simple, sin integración directa)
- **Lector de tarjetas / POS de pago**: se registra el monto y referencia manualmente en el MVP; integración con pasarela (Izipay, Niubiz, etc.) en fase posterior

---

## 7. Reportes y analítica gerencial

- Dashboard en tiempo real (Supabase Realtime): ventas del día, ticket promedio, productos más vendidos
- Reporte de ventas por sucursal / caja / cajero / rango de fechas
- Reporte de márgenes (precio venta vs. costo)
- Kardex de inventario por producto (entradas, salidas, saldo)
- Reporte de mermas y su motivo
- Reporte de cierres de caja y diferencias (control de faltantes/sobrantes recurrentes por cajero)
- Curva ABC de productos (D3.js) — qué productos generan el 80% de las ventas
- Alertas de stock mínimo y productos próximos a vencer

---

## 8. Seguridad

- RLS en **todas** las tablas con `tenant_id`
- Server Actions validan `tenant_id`/`sucursal_id` del usuario autenticado antes de cualquier escritura (nunca confiar en valores enviados desde el cliente)
- Autorización de acciones sensibles (anulación, descuento manual, ajuste de inventario) con PIN de supervisor o segundo login
- Rate limiting en login y en endpoints de facturación
- Logs de auditoría inmutables (o con append-only + hash encadenado si se requiere nivel forense)
- Backups automáticos de Supabase + retención configurable por plan

---

## 9. Roadmap por fases

### Fase 0 — Fundación (Sprint 1-2)
- Setup del proyecto Next.js + Drizzle + Supabase + Supabase Auth
- Configuración del Custom Access Token Hook (inyección de `tenant_id`, `sucursal_id`, `rol` en el JWT)
- Modelo de datos núcleo (tenants, sucursales, cajas, usuarios, roles)
- Middleware de resolución de tenant + RLS base
- Login multi-tenant y selector de empresa/sucursal
- Diseño del flujo de PIN de cajero para cambio rápido de turno

### Fase 1 — Catálogo e inventario (Sprint 3-4)
- CRUD de productos, categorías, códigos de barras
- Módulo de inventario por sucursal, movimientos, stock mínimo
- Proveedores y órdenes de compra básicas

### Fase 2 — POS y caja (Sprint 5-7) — **MVP funcional**
- Pantalla de venta (escaneo, carrito, cobro)
- Apertura/cierre de caja con arqueo
- Impresión de tickets (integración print agent)
- Anulaciones con autorización
- Pagos mixtos

### Fase 3 — Facturación electrónica (Sprint 8-9)
- Integración con [[facturacion-electronica-api]] para boleta/factura
- Manejo de notas de crédito (anulaciones ya facturadas)

### Fase 4 — Promociones, clientes y fidelización (Sprint 10-11)
- Motor de promociones y descuentos
- Registro de clientes y programa de puntos

### Fase 5 — Reportes y analítica (Sprint 12-13)
- Dashboards gerenciales, curva ABC, reportes de caja y mermas

### Fase 6 — Modo offline y resiliencia (Sprint 14)
- Cola de sincronización local (IndexedDB)
- Reintentos automáticos de facturación

### Fase 7 — SaaS multi-tenant completo (Sprint 15-16)
- Panel de super-admin (gestión de tenants, planes, facturación del propio SaaS)
- Onboarding self-service para nuevos supermercados
- Métricas de uso por tenant, límites de plan

### Fase 8 — Expansión (backlog futuro)
- Balanzas electrónicas integradas
- Pasarelas de pago con tarjeta integradas
- App para toma de inventario con celular (escaneo con cámara)
- E-commerce / catálogo online conectado al mismo inventario

---

## 10. Consideraciones de escalabilidad

- Índices compuestos `(tenant_id, sucursal_id, ...)` en todas las tablas de alto volumen (ventas, movimientos_inventario)
- Particionamiento de `ventas` y `ventas_detalle` por fecha si el volumen crece mucho (Postgres table partitioning)
- Supabase Realtime limitado a canales por sucursal (no por tenant completo) para evitar tráfico innecesario
- Considerar un caché (ej. Redis o Supabase Edge Cache) para catálogo de productos, que se lee muchísimo más de lo que se escribe
- Separar reportes pesados (agregaciones históricas) en vistas materializadas, refrescadas periódicamente, para no golpear las tablas transaccionales

---

## 11. Próximos pasos sugeridos

1. Definir el modelo de datos final en Drizzle (schema completo, similar a lo ya hecho en Joyería)
2. Diseñar las políticas RLS tabla por tabla
3. Prototipar la pantalla de venta (UX del cajero) — es la pieza más crítica de todo el sistema
4. Definir el modelo de planes/límites del SaaS
5. Decidir el mecanismo de integración con impresora térmica (print agent local) antes de avanzar en Fase 2
