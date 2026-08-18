"use client";

import { useState } from "react";
import {
  Shield,
  CheckCircle2,
  Lock,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface RolePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
}

interface PermissionGroup {
  category: string;
  icon: any;
  permissions: {
    id: string;
    label: string;
    description: string;
    enabled: boolean;
  }[];
}

const DEFAULT_PERMISSIONS: Record<string, PermissionGroup[]> = {
  "Cajero POS": [
    {
      category: "Punto de Venta & Caja",
      icon: ShoppingCart,
      permissions: [
        { id: "p1", label: "Apertura y Cierre de Turno", description: "Realizar conteo inicial y arqueo ciego", enabled: true },
        { id: "p2", label: "Cobro y Emisión de Comprobantes", description: "Emitir boletas y facturas oficiales", enabled: true },
        { id: "p3", label: "Anulación Directa de Ítems", description: "Eliminar productos sin pedir PIN de supervisor", enabled: false },
        { id: "p4", label: "Descuentos Libres", description: "Aplicar rebajas manuales en el ticket", enabled: false },
        { id: "p5", label: "Movimientos de Caja Chica", description: "Registrar retiros e ingresos de efectivo", enabled: true },
      ],
    },
    {
      category: "Inventario & Catálogo",
      icon: Package,
      permissions: [
        { id: "p6", label: "Consultar Stock en Vivo", description: "Buscar existencias de productos", enabled: true },
        { id: "p7", label: "Ver Precios de Costo & Margen", description: "Visualizar costos financieros confidenciales", enabled: false },
        { id: "p8", label: "Editar Precios del Catálogo", description: "Modificar precio de venta al público", enabled: false },
      ],
    },
  ],
  "Supervisor de Tienda": [
    {
      category: "Punto de Venta & Caja",
      icon: ShoppingCart,
      permissions: [
        { id: "p1", label: "Apertura y Cierre de Turno", description: "Realizar conteo inicial y arqueo ciego", enabled: true },
        { id: "p2", label: "Cobro y Emisión de Comprobantes", description: "Emitir boletas y facturas oficiales", enabled: true },
        { id: "p3", label: "Autorización de Anulaciones con PIN", description: "Autorizar cancelaciones en cualquier caja", enabled: true },
        { id: "p4", label: "Descuentos Libres y Cortesías", description: "Autorizar descuentos en el POS", enabled: true },
        { id: "p5", label: "Retiros de Efectivo a Bóveda", description: "Aprobar egresos extraordinarios de caja", enabled: true },
      ],
    },
    {
      category: "Inventario & Ventas",
      icon: Package,
      permissions: [
        { id: "p6", label: "Emisión de Notas de Crédito", description: "Generar devoluciones SUNAT", enabled: true },
        { id: "p7", label: "Ver Precios de Costo & Margen", description: "Visualizar costos financieros confidenciales", enabled: true },
        { id: "p8", label: "Registro de Mermas y Ajustes", description: "Ingresar pérdidas por vencimiento o rotura", enabled: true },
      ],
    },
  ],
  "Encargado de Almacén": [
    {
      category: "Inventario & Logística",
      icon: Package,
      permissions: [
        { id: "p1", label: "Recepción de Compras", description: "Ingresar mercadería con orden de compra", enabled: true },
        { id: "p2", label: "Kardex Valorado SUNAT", description: "Consultar movimientos contables de existencias", enabled: true },
        { id: "p3", label: "Creación y Edición de Productos", description: "Crear códigos de barra y SKUs", enabled: true },
        { id: "p4", label: "Control de Lotes y Vencimientos", description: "Monitorear fechas críticas de perecibles", enabled: true },
      ],
    },
  ],
  "Administrador General": [
    {
      category: "Control Total de Plataforma",
      icon: Shield,
      permissions: [
        { id: "p1", label: "Acceso Completo a Todos los Módulos", description: "Sin restricciones de seguridad", enabled: true },
        { id: "p2", label: "Gestión de Sucursales y Cajas", description: "Crear locales y configurar impresoras", enabled: true },
        { id: "p3", label: "Administración de Usuarios y PINs", description: "Asignar credenciales de acceso", enabled: true },
        { id: "p4", label: "Parámetros Fiscales SUNAT", description: "Certificados digitales y credenciales SOL", enabled: true },
      ],
    },
  ],
};

export function RolePermissionsDialog({
  isOpen,
  onClose,
  roleName,
}: RolePermissionsDialogProps) {
  const [groups, setGroups] = useState<PermissionGroup[]>(
    DEFAULT_PERMISSIONS[roleName] || DEFAULT_PERMISSIONS["Cajero POS"]
  );

  if (!isOpen) return null;

  const handleToggle = (groupIdx: number, permIdx: number) => {
    setGroups((prev) => {
      const next = [...prev];
      next[groupIdx].permissions[permIdx].enabled = !next[groupIdx].permissions[permIdx].enabled;
      return next;
    });
  };

  const handleSave = () => {
    toast.success(`Matriz de permisos para "${roleName}" actualizada exitosamente`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Matriz de Permisos: {roleName}
              </h3>
              <p className="text-xs text-slate-400">
                Control granular de privilegios y acciones restringidas por rol
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Lists */}
        <div className="space-y-4">
          {groups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <group.icon className="size-4 text-blue-400" />
                <span>{group.category}</span>
              </div>

              <div className="space-y-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-2">
                {group.permissions.map((perm, permIdx) => (
                  <div
                    key={perm.id}
                    onClick={() => handleToggle(groupIdx, permIdx)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-900/80 transition-colors cursor-pointer"
                  >
                    <div className="pr-4">
                      <div className="text-xs font-bold text-white">{perm.label}</div>
                      <div className="text-[11px] text-slate-400">{perm.description}</div>
                    </div>

                    <input
                      type="checkbox"
                      checked={perm.enabled}
                      onChange={() => {}}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 shrink-0 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
          >
            <CheckCircle2 className="size-4" /> Guardar Permisos
          </button>
        </div>
      </div>
    </div>
  );
}
