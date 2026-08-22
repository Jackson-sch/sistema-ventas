"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { getSalesHistoryData } from "./data-fetchers";

export interface SireSaleRecord {
  id: string;
  periodo: string; // YYYYMM00
  cuo: string; // Código Único de Operación
  fechaEmision: string; // DD/MM/YYYY
  fechaVcto: string;
  tipoComprobante: "01" | "03" | "07";
  serie: string;
  numero: string;
  tipoDocCliente: "1" | "6" | "0" | "4";
  numDocCliente: string;
  razonSocialCliente: string;
  baseImponibleGravada: number;
  igv: number;
  inafecta: number;
  exonerada: number;
  montoTotal: number;
  moneda: "PEN" | "USD";
  tipoCambio: number;
  estadoComprobante: "1" | "2"; // 1 = Aceptado, 2 = Anulado
  codigoSunat: string;
}

export interface CategoryProfitabilityRecord {
  name: string;
  ventas: number;
  costo: number;
  margen: number;
  ganancia: number;
}

export interface ProductTurnoverRecord {
  rank: number;
  name: string;
  sku: string;
  und: string;
  total: number;
  unitsSold: number;
}

export async function getSireSalesData(periodo: string = "202608"): Promise<SireSaleRecord[]> {
  try {
    const sales = await getSalesHistoryData();
    if (sales && sales.length > 0) {
      return sales.map((s, idx) => {
        const isFactura = s.tipo === "Factura";
        const isNC = s.tipo === "Nota de Crédito";
        const tipoComp = (isFactura ? "01" : isNC ? "07" : "03") as "01" | "03" | "07";
        const parts = s.comprobante.split("-");
        const serie = parts[0] || (isFactura ? "F001" : "B001");
        const numero = parts[1] || String(1000 + idx);

        const total = s.total;
        const base = +(total / 1.18).toFixed(2);
        const igv = +(total - base).toFixed(2);

        return {
          id: s.id,
          periodo: `${periodo}00`,
          cuo: `CUO-${(100000 + idx).toString()}`,
          fechaEmision: s.fecha || "16/08/2026",
          fechaVcto: s.fecha || "16/08/2026",
          tipoComprobante: tipoComp,
          serie,
          numero,
          tipoDocCliente: isFactura ? "6" : "1",
          numDocCliente: s.docNumero || "00000000",
          razonSocialCliente: s.cliente || "CLIENTES VARIOS",
          baseImponibleGravada: base,
          igv,
          inafecta: 0,
          exonerada: 0,
          montoTotal: total,
          moneda: "PEN",
          tipoCambio: 1.0,
          estadoComprobante: s.estadoSunat === "anulado" ? "2" : "1",
          codigoSunat: s.hashSunat?.substring(0, 8) || "SUNATOK",
        };
      });
    }
  } catch (err) {
    console.warn("getSireSalesData error:", err);
  }

  // Fallback demo data
  return [
    {
      id: "1",
      periodo: `${periodo}00`,
      cuo: "CUO-100001",
      fechaEmision: "16/08/2026",
      fechaVcto: "16/08/2026",
      tipoComprobante: "03",
      serie: "B001",
      numero: "00042918",
      tipoDocCliente: "1",
      numDocCliente: "45892144",
      razonSocialCliente: "JUAN PEREZ GARCIA",
      baseImponibleGravada: 24.15,
      igv: 4.35,
      inafecta: 0,
      exonerada: 0,
      montoTotal: 28.50,
      moneda: "PEN",
      tipoCambio: 1.0,
      estadoComprobante: "1",
      codigoSunat: "7X8A9B2C",
    },
    {
      id: "2",
      periodo: `${periodo}00`,
      cuo: "CUO-100002",
      fechaEmision: "16/08/2026",
      fechaVcto: "16/08/2026",
      tipoComprobante: "01",
      serie: "F001",
      numero: "00001204",
      tipoDocCliente: "6",
      numDocCliente: "20601234567",
      razonSocialCliente: "INVERSIONES RETAIL SAC",
      baseImponibleGravada: 122.88,
      igv: 22.12,
      inafecta: 0,
      exonerada: 0,
      montoTotal: 145.00,
      moneda: "PEN",
      tipoCambio: 1.0,
      estadoComprobante: "1",
      codigoSunat: "3F4D5E6A",
    },
  ];
}

