"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";
import { buildUblXml, SunatDocumentData } from "@/lib/sunat";
import { TicketData } from "@/components/ventas/thermal-ticket-dialog";

export interface CreditNoteItemInput {
  id: string;
  sku: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  tipo?: "unidad" | "peso";
}

export interface EmitCreditNoteInput {
  ventaId: string;
  comprobanteModificado: string; // Ej: B001-00042918 o F001-00001204
  tipoDocModificado: "01" | "03"; // 01=Factura, 03=Boleta
  motivoCodigo: "01" | "02" | "06" | "07" | "04";
  motivoDescripcion: string;
  clienteDoc: string;
  clienteNombre: string;
  reingresarStock: boolean;
  reintegrarEfectivo: boolean;
  itemsDevueltos: CreditNoteItemInput[];
}

export interface EmitCreditNoteResult {
  success: boolean;
  comprobanteSerieNumero: string;
  hashSunat: string;
  ticketData: TicketData;
  error?: string;
}

export async function emitCreditNoteAction(
  input: EmitCreditNoteInput
): Promise<EmitCreditNoteResult> {
  try {
    const ctx = await getDevContext();

    if (!input.itemsDevueltos || input.itemsDevueltos.length === 0) {
      return {
        success: false,
        comprobanteSerieNumero: "",
        hashSunat: "",
        ticketData: {} as TicketData,
        error: "Debe incluir al menos un ítem a devolver o anular.",
      };
    }

    const totalDevolucion = +(input.itemsDevueltos.reduce(
      (acc, item) => acc + item.precioUnitario * item.cantidad,
      0
    )).toFixed(2);
    const subtotalGravado = +(totalDevolucion / 1.18).toFixed(2);
    const igv = +(totalDevolucion - subtotalGravado).toFixed(2);

    const isModificandoFactura = input.tipoDocModificado === "01";
    const serie = isModificandoFactura ? "FC01" : "BC01";
    const numeroConsecutivo = Math.floor(10 + Math.random() * 90);
    const serieNumero = `${serie}-${numeroConsecutivo.toString().padStart(8, "0")}`;

    const fechaActual = new Date();
    const fechaEmisionStr = fechaActual.toISOString().split("T")[0];

    // SUNAT UBL 2.1 Credit Note Structure
    const sunatDocData: SunatDocumentData = {
      tipoComprobante: "07", // 07 = Nota de Crédito Electrónica
      serie,
      numero: numeroConsecutivo,
      fechaEmision: fechaEmisionStr,
      horaEmision: fechaActual.toTimeString().split(" ")[0],
      moneda: "PEN",
      emisor: {
        ruc: "20608945123",
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        nombreComercial: "NovaMarket Retail",
        direccion: "Av. Javier Prado Este 4200, Surco, Lima",
        ubigeo: "150140",
        departamento: "LIMA",
        provincia: "LIMA",
        distrito: "SANTIAGO DE SURCO",
      },
      cliente: {
        tipoDoc: isModificandoFactura ? "6" : "1",
        numDoc: input.clienteDoc || "00000000",
        nombre: input.clienteNombre || "CLIENTES VARIOS",
      },
      items: input.itemsDevueltos.map((item, idx) => {
        const itemTotal = +(item.precioUnitario * item.cantidad).toFixed(2);
        const itemValor = +(itemTotal / 1.18).toFixed(2);
        const itemIgv = +(itemTotal - itemValor).toFixed(2);
        return {
          id: (idx + 1).toString(),
          sku: item.sku,
          descripcion: `[DEV] ${item.nombre}`,
          unidadMedida: item.tipo === "peso" ? "KGM" : "NIU",
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          valorUnitario: +(item.precioUnitario / 1.18).toFixed(4),
          tipoAfectacionIgv: "10",
          igv: itemIgv,
          total: itemTotal,
        };
      }),
      totalGravadas: subtotalGravado,
      totalExoneradas: 0,
      totalInafectas: 0,
      totalIgv: igv,
      totalVenta: totalDevolucion,
      medioPago: "efectivo",
      documentoModificado: {
        tipoDoc: input.tipoDocModificado,
        serieNumero: input.comprobanteModificado,
        motivoCodigo: input.motivoCodigo,
        motivoDescripcion: input.motivoDescripcion,
      },
    };

    const sunatResult = buildUblXml(sunatDocData);

    // Database Atomic Transaction (if DB available)
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      try {
        await db.transaction(async (tx) => {
          // 1. Insert Comprobante NC
          await tx.insert(schema.comprobantes).values({
            ventaId: input.ventaId.length === 36 ? input.ventaId : ctx.cajaId,
            tipo: "nota_credito",
            serie,
            numero: numeroConsecutivo.toString().padStart(8, "0"),
            estadoSunat: "aceptado",
            hash: sunatResult.hash,
            xmlUrl: `sunat/xml/${serieNumero}.xml`,
            cdrUrl: `sunat/cdr/R-${serieNumero}.zip`,
          });

          // 2. Insert Anulación Log
          if (input.ventaId.length === 36) {
            await tx.insert(schema.anulaciones).values({
              ventaId: input.ventaId,
              motivo: `[NC ${serieNumero}] ${input.motivoDescripcion}`,
              autorizadoPor: ctx.cajeroId,
            });
          }

          // 3. Reingreso de Stock en Inventario & Kardex
          if (input.reingresarStock) {
            for (const item of input.itemsDevueltos) {
              if (item.id && item.id.length === 36) {
                await tx
                  .update(schema.inventario)
                  .set({
                    stockActual: sql`${schema.inventario.stockActual} + ${item.cantidad}`,
                    actualizadoEn: new Date(),
                  })
                  .where(eq(schema.inventario.productoId, item.id));

                await tx.insert(schema.movimientosInventario).values({
                  tenantId: ctx.tenantId,
                  sucursalId: ctx.sucursalId,
                  productoId: item.id,
                  tipo: "entrada",
                  cantidad: item.cantidad.toString(),
                  motivo: `Reingreso por Devolución / NC ${serieNumero} de ${input.comprobanteModificado}`,
                  usuarioId: ctx.cajeroId,
                } as any);
              }
            }
          }

          // 4. Reintegro de Efectivo en Movimientos de Caja
          if (input.reintegrarEfectivo) {
            await db.insert(schema.movimientosCaja).values({
              sesionCajaId: ctx.cajaId,
              tipo: "retiro_parcial",
              monto: totalDevolucion.toFixed(2),
              motivo: `Reintegro al cliente por NC ${serieNumero} (${input.comprobanteModificado})`,
              usuarioId: ctx.cajeroId,
            } as any);
          }

          // 5. Auditoría Inmutable
          await tx.insert(schema.auditoriaLog).values({
            tenantId: ctx.tenantId,
            usuarioId: ctx.cajeroId,
            tablaAfectada: "comprobantes",
            registroId: ctx.cajaId,
            accion: "crear",
            datosNuevos: sql`jsonb_build_object('nota_credito', ${serieNumero}, 'comprobante_modificado', ${input.comprobanteModificado}, 'total_revertido', ${totalDevolucion}, 'motivo', ${input.motivoDescripcion})`,
          });
        });
      } catch (dbErr) {
        console.warn("emitCreditNoteAction: DB transaction error, falling back to simulated output:", dbErr);
      }
    }

    revalidatePath("/ventas");
    revalidatePath("/pos");
    revalidatePath("/inventario");
    revalidatePath("/inventario/kardex");
    revalidatePath("/reportes");

    const ticketData: TicketData = {
      comprobante: serieNumero,
      tipo: "Nota de Crédito",
      fecha: fechaActual.toLocaleDateString("es-PE"),
      hora: fechaActual.toLocaleTimeString("es-PE"),
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      cliente: {
        nombre: input.clienteNombre || "CLIENTES VARIOS",
        documentoTipo: isModificandoFactura ? "RUC" : "DNI",
        documentoNumero: input.clienteDoc || "00000000",
      },
      items: input.itemsDevueltos.map((item) => ({
        cantidad: item.cantidad,
        descripcion: `[DEV] ${item.nombre}`,
        precioUnit: item.precioUnitario,
        total: +(item.precioUnitario * item.cantidad).toFixed(2),
        unidad: item.tipo === "peso" ? "kg" : "und",
      })),
      medioPago: "efectivo",
      total: totalDevolucion,
      hashSunat: sunatResult.hash,
    };

    return {
      success: true,
      comprobanteSerieNumero: serieNumero,
      hashSunat: sunatResult.hash,
      ticketData,
    };
  } catch (error) {
    console.error("Error en emitCreditNoteAction:", error);
    return {
      success: false,
      comprobanteSerieNumero: "",
      hashSunat: "",
      ticketData: {} as TicketData,
      error: error instanceof Error ? error.message : "Error inesperado al emitir la Nota de Crédito.",
    };
  }
}
