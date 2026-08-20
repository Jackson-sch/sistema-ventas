"use server";

import { revalidatePath } from "next/cache";

export type RiskLevel = "operativo" | "sensible" | "critico";

export interface MasterPermission {
  id: string;
  category: string;
  label: string;
  description: string;
  risk: RiskLevel;
}

export interface RolePermissionMatrix {
  roles: {
    id: string;
    label: string;
    color: string;
    description: string;
  }[];
  categories: {
    id: string;
    name: string;
    permissions: MasterPermission[];
  }[];
  // roleId -> permissionId -> boolean
  matrix: Record<string, Record<string, boolean>>;
}

export const MASTER_PERMISSIONS: { id: string; name: string; permissions: MasterPermission[] }[] = [
  {
    id: "pos",
    name: "Punto de Venta & Caja",
    permissions: [
      {
        id: "pos.apertura_cierre",
        category: "Punto de Venta & Caja",
        label: "Apertura y Cierre de Turno",
        description: "Realizar conteo inicial de efectivo y arqueo ciego al culminar el turno",
        risk: "operativo",
      },
      {
        id: "pos.emision_cpe",
        category: "Punto de Venta & Caja",
        label: "Cobro y Emisión de CPE (Boletas/Facturas)",
        description: "Emitir comprobantes fiscales electrónicos ante SUNAT UBL 2.1",
        risk: "operativo",
      },
      {
        id: "pos.anulacion_items",
        category: "Punto de Venta & Caja",
        label: "Anulación Directa de Ítems sin PIN",
        description: "Eliminar productos escaneados del carrito sin clave de supervisor",
        risk: "sensible",
      },
      {
        id: "pos.descuentos_manuales",
        category: "Punto de Venta & Caja",
        label: "Descuentos Manuales Libres",
        description: "Aplicar rebajas extraordinarias en el ticket de venta",
        risk: "sensible",
      },
      {
        id: "pos.movimientos_caja_chica",
        category: "Punto de Venta & Caja",
        label: "Movimientos de Caja Chica (Egresos/Ingresos)",
        description: "Registrar salidas menores de efectivo o ingresos de sencillo",
        risk: "operativo",
      },
      {
        id: "pos.retiros_boveda",
        category: "Punto de Venta & Caja",
        label: "Retiros de Efectivo a Bóveda / Remesas",
        description: "Aprobar remesas de dinero acumulado hacia la caja fuerte principal",
        risk: "critico",
      },
    ],
  },
  {
    id: "inventario",
    name: "Inventario, Kardex & Logística",
    permissions: [
      {
        id: "inv.consulta_stock",
        category: "Inventario, Kardex & Logística",
        label: "Consultar Existencias en Góndola",
        description: "Ver el inventario físico disponible en tiempo real",
        risk: "operativo",
      },
      {
        id: "inv.ver_costos",
        category: "Inventario, Kardex & Logística",
        label: "Visualizar Costos de Compra & Márgenes",
        description: "Acceso a costos financieros confidenciales por producto",
        risk: "critico",
      },
      {
        id: "inv.editar_precios",
        category: "Inventario, Kardex & Logística",
        label: "Modificar Precios de Venta al Público",
        description: "Editar el catálogo y tarifas de venta en tienda",
        risk: "critico",
      },
      {
        id: "inv.kardex_valorado",
        category: "Inventario, Kardex & Logística",
        label: "Kardex Valorado SUNAT (Método Promedio)",
        description: "Consultar y auditar la valorización contable de existencias",
        risk: "sensible",
      },
      {
        id: "inv.mermas_desmedros",
        category: "Inventario, Kardex & Logística",
        label: "Formular Actas de Mermas & Desmedros",
        description: "Dar de baja mercadería por vencimiento o rotura (Art. 37 LIR)",
        risk: "sensible",
      },
      {
        id: "inv.conteo_fisico",
        category: "Inventario, Kardex & Logística",
        label: "Toma de Inventario & Conteos Ciegos",
        description: "Realizar inventarios periódicos y registrar sobrantes/faltantes",
        risk: "operativo",
      },
      {
        id: "inv.transferencias_gre",
        category: "Inventario, Kardex & Logística",
        label: "Transferencias entre Sucursales & Guías GRE",
        description: "Emitir Guías de Remisión Electrónica de remitente (T001)",
        risk: "sensible",
      },
    ],
  },
  {
    id: "ventas_clientes",
    name: "Ventas, Cotizaciones & Clientes",
    permissions: [
      {
        id: "ventas.notas_credito",
        category: "Ventas, Cotizaciones & Clientes",
        label: "Emisión de Notas de Crédito & Devoluciones",
        description: "Aprobar anulaciones y devoluciones tributarias de comprobantes",
        risk: "critico",
      },
      {
        id: "ventas.cotizaciones",
        category: "Ventas, Cotizaciones & Clientes",
        label: "Gestión de Cotizaciones & Proformas",
        description: "Emitir proformas institucionales B2B y convertirlas a venta",
        risk: "operativo",
      },
      {
        id: "clientes.credito_fiado",
        category: "Ventas, Cotizaciones & Clientes",
        label: "Ventas al Crédito / Fiado en POS",
        description: "Cargar consumos a cuentas corrientes autorizadas",
        risk: "sensible",
      },
      {
        id: "clientes.aprobar_limites",
        category: "Ventas, Cotizaciones & Clientes",
        label: "Aprobación y Ajuste de Líneas de Crédito",
        description: "Modificar límites autorizados y plazos de pago a clientes",
        risk: "critico",
      },
    ],
  },
  {
    id: "compras",
    name: "Compras & Proveedores",
    permissions: [
      {
        id: "compras.ordenes_compra",
        category: "Compras & Proveedores",
        label: "Emisión de Órdenes de Compra (OC)",
        description: "Generar pedidos formales de abastecimiento a distribuidores",
        risk: "sensible",
      },
      {
        id: "compras.recepcion_muelle",
        category: "Compras & Proveedores",
        label: "Recepción de Mercadería en Muelle",
        description: "Cotejar guías y facturas de transporte e ingresar stock",
        risk: "operativo",
      },
    ],
  },
  {
    id: "admin_fiscal",
    name: "Administración, SUNAT & Seguridad",
    permissions: [
      {
        id: "admin.all_modules",
        category: "Administración, SUNAT & Seguridad",
        label: "Acceso Irrestricto a Todos los Módulos",
        description: "Control absoluto de navegación y bypass de restricciones",
        risk: "critico",
      },
      {
        id: "admin.usuarios_pins",
        category: "Administración, SUNAT & Seguridad",
        label: "Administración de Usuarios, Roles & PINs",
        description: "Crear cuentas, modificar contraseñas y claves maestras",
        risk: "critico",
      },
      {
        id: "admin.libros_sire",
        category: "Administración, SUNAT & Seguridad",
        label: "Libros Electrónicos SUNAT SIRE (RVIE / RCE)",
        description: "Descargar propuestas preliminares y macro de ventas 14.1",
        risk: "critico",
      },
      {
        id: "admin.auditoria_logs",
        category: "Administración, SUNAT & Seguridad",
        label: "Auditoría de Actividad del Sistema",
        description: "Consultar logs de auditoría forense de todas las operaciones",
        risk: "sensible",
      },
      {
        id: "admin.config_empresa",
        category: "Administración, SUNAT & Seguridad",
        label: "Configuración Fiscal & Certificados Digitales",
        description: "Modificar RUC, logo institucional y credenciales SOL",
        risk: "critico",
      },
    ],
  },
];

