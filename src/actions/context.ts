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

/**
 * Contexto de desarrollo: la app aún no tiene sesión autenticada
 * (login Supabase), así que las Server Actions resuelven el primer
 * tenant activo, su sucursal principal, la primera caja y un cajero
 * demo para poder persistir datos reales durante las pruebas.
 */
export async function getDevContext(): Promise<DevContext> {
  const [tenant] = await db
    .select({ id: schema.tenants.id })
    .from(schema.tenants)
    .where(eq(schema.tenants.estado, "activo"))
    .limit(1);

  if (!tenant) {
    throw new Error("No hay un tenant activo en la base de datos. Ejecuta el seed primero.");
  }

  const [sucursal] = await db
    .select({ id: schema.sucursales.id })
    .from(schema.sucursales)
    .where(and(eq(schema.sucursales.tenantId, tenant.id), eq(schema.sucursales.estado, "activa")))
    .orderBy(schema.sucursales.esPrincipal)
    .limit(1);

  if (!sucursal) {
    throw new Error("El tenant no tiene sucursales activas.");
  }

  const [caja] = await db
    .select({ id: schema.cajas.id })
    .from(schema.cajas)
    .where(eq(schema.cajas.sucursalId, sucursal.id))
    .limit(1);

  const [cajero] = await db
    .select({ id: schema.usuarios.id })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.tenantId, tenant.id))
    .limit(1);

  if (!cajero) {
    throw new Error("No hay usuarios registrados para el tenant.");
  }

  return {
    tenantId: tenant.id,
    sucursalId: sucursal.id,
    cajaId: caja?.id ?? "",
    cajeroId: cajero.id,
  };
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

/**
 * Busca una sesión abierta para la caja; si no existe, la crea con
 * monto de apertura 0. Devuelve la sesión resultante.
 */
export async function ensureSesionAbierta(cajaId: string, cajeroId: string): Promise<string> {
  const existente = await resolveSesionCaja(cajaId);
  if (existente) return existente.id;

  const [nueva] = await db
    .insert(schema.sesionesCaja)
    .values({
      cajaId,
      cajeroId,
      montoApertura: "0",
      estado: "abierta",
    })
    .returning({ id: schema.sesionesCaja.id });

  return nueva.id;
}