import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  boolean,
  index,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { productoEstadoEnum, productoTipoEnum } from "./enums";
import { tenants, sucursales } from "./tenants";

export const categorias = pgTable(
  "categorias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    nombre: varchar("nombre", { length: 100 }).notNull(),
    // Árbol de categorías: null = categoría raíz
    categoriaPadreId: uuid("categoria_padre_id").references(
      (): AnyPgColumn => categorias.id,
    ),
    orden: numeric("orden", { precision: 5, scale: 0 }).default("0"),
  },
  (t) => ({
    tenantIdx: index("categorias_tenant_idx").on(t.tenantId),
  }),
);

export const productos = pgTable(
  "productos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sku: varchar("sku", { length: 50 }).notNull(),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    descripcion: varchar("descripcion", { length: 500 }),
    categoriaId: uuid("categoria_id").references(() => categorias.id),
    marca: varchar("marca", { length: 100 }),
    unidadMedida: varchar("unidad_medida", { length: 20 }).notNull().default("UND"), // UND, KG, LT, etc.
    tipo: productoTipoEnum("tipo").notNull().default("unidad"),
    precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).notNull(),
    precioCosto: numeric("precio_costo", { precision: 12, scale: 2 }).notNull(),
    afectoIgv: boolean("afecto_igv").notNull().default(true),
    imagenUrl: varchar("imagen_url", { length: 500 }),
    estado: productoEstadoEnum("estado").notNull().default("activo"),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    tenantIdx: index("productos_tenant_idx").on(t.tenantId),
    skuUnico: uniqueIndex("productos_tenant_sku_idx").on(t.tenantId, t.sku),
  }),
);

/**
 * Códigos de barras: un producto puede tener varios códigos
 * (distintas presentaciones, empaques, o códigos internos).
 */
export const productosCodigosBarras = pgTable(
  "productos_codigos_barras",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    codigo: varchar("codigo", { length: 50 }).notNull(),
    esPrincipal: boolean("es_principal").notNull().default(false),
  },
  (t) => ({
    codigoUnico: uniqueIndex("productos_codigos_barras_codigo_idx").on(t.codigo),
  }),
);

/**
 * Override de precio de venta por sucursal (opcional: si no existe
 * fila aquí, se usa productos.precio_venta como default).
 */
export const productosPreciosSucursal = pgTable(
  "productos_precios_sucursal",
  {
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
    precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productoId, t.sucursalId] }),
  }),
);

/**
 * Variantes de un producto (ej: mismo producto en distinto sabor o
 * tamaño), cada variante es en sí un producto independiente en
 * inventario/venta, vinculado a un producto "padre" para agrupación
 * visual en catálogo.
 */
export const productosVariantes = pgTable("productos_variantes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productoPadreId: uuid("producto_padre_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  productoVarianteId: uuid("producto_variante_id")
    .notNull()
    .references(() => productos.id, { onDelete: "cascade" }),
  atributo: varchar("atributo", { length: 50 }).notNull(), // ej: "sabor", "tamaño"
  valor: varchar("valor", { length: 50 }).notNull(), // ej: "fresa", "1L"
});

export const combos = pgTable("combos", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  precioVenta: numeric("precio_venta", { precision: 12, scale: 2 }).notNull(),
  estado: productoEstadoEnum("estado").notNull().default("activo"),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const combosDetalle = pgTable(
  "combos_detalle",
  {
    comboId: uuid("combo_id")
      .notNull()
      .references(() => combos.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.comboId, t.productoId] }),
  }),
);
