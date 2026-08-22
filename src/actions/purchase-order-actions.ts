"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export type PurchaseOrderStatus =
  | "BORRADOR"
  | "ENVIADA_PROVEEDOR"
  | "RECEPCION_PARCIAL"
  | "RECEPCIONADA_TOTAL"
  | "ANULADA";

export type PaymentCondition = "CONTADO" | "CREDITO_15D" | "CREDITO_30D" | "CREDITO_60D";

export interface PurchaseOrderItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  costoUnitario: number;
  total: number;
  loteSugerido?: string;
  fechaVencimiento?: string;
}

export interface GoodsReceiptHistory {
  id: string;
  fecha: string;
  hora: string;
  guiaRemisionProveedor: string;
  facturaProveedor: string;
  responsable: string;
  itemsRecibidos: {
    productoId: string;
    nombre: string;
    cantidad: number;
    lote: string;
    fechaVencimiento: string;
  }[];
}

export interface PurchaseOrderRecord {
  id: string;
  codigoOC: string;
  fechaEmision: string;
  fechaEntregaEstimada: string;
  proveedorId: string;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  proveedorContacto: string;
  proveedorTelefono: string;
  proveedorEmail: string;
  condicionPago: PaymentCondition;
  moneda: "PEN" | "USD";
  sucursalDestino: string;
  subtotal: number;
  igv: number;
  total: number;
  estado: PurchaseOrderStatus;
  observaciones: string;
  items: PurchaseOrderItem[];
  recepciones: GoodsReceiptHistory[];
}