export async function getReportsProfitabilityDataAction(): Promise<{
  categories: CategoryProfitabilityRecord[];
  topProducts: ProductTurnoverRecord[];
}> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [categoryRows, topProductRows] = await Promise.all([
        db
          .select({
            categoriaNombre: sql<string>`coalesce(${schema.categorias.nombre}, 'General')`,
            ventas: sql<number>`coalesce(sum(${schema.ventasDetalle.subtotal}), 0)`,
            costo: sql<number>`coalesce(sum(${schema.ventasDetalle.cantidad} * ${schema.productos.precioCosto}), 0)`,
          })
          .from(schema.ventasDetalle)
          .innerJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id))
          .leftJoin(schema.categorias, eq(schema.productos.categoriaId, schema.categorias.id))
          .groupBy(schema.categorias.nombre)
          .orderBy(desc(sql`coalesce(sum(${schema.ventasDetalle.subtotal}), 0)`))
          .limit(6),
        db
          .select({
            sku: schema.productos.sku,
            nombre: schema.productos.nombre,
            unidadMedida: schema.productos.unidadMedida,
            unitsSold: sql<number>`coalesce(sum(${schema.ventasDetalle.cantidad}), 0)`,
            total: sql<number>`coalesce(sum(${schema.ventasDetalle.subtotal}), 0)`,
          })
          .from(schema.ventasDetalle)
          .innerJoin(schema.productos, eq(schema.ventasDetalle.productoId, schema.productos.id))
          .groupBy(schema.productos.sku, schema.productos.nombre, schema.productos.unidadMedida)
          .orderBy(desc(sql`coalesce(sum(${schema.ventasDetalle.cantidad}), 0)`))
          .limit(5),
      ]);

      if (categoryRows && categoryRows.length > 0) {
        const categories: CategoryProfitabilityRecord[] = categoryRows.map((cat) => {
          const ventas = parseFloat(String(cat.ventas));
          const costo = parseFloat(String(cat.costo));
          const ganancia = +(ventas - costo).toFixed(2);
          const margen = ventas > 0 ? +(((ventas - costo) / ventas) * 100).toFixed(1) : 0;
          return {
            name: cat.categoriaNombre,
            ventas,
            costo,
            margen,
            ganancia,
          };
        });

        const topProducts: ProductTurnoverRecord[] = topProductRows.map((p, idx) => {
          const units = parseFloat(String(p.unitsSold));
          const total = parseFloat(String(p.total));
          const undLabel = p.unidadMedida === "kg" ? `${units} kg` : `${units} und`;
          return {
            rank: idx + 1,
            name: p.nombre,
            sku: p.sku,
            und: undLabel,
            total,
            unitsSold: units,
          };
        });

        return { categories, topProducts };
      }
    }
  } catch (err) {
    console.warn("getReportsProfitabilityDataAction: DB fallback:", err);
  }

  // Fallback seguro si no hay ventas aún
  return {
    categories: [
      { name: "Abarrotes & Despensa", ventas: 28900, costo: 23100, margen: 20.1, ganancia: 5800 },
      { name: "Bebidas & Licores", ventas: 16400, costo: 12100, margen: 26.2, ganancia: 4300 },
      { name: "Lácteos & Huevos", ventas: 14500, costo: 11200, margen: 22.8, ganancia: 3300 },
      { name: "Limpieza & Hogar", ventas: 11200, costo: 8100, margen: 27.6, ganancia: 3100 },
      { name: "Frutas & Verduras", ventas: 9800, costo: 6400, margen: 34.7, ganancia: 3400 },
    ],
    topProducts: [
      { rank: 1, name: "Leche Gloria Entera 400g", sku: "GLO-001", und: "1,420 und", total: 6390.0, unitsSold: 1420 },
      { rank: 2, name: "Aceite Primor Premium 1L", sku: "PRI-001", und: "740 und", total: 7252.0, unitsSold: 740 },
      { rank: 3, name: "Arroz Costeño Extra 1kg", sku: "COS-001", und: "980 und", total: 5096.0, unitsSold: 980 },
      { rank: 4, name: "Detergente Bolívar Floral 1kg", sku: "BOL-001", und: "520 und", total: 4420.0, unitsSold: 520 },
      { rank: 5, name: "Manzana Delicia Nacional", sku: "MAN-001", und: "890 kg", total: 4272.0, unitsSold: 890 },
    ],
  };
}
