import { pgEnum } from "drizzle-orm/pg-core";

// ── Plataforma / Tenant ──────────────────────────────────────────────
export const tenantEstadoEnum = pgEnum("tenant_estado", [
  "activo",
  "suspendido",
  "cancelado",
]);

export const planTipoEnum = pgEnum("plan_tipo", ["starter", "pro", "enterprise"]);

export const sucursalEstadoEnum = pgEnum("sucursal_estado", ["activa", "inactiva"]);

export const cajaTipoEnum = pgEnum("caja_tipo", ["fisica", "autoservicio"]);

export const cajaEstadoEnum = pgEnum("caja_estado", [
  "disponible",
  "en_uso",
  "inactiva",
]);

// ── Productos / Inventario ───────────────────────────────────────────
export const productoTipoEnum = pgEnum("producto_tipo", ["unidad", "peso"]);

export const productoEstadoEnum = pgEnum("producto_estado", ["activo", "inactivo"]);

export const movimientoInventarioTipoEnum = pgEnum("movimiento_inventario_tipo", [
  "ingreso",
  "salida",
  "ajuste",
  "merma",
  "transferencia_salida",
  "transferencia_entrada",
]);

export const transferenciaEstadoEnum = pgEnum("transferencia_estado", [
  "pendiente",
  "en_transito",
  "recibida",
  "cancelada",
]);

export const ordenCompraEstadoEnum = pgEnum("orden_compra_estado", [
  "pendiente",
  "aprobada",
  "recibida_parcial",
  "recibida_completa",
  "cancelada",
]);

export const promocionTipoEnum = pgEnum("promocion_tipo", [
  "porcentaje",
  "monto_fijo",
  "2x1",
  "combo",
]);

// ── Ventas / Caja ─────────────────────────────────────────────────────
export const sesionCajaEstadoEnum = pgEnum("sesion_caja_estado", ["abierta", "cerrada"]);

export const ventaEstadoEnum = pgEnum("venta_estado", ["completada", "anulada"]);

export const medioPagoEnum = pgEnum("medio_pago", [
  "efectivo",
  "tarjeta",
  "yape",
  "plin",
  "transferencia",
]);

export const movimientoCajaTipoEnum = pgEnum("movimiento_caja_tipo", [
  "ingreso",
  "egreso",
  "venta",
]);

// ── Clientes / Facturación ───────────────────────────────────────────
export const docTipoEnum = pgEnum("doc_tipo", ["dni", "ruc", "ce", "pasaporte"]);

export const comprobanteTipoEnum = pgEnum("comprobante_tipo", [
  "boleta",
  "factura",
  "nota_credito",
]);

export const comprobanteEstadoSunatEnum = pgEnum("comprobante_estado_sunat", [
  "pendiente",
  "enviado",
  "aceptado",
  "rechazado",
  "anulado",
]);

// ── Auditoría ─────────────────────────────────────────────────────────
export const auditoriaAccionEnum = pgEnum("auditoria_accion", [
  "crear",
  "actualizar",
  "eliminar",
]);
