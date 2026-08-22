"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, sql, gte } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

// 3. SUCURSALES & CAJAS
export async function getBranchesAndRegistersData() {
  try {
    if (hasDb()) {
      const [sucursalesRows, cajasRows, sesionesRows, ventasHoyRows] = await Promise.all([
        db.select().from(schema.sucursales),
        db.select().from(schema.cajas),
        db
          .select({
            id: schema.sesionesCaja.id,
            cajaId: schema.sesionesCaja.cajaId,
            estado: schema.sesionesCaja.estado,
            cajeroNombre: schema.usuarios.nombre,
            fechaApertura: schema.sesionesCaja.fechaApertura,
          })
          .from(schema.sesionesCaja)
          .innerJoin(schema.usuarios, eq(schema.sesionesCaja.cajeroId, schema.usuarios.id))
          .where(eq(schema.sesionesCaja.estado, "abierta"))
          .orderBy(desc(schema.sesionesCaja.fechaApertura)),
        db
          .select({
            cajaId: schema.ventas.cajaId,
            total: sql<number>`coalesce(sum(${schema.ventas.total}), 0)`,
          })
          .from(schema.ventas)
          .where(gte(schema.ventas.creadoEn, startOfToday()))
          .groupBy(schema.ventas.cajaId),
      ]);

      if (sucursalesRows && sucursalesRows.length > 0) {
        const sesionPorCaja = new Map<string, (typeof sesionesRows)[number]>();
        for (const s of sesionesRows) {
          if (!sesionPorCaja.has(s.cajaId)) sesionPorCaja.set(s.cajaId, s);
        }
        const totalHoyPorCaja = new Map(ventasHoyRows.map((v) => [v.cajaId, parseFloat(String(v.total))]));

        const seenBranchNames = new Set<string>();
        const uniqueBranches = sucursalesRows.filter((s) => {
          if (seenBranchNames.has(s.nombre)) return false;
          seenBranchNames.add(s.nombre);
          return true;
        });

        uniqueBranches.sort((a, b) => {
          if (a.esPrincipal && !b.esPrincipal) return -1;
          if (!a.esPrincipal && b.esPrincipal) return 1;
          return a.nombre.localeCompare(b.nombre);
        });

        return uniqueBranches.map((s, bIdx) => {
          const rawCajas = cajasRows.filter((c) => c.sucursalId === s.id);
          const seenCajaNames = new Set<string>();
          const matchedCajas = rawCajas.filter((c) => {
            if (seenCajaNames.has(c.nombre)) return false;
            seenCajaNames.add(c.nombre);
            return true;
          });

          return {
            id: s.id,
            nombre: s.nombre,
            codigoSunat: `000${(bIdx + 1).toString()}`,
            direccion: s.direccion || "Dirección Fiscal Principal",
            telefono: s.telefono || "(01) 619-8000",
            esPrincipal: s.esPrincipal,
            activo: s.estado === "activa",
            cajasCount: matchedCajas.length,
            cajas: matchedCajas.map((c, cIdx) => {
              const sesion = sesionPorCaja.get(c.id);
              const b = bIdx + 1;
              const cc = cIdx + 1;
              return {
                id: c.id,
                numero: cc.toString().padStart(2, "0"),
                nombre: c.nombre,
                tipo: c.tipo === "autoservicio" ? ("Autoservicio" as const) : ("Principal" as const),
                serieBoleta: `B0${b}${cc}`,
                serieFactura: `F0${b}${cc}`,
                serieNC: `BC${b}${cc}`,
                estado: sesion ? ("abierta" as const) : ("cerrada" as const),
                cajeroActual: sesion?.cajeroNombre,
                turnoActual: sesion ? `#${sesion.id.substring(0, 4).toUpperCase()}` : undefined,
                ipImpresora: c.impresoraId || "192.168.1.150",
                totalHoy: totalHoyPorCaja.get(c.id) ?? 0,
              };
            }),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getBranchesAndRegistersData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      nombre: "Sucursal Central - Surco",
      codigoSunat: "0001",
      direccion: "Av. Javier Prado Este 4200 - Santiago de Surco - Lima",
      telefono: "(01) 619-8000",
      esPrincipal: true,
      activo: true,
      cajasCount: 3,
      cajas: [
        {
          id: "caja-1",
          numero: "01",
          nombre: "Caja 01 - Principal",
          tipo: "Principal" as const,
          serieBoleta: "B001",
          serieFactura: "F001",
          serieNC: "BC01",
          estado: "abierta" as const,
          cajeroActual: "Carlos Alarcón",
          turnoActual: "#124",
          ipImpresora: "192.168.1.150",
          totalHoy: 1245.80,
        },
        {
          id: "caja-2",
          numero: "02",
          nombre: "Caja 02 - Rápida",
          tipo: "Rápida" as const,
          serieBoleta: "B002",
          serieFactura: "F002",
          serieNC: "BC02",
          estado: "abierta" as const,
          cajeroActual: "María Gómez",
          turnoActual: "#089",
          ipImpresora: "192.168.1.151",
          totalHoy: 890.40,
        },
        {
          id: "caja-3",
          numero: "03",
          nombre: "Caja 03 - Autoservicio",
          tipo: "Autoservicio" as const,
          serieBoleta: "B003",
          serieFactura: "F003",
          serieNC: "BC03",
          estado: "cerrada" as const,
          ipImpresora: "USB_DIRECT",
          totalHoy: 430.00,
        },
      ],
    },
    {
      id: "2",
      nombre: "Sucursal San Isidro - Begonias",
      codigoSunat: "0002",
      direccion: "Calle Las Begonias 441 - San Isidro - Lima",
      telefono: "(01) 619-8001",
      esPrincipal: false,
      activo: true,
      cajasCount: 2,
      cajas: [
        {
          id: "caja-4",
          numero: "01",
          nombre: "Caja 01 - Principal Begonias",
          tipo: "Principal" as const,
          serieBoleta: "B004",
          serieFactura: "F004",
          serieNC: "BC04",
          estado: "abierta" as const,
          cajeroActual: "Diego Flores",
          turnoActual: "#045",
          ipImpresora: "192.168.2.150",
          totalHoy: 640.20,
        },
      ],
    },
  ];
}
