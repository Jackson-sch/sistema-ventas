"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export interface DevContext {
  tenantId: string;
  sucursalId: string;
  cajaId: string;
  cajeroId: string;
}

let cachedContext: DevContext | null = null;
let lastContextFetch = 0;
const CONTEXT_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Contexto de desarrollo con caché en memoria (TTL 5 min)
 * Evita 4 consultas secuenciales repetitivas en cada venta.
 */
export async function getDevContext(): Promise<DevContext> {
  const now = Date.now();
  if (cachedContext && now - lastContextFetch < CONTEXT_TTL) {
    return cachedContext;
  }

  const [tenantsRows, sucursalesRows, cajasRows, usuariosRows] = await Promise.all([
    db.select({ id: schema.tenants.id }).from(schema.tenants).where(eq(schema.tenants.estado, "activo")).limit(1),
    db.select({ id: schema.sucursales.id, tenantId: schema.sucursales.tenantId }).from(schema.sucursales).where(eq(schema.sucursales.estado, "activa")).limit(1),
    db.select({ id: schema.cajas.id }).from(schema.cajas).limit(1),
    db.select({ id: schema.usuarios.id }).from(schema.usuarios).limit(1),
  ]);

  const tenant = tenantsRows[0];
  if (!tenant) throw new Error("No hay un tenant activo en la base de datos.");

  const sucursal = sucursalesRows[0];
  if (!sucursal) throw new Error("El tenant no tiene sucursales activas.");

  const caja = cajasRows[0];
  const cajero = usuariosRows[0];
  if (!cajero) throw new Error("No hay usuarios registrados para el tenant.");

  cachedContext = {
    tenantId: tenant.id,
    sucursalId: sucursal.id,
    cajaId: caja?.id ?? "",
    cajeroId: cajero.id,
  };
  lastContextFetch = now;

  return cachedContext;
}

/**
 * Devuelve la sesión de caja abierta para la caja dada, o null.
 * Si se pasa un id de sesión que es un UUID real, lo usa directo.
 */
export async function resolveSesionCaja(cajaId: string, sesionCajaId?: string) {
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

  activeSessionsCache.set(cajaId, { id: nueva.id, expires: Date.now() + 3 * 60 * 1000 });
  return nueva.id;
}