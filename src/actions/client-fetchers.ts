"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 2. CLIENTES & PROGRAMA DE PUNTOS
export async function getClientsData() {
  try {
    if (hasDb()) {
      const [clientesRows, puntosRows, ventasRows] = await Promise.all([
        db.select().from(schema.clientes),
        db.select().from(schema.programaPuntos),
        db
          .select({
            clienteId: schema.ventas.clienteId,
            total: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`,
            ultima: sql<Date>`max(${schema.ventas.creadoEn})`,
          })
          .from(schema.ventas)
          .where(sql`${schema.ventas.clienteId} is not null`)
          .groupBy(schema.ventas.clienteId),
      ]);

      if (clientesRows && clientesRows.length > 0) {
        const puntosMap = new Map(puntosRows.map((p) => [p.clienteId, p.puntosAcumulados]));
        const ventasMap = new Map(ventasRows.map((v) => [v.clienteId, v]));

        return clientesRows.map((c) => {
          const puntos = puntosMap.get(c.id) ?? 0;
          const ventas = ventasMap.get(c.id);
          const categoria =
            puntos >= 300 ? "Mayorista" : puntos >= 50 ? "VIP / Frecuente" : "Estándar";
          return {
            id: c.id,
            tipoDoc: c.tipoDocumento.toUpperCase() as "DNI" | "RUC" | "CE",
            numDoc: c.numeroDocumento,
            nombre: c.nombre,
            email: c.email || "-",
            telefono: c.telefono || "-",
            direccion: c.direccion || "-",
            categoria: categoria as "Estándar" | "VIP / Frecuente" | "Mayorista",
            puntos,
            totalCompras: ventas ? parseFloat(String(ventas.total)) : 0,
            ultimaCompra: ventas?.ultima ? fmtFechaHora(ventas.ultima) : "Sin compras",
          };
        });
      }
    }
  } catch (err) {
    console.warn("getClientsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      tipoDoc: "DNI" as const,
      numDoc: "00000000",
      nombre: "Clientes Varios / Consumidor Final",
      email: "-",
      telefono: "-",
      direccion: "-",
      categoria: "Estándar" as const,
      puntos: 0,
      totalCompras: 12450.00,
      ultimaCompra: "Hoy, 11:42",
    },
    {
      id: "2",
      tipoDoc: "DNI" as const,
      numDoc: "45892144",
      nombre: "Juan Pérez García",
      email: "juan.perez@gmail.com",
      telefono: "987-112-233",
      direccion: "Calle Los Cedros 340 - Surco",
      categoria: "VIP / Frecuente" as const,
      puntos: 148,
      totalCompras: 1480.00,
      ultimaCompra: "Hoy, 11:35",
    },
    {
      id: "3",
      tipoDoc: "RUC" as const,
      numDoc: "20601234567",
      nombre: "Inversiones Retail SAC",
      email: "facturas@inversionesretail.pe",
      telefono: "(01) 440-2010",
      direccion: "Av. Rivera Navarrete 501 - San Isidro",
      categoria: "Mayorista" as const,
      puntos: 420,
      totalCompras: 4200.00,
      ultimaCompra: "Hoy, 11:15",
    },
    {
      id: "4",
      tipoDoc: "DNI" as const,
      numDoc: "72109845",
      nombre: "Ana Torres Silva",
      email: "ana.torres@outlook.com",
      telefono: "991-445-566",
      direccion: "Av. Benavides 1820 - Miraflores",
      categoria: "VIP / Frecuente" as const,
      puntos: 86,
      totalCompras: 860.00,
      ultimaCompra: "Hoy, 10:42",
    },
  ];
}
