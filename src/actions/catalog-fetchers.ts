"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

// 1. INVENTARIO & CATÁLOGO
export async function getProductsData() {
  try {
    if (hasDb()) {
      const [productosRows, categoriasRows, inventarioRows, lotesRows] = await Promise.all([
        db
          .select({
            id: schema.productos.id,
            sku: schema.productos.sku,
            nombre: schema.productos.nombre,
            categoriaId: schema.productos.categoriaId,
            marca: schema.productos.marca,
            tipo: schema.productos.tipo,
            precioCosto: schema.productos.precioCosto,
            precioVenta: schema.productos.precioVenta,
            estado: schema.productos.estado,
          })
          .from(schema.productos)
          .where(eq(schema.productos.estado, "activo")),
        db.select().from(schema.categorias),
        db.select().from(schema.inventario),
        db.select().from(schema.lotes),
      ]);

      if (productosRows && productosRows.length > 0) {
        const catMap = new Map(categoriasRows.map((c) => [c.id, c.nombre]));
        const stockMap = new Map<string, number>();
        for (const inv of inventarioRows) {
          stockMap.set(inv.productoId, (stockMap.get(inv.productoId) ?? 0) + parseFloat(inv.stockActual));
        }
        const loteMap = new Map<string, (typeof lotesRows)[number]>();
        for (const l of lotesRows) {
          const prev = loteMap.get(l.productoId);
          if (!prev || prev.creadoEn < l.creadoEn) loteMap.set(l.productoId, l);
        }
        const today = new Date();

        return productosRows.map((p) => {
          const stock = stockMap.get(p.id) ?? 0;
          const lote = loteMap.get(p.id);
          const venc = lote?.fechaVencimiento ? new Date(`${lote.fechaVencimiento}T00:00:00`) : null;
          return {
            id: p.id,
            sku: p.sku,
            nombre: p.nombre,
            categoria: catMap.get(p.categoriaId ?? "") ?? "General",
            marca: p.marca || "NovaMarket",
            tipoVenta: (p.tipo === "peso" ? "peso" : "unidad") as "unidad" | "peso",
            stock,
            stockMin: 0,
            precioCosto: parseFloat(p.precioCosto),
            precioVenta: parseFloat(p.precioVenta),
            margen: parseFloat((((parseFloat(p.precioVenta) - parseFloat(p.precioCosto)) / parseFloat(p.precioVenta)) * 100).toFixed(1)),
            isPerecible: Boolean(lote),
            lote: lote?.numeroLote,
            vencimiento: venc ? venc.toLocaleDateString("es-PE") : undefined,
            diasVencimiento: venc ? Math.ceil((venc.getTime() - today.getTime()) / 86400000) : undefined,
          };
        });
      }
    }
  } catch (err) {
    console.warn("getProductsData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      sku: "GLO-001",
      nombre: "Leche Gloria Entera 400g",
      categoria: "Lácteos",
      marca: "Gloria",
      tipoVenta: "unidad" as const,
      stock: 48,
      stockMin: 20,
      precioCosto: 3.20,
      precioVenta: 4.50,
      margen: 28.9,
      isPerecible: true,
      lote: "L-2026-081",
      vencimiento: "15/09/2026",
      diasVencimiento: 31,
    },
    {
      id: "2",
      sku: "PRI-001",
      nombre: "Aceite Primor Premium 1L",
      categoria: "Abarrotes",
      marca: "Primor",
      tipoVenta: "unidad" as const,
      stock: 12,
      stockMin: 15,
      precioCosto: 7.50,
      precioVenta: 9.80,
      margen: 23.5,
      isPerecible: false,
    },
    {
      id: "3",
      sku: "COS-001",
      nombre: "Arroz Costeño Extra 1kg",
      categoria: "Abarrotes",
      marca: "Costeño",
      tipoVenta: "unidad" as const,
      stock: 85,
      stockMin: 30,
      precioCosto: 3.80,
      precioVenta: 5.20,
      margen: 26.9,
      isPerecible: false,
    },
    {
      id: "4",
      sku: "MAN-001",
      nombre: "Manzana Delicia Nacional (kg)",
      categoria: "Frutas & Verduras",
      marca: "Granja Fresca",
      tipoVenta: "peso" as const,
      stock: 14.5,
      stockMin: 10.0,
      precioCosto: 2.80,
      precioVenta: 4.80,
      margen: 41.7,
      isPerecible: true,
      lote: "L-2026-092",
      vencimiento: "22/08/2026",
      diasVencimiento: 7,
    },
    {
      id: "5",
      sku: "BOL-001",
      nombre: "Detergente Bolívar 1kg",
      categoria: "Limpieza",
      marca: "Bolívar",
      tipoVenta: "unidad" as const,
      stock: 35,
      stockMin: 15,
      precioCosto: 6.20,
      precioVenta: 8.50,
      margen: 27.1,
      isPerecible: false,
    },
    {
      id: "6",
      sku: "YOG-001",
      nombre: "Yogurt Gloria Fresa 1L",
      categoria: "Lácteos",
      marca: "Gloria",
      tipoVenta: "unidad" as const,
      stock: 8,
      stockMin: 15,
      precioCosto: 5.40,
      precioVenta: 7.20,
      margen: 25.0,
      isPerecible: true,
      lote: "L-2026-088",
      vencimiento: "18/08/2026",
      diasVencimiento: 3,
    },
  ];
}
