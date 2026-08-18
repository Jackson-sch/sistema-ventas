import { sql } from "drizzle-orm";
import { pgPolicy } from "drizzle-orm/pg-core";
import { tenantPlanes, tenants, sucursales, cajas } from "./tenants";
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
import { auditoriaLog } from "./auditoria";

// Todas las policies se aplican al rol `authenticated` de Supabase.
// El `service_role` (usado por jobs de backend y la API de
// facturación) ignora RLS por completo — no necesita policy propia.
const TO = "authenticated";

// ════════════════════════════════════════════════════════════════════
// Plataforma / tenant
// ════════════════════════════════════════════════════════════════════

// Catálogo de planes: lectura abierta (no es información sensible,
// se usa para mostrar límites/upgrade), escritura solo super_admin.
export const tenantPlanesSelectPolicy = pgPolicy("tenant_planes_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`true`,
}).link(tenantPlanes);

export const tenantPlanesWritePolicy = pgPolicy("tenant_planes_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.is_super_admin()`,
  withCheck: sql`app.is_super_admin()`,
}).link(tenantPlanes);

// Tenants: cada tenant solo ve su propia fila; solo super_admin
// crea/edita/suspende tenants.
export const tenantsSelectPolicy = pgPolicy("tenants_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`id = app.current_tenant_id() or app.is_super_admin()`,
}).link(tenants);

export const tenantsWritePolicy = pgPolicy("tenants_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.is_super_admin()`,
  withCheck: sql`app.is_super_admin()`,
}).link(tenants);

// Sucursales: visibles solo si el usuario tiene acceso a ellas;
// gestión (crear/editar/desactivar) reservada a admin_tenant.
export const sucursalesSelectPolicy = pgPolicy("sucursales_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(id)`,
}).link(sucursales);

export const sucursalesWritePolicy = pgPolicy("sucursales_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.is_admin_tenant()`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.is_admin_tenant()`,
}).link(sucursales);

// Cajas: visibles para quien tenga acceso a la sucursal; gestión
// (alta de caja, asignar impresora, etc.) requiere el permiso
// 'cajas.gestionar'.
export const cajasSelectPolicy = pgPolicy("cajas_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id)`,
}).link(cajas);

export const cajasWritePolicy = pgPolicy("cajas_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('cajas.gestionar')`,
  withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('cajas.gestionar')`,
}).link(cajas);

// ════════════════════════════════════════════════════════════════════
// Auth / RBAC
// ════════════════════════════════════════════════════════════════════

// Roles: cada tenant ve sus roles custom + los roles base de
// plataforma (tenant_id null); solo admin_tenant edita los suyos,
// nadie edita los roles base salvo super_admin.
export const rolesSelectPolicy = pgPolicy("roles_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id is null or tenant_id = app.current_tenant_id()`,
}).link(roles);

export const rolesWritePolicy = pgPolicy("roles_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`
    (tenant_id = app.current_tenant_id() and app.is_admin_tenant())
    or app.is_super_admin()
  `,
  withCheck: sql`
    (tenant_id = app.current_tenant_id() and app.is_admin_tenant())
    or app.is_super_admin()
  `,
}).link(roles);

// Permisos: catálogo global de solo lectura para cualquier
// autenticado; solo super_admin lo mantiene (nuevas funcionalidades).
export const permisosSelectPolicy = pgPolicy("permisos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`true`,
}).link(permisos);

export const permisosWritePolicy = pgPolicy("permisos_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.is_super_admin()`,
  withCheck: sql`app.is_super_admin()`,
}).link(permisos);

// Rol-permisos: visibilidad y edición siguen al rol referenciado.
export const rolPermisosSelectPolicy = pgPolicy("rol_permisos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    exists (
      select 1 from roles r
      where r.id = rol_permisos.rol_id
        and (r.tenant_id is null or r.tenant_id = app.current_tenant_id())
    )
  `,
}).link(rolPermisos);

export const rolPermisosWritePolicy = pgPolicy("rol_permisos_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`
    exists (
      select 1 from roles r
      where r.id = rol_permisos.rol_id
        and r.tenant_id = app.current_tenant_id()
        and app.is_admin_tenant()
    )
    or app.is_super_admin()
  `,
  withCheck: sql`
    exists (
      select 1 from roles r
      where r.id = rol_permisos.rol_id
        and r.tenant_id = app.current_tenant_id()
        and app.is_admin_tenant()
    )
    or app.is_super_admin()
  `,
}).link(rolPermisos);

// Usuarios: visibles dentro del propio tenant; cada quien puede
// además ver/editar su propia fila (perfil) aunque no sea admin;
// alta/baja/edición de otros usuarios requiere admin_tenant.
export const usuariosSelectPolicy = pgPolicy("usuarios_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() or id = auth.uid()`,
}).link(usuarios);

