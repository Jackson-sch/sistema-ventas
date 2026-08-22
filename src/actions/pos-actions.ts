"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sql } from "drizzle-orm";
import { getDevContext, ensureSesionAbierta } from "./context";
import { getNextCorrelativoNumber } from "./series-actions";
import { buildUblXml, SunatDocumentData } from "@/lib/sunat";
import { TicketData } from "@/components/ventas/thermal-ticket-dialog";

export interface SaleItemInput {
  id: string;
  sku: string;
  nombre: string;
  precio: number;
  cantidad: number;
  tipo: "unidad" | "peso";
}

export interface SplitPaymentInput {
  medioPago: "efectivo" | "tarjeta" | "yape" | "plin" | "transferencia";
  monto: number;
  referencia?: string;
  montoRecibido?: number;
  vuelto?: number;
}

export interface SaleTransactionInput {
  docType: "boleta" | "factura";
  clienteId?: string;
  clienteDoc: string;
  clienteNombre: string;
  medioPago: "efectivo" | "tarjeta" | "yape" | "plin" | "transferencia" | "mixto" | "credito";
  pagos?: SplitPaymentInput[];
  montoRecibido?: number;
  vuelto?: number;
  items: SaleItemInput[];
}

export interface SaleTransactionResult {
  success: boolean;
  ventaId: string;
  comprobanteSerieNumero: string;
  ticketData: TicketData;
  error?: string;
}

