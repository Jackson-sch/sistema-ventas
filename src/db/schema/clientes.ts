import {
  boolean,
  date,
  index,
  integer,
  numeric,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { docTipoEnum, promocionTipoEnum } from "./enums";
import { tenants } from "./tenants";
import { productos } from "./productos";

export const clientes = pgTable(
  "clientes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    tipoDocumento: docTipoEnum("tipo_documento").notNull().default("dni"),
    numeroDocumento: varchar("numero_documento", { length: 15 }).notNull(),
    nombre: varchar("nombre", { length: 200 }).notNull(),
    telefono: varchar("telefono", { length: 20 }),
    email: varchar("email", { length: 150 }),
    direccion: varchar("direccion", { length: 300 }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    documentoUnico: uniqueIndex("clientes_tenant_documento_idx").on(
      t.tenantId,
      t.numeroDocumento,
    ),
  }),
);

export const programaPuntos = pgTable("programa_puntos", {
  clienteId: uuid("cliente_id")
    .primaryKey()
    .references(() => clientes.id, { onDelete: "cascade" }),
  puntosAcumulados: integer("puntos_acumulados").notNull().default(0),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const movimientosPuntos = pgTable(
  "movimientos_puntos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clienteId: uuid("cliente_id")
      .notNull()
      .references(() => clientes.id, { onDelete: "cascade" }),
    ventaId: uuid("venta_id"), // FK lógica a ventas.id (se declara en relations.ts para evitar ciclo)
    puntos: integer("puntos").notNull(), // positivo = ganados, negativo = canjeados
    motivo: varchar("motivo", { length: 200 }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    clienteIdx: index("movimientos_puntos_cliente_idx").on(t.clienteId),
  }),
);

export const promociones = pgTable("promociones", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  tipo: promocionTipoEnum("tipo").notNull(),
  valor: numeric("valor", { precision: 12, scale: 2 }), // % o monto fijo, según tipo
  vigenteDesde: date("vigente_desde").notNull(),
  vigenteHasta: date("vigente_hasta").notNull(),
  activa: boolean("activa").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
});

export const promocionesProductos = pgTable(
  "promociones_productos",
  {
    promocionId: uuid("promocion_id")
      .notNull()
      .references(() => promociones.id, { onDelete: "cascade" }),
    productoId: uuid("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.promocionId, t.productoId] }),
  }),
);