export const usuariosInsertPolicy = pgPolicy("usuarios_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.is_admin_tenant()`,
}).link(usuarios);

export const usuariosUpdatePolicy = pgPolicy("usuarios_update", {
  as: "permissive",
  for: "update",
  to: TO,
  using: sql`
    (tenant_id = app.current_tenant_id() and app.is_admin_tenant())
    or id = auth.uid()
  `,
  withCheck: sql`
    (tenant_id = app.current_tenant_id() and app.is_admin_tenant())
    or id = auth.uid()
  `,
}).link(usuarios);

export const usuariosDeletePolicy = pgPolicy("usuarios_delete", {
  as: "permissive",
  for: "delete",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.is_admin_tenant()`,
}).link(usuarios);

// Asignación usuario ↔ sucursal: visible/editable por quien
// administra usuarios del tenant.
export const usuariosSucursalesPolicy = pgPolicy("usuarios_sucursales_all", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`
    exists (
      select 1 from usuarios u
      where u.id = usuarios_sucursales.usuario_id
        and u.tenant_id = app.current_tenant_id()
        and (app.is_admin_tenant() or u.id = auth.uid())
    )
  `,
  withCheck: sql`
    exists (
      select 1 from usuarios u
      where u.id = usuarios_sucursales.usuario_id
        and u.tenant_id = app.current_tenant_id()
        and app.is_admin_tenant()
    )
  `,
}).link(usuariosSucursales);

// ════════════════════════════════════════════════════════════════════
// Catálogo de productos (tenant-wide, no por sucursal)
// ════════════════════════════════════════════════════════════════════

export const categoriasSelectPolicy = pgPolicy("categorias_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(categorias);

export const categoriasWritePolicy = pgPolicy("categorias_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
}).link(categorias);

export const productosSelectPolicy = pgPolicy("productos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(productos);

export const productosWritePolicy = pgPolicy("productos_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
}).link(productos);

const productoTenantCheck = (col: string) => sql`
  exists (
    select 1 from productos p
    where p.id = ${sql.raw(col)}
      and p.tenant_id = app.current_tenant_id()
  )
`;

export const productosCodigosBarrasSelectPolicy = pgPolicy(
  "productos_codigos_barras_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: productoTenantCheck("productos_codigos_barras.producto_id"),
  },
).link(productosCodigosBarras);

export const productosCodigosBarrasWritePolicy = pgPolicy(
  "productos_codigos_barras_write",
  {
    as: "permissive",
    for: "all",
    to: TO,
    using: sql`${productoTenantCheck("productos_codigos_barras.producto_id")} and app.has_permission('catalogo.editar')`,
    withCheck: sql`${productoTenantCheck("productos_codigos_barras.producto_id")} and app.has_permission('catalogo.editar')`,
  },
).link(productosCodigosBarras);

export const productosVariantesSelectPolicy = pgPolicy("productos_variantes_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: productoTenantCheck("productos_variantes.producto_padre_id"),
}).link(productosVariantes);

export const productosVariantesWritePolicy = pgPolicy("productos_variantes_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`${productoTenantCheck("productos_variantes.producto_padre_id")} and app.has_permission('catalogo.editar')`,
  withCheck: sql`${productoTenantCheck("productos_variantes.producto_padre_id")} and app.has_permission('catalogo.editar')`,
}).link(productosVariantes);

// Precio por sucursal: exige acceso tanto al producto (tenant) como
// a la sucursal puntual.
export const productosPreciosSucursalSelectPolicy = pgPolicy(
  "productos_precios_sucursal_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: sql`app.has_sucursal_access(sucursal_id)`,
  },
).link(productosPreciosSucursal);

export const productosPreciosSucursalWritePolicy = pgPolicy(
  "productos_precios_sucursal_write",
  {
    as: "permissive",
    for: "all",
    to: TO,
    using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('catalogo.editar')`,
    withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('catalogo.editar')`,
  },
).link(productosPreciosSucursal);

export const combosSelectPolicy = pgPolicy("combos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(combos);

export const combosWritePolicy = pgPolicy("combos_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.has_permission('catalogo.editar')`,
}).link(combos);