export async function completeSaleTransactionAction(
  input: SaleTransactionInput
): Promise<SaleTransactionResult> {
  try {
    const ctx = await getDevContext();

    if (!input.items || input.items.length === 0) {
      return {
        success: false,
        ventaId: "",
        comprobanteSerieNumero: "",
        ticketData: {} as TicketData,
        error: "El carrito no contiene productos.",
      };
    }

    const totalVenta = input.items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
    const subtotalGravado = +(totalVenta / 1.18).toFixed(2);
    const igv = +(totalVenta - subtotalGravado).toFixed(2);

    const isFactura = input.docType === "factura";
    const tipoDocSunat = isFactura ? "01" : "03";
    const databaseConfigured = Boolean(
      process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")
    );
    const missingSkuItems = input.items.filter((item) => !item.id || item.id.length !== 36);

    // Estas tres operaciones no dependen entre sí. Iniciarlas juntas evita sumar
    // su latencia de red antes de abrir la transacción de venta.
    const correlativoPromise = getNextCorrelativoNumber(tipoDocSunat, ctx.tenantId);
    const sesionCajaPromise = databaseConfigured
      ? ensureSesionAbierta(ctx.cajaId, ctx.cajeroId)
      : null;
    const productsPromise = databaseConfigured && missingSkuItems.length > 0
      ? db
          .select({ id: schema.productos.id, sku: schema.productos.sku })
          .from(schema.productos)
          .where(sql`${schema.productos.sku} IN ${missingSkuItems.map((item) => item.sku)}`)
      : null;

    const correlativoInfo = await correlativoPromise;
    const serie = correlativoInfo.serie;
    const numeroConsecutivo = correlativoInfo.numero;
    const serieNumero = correlativoInfo.serieNumero;

    const fechaActual = new Date();
    const fechaEmisionStr = fechaActual.toISOString().split("T")[0];

    // SUNAT UBL 2.1 Generation
    const sunatDocData: SunatDocumentData = {
      tipoComprobante: isFactura ? "01" : "03",
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
        tipoDoc: isFactura ? "6" : "1",
        numDoc: input.clienteDoc || "00000000",
        nombre: input.clienteNombre || "CLIENTES VARIOS",
      },
      items: input.items.map((item, idx) => {
        const itemTotal = item.precio * item.cantidad;
        const itemValor = +(itemTotal / 1.18).toFixed(2);
        const itemIgv = +(itemTotal - itemValor).toFixed(2);
        return {
          id: (idx + 1).toString(),
          sku: item.sku,
          descripcion: item.nombre,
          unidadMedida: item.tipo === "peso" ? "KGM" : "NIU",
          cantidad: item.cantidad,
          precioUnitario: item.precio,
          valorUnitario: +(item.precio / 1.18).toFixed(4),
          tipoAfectacionIgv: "10",
          igv: itemIgv,
          total: itemTotal,
        };
      }),
      totalGravadas: subtotalGravado,
      totalExoneradas: 0,
      totalInafectas: 0,
      totalIgv: igv,
      totalVenta,
      medioPago: input.medioPago === "mixto" ? "efectivo" : input.medioPago === "credito" ? "transferencia" : input.medioPago,
    };

    const sunatResult = buildUblXml(sunatDocData);
    const ventaId = crypto.randomUUID();
    const puntosGanados = Math.floor(totalVenta / 10);

    // Normalize effective payment list
    const effectivePayments: SplitPaymentInput[] =
      input.pagos && input.pagos.length > 0
        ? input.pagos
        : [
            {
              medioPago: input.medioPago === "mixto" ? "efectivo" : (input.medioPago as any),
              monto: totalVenta,
              referencia: undefined,
              montoRecibido: input.montoRecibido,
              vuelto: input.vuelto,
            },
          ];

    // Database Atomic Transaction (if DB available)
    if (databaseConfigured) {
      try {
        const [sesionCajaId, dbProducts] = await Promise.all([
          sesionCajaPromise!,
          productsPromise ?? Promise.resolve([]),
        ]);

        const skuToIdMap = new Map<string, string>();
        for (const product of dbProducts) {
          skuToIdMap.set(product.sku.toLowerCase(), product.id);
        }

        const detalleValues: any[] = [];
        const kardexValues: any[] = [];
        const stockByProduct = new Map<string, number>();

        for (const item of input.items) {
          const validProdId =
            item.id && item.id.length === 36
              ? item.id
              : skuToIdMap.get(item.sku.toLowerCase());

          if (validProdId) {
            detalleValues.push({
              ventaId,
              productoId: validProdId,
              cantidad: item.cantidad.toString(),
              precioUnitario: item.precio.toString(),
              descuento: "0.00",
              subtotal: (item.precio * item.cantidad).toFixed(2),
            });

            kardexValues.push({
              tenantId: ctx.tenantId,
              sucursalId: ctx.sucursalId,
              productoId: validProdId,
              tipo: "salida" as const,
              cantidad: item.cantidad.toString(),
              motivo: `Venta POS ${serieNumero}`,
              usuarioId: ctx.cajeroId,
            });

            stockByProduct.set(
              validProdId,
              (stockByProduct.get(validProdId) ?? 0) + item.cantidad
            );
          }
        }

        const pagosValues = effectivePayments.map((p) => ({
          ventaId,
          medioPago: p.medioPago === "transferencia" ? "plin" : p.medioPago,
          monto: p.monto.toFixed(2),
          referencia: p.referencia || (p.medioPago !== "efectivo" ? `OP-${Date.now().toString().slice(-6)}` : null),
        }));

        await db.transaction(async (tx) => {
          // 1. Insert Venta principal
          await tx.insert(schema.ventas).values({
            id: ventaId,
            tenantId: ctx.tenantId,
            sucursalId: ctx.sucursalId,
            cajaId: ctx.cajaId,
            sesionCajaId,
            cajeroId: ctx.cajeroId,
            clienteId: input.clienteId && input.clienteId.length === 36 ? input.clienteId : null,
            subtotal: subtotalGravado.toString(),
            descuento: "0.00",
            igv: igv.toString(),
            total: totalVenta.toString(),
            estado: "completada",
          });

          // 2. Batch Insert Pagos
          if (pagosValues.length > 0) {
            await tx.insert(schema.ventasPagos).values(pagosValues);
          }

          // 3. Batch Insert Detalle de Venta
          if (detalleValues.length > 0) {
            await tx.insert(schema.ventasDetalle).values(detalleValues);
          }

          // 4. Batch Insert Kardex de Movimientos
          if (kardexValues.length > 0) {
            await tx.insert(schema.movimientosInventario).values(kardexValues);
          }

          // 5. Un solo UPDATE para todo el carrito. Agrupar también evita
          // bloquear repetidamente el mismo producto cuando aparece dos veces.
          if (stockByProduct.size > 0) {
            const stockValues = Array.from(stockByProduct, ([productoId, cantidad]) =>
              sql`(${productoId}::uuid, ${cantidad}::numeric)`
            );

            await tx.execute(sql`
              UPDATE "inventario" AS inventory
              SET
                "stock_actual" = GREATEST(0, inventory."stock_actual" - updates.cantidad),
                "actualizado_en" = NOW()
              FROM (VALUES ${sql.join(stockValues, sql`, `)}) AS updates(producto_id, cantidad)
              WHERE inventory."producto_id" = updates.producto_id
                AND inventory."sucursal_id" = ${ctx.sucursalId}::uuid
            `);
          }

          // 6. Insert Comprobante Electrónico
          await tx.insert(schema.comprobantes).values({
            ventaId,
            tipo: isFactura ? "factura" : "boleta",
            serie,
            numero: numeroConsecutivo.toString().padStart(8, "0"),
            estadoSunat: "aceptado",
            hash: sunatResult.hash,
            xmlUrl: `sunat/xml/${serieNumero}.xml`,
            cdrUrl: `sunat/cdr/R-${serieNumero}.zip`,
          });

          // 7. Puntos de fidelización (si aplica)
          if (input.clienteId && input.clienteId.length === 36 && puntosGanados > 0) {
            await tx
              .insert(schema.programaPuntos)
              .values({ clienteId: input.clienteId, puntosAcumulados: puntosGanados })
              .onConflictDoUpdate({
                target: schema.programaPuntos.clienteId,
                set: {
                  puntosAcumulados: sql`${schema.programaPuntos.puntosAcumulados} + ${puntosGanados}`,
                  actualizadoEn: new Date(),
                },
              });

            await tx.insert(schema.movimientosPuntos).values({
              clienteId: input.clienteId,
              ventaId,
              puntos: puntosGanados,
              motivo: `Ganados por compra ${serieNumero}`,
            });
          }

          // 8. Auditoría inmutable
          await tx.insert(schema.auditoriaLog).values({
            tenantId: ctx.tenantId,
            usuarioId: ctx.cajeroId,
            tablaAfectada: "ventas",
            registroId: ventaId,
            accion: "crear",
            datosNuevos: {
              comprobante: serieNumero,
              total: totalVenta,
              itemsCount: input.items.length,
              pagos: effectivePayments,
            },
          });
        });
      } catch (dbErr) {
        console.error("completeSaleTransactionAction: Database write error:", dbErr);
        return {
          success: false,
          ventaId: "",
          comprobanteSerieNumero: "",
          ticketData: {} as TicketData,
          error: dbErr instanceof Error ? dbErr.message : "Error al registrar la venta en base de datos.",
        };
      }
    }

    const ticketData: TicketData = {
      comprobante: serieNumero,
      tipo: isFactura ? "Factura" : "Boleta",
      fecha: fechaActual.toLocaleDateString("es-PE"),
      hora: fechaActual.toLocaleTimeString("es-PE"),
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      cliente: {
        nombre: input.clienteNombre || "CLIENTES VARIOS",
        documentoTipo: isFactura ? "RUC" : "DNI",
        documentoNumero: input.clienteDoc || "00000000",
      },
      items: input.items.map((item) => ({
        cantidad: item.cantidad,
        descripcion: item.nombre,
        precioUnit: item.precio,
        total: +(item.precio * item.cantidad).toFixed(2),
        unidad: item.tipo === "peso" ? "kg" : "und",
      })),
      medioPago: input.medioPago === "transferencia" ? "plin" : input.medioPago,
      pagos: effectivePayments.map((p) => ({
        medio: p.medioPago,
        monto: p.monto,
        referencia: p.referencia,
        montoRecibido: p.montoRecibido,
        vuelto: p.vuelto,
      })),
      montoRecibido: input.montoRecibido,
      vuelto: input.vuelto,
      total: totalVenta,
      hashSunat: sunatResult.hash,
    };

    return {
      success: true,
      ventaId,
      comprobanteSerieNumero: serieNumero,
      ticketData,
    };
  } catch (error) {
    console.error("Error en completeSaleTransactionAction:", error);
    return {
      success: false,
      ventaId: "",
      comprobanteSerieNumero: "",
      ticketData: {} as TicketData,
      error: error instanceof Error ? error.message : "Error desconocido al procesar la venta.",
    };
  }
}
