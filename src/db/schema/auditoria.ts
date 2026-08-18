import { index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { auditoriaAccionEnum } from "./enums";
import { tenants } from "./tenants";
import { usuarios } from "./auth";

/**
 * Log de auditoría append-only. Se escribe desde triggers de
 * Postgres o desde las propias Server Actions en operaciones
 * sensibles (anulaciones, ajustes de inventario, cambios de precio,
 * cierres de caja con diferencia).
 */
export const auditoriaLog = pgTable(
  "auditoria_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    usuarioId: uuid("usuario_id").references(() => usuarios.id),
    tablaAfectada: varchar("tabla_afectada", { length: 60 }).notNull(),
    registroId: uuid("registro_id").notNull(),
    accion: auditoriaAccionEnum("accion").notNull(),
    datosAnteriores: jsonb("datos_anteriores"),
    datosNuevos: jsonb("datos_nuevos"),
    ipOrigen: varchar("ip_origen", { length: 45 }),
    creadoEn: timestamp("creado_en", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index("auditoria_log_tenant_idx").on(t.tenantId),
    tablaRegistroIdx: index("auditoria_log_tabla_registro_idx").on(
      t.tablaAfectada,
      t.registroId,
    ),
    fechaIdx: index("auditoria_log_fecha_idx").on(t.creadoEn),
  }),
);
