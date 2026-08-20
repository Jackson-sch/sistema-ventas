"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

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

let DEMO_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: "oc-001",
    codigoOC: "OC-2026-0089",
    fechaEmision: "15/08/2026",
    fechaEntregaEstimada: "19/08/2026",
    proveedorId: "prov-1",
    proveedorRuc: "20100190797",
    proveedorRazonSocial: "LECHE GLORIA S.A.",
    proveedorContacto: "Marcos Villanueva (Ejecutivo de Cuentas)",
    proveedorTelefono: "987654321",
    proveedorEmail: "pedidos@gloria.com.pe",
    condicionPago: "CREDITO_30D",
    moneda: "PEN",
    sucursalDestino: "Sucursal Central (Surco)",
    subtotal: 3520.00,
    igv: 633.60,
    total: 4153.60,
    estado: "ENVIADA_PROVEEDOR",
    observaciones: "Entrega en rampa 2 entre 08:00 y 12:00 hrs. Presentar guía física y electrónica.",
    items: [
      {
        productoId: "prod-1",
        sku: "775123456789",
        nombre: "Leche Gloria Entera 400g (Caja x 48)",
        cantidadPedida: 20,
        cantidadRecibida: 0,
        costoUnitario: 140.00,
        total: 2800.00,
        loteSugerido: "L-GLO-2026-89",
        fechaVencimiento: "15/08/2027",
      },
      {
        productoId: "prod-8",
        sku: "775000000008",
        nombre: "Yogurt Gloria Fresa 1kg (Pack x 12)",
        cantidadPedida: 12,
        cantidadRecibida: 0,
        costoUnitario: 60.00,
        total: 720.00,
        loteSugerido: "L-GLO-2026-90",
        fechaVencimiento: "30/09/2026",
      },
    ],
    recepciones: [],
  },
  {
    id: "oc-002",
    codigoOC: "OC-2026-0088",
    fechaEmision: "10/08/2026",
    fechaEntregaEstimada: "13/08/2026",
    proveedorId: "prov-2",
    proveedorRuc: "20100055237",
    proveedorRazonSocial: "ALICORP S.A.A.",
    proveedorContacto: "Patricia Romero",
    proveedorTelefono: "976543210",
    proveedorEmail: "distribucion@alicorp.com.pe",
    condicionPago: "CREDITO_30D",
    moneda: "PEN",
    sucursalDestino: "Sucursal Central (Surco)",
    subtotal: 6200.00,
    igv: 1116.00,
    total: 7316.00,
    estado: "RECEPCIONADA_TOTAL",
    observaciones: "Recepción de aceites y fideos.",
    items: [
      {
        productoId: "prod-3",
        sku: "775456789123",
        nombre: "Aceite Primor Premium 1L (Caja x 12)",
        cantidadPedida: 50,
        cantidadRecibida: 50,
        costoUnitario: 90.00,
        total: 4500.00,
        loteSugerido: "L-ALI-2026-12",
        fechaVencimiento: "20/12/2027",
      },
      {
        productoId: "prod-2",
        sku: "775987654321",
        nombre: "Fideos Don Vittorio Spaghetti 1kg (Fardo x 20)",
        cantidadPedida: 40,
        cantidadRecibida: 40,
        costoUnitario: 42.50,
        total: 1700.00,
        loteSugerido: "L-DON-2026-04",
        fechaVencimiento: "10/05/2028",
      },
    ],
    recepciones: [
      {
        id: "rec-001",
        fecha: "13/08/2026",
        hora: "10:15",
        guiaRemisionProveedor: "GR-001-008912",
        facturaProveedor: "F001-00045612",
        responsable: "Esteban Vega (Encargado Almacén)",
        itemsRecibidos: [
          {
            productoId: "prod-3",
            nombre: "Aceite Primor Premium 1L (Caja x 12)",
            cantidad: 50,
            lote: "L-ALI-2026-12",
            fechaVencimiento: "20/12/2027",
          },
          {
            productoId: "prod-2",
            nombre: "Fideos Don Vittorio Spaghetti 1kg (Fardo x 20)",
            cantidad: 40,
            lote: "L-DON-2026-04",
            fechaVencimiento: "10/05/2028",
          },
        ],
      },
    ],
  },
];

