import {
  date,
  index,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import {
  movimientoInventarioTipoEnum,
  ordenCompraEstadoEnum,
  transferenciaEstadoEnum,
} from "./enums";
import { tenants, sucursales } from "./tenants";
import { productos } from "./productos";
import { usuarios } from "./auth";

/**
 * Stock actual por producto y sucursal. Es la tabla de lectura
 * rápida; los movimientos de abajo son el detalle histórico que
 * explica cómo se llegó a ese stock.
 */
export const inventario = pgTable(
  "inventario",
  {
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
    stockActual: numeric("stock_actual", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    stockMinimo: numeric("stock_minimo", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    stockMaximo: numeric("stock_maximo", { precision: 12, scale: 3 }),
    ubicacionAlmacen: varchar("ubicacion_almacen", { length: 50 }),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productoId, t.sucursalId] }),
    sucursalIdx: index("inventario_sucursal_idx").on(t.sucursalId),
  }),
);

export const lotes = pgTable(
  "lotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
    numeroLote: varchar("numero_lote", { length: 60 }).notNull(),
    fechaVencimiento: date("fecha_vencimiento"),
    cantidadInicial: numeric("cantidad_inicial", { precision: 12, scale: 3 }).notNull(),
    cantidadActual: numeric("cantidad_actual", { precision: 12, scale: 3 }).notNull(),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    vencimientoIdx: index("lotes_vencimiento_idx").on(t.fechaVencimiento),
  }),
);

export const movimientosInventario = pgTable(
  "movimientos_inventario",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    loteId: uuid("lote_id").references(() => lotes.id),
    tipo: movimientoInventarioTipoEnum("tipo").notNull(),
    cantidad: numeric("cantidad", { precision: 12, scale: 3 }).notNull(),
    motivo: varchar("motivo", { length: 300 }),
    // referencia libre al documento origen: venta_id, orden_compra_id, transferencia_id, etc.
    referenciaTipo: varchar("referencia_tipo", { length: 40 }),
    referenciaId: uuid("referencia_id"),
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    productoSucursalIdx: index("movimientos_inventario_producto_sucursal_idx").on(
      t.productoId,
      t.sucursalId,
    ),
    fechaIdx: index("movimientos_inventario_fecha_idx").on(t.creadoEn),
  }),
);

export const transferenciasStock = pgTable("transferencias_stock", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sucursalOrigenId: uuid("sucursal_origen_id")
    .notNull()
    .references(() => sucursales.id),
  sucursalDestinoId: uuid("sucursal_destino_id")
    .notNull()
    .references(() => sucursales.id),
  estado: transferenciaEstadoEnum("estado").notNull().default("pendiente"),
  solicitadoPor: uuid("solicitado_por")
    .notNull()
    .references(() => usuarios.id),
  recibidoPor: uuid("recibido_por").references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  recibidoEn: timestamp("recibido_en", { withTimezone: true }),
});

export const transferenciasStockDetalle = pgTable(
  "transferencias_stock_detalle",
  {
    transferenciaId: uuid("transferencia_id")
      .notNull()
      .references(() => transferenciasStock.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    cantidad: numeric("cantidad", { precision: 12, scale: 3 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.transferenciaId, t.productoId] }),
  }),
);

export const proveedores = pgTable("proveedores", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  razonSocial: varchar("razon_social", { length: 200 }).notNull(),
  ruc: varchar("ruc", { length: 11 }).notNull(),
  contactoNombre: varchar("contacto_nombre", { length: 150 }),
  contactoTelefono: varchar("contacto_telefono", { length: 20 }),
  contactoEmail: varchar("contacto_email", { length: 150 }),
  direccion: varchar("direccion", { length: 300 }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const ordenesCompra = pgTable("ordenes_compra", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sucursalId: uuid("sucursal_id")
    .notNull()
    .references(() => sucursales.id, { onDelete: "cascade" }),
  proveedorId: uuid("proveedor_id")
    .notNull()
    .references(() => proveedores.id),
  estado: ordenCompraEstadoEnum("estado").notNull().default("pendiente"),
  numero: varchar("numero", { length: 30 }).notNull(),
  fechaEmision: date("fecha_emision").notNull(),
  fechaEntregaEstimada: date("fecha_entrega_estimada"),
  observaciones: text("observaciones"),
  creadoPor: uuid("creado_por")
    .notNull()
    .references(() => usuarios.id),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const ordenesCompraDetalle = pgTable(
  "ordenes_compra_detalle",
  {
    ordenCompraId: uuid("orden_compra_id")
      .notNull()
      .references(() => ordenesCompra.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    cantidadPedida: numeric("cantidad_pedida", { precision: 12, scale: 3 }).notNull(),
    cantidadRecibida: numeric("cantidad_recibida", { precision: 12, scale: 3 })
      .notNull()
      .default("0"),
    precioUnitarioCosto: numeric("precio_unitario_costo", {
      precision: 12,
      scale: 2,
    }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.ordenCompraId, t.productoId] }),
  }),
);

export const recepcionesMercaderia = pgTable("recepciones_mercaderia", {
  id: uuid("id").primaryKey().defaultRandom(),
  ordenCompraId: uuid("orden_compra_id")
    .notNull()
    .references(() => ordenesCompra.id, { onDelete: "cascade" }),
  numeroGuiaRemision: varchar("numero_guia_remision", { length: 30 }),
  recibidoPor: uuid("recibido_por")
    .notNull()
    .references(() => usuarios.id),
  recibidoEn: timestamp("recibido_en", { withTimezone: true }).notNull().defaultNow(),
  observaciones: text("observaciones"),
});

export const recepcionesMercaderiaDetalle = pgTable(
  "recepciones_mercaderia_detalle",
  {
    recepcionId: uuid("recepcion_id")
      .notNull()
      .references(() => recepcionesMercaderia.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    cantidadRecibida: numeric("cantidad_recibida", { precision: 12, scale: 3 }).notNull(),
    loteId: uuid("lote_id").references(() => lotes.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.recepcionId, t.productoId] }),
  }),
);
