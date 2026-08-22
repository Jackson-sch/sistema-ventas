"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 4. USUARIOS & ROLES RBAC
export async function getUsersAndRolesData() {
  try {
    if (hasDb()) {
      const [usuariosRows, sucursalesRows, usuariosSucursalesRows, sesionesRows, cajasRows] =
        await Promise.all([
          db
            .select({
              id: schema.usuarios.id,
              nombre: schema.usuarios.nombre,
              email: schema.usuarios.email,
              activo: schema.usuarios.activo,
              rolNombre: schema.roles.nombre,
            })
            .from(schema.usuarios)
            .leftJoin(schema.roles, eq(schema.usuarios.rolId, schema.roles.id)),
          db.select().from(schema.sucursales),
          db.select().from(schema.usuariosSucursales),
          db.select().from(schema.sesionesCaja).orderBy(desc(schema.sesionesCaja.fechaApertura)),
          db.select().from(schema.cajas),
        ]);

      if (usuariosRows && usuariosRows.length > 0) {
        const sucursalMap = new Map(sucursalesRows.map((s) => [s.id, s.nombre]));
        const cajaMap = new Map(cajasRows.map((c) => [c.sucursalId, c.nombre]));
        const sucursalesPorUsuario = new Map<string, string[]>();
        for (const us of usuariosSucursalesRows) {
          const nombre = sucursalMap.get(us.sucursalId);
          if (!nombre) continue;
          const arr = sucursalesPorUsuario.get(us.usuarioId) ?? [];
          arr.push(nombre);
          sucursalesPorUsuario.set(us.usuarioId, arr);
        }
        const ultimoAccesoPorUsuario = new Map<string, Date>();
        for (const s of sesionesRows) {
          if (!ultimoAccesoPorUsuario.has(s.cajeroId)) ultimoAccesoPorUsuario.set(s.cajeroId, s.fechaApertura);
        }

        return usuariosRows.map((u) => {
          const rolLower = (u.rolNombre ?? "").toLowerCase();
          const esAdmin = rolLower.includes("admin") || rolLower.includes("super");
          const sucursales = sucursalesPorUsuario.get(u.id);
          const sucursal =
            esAdmin || !sucursales || sucursales.length === 0
              ? "Todas las sucursales"
              : sucursales.join(", ");
          const esCajero = rolLower.includes("cajero");
          const pinPseudo = String(
            1000 + (parseInt(u.id.replace(/-/g, "").slice(0, 8), 16) % 9000),
          );
          return {
            id: u.id,
            nombre: u.nombre,
            email: u.email,
            rol: (rolLower.includes("admin")
              ? "Administrador General"
              : rolLower.includes("super")
              ? "Supervisor de Tienda"
              : rolLower.includes("almac")
              ? "Encargado de Almacén"
              : "Cajero POS") as "Cajero POS" | "Supervisor de Tienda" | "Administrador General" | "Encargado de Almacén",
            sucursal,
            cajaAsignada: esCajero && sucursales && sucursales.length > 0 ? cajaMap.get(sucursales[0]) ?? undefined : undefined,
            pinSupervisor: pinPseudo,
            estado: u.activo ? ("activo" as const) : ("inactivo" as const),
            ultimoAcceso: ultimoAccesoPorUsuario.get(u.id)
              ? fmtFechaHora(ultimoAccesoPorUsuario.get(u.id)!)
              : "Sin accesos",
          };
        });
      }
    }
  } catch (err) {
    console.warn("getUsersAndRolesData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      nombre: "Carlos Alarcón",
      email: "carlos.alarcon@novamarket.pe",
      rol: "Cajero POS" as const,
      sucursal: "Sucursal Central - Surco",
      cajaAsignada: "Caja 01 - Principal",
      pinSupervisor: "4821",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 11:42",
    },
    {
      id: "2",
      nombre: "María Gómez",
      email: "maria.gomez@novamarket.pe",
      rol: "Cajero POS" as const,
      sucursal: "Sucursal Central - Surco",
      cajaAsignada: "Caja 02 - Rápida",
      pinSupervisor: "9102",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 11:35",
    },
    {
      id: "3",
      nombre: "Marcos Ramos",
      email: "marcos.ramos@novamarket.pe",
      rol: "Supervisor de Tienda" as const,
      sucursal: "Sucursal Central - Surco",
      pinSupervisor: "7741",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 10:15",
    },
    {
      id: "4",
      nombre: "Esteban Vega",
      email: "esteban.vega@novamarket.pe",
      rol: "Encargado de Almacén" as const,
      sucursal: "Todas las sucursales",
      pinSupervisor: "3319",
      estado: "activo" as const,
      ultimoAcceso: "Ayer, 18:30",
    },
    {
      id: "5",
      nombre: "Admin General",
      email: "admin@novamarket.pe",
      rol: "Administrador General" as const,
      sucursal: "Todas las sucursales",
      pinSupervisor: "9999",
      estado: "activo" as const,
      ultimoAcceso: "Hoy, 09:00",
    },
  ];
}
