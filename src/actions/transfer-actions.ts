"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";
import { buildGreXml, GreDocumentData, GreItem } from "@/lib/sunat";

export interface TransferItemInput {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  unidadMedida: string;
  pesoKgm?: number;
}

export interface CreateTransferInput {
  sucursalOrigenId?: string;
  sucursalDestinoId: string;
  sucursalDestinoNombre: string;
  direccionDestino: string;
  ubigeoDestino: string;
  modalidadTransporte: "01" | "02";
  motivoTraslado?: "04" | "01" | "02" | "13";
  motivoDescripcion?: string;
  transportista?: {
    ruc: string;
    razonSocial: string;
  };
  conductor?: {
    tipoDoc: "1" | "4";
    numDoc: string;
    nombres: string;
    apellidos: string;
    licenciaConducir: string;
  };
  vehiculo?: {
    placa: string;
    marca?: string;
  };
  items: TransferItemInput[];
}

export interface TransferRecord {
  id: string;
  codigoGuia: string;
  sucursalOrigen: string;
  sucursalDestino: string;
  estado: "en_transito" | "completada" | "cancelada";
  fechaSalida: string;
  horaSalida: string;
  fechaLlegada?: string;
  pesoBrutoKgm: number;
  totalBultos: number;
  modalidadTransporte: "01" | "02";
  transportistaNombre?: string;
  choferNombre?: string;
  vehiculoPlaca?: string;
  hashSunat: string;
  qrString: string;
  items: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidad: number;
    unidadMedida: string;
  }[];
}

export async function createStockTransferAction(
  input: CreateTransferInput
): Promise<{ success: boolean; transfer?: TransferRecord; error?: string }> {
  try {
    const ctx = await getDevContext();

    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Debe agregar al menos un producto a transferir." };
    }

    const serie = "T001";
    const numeroConsecutivo = Math.floor(1 + Math.random() * 80);
    const serieNumero = `${serie}-${numeroConsecutivo.toString().padStart(8, "0")}`;
    const fechaActual = new Date();
    const fechaEmisionStr = fechaActual.toISOString().split("T")[0];

    const pesoTotal = input.items.reduce((acc, it) => acc + (it.pesoKgm || 1) * it.cantidad, 0);
    const totalBultos = input.items.length;

    // XML UBL 2.1 GRE
    const greData: GreDocumentData = {
      tipoComprobante: "09",
      serie,
      numero: numeroConsecutivo,
      fechaEmision: fechaEmisionStr,
      horaEmision: fechaActual.toTimeString().split(" ")[0],
      fechaInicioTraslado: fechaEmisionStr,
      motivoTraslado: input.motivoTraslado || "04",
      motivoDescripcion: input.motivoDescripcion || "Traslado entre establecimientos de la misma empresa",
      modalidadTransporte: input.modalidadTransporte,
      pesoBrutoTotal: Math.max(1, pesoTotal),
      unidadPeso: "KGM",
      totalBultos,
      partida: {
        ubigeo: "150140",
        direccion: "Av. Javier Prado Este 4200, Surco, Lima (Almacén Central)",
      },
      llegada: {
        ubigeo: input.ubigeoDestino || "150122",
        direccion: input.direccionDestino || "Av. Larco 850, Miraflores, Lima",
      },
      remitente: {
        ruc: "20608945123",
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        nombreComercial: "NovaMarket Retail",
        direccion: "Av. Javier Prado Este 4200, Surco, Lima",
        ubigeo: "150140",
        departamento: "LIMA",
        provincia: "LIMA",
        distrito: "SANTIAGO DE SURCO",
      },
      destinatario: {
        tipoDoc: "6",
        numDoc: "20608945123",
        nombre: "NOVAMARKET SUPERMERCADOS S.A.C. - SUCURSAL DESTINO",
      },
      conductor: input.conductor
        ? {
            tipoDoc: input.conductor.tipoDoc,
            numDoc: input.conductor.numDoc,
            nombres: input.conductor.nombres,
            apellidos: input.conductor.apellidos,
            licenciaConducir: input.conductor.licenciaConducir,
          }
        : undefined,
      vehiculo: input.vehiculo
        ? {
            placa: input.vehiculo.placa,
          }
        : undefined,
      transportista: input.transportista
        ? {
            ruc: input.transportista.ruc,
            razonSocial: input.transportista.razonSocial,
          }
        : undefined,
      items: input.items.map((it, idx) => ({
        id: (idx + 1).toString(),
        sku: it.sku,
        descripcion: it.nombre,
        cantidad: it.cantidad,
        unidadMedida: it.unidadMedida === "kg" ? "KGM" : "NIU",
      })),
    };

    const greResult = buildGreXml(greData);
    const transferId = crypto.randomUUID();

    // Database Atomic Transaction (if DB available)
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      try {
        await db.transaction(async (tx) => {
          // 1. Insert Transfer Header
          await tx.insert(schema.transferenciasStock).values({
            id: transferId,
            tenantId: ctx.tenantId,
            sucursalOrigenId: ctx.sucursalId,
            sucursalDestinoId: input.sucursalDestinoId.length === 36 ? input.sucursalDestinoId : ctx.sucursalId,
            estado: "pendiente",
            solicitadoPor: ctx.cajeroId,
          } as any);

          // 2. Insert Transfer Details & Deduct Origin Inventory & Log Kardex
          for (const item of input.items) {
            if (item.productoId && item.productoId.length === 36) {
              await tx.insert(schema.transferenciasStockDetalle).values({
                transferenciaId: transferId,
                productoId: item.productoId,
                cantidad: item.cantidad.toString(),
              } as any);

              // Deduct stock from origin
              await tx
                .update(schema.inventario)
                .set({
                  stockActual: sql`${schema.inventario.stockActual} - ${item.cantidad}`,
                  actualizadoEn: new Date(),
                })
                .where(eq(schema.inventario.productoId, item.productoId));

              // Kardex output log
              await tx.insert(schema.movimientosInventario).values({
                tenantId: ctx.tenantId,
                sucursalId: ctx.sucursalId,
                productoId: item.productoId,
                tipo: "salida",
                cantidad: item.cantidad.toString(),
                motivo: `Despacho GRE ${serieNumero} hacia ${input.sucursalDestinoNombre}`,
                usuarioId: ctx.cajeroId,
              } as any);
            }
          }

          // 3. Security Audit Log
          await tx.insert(schema.auditoriaLog).values({
            tenantId: ctx.tenantId,
            usuarioId: ctx.cajeroId,
            tablaAfectada: "transferencias_stock",
            registroId: transferId,
            accion: "crear",
            datosNuevos: sql`jsonb_build_object('guia_remision', ${serieNumero}, 'destino', ${input.sucursalDestinoNombre}, 'bultos', ${totalBultos}, 'peso_kgm', ${pesoTotal})`,
          });
        });
      } catch (dbErr) {
        console.warn("createStockTransferAction: DB error, fallback simulator:", dbErr);
      }
    }

    revalidatePath("/inventario");
    revalidatePath("/inventario/kardex");
    revalidatePath("/inventario/transferencias");

    const transfer: TransferRecord = {
      id: transferId,
      codigoGuia: serieNumero,
      sucursalOrigen: "Almacén Central (Surco)",
      sucursalDestino: input.sucursalDestinoNombre,
      estado: "en_transito",
      fechaSalida: fechaActual.toLocaleDateString("es-PE"),
      horaSalida: fechaActual.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      pesoBrutoKgm: +pesoTotal.toFixed(2),
      totalBultos,
      modalidadTransporte: input.modalidadTransporte,
      transportistaNombre: input.transportista?.razonSocial,
      choferNombre: input.conductor ? `${input.conductor.nombres} ${input.conductor.apellidos}` : undefined,
      vehiculoPlaca: input.vehiculo?.placa,
      hashSunat: greResult.hash,
      qrString: greResult.qrString,
      items: input.items.map((it) => ({
        productoId: it.productoId,
        sku: it.sku,
        nombre: it.nombre,
        cantidad: it.cantidad,
        unidadMedida: it.unidadMedida,
      })),
    };

    return {
      success: true,
      transfer,
    };
  } catch (err: any) {
    console.error("Error en createStockTransferAction:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al procesar la transferencia y GRE.",
    };
  }
}