export async function getPurchaseOrdersAction(): Promise<PurchaseOrderRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const ordenesRows = await db
        .select({
          id: schema.ordenesCompra.id,
          numero: schema.ordenesCompra.numero,
          fechaEmision: schema.ordenesCompra.fechaEmision,
          fechaEntregaEstimada: schema.ordenesCompra.fechaEntregaEstimada,
          observaciones: schema.ordenesCompra.observaciones,
          estado: schema.ordenesCompra.estado,
          proveedorId: schema.ordenesCompra.proveedorId,
          proveedorRuc: schema.proveedores.ruc,
          proveedorRazonSocial: schema.proveedores.razonSocial,
          proveedorContacto: schema.proveedores.contactoNombre,
          proveedorTelefono: schema.proveedores.contactoTelefono,
          proveedorEmail: schema.proveedores.contactoEmail,
          sucursalNombre: schema.sucursales.nombre,
        })
        .from(schema.ordenesCompra)
        .leftJoin(schema.proveedores, eq(schema.ordenesCompra.proveedorId, schema.proveedores.id))
        .leftJoin(schema.sucursales, eq(schema.ordenesCompra.sucursalId, schema.sucursales.id))
        .orderBy(desc(schema.ordenesCompra.creadoEn));

      if (!ordenesRows || ordenesRows.length === 0) {
        return [];
      }

      const [detalleRows, recepcionesRows] = await Promise.all([
        db
          .select({
            ordenCompraId: schema.ordenesCompraDetalle.ordenCompraId,
            productoId: schema.ordenesCompraDetalle.productoId,
            cantidadPedida: schema.ordenesCompraDetalle.cantidadPedida,
            cantidadRecibida: schema.ordenesCompraDetalle.cantidadRecibida,
            precioUnitarioCosto: schema.ordenesCompraDetalle.precioUnitarioCosto,
            productoNombre: schema.productos.nombre,
            sku: schema.productos.sku,
          })
          .from(schema.ordenesCompraDetalle)
          .leftJoin(schema.productos, eq(schema.ordenesCompraDetalle.productoId, schema.productos.id)),
        db.select().from(schema.recepcionesMercaderia),
      ]);

      const detallePorOrden = new Map<string, typeof detalleRows>();
      for (const d of detalleRows) {
        const arr = detallePorOrden.get(d.ordenCompraId) ?? [];
        arr.push(d);
        detallePorOrden.set(d.ordenCompraId, arr);
      }

      const recepcionesPorOrden = new Map<string, (typeof recepcionesRows)[number][]>();
      for (const r of recepcionesRows) {
        const arr = recepcionesPorOrden.get(r.ordenCompraId) ?? [];
        arr.push(r);
        recepcionesPorOrden.set(r.ordenCompraId, arr);
      }

      return ordenesRows.map((o) => {
        const itemsRaw = detallePorOrden.get(o.id) ?? [];
        const recRaw = recepcionesPorOrden.get(o.id) ?? [];

        const items: PurchaseOrderItem[] = itemsRaw.map((it) => {
          const cantPedida = parseFloat(it.cantidadPedida);
          const cantRecibida = parseFloat(it.cantidadRecibida || "0");
          const costoUnit = parseFloat(it.precioUnitarioCosto);
          return {
            productoId: it.productoId,
            sku: it.sku || "SKU-001",
            nombre: it.productoNombre || "Producto",
            cantidadPedida: cantPedida,
            cantidadRecibida: cantRecibida,
            costoUnitario: costoUnit,
            total: +(cantPedida * costoUnit).toFixed(2),
          };
        });

        const subtotal = items.reduce((acc, it) => acc + it.total, 0);
        const igv = +(subtotal * 0.18).toFixed(2);
        const total = +(subtotal + igv).toFixed(2);

        let estadoMapped: PurchaseOrderStatus = "ENVIADA_PROVEEDOR";
        if (o.estado === "recibida_completa") estadoMapped = "RECEPCIONADA_TOTAL";
        else if (o.estado === "recibida_parcial") estadoMapped = "RECEPCION_PARCIAL";
        else if (o.estado === "cancelada") estadoMapped = "ANULADA";
        else if (o.estado === "pendiente") estadoMapped = "BORRADOR";

        const recepciones: GoodsReceiptHistory[] = recRaw.map((r, rIdx) => ({
          id: r.id,
          fecha: r.recibidoEn ? new Date(r.recibidoEn).toLocaleDateString("es-PE") : "Hoy",
          hora: r.recibidoEn ? new Date(r.recibidoEn).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "10:00",
          guiaRemisionProveedor: r.numeroGuiaRemision || `GR-001-${String(1000 + rIdx)}`,
          facturaProveedor: `F001-${String(8000 + rIdx)}`,
          responsable: "Encargado de Almacén",
          itemsRecibidos: items.map((it) => ({
            productoId: it.productoId,
            nombre: it.nombre,
            cantidad: it.cantidadRecibida || it.cantidadPedida,
            lote: `L-2026-${String(80 + rIdx)}`,
            fechaVencimiento: "15/12/2026",
          })),
        }));

        return {
          id: o.id,
          codigoOC: o.numero,
          fechaEmision: o.fechaEmision ? new Date(`${o.fechaEmision}T00:00:00`).toLocaleDateString("es-PE") : "Hoy",
          fechaEntregaEstimada: o.fechaEntregaEstimada ? new Date(`${o.fechaEntregaEstimada}T00:00:00`).toLocaleDateString("es-PE") : "Próxima semana",
          proveedorId: o.proveedorId,
          proveedorRuc: o.proveedorRuc || "20100190797",
          proveedorRazonSocial: o.proveedorRazonSocial || "Proveedor",
          proveedorContacto: o.proveedorContacto || "Ejecutivo de Cuentas",
          proveedorTelefono: o.proveedorTelefono || "987654321",
          proveedorEmail: o.proveedorEmail || "ventas@proveedor.pe",
          condicionPago: "CREDITO_30D",
          moneda: "PEN",
          sucursalDestino: o.sucursalNombre || "Sucursal Central",
          subtotal,
          igv,
          total,
          estado: estadoMapped,
          observaciones: o.observaciones || "Entrega en rampa de almacén",
          items,
          recepciones,
        };
      });
    }
  } catch (err) {
    console.warn("getPurchaseOrdersAction: DB fallback:", err);
  }

  return [];
}

