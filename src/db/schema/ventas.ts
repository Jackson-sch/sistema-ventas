import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  medioPagoEnum,
  movimientoCajaTipoEnum,
  sesionCajaEstadoEnum,
  ventaEstadoEnum,
} from "./enums";
import { tenants, sucursales, cajas } from "./tenants";
import { usuarios } from "./auth";
import { productos } from "./productos";
import { clientes } from "./clientes";

export const sesionesCaja = pgTable(
  "sesiones_caja",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cajaId: uuid("caja_id")
      .notNull()
      .references(() => cajas.id),
    cajeroId: uuid("cajero_id")
      .notNull()
      .references(() => usuarios.id),
    fechaApertura: timestamp("fecha_apertura", { withTimezone: true })
      .notNull()
      .defaultNow(),
    montoApertura: numeric("monto_apertura", { precision: 12, scale: 2 }).notNull(),
    fechaCierre: timestamp("fecha_cierre", { withTimezone: true }),
    montoCierreDeclarado: numeric("monto_cierre_declarado", {
      precision: 12,
      scale: 2,
    }),
    montoCierreSistema: numeric("monto_cierre_sistema", { precision: 12, scale: 2 }),
    diferencia: numeric("diferencia", { precision: 12, scale: 2 }),
    estado: sesionCajaEstadoEnum("estado").notNull().default("abierta"),
  },
  (t) => ({
    cajaIdx: index("sesiones_caja_caja_idx").on(t.cajaId),
    cajeroIdx: index("sesiones_caja_cajero_idx").on(t.cajeroId),
  }),
);

export const ventas = pgTable(
  "ventas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
    cajaId: uuid("caja_id")
      .notNull()
      .references(() => cajas.id),
    sesionCajaId: uuid("sesion_caja_id")
      .notNull()
      .references(() => sesionesCaja.id),
    cajeroId: uuid("cajero_id")
      .notNull()
      .references(() => usuarios.id),
    clienteId: uuid("cliente_id").references(() => clientes.id),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
    descuento: numeric("descuento", { precision: 12, scale: 2 }).notNull().default("0"),
    igv: numeric("igv", { precision: 12, scale: 2 }).notNull(),
    total: numeric("total", { precision: 12, scale: 2 }).notNull(),
    estado: ventaEstadoEnum("estado").notNull().default("completada"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantSucursalIdx: index("ventas_tenant_sucursal_idx").on(t.tenantId, t.sucursalId),
    fechaIdx: index("ventas_fecha_idx").on(t.creadoEn),
    sesionCajaIdx: index("ventas_sesion_caja_idx").on(t.sesionCajaId),
  }),
);

export const ventasDetalle = pgTable(
  "ventas_detalle",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ventaId: uuid("venta_id")
      .notNull()
      .references(() => ventas.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id),
    cantidad: numeric("cantidad", { precision: 12, scale: 3 }).notNull(),
    precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 }).notNull(),
    descuento: numeric("descuento", { precision: 12, scale: 2 }).notNull().default("0"),
    subtotal: numeric("subtotal", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => ({
    ventaIdx: index("ventas_detalle_venta_idx").on(t.ventaId),
  }),
);

export const ventasPagos = pgTable("ventas_pagos", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventaId: uuid("venta_id")
    .notNull()
    .references(() => ventas.id, { onDelete: "cascade" }),
  medioPago: medioPagoEnum("medio_pago").notNull(),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  referencia: varchar("referencia", { length: 100 }), // últimos 4 dígitos, código Yape/Plin, etc.
});

export const anulaciones = pgTable("anulaciones", {
  id: uuid("id").primaryKey().defaultRandom(),
  ventaId: uuid("venta_id")
    .notNull()
    .references(() => ventas.id, { onDelete: "cascade" }),
  motivo: text("motivo").notNull(),
  autorizadoPor: uuid("autorizado_por")
    .notNull()
    .references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Movimientos de efectivo dentro de una sesión de caja que no son
 * ventas directas: retiros parciales, ingresos de efectivo adicional,
 * y el registro espejo de cada venta en efectivo (para el cuadre).
 */
export const movimientosCaja = pgTable(
  "movimientos_caja",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sesionCajaId: uuid("sesion_caja_id")
      .notNull()
      .references(() => sesionesCaja.id, { onDelete: "cascade" }),
    tipo: movimientoCajaTipoEnum("tipo").notNull(),
    monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
    motivo: varchar("motivo", { length: 300 }),
    ventaId: uuid("venta_id").references(() => ventas.id),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    sesionIdx: index("movimientos_caja_sesion_idx").on(t.sesionCajaId),
  }),
);