export async function receiveStockTransferAction(
  transferId: string,
  codigoGuia: string,
  items: { productoId: string; cantidad: number }[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await getDevContext();

    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      try {
        await db.transaction(async (tx) => {
          // 1. Update transfer status
          if (transferId.length === 36) {
            await tx
              .update(schema.transferenciasStock)
              .set({
                estado: "recibida",
                recibidoPor: ctx.cajeroId,
                recibidoEn: new Date(),
              })
              .where(eq(schema.transferenciasStock.id, transferId));
          }

          // 2. Increase stock in destination branch and add Kardex entrada
          for (const item of items) {
            if (item.productoId && item.productoId.length === 36) {
              await tx
                .update(schema.inventario)
                .set({
                  stockActual: sql`${schema.inventario.stockActual} + ${item.cantidad}`,
                  actualizadoEn: new Date(),
                })
                .where(eq(schema.inventario.productoId, item.productoId));

              await tx.insert(schema.movimientosInventario).values({
                tenantId: ctx.tenantId,
                sucursalId: ctx.sucursalId,
                productoId: item.productoId,
                tipo: "entrada",
                cantidad: item.cantidad.toString(),
                motivo: `Recepción de traslado / GRE ${codigoGuia}`,
                usuarioId: ctx.cajeroId,
              } as any);
            }
          }
        });
      } catch (dbErr) {
        console.warn("receiveStockTransferAction: DB error:", dbErr);
      }
    }

    revalidatePath("/inventario");
    revalidatePath("/inventario/kardex");
    revalidatePath("/inventario/transferencias");

    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al recepcionar el traslado.",
    };
  }
}