const comboTenantCheck = sql`
  exists (
    select 1 from combos c
    where c.id = combos_detalle.combo_id
      and c.tenant_id = app.current_tenant_id()
  )
`;

export const combosDetalleSelectPolicy = pgPolicy("combos_detalle_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: comboTenantCheck,
}).link(combosDetalle);

export const combosDetalleWritePolicy = pgPolicy("combos_detalle_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`${comboTenantCheck} and app.has_permission('catalogo.editar')`,
  withCheck: sql`${comboTenantCheck} and app.has_permission('catalogo.editar')`,
}).link(combosDetalle);

// ════════════════════════════════════════════════════════════════════
// Inventario
// ════════════════════════════════════════════════════════════════════

export const inventarioSelectPolicy = pgPolicy("inventario_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id)`,
}).link(inventario);

export const inventarioWritePolicy = pgPolicy("inventario_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('inventario.ajustar')`,
  withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('inventario.ajustar')`,
}).link(inventario);

export const lotesSelectPolicy = pgPolicy("lotes_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id)`,
}).link(lotes);

export const lotesWritePolicy = pgPolicy("lotes_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('inventario.ajustar')`,
  withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('inventario.ajustar')`,
}).link(lotes);

// Movimientos de inventario: cualquier usuario con acceso a la
// sucursal puede leerlos (trazabilidad); registrar un movimiento
// requiere el permiso puntual (un cajero normal no ajusta stock a
// mano, eso pasa automático al vender).
export const movimientosInventarioSelectPolicy = pgPolicy(
  "movimientos_inventario_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: sql`app.has_sucursal_access(sucursal_id)`,
  },
).link(movimientosInventario);

export const movimientosInventarioInsertPolicy = pgPolicy(
  "movimientos_inventario_insert",
  {
    as: "permissive",
    for: "insert",
    to: TO,
    withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('inventario.registrar_movimiento')`,
  },
).link(movimientosInventario);

// No se permite update/delete de movimientos de inventario: es un
// log histórico (append-only), cualquier corrección se hace con un
// movimiento de ajuste nuevo, nunca editando uno existente.

export const proveedoresSelectPolicy = pgPolicy("proveedores_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(proveedores);

export const proveedoresWritePolicy = pgPolicy("proveedores_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.has_permission('compras.gestionar')`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.has_permission('compras.gestionar')`,
}).link(proveedores);

export const ordenesCompraSelectPolicy = pgPolicy("ordenes_compra_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id)`,
}).link(ordenesCompra);

export const ordenesCompraWritePolicy = pgPolicy("ordenes_compra_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('compras.gestionar')`,
  withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('compras.gestionar')`,
}).link(ordenesCompra);

const ordenCompraAccessCheck = (permiso: string | null) => sql`
  exists (
    select 1 from ordenes_compra oc
    where oc.id = ordenes_compra_detalle.orden_compra_id
      and app.has_sucursal_access(oc.sucursal_id)
      ${permiso ? sql`and app.has_permission(${permiso})` : sql``}
  )
`;

export const ordenesCompraDetalleSelectPolicy = pgPolicy(
  "ordenes_compra_detalle_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: ordenCompraAccessCheck(null),
  },
).link(ordenesCompraDetalle);

export const ordenesCompraDetalleWritePolicy = pgPolicy(
  "ordenes_compra_detalle_write",
  {
    as: "permissive",
    for: "all",
    to: TO,
    using: ordenCompraAccessCheck("compras.gestionar"),
    withCheck: ordenCompraAccessCheck("compras.gestionar"),
  },
).link(ordenesCompraDetalle);

export const recepcionesMercaderiaSelectPolicy = pgPolicy(
  "recepciones_mercaderia_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: sql`
      exists (
        select 1 from ordenes_compra oc
        where oc.id = recepciones_mercaderia.orden_compra_id
          and app.has_sucursal_access(oc.sucursal_id)
      )
    `,
  },
).link(recepcionesMercaderia);

export const recepcionesMercaderiaInsertPolicy = pgPolicy(
  "recepciones_mercaderia_insert",
  {
    as: "permissive",
    for: "insert",
    to: TO,
    withCheck: sql`
      exists (
        select 1 from ordenes_compra oc
        where oc.id = recepciones_mercaderia.orden_compra_id
          and app.has_sucursal_access(oc.sucursal_id)
          and app.has_permission('compras.gestionar')
      )
    `,
  },
).link(recepcionesMercaderia);

export const recepcionesMercaderiaDetalleSelectPolicy = pgPolicy(
  "recepciones_mercaderia_detalle_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: sql`
      exists (
        select 1 from recepciones_mercaderia rm
        join ordenes_compra oc on oc.id = rm.orden_compra_id
        where rm.id = recepciones_mercaderia_detalle.recepcion_id
          and app.has_sucursal_access(oc.sucursal_id)
      )
    `,
  },
).link(recepcionesMercaderiaDetalle);

export const recepcionesMercaderiaDetalleInsertPolicy = pgPolicy(
  "recepciones_mercaderia_detalle_insert",
  {
    as: "permissive",
    for: "insert",
    to: TO,
    withCheck: sql`
      exists (
        select 1 from recepciones_mercaderia rm
        join ordenes_compra oc on oc.id = rm.orden_compra_id
        where rm.id = recepciones_mercaderia_detalle.recepcion_id
          and app.has_sucursal_access(oc.sucursal_id)
          and app.has_permission('compras.gestionar')
      )
    `,
  },
).link(recepcionesMercaderiaDetalle);

// Transferencias: acceso si el usuario tiene alcance sobre la
// sucursal origen o la destino.
export const transferenciasStockSelectPolicy = pgPolicy("transferencias_stock_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_origen_id) or app.has_sucursal_access(sucursal_destino_id)`,
}).link(transferenciasStock);

