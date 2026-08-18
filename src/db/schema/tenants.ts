import {
  boolean,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { cajaEstadoEnum, cajaTipoEnum, planTipoEnum, sucursalEstadoEnum, tenantEstadoEnum } from "./enums";

/**
 * Planes de suscripción del SaaS: define límites por tenant
 * (número de sucursales, cajas, usuarios, si incluye facturación
 * electrónica, etc.)
 */
export const tenantPlanes = pgTable("tenant_planes", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: planTipoEnum("tipo").notNull(),
  nombre: varchar("nombre", { length: 60 }).notNull(),
  maxSucursales: integer("max_sucursales").notNull(),
  maxCajas: integer("max_cajas").notNull(),
  maxUsuarios: integer("max_usuarios").notNull(),
  maxProductos: integer("max_productos").notNull(),
  incluyeFacturacionElectronica: boolean("incluye_facturacion_electronica")
    .notNull()
    .default(false),
  precioMensual: numeric("precio_mensual", { precision: 10, scale: 2 }).notNull(),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

/**
 * Tenants: cada supermercado o cadena de supermercados registrado
 * en la plataforma.
 */
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  razonSocial: varchar("razon_social", { length: 200 }).notNull(),
  ruc: varchar("ruc", { length: 11 }).notNull().unique(),
  slug: varchar("slug", { length: 80 }).notNull().unique(), // subdominio: {slug}.tuapp.com
  planId: uuid("plan_id")
    .notNull()
    .references(() => tenantPlanes.id),
  estado: tenantEstadoEnum("estado").notNull().default("activo"),
  logoUrl: varchar("logo_url", { length: 500 }),
  colorPrimario: varchar("color_primario", { length: 7 }), // hex, ej: #0ea5e9
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

export const sucursales = pgTable("sucursales", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  direccion: varchar("direccion", { length: 300 }).notNull(),
  ubigeo: varchar("ubigeo", { length: 6 }), // código INEI para SUNAT
  telefono: varchar("telefono", { length: 20 }),
  estado: sucursalEstadoEnum("estado").notNull().default("activa"),
  esPrincipal: boolean("es_principal").notNull().default(false),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const cajas = pgTable("cajas", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  sucursalId: uuid("sucursal_id")
    .notNull()
    .references(() => sucursales.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 60 }).notNull(), // ej: "Caja 1"
  tipo: cajaTipoEnum("tipo").notNull().default("fisica"),
  estado: cajaEstadoEnum("estado").notNull().default("disponible"),
  // Identificador de la impresora térmica asociada (usado por el print agent local)
  impresoraId: varchar("impresora_id", { length: 100 }),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();
