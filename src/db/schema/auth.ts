import {
  boolean,
  pgSchema,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { tenants, sucursales } from "./tenants";

/**
 * Stub de referencia al schema `auth` de Supabase Auth.
 * No se gestiona desde Drizzle (Supabase lo administra), solo se
 * declara para poder referenciar `auth.users.id` como FK desde
 * nuestras tablas de aplicación.
 */
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

/**
 * Roles: catálogo dinámico por tenant (permite roles custom además
 * de los roles base: super_admin, admin_tenant, admin_sucursal,
 * supervisor_caja, cajero, almacenero).
 */
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // null = rol base de la plataforma (no pertenece a un tenant específico)
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  nombre: varchar("nombre", { length: 60 }).notNull(),
  slug: varchar("slug", { length: 60 }).notNull(),
  descripcion: text("descripcion"),
  esRolBase: boolean("es_rol_base").notNull().default(false),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
}).enableRLS();

export const permisos = pgTable("permisos", {
  id: uuid("id").primaryKey().defaultRandom(),
  codigo: varchar("codigo", { length: 100 }).notNull().unique(), // ej: "ventas.anular"
  descripcion: text("descripcion").notNull(),
  modulo: varchar("modulo", { length: 60 }).notNull(), // ej: "ventas", "inventario"
}).enableRLS();

export const rolPermisos = pgTable(
  "rol_permisos",
  {
    rolId: uuid("rol_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permisoId: uuid("permiso_id")
      .notNull()
      .references(() => permisos.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.rolId, t.permisoId] }),
  }),
).enableRLS();

/**
 * Usuarios de la aplicación: extiende auth.users de Supabase con
 * los datos propios del dominio (tenant, rol, PIN de cajero, etc.).
 * El id es el mismo UUID que el de auth.users (1:1).
 */
export const usuarios = pgTable("usuarios", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  rolId: uuid("rol_id")
    .notNull()
    .references(() => roles.id),
  nombre: varchar("nombre", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  telefono: varchar("telefono", { length: 20 }),
  // PIN hasheado (bcrypt) para cambio rápido de turno en caja sin
  // re-autenticar toda la sesión de Supabase Auth.
  pinHash: varchar("pin_hash", { length: 255 }),
  activo: boolean("activo").notNull().default(true),
  creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
}).enableRLS();

/**
 * Asignación de usuarios a sucursales (un cajero/supervisor puede
 * tener acceso a más de una sucursal; admin_tenant no requiere filas
 * aquí porque su rol ya implica acceso a todas las sucursales del tenant).
 */
export const usuariosSucursales = pgTable(
  "usuarios_sucursales",
  {
    usuarioId: uuid("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    sucursalId: uuid("sucursal_id")
      .notNull()
      .references(() => sucursales.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.usuarioId, t.sucursalId] }),
  }),
).enableRLS();
