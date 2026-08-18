import { relations } from "drizzle-orm";
import { tenants, tenantPlanes, sucursales, cajas } from "./tenants";
import { roles, permisos, rolPermisos, usuarios, usuariosSucursales } from "./auth";
import {
  categorias,
  productos,
  productosCodigosBarras,
  productosPreciosSucursal,
  productosVariantes,
  combos,
  combosDetalle,
} from "./productos";
import {
  inventario,
  lotes,
  movimientosInventario,
  transferenciasStock,
  transferenciasStockDetalle,
  proveedores,
  ordenesCompra,
  ordenesCompraDetalle,
  recepcionesMercaderia,
  recepcionesMercaderiaDetalle,
} from "./inventario";
import {
  clientes,
  programaPuntos,
  movimientosPuntos,
  promociones,
  promocionesProductos,
} from "./clientes";
import {
  sesionesCaja,
  ventas,
  ventasDetalle,
  ventasPagos,
  anulaciones,
  movimientosCaja,
} from "./ventas";
import { comprobantes } from "./facturacion";

// ── Tenants / plataforma ─────────────────────────────────────────────
export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  plan: one(tenantPlanes, { fields: [tenants.planId], references: [tenantPlanes.id] }),
  sucursales: many(sucursales),
  usuarios: many(usuarios),
  roles: many(roles),
}));

export const sucursalesRelations = relations(sucursales, ({ one, many }) => ({
  tenant: one(tenants, { fields: [sucursales.tenantId], references: [tenants.id] }),
  cajas: many(cajas),
  inventario: many(inventario),
}));

export const cajasRelations = relations(cajas, ({ one, many }) => ({
  sucursal: one(sucursales, { fields: [cajas.sucursalId], references: [sucursales.id] }),
  sesiones: many(sesionesCaja),
}));

// ── Auth / RBAC ───────────────────────────────────────────────────────
export const rolesRelations = relations(roles, ({ many }) => ({
  rolPermisos: many(rolPermisos),
  usuarios: many(usuarios),
}));

export const rolPermisosRelations = relations(rolPermisos, ({ one }) => ({
  rol: one(roles, { fields: [rolPermisos.rolId], references: [roles.id] }),
  permiso: one(permisos, { fields: [rolPermisos.permisoId], references: [permisos.id] }),
}));

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  tenant: one(tenants, { fields: [usuarios.tenantId], references: [tenants.id] }),
  rol: one(roles, { fields: [usuarios.rolId], references: [roles.id] }),
  sucursales: many(usuariosSucursales),
}));

// ── Productos ─────────────────────────────────────────────────────────
export const categoriasRelations = relations(categorias, ({ one, many }) => ({
  categoriaPadre: one(categorias, {
    fields: [categorias.categoriaPadreId],
    references: [categorias.id],
    relationName: "subcategorias",
  }),
  subcategorias: many(categorias, { relationName: "subcategorias" }),
  productos: many(productos),
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
  categoria: one(categorias, {
    fields: [productos.categoriaId],
    references: [categorias.id],
  }),
  codigosBarras: many(productosCodigosBarras),
  preciosSucursal: many(productosPreciosSucursal),
  inventario: many(inventario),
}));

export const combosRelations = relations(combos, ({ many }) => ({
  detalle: many(combosDetalle),
}));

export const combosDetalleRelations = relations(combosDetalle, ({ one }) => ({
  combo: one(combos, { fields: [combosDetalle.comboId], references: [combos.id] }),
  producto: one(productos, {
    fields: [combosDetalle.productoId],
    references: [productos.id],
  }),
}));

// ── Inventario ────────────────────────────────────────────────────────
export const inventarioRelations = relations(inventario, ({ one }) => ({
  producto: one(productos, {
    fields: [inventario.productoId],
    references: [productos.id],
  }),
  sucursal: one(sucursales, {
    fields: [inventario.sucursalId],
    references: [sucursales.id],
  }),
}));