export const transferenciasStockWritePolicy = pgPolicy("transferencias_stock_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`
    (app.has_sucursal_access(sucursal_origen_id) or app.has_sucursal_access(sucursal_destino_id))
    and app.has_permission('inventario.transferir')
  `,
  withCheck: sql`
    (app.has_sucursal_access(sucursal_origen_id) or app.has_sucursal_access(sucursal_destino_id))
    and app.has_permission('inventario.transferir')
  `,
}).link(transferenciasStock);

export const transferenciasStockDetalleSelectPolicy = pgPolicy(
  "transferencias_stock_detalle_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: sql`
      exists (
        select 1 from transferencias_stock t
        where t.id = transferencias_stock_detalle.transferencia_id
          and (app.has_sucursal_access(t.sucursal_origen_id) or app.has_sucursal_access(t.sucursal_destino_id))
      )
    `,
  },
).link(transferenciasStockDetalle);

export const transferenciasStockDetalleWritePolicy = pgPolicy(
  "transferencias_stock_detalle_write",
  {
    as: "permissive",
    for: "all",
    to: TO,
    using: sql`
      exists (
        select 1 from transferencias_stock t
        where t.id = transferencias_stock_detalle.transferencia_id
          and (app.has_sucursal_access(t.sucursal_origen_id) or app.has_sucursal_access(t.sucursal_destino_id))
          and app.has_permission('inventario.transferir')
      )
    `,
    withCheck: sql`
      exists (
        select 1 from transferencias_stock t
        where t.id = transferencias_stock_detalle.transferencia_id
          and (app.has_sucursal_access(t.sucursal_origen_id) or app.has_sucursal_access(t.sucursal_destino_id))
          and app.has_permission('inventario.transferir')
      )
    `,
  },
).link(transferenciasStockDetalle);

// ════════════════════════════════════════════════════════════════════
// Clientes / promociones (tenant-wide)
// ════════════════════════════════════════════════════════════════════

export const clientesSelectPolicy = pgPolicy("clientes_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(clientes);

export const clientesWritePolicy = pgPolicy("clientes_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
  withCheck: sql`tenant_id = app.current_tenant_id()`,
}).link(clientes);

const clienteTenantCheck = (col: string) => sql`
  exists (
    select 1 from clientes c
    where c.id = ${sql.raw(col)}
      and c.tenant_id = app.current_tenant_id()
  )
`;

export const programaPuntosPolicy = pgPolicy("programa_puntos_all", {
  as: "permissive",
  for: "all",
  to: TO,
  using: clienteTenantCheck("programa_puntos.cliente_id"),
  withCheck: clienteTenantCheck("programa_puntos.cliente_id"),
}).link(programaPuntos);

export const movimientosPuntosSelectPolicy = pgPolicy("movimientos_puntos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: clienteTenantCheck("movimientos_puntos.cliente_id"),
}).link(movimientosPuntos);

export const movimientosPuntosInsertPolicy = pgPolicy("movimientos_puntos_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: clienteTenantCheck("movimientos_puntos.cliente_id"),
}).link(movimientosPuntos);

export const promocionesSelectPolicy = pgPolicy("promociones_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id()`,
}).link(promociones);

