import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { boolean, index, integer, pgTable, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { comprobanteEstadoSunatEnum, comprobanteTipoEnum } from "./enums";
import { ventas } from "./ventas";
import { tenants, sucursales, cajas } from "./tenants";

/**
 * Series y Correlativos tributarios por tipo de comprobante SUNAT / POS
 */
export const seriesComprobantes = pgTable(
  "series_comprobantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id").references(() => sucursales.id, { onDelete: "set null" }),
    cajaId: uuid("caja_id").references(() => cajas.id, { onDelete: "set null" }),
    tipoComprobante: varchar("tipo_comprobante", { length: 4 }).notNull(), // '01' (Factura), '03' (Boleta), '07' (NC), '08' (ND), '09' (Guía), 'COT' (Cotización)
    tipoNombre: varchar("tipo_nombre", { length: 60 }).notNull(),
    serie: varchar("serie", { length: 4 }).notNull(), // 'F001', 'B001', 'FC01', 'BC01', 'T001', 'COT1'
    correlativoActual: integer("correlativo_actual").notNull().default(0),
    correlativoInicial: integer("correlativo_inicial").notNull().default(1),
    formato: varchar("formato", { length: 20 }).notNull().default("ticket_80mm"), // 'ticket_80mm', 'ticket_58mm', 'a4', 'a5'
    esPrincipal: boolean("es_principal").notNull().default(true),
    activo: boolean("activo").notNull().default(true),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantTipoSerieIdx: uniqueIndex("series_tenant_tipo_serie_idx").on(t.tenantId, t.tipoComprobante, t.serie),
    tenantIdx: index("series_tenant_idx").on(t.tenantId),
  }),
);

/**
 * Comprobantes emitidos por venta. El POS no habla directo con
 * SUNAT: delega el envío/consulta en la API centralizada de
 * facturación electrónica (compartida con Joyería y WashMaster Pro).
 */
export const comprobantes = pgTable(
  "comprobantes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ventaId: uuid("venta_id")
      .notNull()
      .references(() => ventas.id, { onDelete: "cascade" }),
    tipo: comprobanteTipoEnum("tipo").notNull(),
    serie: varchar("serie", { length: 4 }).notNull(),
    numero: varchar("numero", { length: 8 }).notNull(),
    estadoSunat: comprobanteEstadoSunatEnum("estado_sunat")
      .notNull()
      .default("pendiente"),
    // referencia al comprobante que este anula (para notas de crédito)
    comprobanteAnuladoId: uuid("comprobante_anulado_id").references(
      (): AnyPgColumn => comprobantes.id,
    ),
    xmlUrl: varchar("xml_url", { length: 500 }),
    cdrUrl: varchar("cdr_url", { length: 500 }),
    hash: varchar("hash", { length: 100 }),
    mensajeError: varchar("mensaje_error", { length: 500 }),
    enviadoEn: timestamp("enviado_en", { withTimezone: true }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    ventaIdx: index("comprobantes_venta_idx").on(t.ventaId),
    serieNumeroIdx: index("comprobantes_serie_numero_idx").on(t.serie, t.numero),
  }),
);
