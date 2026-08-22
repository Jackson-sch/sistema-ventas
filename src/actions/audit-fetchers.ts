"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 7. AUDITORÍA & SEGURIDAD
export async function getAuditLogsData() {
  try {
    if (hasDb()) {
      const rows = await db
        .select({
          id: schema.auditoriaLog.id,
          tablaAfectada: schema.auditoriaLog.tablaAfectada,
          accion: schema.auditoriaLog.accion,
          ipOrigen: schema.auditoriaLog.ipOrigen,
          creadoEn: schema.auditoriaLog.creadoEn,
          usuarioId: schema.auditoriaLog.usuarioId,
          usuarioNombre: schema.usuarios.nombre,
        })
        .from(schema.auditoriaLog)
        .leftJoin(schema.usuarios, eq(schema.auditoriaLog.usuarioId, schema.usuarios.id))
        .orderBy(desc(schema.auditoriaLog.creadoEn))
        .limit(50);

      if (rows && rows.length > 0) {
        return rows.map((r) => ({
          id: r.id.substring(0, 8).toUpperCase(),
          timestamp: fmtFechaHora(new Date(r.creadoEn)),
          accion: `Operación sobre ${r.tablaAfectada}: ${r.accion.toUpperCase()}`,
          categoria: "Caja & POS" as const,
          severidad: "informativo" as const,
          usuario: r.usuarioNombre || "Sistema POS",
          rolUsuario: "Cajero POS",
          sucursal: "Sucursal Central - Surco",
          terminal: "Caja 01 - Principal",
          ip: r.ipOrigen || "192.168.1.101",
          detalles: `Registro de auditoría inmutable de acción ${r.accion} en ${r.tablaAfectada}.`,
          supervisorAutorizo: undefined as string | undefined,
        }));
      }
    }
  } catch (err) {
    console.warn("getAuditLogsData: DB fallback:", err);
  }

  return [
    {
      id: "EVT-90412",
      timestamp: "15/08/2026 11:35:12",
      accion: "Eliminación de Ítem en Caja Activa",
      categoria: "Caja & POS" as const,
      severidad: "advertencia" as const,
      usuario: "Carlos Alarcón",
      rolUsuario: "Cajero POS",
      sucursal: "Sucursal Central - Surco",
      terminal: "Caja 01 - Principal",
      ip: "192.168.1.101",
      detalles: "Eliminación de ítem 'Aceite Primor 1L' (S/ 9.80) del ticket en curso tras autorización de supervisor.",
      supervisorAutorizo: "Marcos Ramos (PIN Verificado)",
    },
    {
      id: "EVT-90411",
      timestamp: "15/08/2026 11:20:05",
      accion: "Modificación de Precio Unitario",
      categoria: "Seguridad" as const,
      severidad: "critico" as const,
      usuario: "Carlos Alarcón",
      rolUsuario: "Cajero POS",
      sucursal: "Sucursal Central - Surco",
      terminal: "Caja 01 - Principal",
      ip: "192.168.1.101",
      detalles: "Intento de modificación manual de precio unitario en 'Detergente Bolívar 1kg' de S/ 8.50 a S/ 7.00.",
      supervisorAutorizo: "Marcos Ramos (PIN Verificado)",
    },
  ];
}
