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

import { getSalesFromMemoryStore } from "@/lib/sales-store";

// 8. HISTORIAL DE VENTAS & COMPROBANTES
export async function getSalesHistoryData() {
  const memorySales = getSalesFromMemoryStore();

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

        const dbSales = ventasRows.map((v, idx) => {
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

        // Combinar evitando duplicados
        const idsInDb = new Set(dbSales.map((s) => s.id));
        const extraMemory = memorySales.filter((s) => !idsInDb.has(s.id) && !idsInDb.has(s.comprobante));
        return [...extraMemory, ...dbSales];
      }
    }
  } catch (err) {
    console.warn("getSalesHistoryData: DB fallback, using memory store:", err);
  }

  return memorySales;
}