export const MASTER_ROLES = [
  { id: "cajero", label: "Cajero POS", color: "text-blue-400", description: "Operador de terminales de cobro y atención al cliente" },
  { id: "supervisor", label: "Supervisor de Tienda", color: "text-purple-400", description: "Control de caja, autorizaciones con PIN y auditoría de turno" },
  { id: "almacen", label: "Encargado de Almacén", color: "text-emerald-400", description: "Recepción en muelle, stock, lotes y mermas" },
  { id: "admin", label: "Administrador General", color: "text-amber-400", description: "Acceso total a reportes, finanzas, SUNAT y colaboradores" },
];

const DEFAULT_MATRIX: Record<string, Record<string, boolean>> = {
  cajero: {
    "pos.apertura_cierre": true,
    "pos.emision_cpe": true,
    "pos.anulacion_items": false,
    "pos.descuentos_manuales": false,
    "pos.movimientos_caja_chica": true,
    "pos.retiros_boveda": false,
    "inv.consulta_stock": true,
    "inv.ver_costos": false,
    "inv.editar_precios": false,
    "inv.kardex_valorado": false,
    "inv.mermas_desmedros": false,
    "inv.conteo_fisico": false,
    "inv.transferencias_gre": false,
    "ventas.notas_credito": false,
    "ventas.cotizaciones": false,
    "clientes.credito_fiado": true,
    "clientes.aprobar_limites": false,
    "compras.ordenes_compra": false,
    "compras.recepcion_muelle": false,
    "admin.all_modules": false,
    "admin.usuarios_pins": false,
    "admin.libros_sire": false,
    "admin.auditoria_logs": false,
    "admin.config_empresa": false,
  },
  supervisor: {
    "pos.apertura_cierre": true,
    "pos.emision_cpe": true,
    "pos.anulacion_items": true,
    "pos.descuentos_manuales": true,
    "pos.movimientos_caja_chica": true,
    "pos.retiros_boveda": true,
    "inv.consulta_stock": true,
    "inv.ver_costos": true,
    "inv.editar_precios": false,
    "inv.kardex_valorado": false,
    "inv.mermas_desmedros": true,
    "inv.conteo_fisico": true,
    "inv.transferencias_gre": false,
    "ventas.notas_credito": true,
    "ventas.cotizaciones": true,
    "clientes.credito_fiado": true,
    "clientes.aprobar_limites": false,
    "compras.ordenes_compra": true,
    "compras.recepcion_muelle": true,
    "admin.all_modules": false,
    "admin.usuarios_pins": false,
    "admin.libros_sire": false,
    "admin.auditoria_logs": false,
    "admin.config_empresa": false,
  },
  almacen: {
    "pos.apertura_cierre": false,
    "pos.emision_cpe": false,
    "pos.anulacion_items": false,
    "pos.descuentos_manuales": false,
    "pos.movimientos_caja_chica": false,
    "pos.retiros_boveda": false,
    "inv.consulta_stock": true,
    "inv.ver_costos": true,
    "inv.editar_precios": false,
    "inv.kardex_valorado": true,
    "inv.mermas_desmedros": true,
    "inv.conteo_fisico": true,
    "inv.transferencias_gre": true,
    "ventas.notas_credito": false,
    "ventas.cotizaciones": false,
    "clientes.credito_fiado": false,
    "clientes.aprobar_limites": false,
    "compras.ordenes_compra": true,
    "compras.recepcion_muelle": true,
    "admin.all_modules": false,
    "admin.usuarios_pins": false,
    "admin.libros_sire": false,
    "admin.auditoria_logs": false,
    "admin.config_empresa": false,
  },
  admin: {
    "pos.apertura_cierre": true,
    "pos.emision_cpe": true,
    "pos.anulacion_items": true,
    "pos.descuentos_manuales": true,
    "pos.movimientos_caja_chica": true,
    "pos.retiros_boveda": true,
    "inv.consulta_stock": true,
    "inv.ver_costos": true,
    "inv.editar_precios": true,
    "inv.kardex_valorado": true,
    "inv.mermas_desmedros": true,
    "inv.conteo_fisico": true,
    "inv.transferencias_gre": true,
    "ventas.notas_credito": true,
    "ventas.cotizaciones": true,
    "clientes.credito_fiado": true,
    "clientes.aprobar_limites": true,
    "compras.ordenes_compra": true,
    "compras.recepcion_muelle": true,
    "admin.all_modules": true,
    "admin.usuarios_pins": true,
    "admin.libros_sire": true,
    "admin.auditoria_logs": true,
    "admin.config_empresa": true,
  },
};

