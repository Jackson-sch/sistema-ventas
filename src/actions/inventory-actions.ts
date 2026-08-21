"use server";

import { db } from "@/db";
import {
  productos,
  categorias,
  productosCodigosBarras,
  inventario,
  lotes,
  movimientosInventario,
  auditoriaLog,
} from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDevContext } from "./context";

export interface UpsertProductInput {
  id?: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca?: string;
  tipoVenta: "unidad" | "peso";
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  precioCosto: number;
  precioVenta: number;
  isPerecible: boolean;
  lote?: string;
  vencimiento?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function upsertProductAction(input: UpsertProductInput) {
  try {
    const ctx = await getDevContext();

    let categoriaId: string | undefined;
    if (input.categoria) {
      const [categoria] = await db
        .select({ id: categorias.id })
        .from(categorias)
        .where(and(eq(categorias.tenantId, ctx.tenantId), eq(categorias.nombre, input.categoria)))
        .limit(1);

      if (categoria) {
        categoriaId = categoria.id;
      } else {
        const [nuevaCategoria] = await db
          .insert(categorias)
          .values({ tenantId: ctx.tenantId, nombre: input.categoria })
          .returning({ id: categorias.id });
        categoriaId = nuevaCategoria.id;
      }
    }

    const productId = input.id && UUID_RE.test(input.id) ? input.id : crypto.randomUUID();
    const esNuevo = !input.id || !UUID_RE.test(input.id);

    if (esNuevo) {
      await db.insert(productos).values({
        id: productId,
        tenantId: ctx.tenantId,
        sku: input.sku,
        nombre: input.nombre,
        categoriaId,
        marca: input.marca || null,
        unidadMedida: input.tipoVenta === "peso" ? "KG" : "UND",
        tipo: input.tipoVenta,
        precioVenta: input.precioVenta.toFixed(2),
        precioCosto: input.precioCosto.toFixed(2),
        afectoIgv: true,
        estado: "activo",
      });

      await db.insert(productosCodigosBarras).values({
        productoId: productId,
        codigo: input.sku,
        esPrincipal: true,
      });
    } else {
      await db
        .update(productos)
        .set({
          sku: input.sku,
          nombre: input.nombre,
          categoriaId,
          marca: input.marca || null,
          unidadMedida: input.tipoVenta === "peso" ? "KG" : "UND",
          tipo: input.tipoVenta,
          precioVenta: input.precioVenta.toFixed(2),
          precioCosto: input.precioCosto.toFixed(2),
          actualizadoEn: new Date(),
        })
        .where(eq(productos.id, productId));
    }

    await db
      .insert(inventario)
      .values({
        productoId: productId,
        sucursalId: ctx.sucursalId,
        stockActual: input.stockActual.toFixed(3),
        stockMinimo: input.stockMinimo.toFixed(3),
        stockMaximo: input.stockMaximo != null ? input.stockMaximo.toFixed(3) : null,
        ubicacionAlmacen: "Almacén Principal",
      })
      .onConflictDoUpdate({
        target: [inventario.productoId, inventario.sucursalId],
        set: {
          stockActual: input.stockActual.toFixed(3),
          stockMinimo: input.stockMinimo.toFixed(3),
          stockMaximo: input.stockMaximo != null ? input.stockMaximo.toFixed(3) : null,
          actualizadoEn: new Date(),
        },
      });

    if (input.isPerecible && input.lote) {
      await db.insert(lotes).values({
        productoId: productId,
        sucursalId: ctx.sucursalId,
        numeroLote: input.lote,
        fechaVencimiento: input.vencimiento || null,
        cantidadInicial: input.stockActual.toFixed(3),
        cantidadActual: input.stockActual.toFixed(3),
      });
    }

    await db.insert(movimientosInventario).values({
      tenantId: ctx.tenantId,
      sucursalId: ctx.sucursalId,
      productoId: productId,
      tipo: "ajuste",
      cantidad: input.stockActual.toFixed(3),
      motivo: esNuevo ? "Alta de producto" : "Actualización de stock",
      referenciaTipo: "producto",
      referenciaId: productId,
      usuarioId: ctx.cajeroId,
    });

    await db.insert(auditoriaLog).values({
      tenantId: ctx.tenantId,
      usuarioId: ctx.cajeroId,
      tablaAfectada: "productos",
      registroId: productId,
      accion: esNuevo ? "crear" : "actualizar",
      datosNuevos: { sku: input.sku, nombre: input.nombre, stock: input.stockActual },
    });

    revalidatePath("/inventario");
    revalidatePath("/inventario/kardex");
    revalidatePath("/pos");
    revalidatePath("/dashboard");

    return {
      success: true,
      productId,
      sku: input.sku,
      nombre: input.nombre,
    };
  } catch (error: any) {
    console.error("Error upsert product:", error);
    return {
      success: false,
      error: error.message || "Error al guardar producto",
    };
  }
}

export interface KardexAdjustmentInput {
  productoId: string;
  sku?: string;
  productoNombre?: string;
  tipo: "merma" | "ingreso" | "salida" | "ajuste";
  cantidad: number;
  costoUnitario?: number;
  motivo: string;
  documentoReferencia?: string;
}

export async function recordKardexAdjustmentAction(input: KardexAdjustmentInput) {
  try {
    const ctx = await getDevContext();
    const kardexId = crypto.randomUUID();

    const isPositive = input.tipo === "ingreso" || (input.tipo === "ajuste" && input.cantidad > 0);
    const signedQty = isPositive ? Math.abs(input.cantidad) : -Math.abs(input.cantidad);
    const docRef = input.documentoReferencia || `${input.tipo.toUpperCase()}-${new Date().getFullYear()}`;

    await db.transaction(async (tx) => {
      // 1. Insert Kardex Movement
      await tx.insert(movimientosInventario).values({
        id: kardexId,
        tenantId: ctx.tenantId,
        sucursalId: ctx.sucursalId,
        productoId: input.productoId,
        tipo: input.tipo as any,
        cantidad: signedQty.toFixed(3),
        motivo: `${input.motivo} [${docRef}]`,
        referenciaTipo: "ajuste_manual",
        referenciaId: kardexId,
        usuarioId: ctx.cajeroId,
      });

      // 2. Update stock in inventory
      const deltaStock = signedQty;
      await tx
        .update(inventario)
        .set({
          stockActual: sql`GREATEST(${inventario.stockActual} + ${deltaStock}, 0)`,
          actualizadoEn: new Date(),
        })
        .where(
          and(
            eq(inventario.productoId, input.productoId),
            eq(inventario.sucursalId, ctx.sucursalId)
          )
        );

      // 3. Security Audit Trail
      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "movimientos_inventario",
        registroId: kardexId,
        accion: "crear",
        datosNuevos: {
          productoId: input.productoId,
          producto: input.productoNombre,
          tipo: input.tipo,
          cantidad: input.cantidad,
          costoUnitario: input.costoUnitario,
          motivo: input.motivo,
          documentoReferencia: docRef,
        },
      });
    });

