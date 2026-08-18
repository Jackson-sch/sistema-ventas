import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { index, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { comprobanteEstadoSunatEnum, comprobanteTipoEnum } from "./enums";
import { ventas } from "./ventas";

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