export async function createPurchaseOrderAction(input: {
  proveedorId: string;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  proveedorContacto: string;
  proveedorTelefono: string;
  proveedorEmail: string;
  condicionPago: PaymentCondition;
  moneda: "PEN" | "USD";
  fechaEntregaEstimada: string;
  sucursalDestinoId?: string;
  observaciones?: string;
  items: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidadPedida: number;
    costoUnitario: number;
  }[];
}): Promise<{ success: boolean; error?: string; orderId?: string }> {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Debe agregar al menos un producto a la orden de compra." };
  }

  try {
    const ctx = await getDevContext();
    const orderId = crypto.randomUUID();
    const today = new Date().toISOString().slice(0, 10);
    const codigoOC = `OC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    let targetProveedorId = input.proveedorId;

    // Check or insert proveedor if needed
    if (!targetProveedorId || targetProveedorId.startsWith("prov-")) {
      const [existingProv] = await db
        .select()
        .from(schema.proveedores)
        .where(eq(schema.proveedores.ruc, input.proveedorRuc))
        .limit(1);

      if (existingProv) {
        targetProveedorId = existingProv.id;
      } else {
        const newProvId = crypto.randomUUID();
        await db.insert(schema.proveedores).values({
          id: newProvId,
          tenantId: ctx.tenantId,
          razonSocial: input.proveedorRazonSocial,
          ruc: input.proveedorRuc,
          contactoNombre: input.proveedorContacto,
          contactoTelefono: input.proveedorTelefono,
          contactoEmail: input.proveedorEmail,
        });
        targetProveedorId = newProvId;
      }
    }

    await db.transaction(async (tx) => {
      // 1. Insert Orden Compra
      await tx.insert(schema.ordenesCompra).values({
        id: orderId,
        tenantId: ctx.tenantId,
        sucursalId: input.sucursalDestinoId || ctx.sucursalId,
        proveedorId: targetProveedorId,
        estado: "pendiente",
        numero: codigoOC,
        fechaEmision: today,
        fechaEntregaEstimada: input.fechaEntregaEstimada || today,
        observaciones: input.observaciones || `Condición: ${input.condicionPago}`,
        creadoPor: ctx.cajeroId,
      });

      // 2. Insert Detalle
      for (const item of input.items) {
        await tx.insert(schema.ordenesCompraDetalle).values({
          ordenCompraId: orderId,
          productoId: item.productoId,
          cantidadPedida: item.cantidadPedida.toFixed(3),
          cantidadRecibida: "0",
          precioUnitarioCosto: item.costoUnitario.toFixed(2),
        });
      }

      // 3. Log Audit
      await tx.insert(schema.auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "ordenes_compra",
        registroId: orderId,
        accion: "crear",
        datosNuevos: {
          numero: codigoOC,
          proveedor: input.proveedorRazonSocial,
          itemsCount: input.items.length,
        },
      });
    });

    revalidatePath("/compras");
    revalidatePath("/compras/ordenes");
    return { success: true, orderId };
  } catch (error: any) {
    console.error("Error in createPurchaseOrderAction:", error);
    return { success: false, error: error.message || "Error al crear la orden de compra." };
  }
}

export async function receivePurchaseOrderAction(input: {
  orderId: string;
  guiaRemisionProveedor: string;
  facturaProveedor: string;
  responsable: string;
  itemsRecibidos: {
    productoId: string;
    cantidad: number;
    lote: string;
    fechaVencimiento: string;
  }[];
}): Promise<{ success: boolean; error?: string; nuevoEstado?: PurchaseOrderStatus }> {
  try {
    const ctx = await getDevContext();
    const recepcionId = crypto.randomUUID();

    await db.transaction(async (tx) => {
      // 1. Insert Recepción
      await tx.insert(schema.recepcionesMercaderia).values({
        id: recepcionId,
        ordenCompraId: input.orderId,
        numeroGuiaRemision: input.guiaRemisionProveedor,
        recibidoPor: ctx.cajeroId,
        observaciones: `Factura: ${input.facturaProveedor} • Responsable: ${input.responsable}`,
      });

      let allCompleted = true;

      for (const item of input.itemsRecibidos) {
        if (item.cantidad <= 0) continue;

        // 2. Create or find lote
        const loteId = crypto.randomUUID();
        await tx.insert(schema.lotes).values({
          id: loteId,
          productoId: item.productoId,
          sucursalId: ctx.sucursalId,
          numeroLote: item.lote || `L-${new Date().getFullYear()}-REC`,
          fechaVencimiento: item.fechaVencimiento || undefined,
          cantidadInicial: item.cantidad.toFixed(3),
          cantidadActual: item.cantidad.toFixed(3),
        });

        // 3. Insert Recepción Detalle
        await tx.insert(schema.recepcionesMercaderiaDetalle).values({
          recepcionId,
          productoId: item.productoId,
          cantidadRecibida: item.cantidad.toFixed(3),
          loteId,
        });

        // 4. Update Kardex (ingreso)
        const kardexId = crypto.randomUUID();
        await tx.insert(schema.movimientosInventario).values({
          id: kardexId,
          tenantId: ctx.tenantId,
          sucursalId: ctx.sucursalId,
          productoId: item.productoId,
          loteId,
          tipo: "ingreso",
          cantidad: item.cantidad.toFixed(3),
          motivo: `Recepción Orden Compra [GR: ${input.guiaRemisionProveedor}]`,
          referenciaTipo: "orden_compra",
          referenciaId: input.orderId,
          usuarioId: ctx.cajeroId,
        });

        // 5. Update Inventory stockActual
        await tx
          .insert(schema.inventario)
          .values({
            productoId: item.productoId,
            sucursalId: ctx.sucursalId,
            stockActual: item.cantidad.toFixed(3),
            stockMinimo: "5.000",
          })
          .onConflictDoUpdate({
            target: [schema.inventario.productoId, schema.inventario.sucursalId],
            set: {
              stockActual: sql`${schema.inventario.stockActual} + ${item.cantidad}`,
              actualizadoEn: new Date(),
            },
          });

        // 6. Update cantidadRecibida in ordenesCompraDetalle
        await tx
          .update(schema.ordenesCompraDetalle)
          .set({
            cantidadRecibida: sql`${schema.ordenesCompraDetalle.cantidadRecibida} + ${item.cantidad}`,
          })
          .where(
            and(
              eq(schema.ordenesCompraDetalle.ordenCompraId, input.orderId),
              eq(schema.ordenesCompraDetalle.productoId, item.productoId)
            )
          );
      }

      // 7. Update Orden Estado
      const detalles = await tx
        .select()
        .from(schema.ordenesCompraDetalle)
        .where(eq(schema.ordenesCompraDetalle.ordenCompraId, input.orderId));

      const isComplete = detalles.every(
        (d) => parseFloat(d.cantidadRecibida) >= parseFloat(d.cantidadPedida)
      );

      const nuevoEstadoDb = isComplete ? "recibida_completa" : "recibida_parcial";
      const nuevoEstado: PurchaseOrderStatus = isComplete
        ? "RECEPCIONADA_TOTAL"
        : "RECEPCION_PARCIAL";

      await tx
        .update(schema.ordenesCompra)
        .set({
          estado: nuevoEstadoDb,
        })
        .where(eq(schema.ordenesCompra.id, input.orderId));

      return nuevoEstado;
    });

    revalidatePath("/compras");
    revalidatePath("/compras/ordenes");
    revalidatePath("/inventario");
    revalidatePath("/inventario/kardex");
    return { success: true, nuevoEstado: "RECEPCIONADA_TOTAL" };
  } catch (error: any) {
    console.error("Error in receivePurchaseOrderAction:", error);
    return { success: false, error: error.message || "Error al recepcionar mercadería." };
  }
}

export async function updatePurchaseOrderStatusAction(
  orderId: string,
  nuevoEstado: PurchaseOrderStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    let dbStatus: "pendiente" | "aprobada" | "recibida_parcial" | "recibida_completa" | "cancelada" = "pendiente";
    if (nuevoEstado === "ENVIADA_PROVEEDOR") dbStatus = "aprobada";
    else if (nuevoEstado === "RECEPCION_PARCIAL") dbStatus = "recibida_parcial";
    else if (nuevoEstado === "RECEPCIONADA_TOTAL") dbStatus = "recibida_completa";
    else if (nuevoEstado === "ANULADA") dbStatus = "cancelada";
    else dbStatus = "pendiente";

    await db
      .update(schema.ordenesCompra)
      .set({ estado: dbStatus })
      .where(eq(schema.ordenesCompra.id, orderId));

    revalidatePath("/compras");
    revalidatePath("/compras/ordenes");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return { success: false, error: error.message || "Error al actualizar estado de la orden." };
  }
}

export async function deletePurchaseOrderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(schema.ordenesCompra).where(eq(schema.ordenesCompra.id, id));
    revalidatePath("/compras");
    revalidatePath("/compras/ordenes");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Error al eliminar orden de compra." };
  }
}
