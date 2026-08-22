"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFechaHora(d: Date): string {
  return d.toLocaleString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// 6. MOVIMIENTOS KARDEX VALORADO (SUNAT 13.1)
export async function getKardexMovementsData() {
  try {
    if (hasDb()) {
      const rows = await db
        .select({
          id: schema.movimientosInventario.id,
          tipo: schema.movimientosInventario.tipo,
          cantidad: schema.movimientosInventario.cantidad,
          motivo: schema.movimientosInventario.motivo,
          fecha: schema.movimientosInventario.creadoEn,
          productoId: schema.movimientosInventario.productoId,
          referenciaTipo: schema.movimientosInventario.referenciaTipo,
          productoNombre: schema.productos.nombre,
          sku: schema.productos.sku,
          precioCosto: schema.productos.precioCosto,
          categoriaNombre: schema.categorias.nombre,
        })
        .from(schema.movimientosInventario)
        .leftJoin(schema.productos, eq(schema.movimientosInventario.productoId, schema.productos.id))
        .leftJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
        .orderBy(desc(schema.movimientosInventario.creadoEn))
        .limit(100);

      if (rows && rows.length > 0) {
        return rows.map((r, idx) => {
          const rawQty = parseFloat(r.cantidad);
          const absQty = Math.abs(rawQty);
          const cost = parseFloat(r.precioCosto || "3.50");

          const isEntrada =
            r.tipo === "ingreso" ||
            r.tipo === "transferencia_entrada" ||
            (r.tipo === "ajuste" && rawQty > 0);

          const esMerma = r.tipo === "merma";
          const esAjuste = r.tipo === "ajuste";
          const esTransferencia =
            r.tipo === "transferencia_salida" || r.tipo === "transferencia_entrada";
          const esCompra = r.tipo === "ingreso";

          const tipoOperacion: "01_VENTA" | "02_COMPRA" | "13_MERMA" | "11_TRANSFERENCIA" | "99_AJUSTE" =
            esMerma
              ? "13_MERMA"
              : esAjuste
              ? "99_AJUSTE"
              : esTransferencia
              ? "11_TRANSFERENCIA"
              : esCompra
              ? "02_COMPRA"
              : "01_VENTA";

          const tipoDoc: "01_FACTURA" | "03_BOLETA" | "09_GUIA" | "AJ_ACTA" =
            esTransferencia
              ? "09_GUIA"
              : esMerma || esAjuste
              ? "AJ_ACTA"
              : esCompra
              ? "01_FACTURA"
              : "03_BOLETA";

          const matchDoc = r.motivo?.match(/\[(.*?)\]/);
          const docSerieNumero = matchDoc
            ? matchDoc[1]
            : esTransferencia
            ? "T001-GRE"
            : esMerma
            ? `MERMA-${String(100 + idx)}`
            : esAjuste
            ? `AJ-${String(100 + idx)}`
            : `KDX-${String(1000 + idx)}`;

          const cleanMotivo = r.motivo ? r.motivo.replace(/\[(.*?)\]/, "").trim() : "Movimiento de inventario";

          return {
            id: r.id,
            fecha: fmtFechaHora(new Date(r.fecha)),
            productoId: r.productoId,
            productoNombre: r.productoNombre || "Producto Retail",
            sku: r.sku || "775123456789",
            categoria: r.categoriaNombre || "General",
            tipoOperacion,
            operacionLabel: cleanMotivo || (isEntrada ? "Ingreso de Mercadería" : "Salida de Mercadería"),
            tipoDoc,
            docSerieNumero,
            entradaCant: isEntrada ? absQty : undefined,
            entradaCostoUnit: isEntrada ? cost : undefined,
            entradaTotal: isEntrada ? +(absQty * cost).toFixed(2) : undefined,
            salidaCant: !isEntrada ? absQty : undefined,
            salidaCostoUnit: !isEntrada ? cost : undefined,
            salidaTotal: !isEntrada ? +(absQty * cost).toFixed(2) : undefined,
            saldoCant: absQty,
            saldoCostoUnit: cost,
            saldoTotal: +(absQty * cost).toFixed(2),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getKardexMovementsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      fecha: "15/08/2026 11:42",
      productoId: "1",
      productoNombre: "Leche Gloria Entera 400g",
      sku: "775123456789",
      categoria: "Lácteos",
      tipoOperacion: "01_VENTA" as const,
      operacionLabel: "Venta en Caja 01 (POS)",
      tipoDoc: "03_BOLETA" as const,
      docSerieNumero: "B001-00042918",
      salidaCant: 2,
      salidaCostoUnit: 3.40,
      salidaTotal: 6.80,
      saldoCant: 142,
      saldoCostoUnit: 3.40,
      saldoTotal: 482.80,
    },
    {
      id: "2",
      fecha: "15/08/2026 10:15",
      productoId: "1",
      productoNombre: "Leche Gloria Entera 400g",
      sku: "775123456789",
      categoria: "Lácteos",
      tipoOperacion: "02_COMPRA" as const,
      operacionLabel: "Recepción de Proveedor Gloria S.A.",
      tipoDoc: "01_FACTURA" as const,
      docSerieNumero: "F001-0089123",
      entradaCant: 48,
      entradaCostoUnit: 3.40,
      entradaTotal: 163.20,
      saldoCant: 144,
      saldoCostoUnit: 3.40,
      saldoTotal: 489.60,
    },
  ];
}
