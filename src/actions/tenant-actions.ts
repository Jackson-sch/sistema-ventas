"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export async function getTenantSettingsData() {
  try {
    const ctx = await getDevContext();
    const [tenant] = await db
      .select({
        razonSocial: schema.tenants.razonSocial,
        ruc: schema.tenants.ruc,
        slug: schema.tenants.slug,
        logoUrl: schema.tenants.logoUrl,
        colorPrimario: schema.tenants.colorPrimario,
        planNombre: schema.tenantPlanes.nombre,
        planTipo: schema.tenantPlanes.tipo,
      })
      .from(schema.tenants)
      .leftJoin(schema.tenantPlanes, eq(schema.tenants.planId, schema.tenantPlanes.id))
      .where(eq(schema.tenants.id, ctx.tenantId))
      .limit(1);

    if (tenant) {
      return {
        razonSocial: tenant.razonSocial,
        ruc: tenant.ruc,
        nombreComercial: "NovaMarket Retail",
        slug: tenant.slug,
        logoUrl: tenant.logoUrl,
        colorPrimario: tenant.colorPrimario || "#0ea5e9",
        planNombre: tenant.planNombre || "Pro",
        planTipo: tenant.planTipo || "pro",
      };
    }
  } catch (err) {
    console.warn("getTenantSettingsData: fallback:", err);
  }

  return {
    razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
    ruc: "20608912345",
    nombreComercial: "NovaMarket Retail",
    slug: "novamarket",
    logoUrl: null as string | null,
    colorPrimario: "#0ea5e9",
    planNombre: "Pro",
    planTipo: "pro" as const,
  };
}

export async function saveTenantSettingsAction(input: {
  razonSocial: string;
  ruc: string;
  nombreComercial?: string;
  telefono?: string;
  email?: string;
}) {
  try {
    const ctx = await getDevContext();

    await db
      .update(schema.tenants)
      .set({
        razonSocial: input.razonSocial,
        ruc: input.ruc,
        actualizadoEn: new Date(),
      })
      .where(eq(schema.tenants.id, ctx.tenantId));

    await db.insert(schema.auditoriaLog).values({
      tenantId: ctx.tenantId,
      usuarioId: ctx.cajeroId,
      tablaAfectada: "tenants",
      registroId: ctx.tenantId,
      accion: "actualizar",
      datosNuevos: { razon_social: input.razonSocial, ruc: input.ruc },
    });

    revalidatePath("/configuracion");
    revalidatePath("/dashboard");

    return { success: true };
  } catch (error: any) {
    console.error("saveTenantSettingsAction:", error);
    return { success: false, error: error.message || "Error al guardar configuración" };
  }
}