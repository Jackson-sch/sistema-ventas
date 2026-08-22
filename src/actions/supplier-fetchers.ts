"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";

const hasDb = () => Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]"));

function fmtFecha(d: Date): string {
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// 5. PROVEEDORES & COMPRAS
export async function getSuppliersData() {
  try {
    if (hasDb()) {
      const [proveedoresRows, ordenesRows, detalleRows] = await Promise.all([
        db.select().from(schema.proveedores),
        db.select().from(schema.ordenesCompra),
        db.select().from(schema.ordenesCompraDetalle),
      ]);

      if (proveedoresRows && proveedoresRows.length > 0) {
        const totalPorOrden = new Map<string, number>();
        for (const d of detalleRows) {
          totalPorOrden.set(
            d.ordenCompraId,
            (totalPorOrden.get(d.ordenCompraId) ?? 0) +
              parseFloat(d.cantidadRecibida) * parseFloat(d.precioUnitarioCosto),
          );
        }
        const totalPorProveedor = new Map<string, number>();
        for (const o of ordenesRows) {
          const total = totalPorOrden.get(o.id) ?? 0;
          totalPorProveedor.set(o.proveedorId, (totalPorProveedor.get(o.proveedorId) ?? 0) + total);
        }

        const seenRuc = new Set<string>();
        const uniqueProvs = proveedoresRows.filter((p) => {
          if (!p.ruc || seenRuc.has(p.ruc)) return false;
          seenRuc.add(p.ruc);
          return true;
        });

        uniqueProvs.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial));

        return uniqueProvs.map((p) => ({
          id: p.id,
          ruc: p.ruc,
          razonSocial: p.razonSocial,
          contactoNombre: p.contactoNombre || "Ejecutivo Comercial",
          telefono: p.contactoTelefono || "-",
          email: p.contactoEmail || "-",
          direccion: p.direccion || "-",
          condicionPago: "Crédito 30 días" as const,
          diasCredito: 30,
          totalComprado: totalPorProveedor.get(p.id) ?? 0,
        }));
      }
    }
  } catch (err) {
    console.warn("getSuppliersData: DB fallback:", err);
  }

  return [
    {
      id: "1",
      ruc: "20100055237",
      razonSocial: "LECHE GLORIA SOCIEDAD ANONIMA - GLORIA S.A.",
      contactoNombre: "Roberto Mendoza (Ventas Mayoristas)",
      telefono: "(01) 470-7170",
      email: "pedidos@gloria.com.pe",
      direccion: "Av. República de Panamá 2461 - La Victoria - Lima",
      condicionPago: "Crédito 30 días" as const,
      diasCredito: 30,
      totalComprado: 64800.00,
    },
    {
      id: "2",
      ruc: "20100105862",
      razonSocial: "ALICORP S.A.A.",
      contactoNombre: "Valeria Santisteban",
      telefono: "(01) 315-0800",
      email: "distribucion@alicorp.com.pe",
      direccion: "Av. Argentina 4793 - Carmen de la Legua - Callao",
      condicionPago: "Crédito 60 días" as const,
      diasCredito: 45,
      totalComprado: 89200.00,
    },
    {
      id: "3",
      ruc: "20100035121",
      razonSocial: "COMPAÑIA NACIONAL DE CHOCOLATES DE PERU S.A.",
      contactoNombre: "Fernando Castro",
      telefono: "(01) 618-5500",
      email: "ventas@chocolates.pe",
      direccion: "Carretera Central Km 4.5 - Ate - Lima",
      condicionPago: "Contado" as const,
      diasCredito: 0,
      totalComprado: 18450.00,
    },
  ];
}

// 5.1 COMPRAS & RECEPCIONES DE FACTURAS DE PROVEEDOR
export async function getPurchasesData() {
  try {
    if (hasDb()) {
      const [ordenesRows, proveedoresRows, detalleRows, productosRows] = await Promise.all([
        db.select().from(schema.ordenesCompra).orderBy(desc(schema.ordenesCompra.creadoEn)),
        db.select().from(schema.proveedores),
        db.select().from(schema.ordenesCompraDetalle),
        db.select().from(schema.productos),
      ]);

      if (ordenesRows && ordenesRows.length > 0) {
        const provMap = new Map(proveedoresRows.map((p) => [p.id, p]));
        const prodMap = new Map(productosRows.map((p) => [p.id, p]));
        const detallePorOrden = new Map<string, typeof detalleRows>();
        for (const d of detalleRows) {
          const arr = detallePorOrden.get(d.ordenCompraId) ?? [];
          arr.push(d);
          detallePorOrden.set(d.ordenCompraId, arr);
        }

        return ordenesRows.map((o) => {
          const prov = provMap.get(o.proveedorId);
          const detalles = detallePorOrden.get(o.id) ?? [];
          const subtotal = detalles.reduce(
            (acc, d) => acc + parseFloat(d.cantidadPedida) * parseFloat(d.precioUnitarioCosto),
            0
          );
          const igv = +(subtotal * 0.18).toFixed(2);
          const total = +(subtotal + igv).toFixed(2);

          return {
            id: o.id,
            numeroFactura: o.numero || `OC-2026-${o.id.slice(0, 6).toUpperCase()}`,
            proveedorId: o.proveedorId,
            proveedorNombre: prov?.razonSocial || "Proveedor General",
            proveedorRuc: prov?.ruc || "20100000000",
            fechaEmision: fmtFecha(new Date(o.creadoEn)),
            fechaRecepcion: o.fechaEntregaEstimada || fmtFecha(new Date(o.creadoEn)),
            subtotal,
            igv,
            total,
            condicionPago: "Crédito 30 días" as const,
            estado: (o.estado.startsWith("recibida") ? "Recibido" : o.estado === "pendiente" ? "Pendiente" : "En Tránsito") as "Recibido" | "Pendiente" | "En Tránsito",
            items: detalles.map((d) => {
              const prod = prodMap.get(d.productoId);
              return {
                productoId: d.productoId,
                nombre: prod?.nombre || "Producto",
                sku: prod?.sku || "SKU-000",
                cantidad: parseFloat(d.cantidadPedida),
                costoUnitario: parseFloat(d.precioUnitarioCosto),
                total: +(parseFloat(d.cantidadPedida) * parseFloat(d.precioUnitarioCosto)).toFixed(2),
              };
            }),
          };
        });
      }
    }
  } catch (err) {
    console.warn("getPurchasesData: DB fallback:", err);
  }
  return [];
}