let inMemoryMatrix: Record<string, Record<string, boolean>> = JSON.parse(JSON.stringify(DEFAULT_MATRIX));

export async function getRolePermissionsMatrixAction(): Promise<RolePermissionMatrix> {
  return {
    roles: MASTER_ROLES,
    categories: MASTER_PERMISSIONS,
    matrix: inMemoryMatrix,
  };
}

export async function updatePermissionAction(
  roleId: string,
  permissionId: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  if (!inMemoryMatrix[roleId]) inMemoryMatrix[roleId] = {};
  inMemoryMatrix[roleId][permissionId] = enabled;
  revalidatePath("/usuarios/permisos");
  return { success: true };
}

export async function saveAllPermissionsMatrixAction(
  matrix: Record<string, Record<string, boolean>>
): Promise<{ success: boolean }> {
  inMemoryMatrix = JSON.parse(JSON.stringify(matrix));
  revalidatePath("/usuarios/permisos");
  return { success: true };
}

export async function resetPermissionsAction(roleId?: string): Promise<{ success: boolean; matrix: Record<string, Record<string, boolean>> }> {
  if (roleId) {
    inMemoryMatrix[roleId] = JSON.parse(JSON.stringify(DEFAULT_MATRIX[roleId] || {}));
  } else {
    inMemoryMatrix = JSON.parse(JSON.stringify(DEFAULT_MATRIX));
  }
  revalidatePath("/usuarios/permisos");
  return { success: true, matrix: inMemoryMatrix };
}
