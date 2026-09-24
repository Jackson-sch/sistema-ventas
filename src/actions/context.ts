"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export interface DevContext {
  tenantId: string;
  sucursalId: string;
  cajaId: string;
  cajaNombre?: string;
  cajeroId: string;
  cajeroNombre?: string;
}

let cachedContext: DevContext | null = null;
let lastContextFetch = 0;
const CONTEXT_TTL = 5 * 60 * 1000; // 5 minutos

const DEFAULT_DEV_CONTEXT: DevContext = {
  tenantId: "00000000-0000-0000-0000-000000000001",
  sucursalId: "00000000-0000-0000-0000-000000000001",
  cajaId: "00000000-0000-0000-0000-000000000001",
  cajaNombre: "Caja 01 - Principal",
  cajeroId: "00000000-0000-0000-0000-000000000001",
  cajeroNombre: "Carlos Alarcón",
};

/**
 * Contexto de desarrollo con caché en memoria (TTL 5 min)
 * Evita 4 consultas secuenciales repetitivas en cada venta.
 */
export async function getDevContext(): Promise<DevContext> {
  const now = Date.now();
  if (cachedContext && now - lastContextFetch < CONTEXT_TTL) {
    return cachedContext;
  }

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [tenantsRows, sucursalesRows, cajasRows, usuariosRows] = await Promise.all([
        db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.estado, "activo")).limit(1),
        db.select({ id: schema.sucursales.id, tenantId: schema.sucursales.tenantId }).from(schema.sucursales).where(eq(schema.sucursales.estado, "activa")).limit(1),
        db.select({ id: schema.cajas.id, nombre: schema.cajas.nombre }).from(schema.cajas).limit(1),
        db.select({ id: schema.usuarios.id, nombre: schema.usuarios.nombre }).from(schema.usuarios).limit(1),
      ]);

      const tenant = tenantsRows[0];
      const sucursal = sucursalesRows[0];
      const caja = cajasRows[0];
      const cajero = usuariosRows[0];

      if (tenant && sucursal && cajero) {
        cachedContext = {
          tenantId: tenant.id,
          sucursalId: sucursal.id,
          cajaId: caja?.id ?? "00000000-0000-0000-0000-000000000001",
          cajaNombre: caja?.nombre ?? "Caja 01 - Principal",
          cajeroId: cajero.id,
          cajeroNombre: cajero.nombre ?? "Carlos Alarcón",
        };
        lastContextFetch = now;
        return cachedContext;
      }
    }
  } catch (err) {
    console.warn("getDevContext: Database connection fallback used:", err);
  }

  return DEFAULT_DEV_CONTEXT;
}

/**
 * Devuelve la sesión de caja abierta para la caja dada, o null.
 * Si se pasa un id de sesión que es un UUID real, lo usa directo.
 */
export async function resolveSesionCaja(cajaId: string, sesionCajaId?: string) {
  try {
    if (sesionCajaId) {
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (UUID_RE.test(sesionCajaId)) {
        const [sesion] = await db
          .select({ id: schema.sesionesCaja.id, estado: schema.sesionesCaja.estado })
          .from(schema.sesionesCaja)
          .where(eq(schema.sesionesCaja.id, sesionCajaId))
          .limit(1);
        if (sesion) return sesion;
      }
    }

    const [abierta] = await db
      .select({ id: schema.sesionesCaja.id, estado: schema.sesionesCaja.estado })
      .from(schema.sesionesCaja)
      .where(and(eq(schema.sesionesCaja.cajaId, cajaId), eq(schema.sesionesCaja.estado, "abierta")))
      .orderBy(schema.sesionesCaja.fechaApertura)
      .limit(1);

    return abierta ?? null;
  } catch (err) {
    console.warn("resolveSesionCaja: Error querying session, returning null fallback:", err);
    return null;
  }
}

const activeSessionsCache = new Map<string, { id: string; expires: number }>();

/**
 * Busca una sesión abierta para la caja con caché de 3 minutos; si no existe, la crea con
 * monto de apertura 0. Devuelve la sesión resultante de forma instantánea.
 */
export async function ensureSesionAbierta(cajaId: string, cajeroId: string): Promise<string> {
  const cached = activeSessionsCache.get(cajaId);
  if (cached && Date.now() < cached.expires) {
    return cached.id;
  }

  try {
    const existente = await resolveSesionCaja(cajaId);
    if (existente) {
      activeSessionsCache.set(cajaId, { id: existente.id, expires: Date.now() + 3 * 60 * 1000 });
      return existente.id;
    }

    const [nueva] = await db
      .insert(schema.sesionesCaja)
      .values({
        cajaId,
        cajeroId,
        montoApertura: "0",
        estado: "abierta",
      })
      .returning({ id: schema.sesionesCaja.id });

    if (nueva) {
      activeSessionsCache.set(cajaId, { id: nueva.id, expires: Date.now() + 3 * 60 * 1000 });
      return nueva.id;
    }
  } catch (err) {
    console.warn("ensureSesionAbierta: Database fallback session id used:", err);
  }

  const fallbackId = "00000000-0000-0000-0000-000000000001";
  activeSessionsCache.set(cajaId, { id: fallbackId, expires: Date.now() + 3 * 60 * 1000 });
  return fallbackId;
}