    try {
      revalidatePath("/inventario");
      revalidatePath("/inventario/kardex");
      revalidatePath("/dashboard");
    } catch {}

    return {
      success: true,
      kardexId,
    };
  } catch (error: any) {
    console.error("Error en recordKardexAdjustmentAction:", error);
    return {
      success: false,
      error: error.message || "Error al registrar movimiento en Kardex",
    };
  }
}

export async function deleteProductAction(id: string, nombre: string) {
  try {
    const ctx = await getDevContext();

    await db.transaction(async (tx) => {
      await tx
        .update(productos)
        .set({ estado: "inactivo", actualizadoEn: new Date() })
        .where(eq(productos.id, id));

      await tx.insert(auditoriaLog).values({
        tenantId: ctx.tenantId,
        usuarioId: ctx.cajeroId,
        tablaAfectada: "productos",
        registroId: id,
        accion: "eliminar",
        datosNuevos: { estado: "inactivo" },
      });
    });

    revalidatePath("/inventario");
    revalidatePath("/pos");

    return {
      success: true,
      id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Error al eliminar producto",
    };
  }
}

export interface ProductSearchResult {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca?: string;
  tipoVenta: "unidad" | "peso";
  stock: number;
  precioCosto: number;
  precioVenta: number;
}

export async function searchProductsAction(
  query: string,
  limit = 15
): Promise<ProductSearchResult[]> {
  try {
    const ctx = await getDevContext();
    const cleanQuery = query.trim().toLowerCase();

    const rows = await db
      .select({
        id: productos.id,
        sku: productos.sku,
        nombre: productos.nombre,
        categoria: categorias.nombre,
        marca: productos.marca,
        tipo: productos.tipo,
        precioCosto: productos.precioCosto,
        precioVenta: productos.precioVenta,
        stockActual: inventario.stockActual,
      })
      .from(productos)
      .leftJoin(categorias, eq(productos.categoriaId, categorias.id))
      .leftJoin(
        inventario,
        and(
          eq(inventario.productoId, productos.id),
          eq(inventario.sucursalId, ctx.sucursalId)
        )
      )
      .where(
        cleanQuery
          ? sql`(${productos.nombre} ILIKE ${'%' + cleanQuery + '%'} OR ${productos.sku} ILIKE ${'%' + cleanQuery + '%'})`
          : undefined
      )
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      nombre: r.nombre,
      categoria: r.categoria || "General",
      marca: r.marca || undefined,
      tipoVenta: r.tipo === "peso" ? ("peso" as const) : ("unidad" as const),
      stock: r.stockActual ? parseFloat(r.stockActual) : 0,
      precioCosto: r.precioCosto ? parseFloat(r.precioCosto) : 0,
      precioVenta: r.precioVenta ? parseFloat(r.precioVenta) : 0,
    }));
  } catch (error) {
    console.error("Error in searchProductsAction:", error);
    return [];
  }
}