export async function getPurchaseOrdersAction(): Promise<PurchaseOrderRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [ordenesRows, detalleRows, proveedoresRows, sucursalesRows, recepcionesRows, productosRows] =
        await Promise.all([
          db.select().from(schema.ordenesCompra).orderBy(desc(schema.ordenesCompra.creadoEn)),
          db.select().from(schema.ordenesCompraDetalle),
          db.select().from(schema.proveedores),
          db.select().from(schema.sucursales),
          db.select().from(schema.recepcionesMercaderia),
          db.select().from(schema.productos),
        ]);

      if (ordenesRows && ordenesRows.length > 0) {
        const provMap = new Map(proveedoresRows.map((p) => [p.id, p]));
        const sucursalMap = new Map(sucursalesRows.map((s) => [s.id, s.nombre]));
        const prodMap = new Map(productosRows.map((p) => [p.id, p]));

        const detallePorOrden = new Map<string, (typeof detalleRows)[number][]>();
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
          const prov = provMap.get(o.proveedorId);
          const sucursal = sucursalMap.get(o.sucursalId) ?? "Sucursal Central (Surco)";
          const itemsRaw = detallePorOrden.get(o.id) ?? [];
          const recRaw = recepcionesPorOrden.get(o.id) ?? [];

          const items: PurchaseOrderItem[] = itemsRaw.map((it) => {
            const p = prodMap.get(it.productoId);
            const cantPedida = parseFloat(it.cantidadPedida);
            const cantRecibida = parseFloat(it.cantidadRecibida || "0");
            const costoUnit = parseFloat(it.precioUnitarioCosto);
            return {
              productoId: it.productoId,
              sku: p?.sku || "SKU-001",
              nombre: p?.nombre || "Producto",
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
            proveedorRuc: prov?.ruc || "20100190797",
            proveedorRazonSocial: prov?.razonSocial || "Proveedor",
            proveedorContacto: prov?.contactoNombre || "Ejecutivo de Cuentas",
            proveedorTelefono: prov?.contactoTelefono || "987654321",
            proveedorEmail: prov?.contactoEmail || "ventas@proveedor.pe",
            condicionPago: "CREDITO_30D",
            moneda: "PEN",
            sucursalDestino: sucursal,
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
    }
  } catch (err) {
    console.warn("getPurchaseOrdersAction: DB fallback:", err);
  }

  return DEMO_PURCHASE_ORDERS;
}

export async function getPurchaseOrderByIdAction(id: string): Promise<PurchaseOrderRecord | null> {
  const order = DEMO_PURCHASE_ORDERS.find((o) => o.id === id || o.codigoOC === id);
  return order || null;
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
  sucursalDestino?: string;
  observaciones?: string;
  items: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidadPedida: number;
    costoUnitario: number;
    loteSugerido?: string;
    fechaVencimiento?: string;
  }[];
}): Promise<{ success: boolean; error?: string; order?: PurchaseOrderRecord }> {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Debe agregar al menos un producto a la orden de compra." };
  }

  const now = new Date();
  const fechaEmision = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const codigoOC = `OC-2026-${String(DEMO_PURCHASE_ORDERS.length + 89).padStart(4, "0")}`;

  const formattedItems: PurchaseOrderItem[] = input.items.map((i) => ({
    productoId: i.productoId,
    sku: i.sku,
    nombre: i.nombre,
    cantidadPedida: i.cantidadPedida,
    cantidadRecibida: 0,
    costoUnitario: i.costoUnitario,
    total: +(i.cantidadPedida * i.costoUnitario).toFixed(2),
    loteSugerido: i.loteSugerido || `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 80 + 10)}`,
    fechaVencimiento: i.fechaVencimiento || "31/12/2027",
  }));

  const subtotal = +formattedItems.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const igv = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  const newOrder: PurchaseOrderRecord = {
    id: `oc-${Date.now()}`,
    codigoOC,
    fechaEmision,
    fechaEntregaEstimada: input.fechaEntregaEstimada || fechaEmision,
    proveedorId: input.proveedorId,
    proveedorRuc: input.proveedorRuc,
    proveedorRazonSocial: input.proveedorRazonSocial,
    proveedorContacto: input.proveedorContacto,
    proveedorTelefono: input.proveedorTelefono,
    proveedorEmail: input.proveedorEmail,
    condicionPago: input.condicionPago,
    moneda: input.moneda,
    sucursalDestino: input.sucursalDestino || "Sucursal Central (Surco)",
    subtotal,
    igv,
    total,
    estado: "ENVIADA_PROVEEDOR",
    observaciones: input.observaciones || "Entrega regular con control de calidad en almacén.",
    items: formattedItems,
    recepciones: [],
  };

  DEMO_PURCHASE_ORDERS.unshift(newOrder);
  revalidatePath("/compras/ordenes");
  return { success: true, order: newOrder };
}