export const promocionesWritePolicy = pgPolicy("promociones_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`tenant_id = app.current_tenant_id() and app.has_permission('promociones.gestionar')`,
  withCheck: sql`tenant_id = app.current_tenant_id() and app.has_permission('promociones.gestionar')`,
}).link(promociones);

const promocionTenantCheck = sql`
  exists (
    select 1 from promociones p
    where p.id = promociones_productos.promocion_id
      and p.tenant_id = app.current_tenant_id()
  )
`;

export const promocionesProductosSelectPolicy = pgPolicy(
  "promociones_productos_select",
  {
    as: "permissive",
    for: "select",
    to: TO,
    using: promocionTenantCheck,
  },
).link(promocionesProductos);

export const promocionesProductosWritePolicy = pgPolicy("promociones_productos_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`${promocionTenantCheck} and app.has_permission('promociones.gestionar')`,
  withCheck: sql`${promocionTenantCheck} and app.has_permission('promociones.gestionar')`,
}).link(promocionesProductos);

// ════════════════════════════════════════════════════════════════════
// Ventas / caja
// ════════════════════════════════════════════════════════════════════

// Sesiones de caja: acceso a través de la sucursal de la caja.
export const sesionesCajaSelectPolicy = pgPolicy("sesiones_caja_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    exists (
      select 1 from cajas c
      where c.id = sesiones_caja.caja_id
        and app.has_sucursal_access(c.sucursal_id)
    )
  `,
}).link(sesionesCaja);

export const sesionesCajaInsertPolicy = pgPolicy("sesiones_caja_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    cajero_id = auth.uid()
    and exists (
      select 1 from cajas c
      where c.id = sesiones_caja.caja_id
        and app.has_sucursal_access(c.sucursal_id)
    )
  `,
}).link(sesionesCaja);

// El cierre (update) lo puede hacer el propio cajero de la sesión o
// un supervisor con permiso de forzar cierre (turno abandonado, etc.)
export const sesionesCajaUpdatePolicy = pgPolicy("sesiones_caja_update", {
  as: "permissive",
  for: "update",
  to: TO,
  using: sql`
    cajero_id = auth.uid()
    or app.has_permission('caja.cerrar_cualquier_sesion')
  `,
  withCheck: sql`
    exists (
      select 1 from cajas c
      where c.id = sesiones_caja.caja_id
        and app.has_sucursal_access(c.sucursal_id)
    )
  `,
}).link(sesionesCaja);

export const ventasSelectPolicy = pgPolicy("ventas_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id)`,
}).link(ventas);

// Insertar una venta: solo el propio cajero, dentro de su sesión de
// caja abierta y su sucursal.
export const ventasInsertPolicy = pgPolicy("ventas_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    cajero_id = auth.uid()
    and app.has_sucursal_access(sucursal_id)
    and exists (
      select 1 from sesiones_caja sc
      where sc.id = ventas.sesion_caja_id
        and sc.estado = 'abierta'
        and sc.cajero_id = auth.uid()
    )
  `,
}).link(ventas);

// Las ventas no se editan ni eliminan directamente: una venta mal
// hecha se anula (tabla `anulaciones`) y el estado pasa a 'anulada'
// mediante un update controlado por permiso explícito, nunca borrado
// físico.
export const ventasUpdateEstadoPolicy = pgPolicy("ventas_update_estado", {
  as: "permissive",
  for: "update",
  to: TO,
  using: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('ventas.anular')`,
  withCheck: sql`app.has_sucursal_access(sucursal_id) and app.has_permission('ventas.anular')`,
}).link(ventas);

const ventaAccessCheck = sql`
  exists (
    select 1 from ventas v
    where v.id = ventas_detalle.venta_id
      and app.has_sucursal_access(v.sucursal_id)
  )
`;

export const ventasDetalleSelectPolicy = pgPolicy("ventas_detalle_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: ventaAccessCheck,
}).link(ventasDetalle);