export const movimientosInventarioRelations = relations(
  movimientosInventario,
  ({ one }) => ({
    producto: one(productos, {
      fields: [movimientosInventario.productoId],
      references: [productos.id],
    }),
    sucursal: one(sucursales, {
      fields: [movimientosInventario.sucursalId],
      references: [sucursales.id],
    }),
    lote: one(lotes, {
      fields: [movimientosInventario.loteId],
      references: [lotes.id],
    }),
    usuario: one(usuarios, {
      fields: [movimientosInventario.usuarioId],
      references: [usuarios.id],
    }),
  }),
);

export const ordenesCompraRelations = relations(ordenesCompra, ({ one, many }) => ({
  proveedor: one(proveedores, {
    fields: [ordenesCompra.proveedorId],
    references: [proveedores.id],
  }),
  detalle: many(ordenesCompraDetalle),
  recepciones: many(recepcionesMercaderia),
}));

export const ordenesCompraDetalleRelations = relations(
  ordenesCompraDetalle,
  ({ one }) => ({
    ordenCompra: one(ordenesCompra, {
      fields: [ordenesCompraDetalle.ordenCompraId],
      references: [ordenesCompra.id],
    }),
    producto: one(productos, {
      fields: [ordenesCompraDetalle.productoId],
      references: [productos.id],
    }),
  }),
);

export const transferenciasStockRelations = relations(
  transferenciasStock,
  ({ one, many }) => ({
    sucursalOrigen: one(sucursales, {
      fields: [transferenciasStock.sucursalOrigenId],
      references: [sucursales.id],
      relationName: "sucursalOrigen",
    }),
    sucursalDestino: one(sucursales, {
      fields: [transferenciasStock.sucursalDestinoId],
      references: [sucursales.id],
      relationName: "sucursalDestino",
    }),
    detalle: many(transferenciasStockDetalle),
  }),
);

// ── Clientes ──────────────────────────────────────────────────────────
export const clientesRelations = relations(clientes, ({ one, many }) => ({
  puntos: one(programaPuntos, {
    fields: [clientes.id],
    references: [programaPuntos.clienteId],
  }),
  movimientosPuntos: many(movimientosPuntos),
  ventas: many(ventas),
}));

export const promocionesRelations = relations(promociones, ({ many }) => ({
  productos: many(promocionesProductos),
}));

// ── Ventas / caja ─────────────────────────────────────────────────────
export const sesionesCajaRelations = relations(sesionesCaja, ({ one, many }) => ({
  caja: one(cajas, { fields: [sesionesCaja.cajaId], references: [cajas.id] }),
  cajero: one(usuarios, {
    fields: [sesionesCaja.cajeroId],
    references: [usuarios.id],
  }),
  ventas: many(ventas),
  movimientosCaja: many(movimientosCaja),
}));

export const ventasRelations = relations(ventas, ({ one, many }) => ({
  tenant: one(tenants, { fields: [ventas.tenantId], references: [tenants.id] }),
  sucursal: one(sucursales, { fields: [ventas.sucursalId], references: [sucursales.id] }),
  caja: one(cajas, { fields: [ventas.cajaId], references: [cajas.id] }),
  sesionCaja: one(sesionesCaja, {
    fields: [ventas.sesionCajaId],
    references: [sesionesCaja.id],
  }),
  cajero: one(usuarios, { fields: [ventas.cajeroId], references: [usuarios.id] }),
  cliente: one(clientes, { fields: [ventas.clienteId], references: [clientes.id] }),
  detalle: many(ventasDetalle),
  pagos: many(ventasPagos),
  anulaciones: many(anulaciones),
  comprobantes: many(comprobantes),
}));

export const ventasDetalleRelations = relations(ventasDetalle, ({ one }) => ({
  venta: one(ventas, { fields: [ventasDetalle.ventaId], references: [ventas.id] }),
  producto: one(productos, {
    fields: [ventasDetalle.productoId],
    references: [productos.id],
  }),
}));

export const comprobantesRelations = relations(comprobantes, ({ one }) => ({
  venta: one(ventas, { fields: [comprobantes.ventaId], references: [ventas.id] }),
}));
