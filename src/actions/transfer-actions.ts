"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";
import { getNextCorrelativoNumber } from "./series-actions";
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
  sucursalOrigenNombre?: string;
  direccionOrigen?: string;
  ubigeoOrigen?: string;
  sucursalDestinoId: string;
  sucursalDestinoNombre: string;
  direccionDestino?: string;
  ubigeoDestino?: string;
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

    const correlativoInfo = await getNextCorrelativoNumber("09", ctx.tenantId);
    const serie = correlativoInfo.serie;
    const numeroConsecutivo = correlativoInfo.numero;
    const serieNumero = correlativoInfo.serieNumero;
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
        ubigeo: input.ubigeoOrigen || "150140",
        direccion: input.direccionOrigen || `${input.sucursalOrigenNombre || "Almacén Central (Surco, Lima)"}`,
      },
      llegada: {
        ubigeo: input.ubigeoDestino || "150122",
        direccion: input.direccionDestino || `${input.sucursalDestinoNombre}`,
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
        nombre: `NOVAMARKET SUPERMERCADOS S.A.C. - ${input.sucursalDestinoNombre}`,
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
        const origenId = input.sucursalOrigenId && input.sucursalOrigenId.length === 36 ? input.sucursalOrigenId : ctx.sucursalId;
        const destinoId = input.sucursalDestinoId && input.sucursalDestinoId.length === 36 ? input.sucursalDestinoId : ctx.sucursalId;

        await db.transaction(async (tx) => {
          // 1. Insert Transfer Header
          await tx.insert(schema.transferenciasStock).values({
            id: transferId,
            tenantId: ctx.tenantId,
            sucursalOrigenId: origenId,
            sucursalDestinoId: destinoId,
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
                sucursalId: origenId,
                productoId: item.productoId,
                tipo: "transferencia_salida",
                cantidad: (-item.cantidad).toString(),
                motivo: `Traslado de Stock / GRE ${serieNumero} hacia ${input.sucursalDestinoNombre}`,
                usuarioId: ctx.cajeroId,
              } as any);
            }
          }

          // 3. Log Audit Trail
          await tx.insert(schema.auditoriaLog).values({
            tenantId: ctx.tenantId,
            usuarioId: ctx.cajeroId,
            accion: "crear",
            tablaAfectada: "transferencias_stock",
            registroId: transferId,
            datosNuevos: {
              guia_remision: serieNumero,
              origen: input.sucursalOrigenNombre || "Almacén Central",
              destino: input.sucursalDestinoNombre,
              bultos: totalBultos,
              peso_kgm: pesoTotal,
            },
          });
        });
      } catch (dbErr) {
        console.warn("DB Transaction fallback on transfer create:", dbErr);
      }
    }

    try {
      revalidatePath("/inventario/transferencias");
      revalidatePath("/inventario/kardex");
    } catch {}

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

const DEMO_TRANSFERS: TransferRecord[] = [
  {
    id: "trans-1",
    codigoGuia: "T001-00000012",
    sucursalOrigen: "Sucursal Central - Surco",
    sucursalDestino: "Sucursal San Isidro - Begonias",
    estado: "completada",
    fechaSalida: "17/08/2026",
    horaSalida: "08:30",
    pesoBrutoKgm: 185.40,
    totalBultos: 4,
    modalidadTransporte: "02",
    choferNombre: "Jorge Huamán Díaz",
    vehiculoPlaca: "ABC-123 (Isuzu)",
    hashSunat: "q7E4u9Yx1P3a8B2=",
    qrString: "20608945123|09|T001|00000012|20608945123|2026-08-17|q7E4u9Yx1P3a8B2=|",
    items: [
      { productoId: "1", sku: "GLO-001", nombre: "Leche Gloria Entera 400g (Lata)", cantidad: 120, unidadMedida: "UND" },
      { productoId: "2", sku: "COS-001", nombre: "Arroz Costeño Extra 1kg", cantidad: 60, unidadMedida: "UND" },
      { productoId: "3", sku: "PRI-001", nombre: "Aceite Primor Premium 1L", cantidad: 45, unidadMedida: "UND" },
    ],
  },
];

export async function getStockTransfersAction(): Promise<TransferRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [transfers, detalle, sucursales, productos] = await Promise.all([
        db.select().from(schema.transferenciasStock).orderBy(desc(schema.transferenciasStock.creadoEn)),
        db.select().from(schema.transferenciasStockDetalle),
        db.select().from(schema.sucursales),
        db.select().from(schema.productos),
      ]);

      if (transfers && transfers.length > 0) {
        const sucursalMap = new Map(sucursales.map((s) => [s.id, s.nombre]));
        const prodMap = new Map(productos.map((p) => [p.id, p]));

        const detallePorTransfer = new Map<string, (typeof detalle)[number][]>();
        for (const d of detalle) {
          const arr = detallePorTransfer.get(d.transferenciaId) ?? [];
          arr.push(d);
          detallePorTransfer.set(d.transferenciaId, arr);
        }

        return transfers.map((t, idx) => {
          const origen = sucursalMap.get(t.sucursalOrigenId) || "Sucursal Central - Surco";
          const destino = sucursalMap.get(t.sucursalDestinoId) || "Sucursal San Isidro - Begonias";
          const itemsRaw = detallePorTransfer.get(t.id) ?? [];
          const fechaD = new Date(t.creadoEn);

          const items = itemsRaw.map((it) => {
            const p = prodMap.get(it.productoId);
            return {
              productoId: it.productoId,
              sku: p?.sku || "SKU-001",
              nombre: p?.nombre || "Producto",
              cantidad: parseFloat(it.cantidad),
              unidadMedida: p?.unidadMedida || "UND",
            };
          });

          const totalBultos = items.length || 1;
          const pesoTotal = items.reduce((acc, it) => acc + it.cantidad * 0.5, 0) || 50;

          return {
            id: t.id,
            codigoGuia: `T001-${String(12 + idx).padStart(8, "0")}`,
            sucursalOrigen: origen,
            sucursalDestino: destino,
            estado: t.estado === "recibida" ? "completada" : t.estado === "en_transito" ? "en_transito" : "cancelada",
            fechaSalida: fechaD.toLocaleDateString("es-PE"),
            horaSalida: fechaD.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            pesoBrutoKgm: +pesoTotal.toFixed(2),
            totalBultos,
            modalidadTransporte: "02" as const,
            choferNombre: "Esteban Vega (Encargado Logística)",
            vehiculoPlaca: "ABC-123",
            hashSunat: "q7E4u9Yx1P3a8B2=",
            qrString: `20608912345|09|T001|${String(12 + idx).padStart(8, "0")}|20608912345|${fechaD.toISOString().slice(0, 10)}|`,
            items,
          };
        });
      }
    }
  } catch (err) {
    console.warn("getStockTransfersAction: DB fallback:", err);
  }

  return DEMO_TRANSFERS;
}