export const ventasDetalleInsertPolicy = pgPolicy("ventas_detalle_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    exists (
      select 1 from ventas v
      where v.id = ventas_detalle.venta_id
        and v.cajero_id = auth.uid()
    )
  `,
}).link(ventasDetalle);

const ventaAccessCheckPagos = sql`
  exists (
    select 1 from ventas v
    where v.id = ventas_pagos.venta_id
      and app.has_sucursal_access(v.sucursal_id)
  )
`;

export const ventasPagosSelectPolicy = pgPolicy("ventas_pagos_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: ventaAccessCheckPagos,
}).link(ventasPagos);

export const ventasPagosInsertPolicy = pgPolicy("ventas_pagos_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    exists (
      select 1 from ventas v
      where v.id = ventas_pagos.venta_id
        and v.cajero_id = auth.uid()
    )
  `,
}).link(ventasPagos);

export const anulacionesSelectPolicy = pgPolicy("anulaciones_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    exists (
      select 1 from ventas v
      where v.id = anulaciones.venta_id
        and app.has_sucursal_access(v.sucursal_id)
    )
  `,
}).link(anulaciones);

export const anulacionesInsertPolicy = pgPolicy("anulaciones_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    autorizado_por = auth.uid()
    and app.has_permission('ventas.anular')
    and exists (
      select 1 from ventas v
      where v.id = anulaciones.venta_id
        and app.has_sucursal_access(v.sucursal_id)
    )
  `,
}).link(anulaciones);

export const movimientosCajaSelectPolicy = pgPolicy("movimientos_caja_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    exists (
      select 1 from sesiones_caja sc
      join cajas c on c.id = sc.caja_id
      where sc.id = movimientos_caja.sesion_caja_id
        and app.has_sucursal_access(c.sucursal_id)
    )
  `,
}).link(movimientosCaja);

export const movimientosCajaInsertPolicy = pgPolicy("movimientos_caja_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`
    usuario_id = auth.uid()
    and exists (
      select 1 from sesiones_caja sc
      where sc.id = movimientos_caja.sesion_caja_id
        and sc.estado = 'abierta'
        and (
          sc.cajero_id = auth.uid()
          or app.has_permission('caja.registrar_movimiento')
        )
    )
  `,
}).link(movimientosCaja);

// ════════════════════════════════════════════════════════════════════
// Facturación electrónica
// ════════════════════════════════════════════════════════════════════

export const comprobantesSelectPolicy = pgPolicy("comprobantes_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    exists (
      select 1 from ventas v
      where v.id = comprobantes.venta_id
        and app.has_sucursal_access(v.sucursal_id)
    )
  `,
}).link(comprobantes);

// El insert/update real de comprobantes lo hace la API centralizada
// de facturación con `service_role` (bypassa RLS). Aun así se deja
// una policy explícita para llamadas hechas con sesión de usuario
// (ej. reintentar envío manual desde el panel de administración).
export const comprobantesWritePolicy = pgPolicy("comprobantes_write", {
  as: "permissive",
  for: "all",
  to: TO,
  using: sql`
    exists (
      select 1 from ventas v
      where v.id = comprobantes.venta_id
        and app.has_sucursal_access(v.sucursal_id)
    )
    and app.has_permission('facturacion.gestionar')
  `,
  withCheck: sql`
    exists (
      select 1 from ventas v
      where v.id = comprobantes.venta_id
        and app.has_sucursal_access(v.sucursal_id)
    )
    and app.has_permission('facturacion.gestionar')
  `,
}).link(comprobantes);

// ════════════════════════════════════════════════════════════════════
// Auditoría
// ════════════════════════════════════════════════════════════════════

// Log append-only: cualquier autenticado del tenant puede insertar
// (la propia app registra sus acciones), solo admin_tenant/super_admin
// pueden leerlo, y nadie puede editarlo ni borrarlo vía API.
export const auditoriaLogSelectPolicy = pgPolicy("auditoria_log_select", {
  as: "permissive",
  for: "select",
  to: TO,
  using: sql`
    (tenant_id = app.current_tenant_id() and app.is_admin_tenant())
    or app.is_super_admin()
  `,
}).link(auditoriaLog);

export const auditoriaLogInsertPolicy = pgPolicy("auditoria_log_insert", {
  as: "permissive",
  for: "insert",
  to: TO,
  withCheck: sql`tenant_id = app.current_tenant_id()`,
}).link(auditoriaLog);