export async function updatePurchaseOrderAction(input: {
  id: string;
  proveedorId: string;
  proveedorRuc: string;
  proveedorRazonSocial: string;
  proveedorContacto: string;
  proveedorTelefono: string;
  proveedorEmail: string;
  condicionPago: PaymentCondition;
  moneda: "PEN" | "USD";
  fechaEntregaEstimada: string;
  observaciones?: string;
  items: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidadPedida: number;
    costoUnitario: number;
    loteSugerido?: string;
    fechaVencimiento?: string;
  }[];
}): Promise<{ success: boolean; error?: string; order?: PurchaseOrderRecord }> {
  const target = DEMO_PURCHASE_ORDERS.find((o) => o.id === input.id);
  if (!target) return { success: false, error: "Orden de compra no encontrada." };

  if (target.estado === "RECEPCIONADA_TOTAL") {
    return { success: false, error: "No se puede editar una orden que ya ha sido recepcionada totalmente." };
  }

  const formattedItems: PurchaseOrderItem[] = input.items.map((i) => {
    const existing = target.items.find((ex) => ex.productoId === i.productoId);
    return {
      productoId: i.productoId,
      sku: i.sku,
      nombre: i.nombre,
      cantidadPedida: i.cantidadPedida,
      cantidadRecibida: existing ? existing.cantidadRecibida : 0,
      costoUnitario: i.costoUnitario,
      total: +(i.cantidadPedida * i.costoUnitario).toFixed(2),
      loteSugerido: i.loteSugerido || existing?.loteSugerido,
      fechaVencimiento: i.fechaVencimiento || existing?.fechaVencimiento,
    };
  });

  const subtotal = +formattedItems.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const igv = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  target.proveedorId = input.proveedorId;
  target.proveedorRuc = input.proveedorRuc;
  target.proveedorRazonSocial = input.proveedorRazonSocial;
  target.proveedorContacto = input.proveedorContacto;
  target.proveedorTelefono = input.proveedorTelefono;
  target.proveedorEmail = input.proveedorEmail;
  target.condicionPago = input.condicionPago;
  target.moneda = input.moneda;
  target.fechaEntregaEstimada = input.fechaEntregaEstimada;
  if (input.observaciones) target.observaciones = input.observaciones;
  target.items = formattedItems;
  target.subtotal = subtotal;
  target.igv = igv;
  target.total = total;

  revalidatePath("/compras/ordenes");
  return { success: true, order: target };
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
  const target = DEMO_PURCHASE_ORDERS.find((o) => o.id === input.orderId);
  if (!target) return { success: false, error: "Orden de compra no encontrada." };

  if (target.estado === "RECEPCIONADA_TOTAL" || target.estado === "ANULADA") {
    return { success: false, error: "Esta orden de compra no admite nuevas recepciones." };
  }

  const now = new Date();
  const fechaStr = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });

  const historyRecord: GoodsReceiptHistory = {
    id: `rec-${Date.now()}`,
    fecha: fechaStr,
    hora: horaStr,
    guiaRemisionProveedor: input.guiaRemisionProveedor,
    facturaProveedor: input.facturaProveedor,
    responsable: input.responsable || "Supervisor de Almacén",
    itemsRecibidos: input.itemsRecibidos.map((rec) => {
      const itm = target.items.find((i) => i.productoId === rec.productoId);
      return {
        productoId: rec.productoId,
        nombre: itm ? itm.nombre : "Producto",
        cantidad: rec.cantidad,
        lote: rec.lote,
        fechaVencimiento: rec.fechaVencimiento,
      };
    }),
  };

  // Update item quantities
  input.itemsRecibidos.forEach((rec) => {
    const itm = target.items.find((i) => i.productoId === rec.productoId);
    if (itm) {
      itm.cantidadRecibida = Math.min(itm.cantidadPedida, itm.cantidadRecibida + rec.cantidad);
    }
  });

  target.recepciones.push(historyRecord);

  // Evaluate final status
  const totalPedida = target.items.reduce((acc, i) => acc + i.cantidadPedida, 0);
  const totalRecibida = target.items.reduce((acc, i) => acc + i.cantidadRecibida, 0);

  if (totalRecibida >= totalPedida) {
    target.estado = "RECEPCIONADA_TOTAL";
  } else if (totalRecibida > 0) {
    target.estado = "RECEPCION_PARCIAL";
  }

  revalidatePath("/compras/ordenes");
  return { success: true, nuevoEstado: target.estado };
}

export async function deletePurchaseOrderAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const index = DEMO_PURCHASE_ORDERS.findIndex((o) => o.id === id);
  if (index === -1) return { success: false, error: "Orden de compra no encontrada." };

  DEMO_PURCHASE_ORDERS.splice(index, 1);
  revalidatePath("/compras/ordenes");
  return { success: true };
}
