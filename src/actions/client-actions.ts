"use server";

import { db } from "@/db";
import { clientes, movimientosPuntos, programaPuntos, auditoriaLog } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export interface UpsertClientInput {
  id?: string;
  tipoDoc: "DNI" | "RUC" | "CE";
  numDoc: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  categoria: "Estándar" | "VIP / Frecuente" | "Mayorista";
  puntos: number;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function mapTipoDoc(tipoDoc: "DNI" | "RUC" | "CE"): "dni" | "ruc" | "ce" | "pasaporte" {
  return tipoDoc === "RUC" ? "ruc" : tipoDoc === "CE" ? "ce" : "dni";
}

export async function upsertClientAction(input: UpsertClientInput) {
  try {
    const ctx = await getDevContext();
    const esNuevo = !input.id || !UUID_RE.test(input.id);
    const clientId = esNuevo ? crypto.randomUUID() : input.id!;

    await db.transaction(async (tx) => {
      if (esNuevo) {
        await tx.insert(clientes).values({
          id: clientId,
          tenantId: ctx.tenantId,
          tipoDocumento: mapTipoDoc(input.tipoDoc),
          numeroDocumento: input.numDoc,
          nombre: input.nombre,
          telefono: input.telefono || null,
          email: input.email || null,
          direccion: input.direccion || null,
        });
      } else {
        await tx
          .update(clientes)
          .set({
            tipoDocumento: mapTipoDoc(input.tipoDoc),
            numeroDocumento: input.numDoc,
            nombre: input.nombre,
            telefono: input.telefono || null,
            email: input.email || null,
            direccion: input.direccion || null,
          })
          .where(eq(clientes.id, clientId as string));
      }

      await tx
        .insert(programaPuntos)
        .values({ clienteId: clientId as string, puntosAcumulados: input.puntos })
        .onConflictDoUpdate({
          target: programaPuntos.clienteId,
          set: { puntosAcumulados: input.puntos, actualizadoEn: new Date() },
        });

      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "clientes",
        registroId: clientId as string,
        accion: (esNuevo ? "crear" : "actualizar") as "crear" | "actualizar",
        datosNuevos: { nombre: input.nombre, documento: input.numDoc },
      });
    });

    revalidatePath("/clientes");
    revalidatePath("/pos");

    return {
      success: true,
      clientId,
      nombre: input.nombre,
    };
  } catch (error: any) {
    console.error("Error upsert client:", error);
    return {
      success: false,
      error: error.message || "Error al guardar cliente",
    };
  }
}

export async function redeemPointsAction(clientId: string, puntosCanjeados: number, descuento: number) {
  try {
    const ctx = await getDevContext();
    const [cliente] = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.id, clientId))
      .limit(1);

    if (!cliente) {
      throw new Error("El cliente no existe.");
    }

    const [puntos] = await db
      .select({ puntos: programaPuntos.puntosAcumulados })
      .from(programaPuntos)
      .where(eq(programaPuntos.clienteId, clientId))
      .limit(1);

    const puntosActuales = puntos?.puntos ?? 0;
    if (puntosCanjeados > puntosActuales) {
      throw new Error(`El cliente solo tiene ${puntosActuales} puntos disponibles.`);
    }

    const movimientoId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      await tx
        .update(programaPuntos)
        .set({
          puntosAcumulados: sql`GREATEST(${programaPuntos.puntosAcumulados} - ${puntosCanjeados}, 0)`,
          actualizadoEn: new Date(),
        })
        .where(eq(programaPuntos.clienteId, clientId));

      await tx.insert(movimientosPuntos).values({
        id: movimientoId,
        clienteId: clientId,
        puntos: -puntosCanjeados,
        motivo: `Canje de puntos (descuento S/ ${descuento.toFixed(2)})`,
      });

      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "movimientos_puntos",
        registroId: movimientoId,
        accion: "crear",
        datosNuevos: { cliente: clientId, puntos: -puntosCanjeados },
      });
    });

    revalidatePath("/clientes");
    revalidatePath("/pos");

    return {
      success: true,
      movimientoId,
      descuento,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al canjear puntos",
    };
  }
}

export async function deleteClientAction(id: string, nombre: string) {
  try {
    const ctx = await getDevContext();

    await db.transaction(async (tx) => {
      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "clientes",
        registroId: id,
        accion: "eliminar",
        datosNuevos: { nombre },
      });

      await tx.delete(clientes).where(eq(clientes.id, id));
    });

    revalidatePath("/clientes");

    return {
      success: true,
      id,
    };
  } catch (error: any) {
    return {
      success: false,
      error:
        error.message ||
        "Error al eliminar cliente. Verifica que no tenga ventas asociadas.",
    };
  }
}