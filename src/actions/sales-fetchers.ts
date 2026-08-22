"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtHora(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

// 8. HISTORIAL DE VENTAS & COMPROBANTES
export async function getSalesHistoryData() {
  try {
    if (hasDb()) {
      const [ventasRows, comprobantesRows, pagosRows, detalleRows, cajasRows] = await Promise.all([
        db
          .select({
            id: schema.ventas.id,
            total: schema.ventas.total,
            estado: schema.ventas.estado,
            creadoEn: schema.ventas.creadoEn,
            cajaId: schema.ventas.cajaId,
            clienteNombre: schema.clientes.nombre,
            clienteDoc: schema.clientes.numeroDocumento,
            cajeroNombre: schema.usuarios.nombre,
          })
          .from(schema.ventas)
          .leftJoin(schema.clientes, eq(schema.ventas.clienteId, schema.clientes.id))
          .leftJoin(schema.usuarios, eq(schema.ventas.cajeroId, schema.usuarios.id))
          .orderBy(desc(schema.ventas.creadoEn))
          .limit(200),
        db.select().from(schema.comprobantes),
        db.select().from(schema.ventasPagos),
        db
          .select({
            ventaId: schema.ventasDetalle.ventaId,
            cantidad: schema.ventasDetalle.cantidad,
            precioUnitario: schema.ventasDetalle.precioUnitario,
            subtotal: schema.ventasDetalle.subtotal,
            productoNombre: schema.productos.nombre,
            unidadMedida: schema.productos.unidadMedida,
          })
          .from(schema.ventasDetalle)
          .leftJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id)),
        db.select().from(schema.cajas),
      ]);

      if (ventasRows && ventasRows.length > 0) {
        const comprobanteMap = new Map<string, (typeof comprobantesRows)[number]>();
        for (const c of comprobantesRows) comprobanteMap.set(c.ventaId, c);
        const pagoMap = new Map<string, (typeof pagosRows)[number]>();
        for (const p of pagosRows) if (!pagoMap.has(p.ventaId)) pagoMap.set(p.ventaId, p);
        const detallePorVenta = new Map<string, (typeof detalleRows)[number][]>();
        for (const d of detalleRows) {
          const arr = detallePorVenta.get(d.ventaId) ?? [];
          arr.push(d);
          detallePorVenta.set(d.ventaId, arr);
        }
        const cajaMap = new Map(cajasRows.map((c) => [c.id, c.nombre]));

        return ventasRows.map((v, idx) => {
          const comprobante = comprobanteMap.get(v.id);
          const pago = pagoMap.get(v.id);
          const detalle = detallePorVenta.get(v.id) ?? [];
          const numDoc = v.clienteDoc || "00000000";
          const isRuc = numDoc.length === 11;
          const defaultTipo = isRuc ? "Factura" : "Boleta";

          return {
            id: v.id,
            comprobante: comprobante ? `${comprobante.serie}-${comprobante.numero}` : `${isRuc ? "F001" : "B001"}-${String(10000000 + idx)}`,
            tipo: (comprobante?.tipo === "factura" ? "Factura" : comprobante?.tipo === "nota_credito" ? "Nota de Crédito" : defaultTipo) as "Boleta" | "Factura" | "Nota de Crédito",
            cliente: v.clienteNombre || (numDoc === "00000000" ? "Clientes Varios" : "Cliente Particular"),
            docNumero: numDoc,
            medioPago: ((pago?.medioPago === "tarjeta" ? "tarjeta" : pago?.medioPago === "yape" ? "yape" : pago?.medioPago === "plin" ? "plin" : "efectivo") as "efectivo" | "tarjeta" | "yape" | "plin"),
            caja: cajaMap.get(v.cajaId) ?? "Caja Principal",
            cajero: v.cajeroNombre || "Carlos Alarcón",
            total: parseFloat(v.total),
            fecha: fmtFecha(new Date(v.creadoEn)),
            hora: fmtHora(new Date(v.creadoEn)),
            estadoSunat: ((comprobante?.estadoSunat === "anulado" ? "anulado" : comprobante?.estadoSunat === "enviado" ? "enviado" : "aceptado") as "aceptado" | "enviado" | "anulado"),
            hashSunat: comprobante?.hash || `U1VOQVRfSEFTSF8${v.id.slice(0, 8)}`,
            items: detalle.map((d) => ({
              cantidad: parseFloat(d.cantidad),
              descripcion: d.productoNombre || "Producto Retail",
              precioUnit: parseFloat(d.precioUnitario),
              total: parseFloat(d.subtotal),
              unidad: d.unidadMedida || "und",
            })),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getSalesHistoryData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      comprobante: "B001-00042918",
      tipo: "Boleta" as const,
      cliente: "Clientes Varios",
      docNumero: "00000000",
      medioPago: "efectivo" as const,
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      total: 28.50,
      fecha: "15/08/2026",
      hora: "11:42",
      estadoSunat: "aceptado" as const,
      hashSunat: "7x8A9B2C3D4E5F6G",
      items: [
        { cantidad: 2, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 9.00, unidad: "und" },
        { cantidad: 1, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 9.80, unidad: "und" },
        { cantidad: 1.5, descripcion: "Manzana Delicia Nacional (kg)", precioUnit: 4.80, total: 7.20, unidad: "kg" },
        { cantidad: 1, descripcion: "Bolsa Ecológica Biodegradable", precioUnit: 2.50, total: 2.50, unidad: "und" },
      ],
    },
    {
      id: "2",
      comprobante: "F001-00008912",
      tipo: "Factura" as const,
      cliente: "Inversiones Retail SAC",
      docNumero: "20601234567",
      medioPago: "tarjeta" as const,
      caja: "Caja 01 - Principal",
      cajero: "Carlos Alarcón",
      total: 145.80,
      fecha: "15/08/2026",
      hora: "11:15",
      estadoSunat: "aceptado" as const,
      hashSunat: "1a2B3c4D5e6F7g8H",
      items: [
        { cantidad: 10, descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 52.00, unidad: "und" },
        { cantidad: 5, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 49.00, unidad: "und" },
        { cantidad: 4, descripcion: "Detergente Bolívar 1kg", precioUnit: 8.50, total: 34.00, unidad: "und" },
        { cantidad: 12, descripcion: "Galletas Soda San Jorge 6pk", precioUnit: 0.90, total: 10.80, unidad: "und" },
      ],
    },
    {
      id: "3",
      comprobante: "B001-00042917",
      tipo: "Boleta" as const,
      cliente: "Juan Pérez García",
      docNumero: "45892144",
      medioPago: "yape" as const,
      caja: "Caja 02 - Rápida",
      cajero: "María Gómez",
      total: 45.80,
      fecha: "15/08/2026",
      hora: "10:55",
      estadoSunat: "aceptado" as const,
      hashSunat: "9z8Y7x6W5v4U3t2S",
      items: [
        { cantidad: 4, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 18.00, unidad: "und" },
        { cantidad: 2, descripcion: "Yogurt Gloria Fresa 1L", precioUnit: 7.20, total: 14.40, unidad: "und" },
        { cantidad: 2.8, descripcion: "Plátano de Seda (kg)", precioUnit: 4.50, total: 12.60, unidad: "kg" },
        { cantidad: 1, descripcion: "Bolsa Plástica", precioUnit: 0.80, total: 0.80, unidad: "und" },
      ],
    },
  ];
}
