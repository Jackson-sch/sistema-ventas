"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  CheckCircle2,
  Lock,
  Unlock,
  ShoppingCart,
  Package,
  FileText,
  Settings,
  Sparkles,
  RotateCcw,
  Check,
  X,
  CreditCard,
  Building2,
  Users,
  Eye,
  AlertTriangle,
  Layers,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";

interface RolePermissionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
}

export interface PermissionItem {
  id: string;
  label: string;
  description: string;
  level: "operativo" | "sensible" | "critico";
  enabled: boolean;
}

export interface PermissionGroup {
  category: string;
  icon: any;
  permissions: PermissionItem[];
}

export const ALL_ROLES = [
  { id: "Cajero POS", label: "Cajero POS", icon: ShoppingCart, color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10" },
  { id: "Supervisor de Tienda", label: "Supervisor", icon: KeyRound, color: "text-purple-400", border: "border-purple-500/30", bg: "bg-purple-500/10" },
  { id: "Encargado de Almacén", label: "Almacén", icon: Package, color: "text-emerald-400", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  { id: "Administrador General", label: "Administrador", icon: Shield, color: "text-amber-400", border: "border-amber-500/30", bg: "bg-amber-500/10" },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionGroup[]> = {
  "Cajero POS": [
    {
      category: "Punto de Venta & Caja",
      icon: ShoppingCart,
      permissions: [
        { id: "pos_apertura", label: "Apertura y Cierre de Turno", description: "Realizar conteo inicial y arqueo ciego de caja", level: "operativo", enabled: true },
        { id: "pos_cobro", label: "Cobro y Emisión de Comprobantes", description: "Emitir Boletas, Facturas y Tickets de venta", level: "operativo", enabled: true },
        { id: "pos_anulacion_directa", label: "Anulación Directa de Ítems", description: "Eliminar productos del carrito sin requerir PIN supervisor", level: "sensible", enabled: false },
        { id: "pos_descuentos", label: "Descuentos Manuales Libres", description: "Aplicar rebajas porcentuales extraordinarias", level: "sensible", enabled: false },
        { id: "pos_movimientos", label: "Movimientos de Caja Chica", description: "Registrar egresos menores e ingresos de sencillo", level: "operativo", enabled: true },
        { id: "pos_credito", label: "Ventas al Crédito / Fiado", description: "Cargar consumos a líneas de crédito de clientes", level: "sensible", enabled: true },
      ],
    },
    {
      category: "Inventario & Catálogo",
      icon: Package,
      permissions: [
        { id: "inv_consulta", label: "Consultar Stock en Góndola", description: "Ver existencias disponibles en tienda", level: "operativo", enabled: true },
        { id: "inv_ver_costos", label: "Ver Costos de Compra & Margen", description: "Visualizar datos financieros confidenciales", level: "critico", enabled: false },
        { id: "inv_editar_precios", label: "Modificar Precios de Venta", description: "Alterar el catálogo de precios al público", level: "critico", enabled: false },
      ],
    },
  ],
  "Supervisor de Tienda": [
    {
      category: "Punto de Venta & Caja",
      icon: ShoppingCart,
      permissions: [
        { id: "pos_apertura", label: "Apertura y Cierre de Turno", description: "Realizar conteo inicial y arqueo ciego de caja", level: "operativo", enabled: true },
        { id: "pos_cobro", label: "Cobro y Emisión de Comprobantes", description: "Emitir Boletas, Facturas y Tickets de venta", level: "operativo", enabled: true },
        { id: "pos_anulacion_pin", label: "Autorización de Anulaciones con PIN", description: "Autorizar cancelaciones y anulaciones en cualquier terminal", level: "sensible", enabled: true },
        { id: "pos_descuentos_auth", label: "Autorizar Cortesías & Promociones", description: "Validar rebajas especiales y cortesías", level: "sensible", enabled: true },
        { id: "pos_boveda", label: "Retiros de Efectivo a Bóveda", description: "Aprobar remesas de efectivo acumulado", level: "critico", enabled: true },
        { id: "pos_credito", label: "Ventas al Crédito / Fiado", description: "Cargar consumos a líneas de crédito de clientes", level: "sensible", enabled: true },
      ],
    },
    {
      category: "Inventario, Ventas & Notas de Crédito",
      icon: Package,
      permissions: [
        { id: "ventas_nc", label: "Emisión de Notas de Crédito", description: "Aprobar devoluciones fiscales ante SUNAT", level: "critico", enabled: true },
        { id: "ventas_proformas", label: "Crear y Gestionar Cotizaciones", description: "Emitir proformas institucionales B2B", level: "operativo", enabled: true },
        { id: "inv_ver_costos", label: "Ver Costos de Compra & Margen", description: "Visualizar datos financieros confidenciales", level: "sensible", enabled: true },
        { id: "inv_mermas", label: "Registro de Mermas & Desmedros", description: "Formular actas de baja por vencimiento o rotura", level: "sensible", enabled: true },
        { id: "inv_conteo", label: "Toma de Inventario Físico", description: "Auditar conteos ciegos de góndola", level: "operativo", enabled: true },
      ],
    },
  ],
  "Encargado de Almacén": [
    {
      category: "Inventario & Logística de Entrada",
      icon: Package,
      permissions: [
        { id: "alm_recepcion", label: "Recepción de Mercadería en Muelle", description: "Cotejar guías y facturas de proveedores e ingresar a Stock", level: "operativo", enabled: true },
        { id: "alm_kardex", label: "Consulta de Kardex Valorado", description: "Auditar movimientos de entradas y salidas", level: "sensible", enabled: true },
        { id: "alm_transferencias", label: "Transferencias entre Sucursales & GRE", description: "Emitir Guías de Remisión Electrónicas", level: "sensible", enabled: true },
        { id: "alm_lotes", label: "Control de Lotes & Vencimientos", description: "Gestionar rotación FIFO de perecibles", level: "operativo", enabled: true },
        { id: "alm_mermas", label: "Formular Actas de Desmedros", description: "Registrar mercadería dañada o vencida", level: "sensible", enabled: true },
        { id: "alm_etiquetas", label: "Impresión de Etiquetas & Códigos de Barra", description: "Generar flejes para góndolas", level: "operativo", enabled: true },
      ],
    },
  ],
  "Administrador General": [
    {
      category: "Control Total & Configuración SaaS",
      icon: Shield,
      permissions: [
        { id: "adm_all_modules", label: "Acceso Completo a Todos los Módulos", description: "Sin restricciones de menú o URL", level: "critico", enabled: true },
        { id: "adm_sucursales", label: "Gestión de Sucursales & Cajas POS", description: "Crear locales y configurar impresoras", level: "critico", enabled: true },
        { id: "adm_usuarios", label: "Administración de Usuarios, Roles & PINs", description: "Crear colaboradores y asignar claves maestras", level: "critico", enabled: true },
        { id: "adm_sunat", label: "Parámetros Fiscales & Libros SIRE", description: "Certificados digitales, credenciales SOL y libros 14.1/8.1", level: "critico", enabled: true },
        { id: "adm_auditoria", label: "Auditoría de Actividad del Sistema", description: "Ver traza forense de todas las operaciones", level: "sensible", enabled: true },
        { id: "adm_creditos", label: "Aprobación de Líneas de Crédito", description: "Ajustar límites de crédito y plazos de clientes", level: "sensible", enabled: true },
      ],
    },
  ],
};

const STORAGE_KEY = "novamarket_role_permissions_matrix";

export function RolePermissionsDialog({
  isOpen,
  onClose,
  roleName,
}: RolePermissionsDialogProps) {
  const [activeRole, setActiveRole] = useState<string>(roleName || "Supervisor de Tienda");
  const [allPermissions, setAllPermissions] = useState<Record<string, PermissionGroup[]>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.error("Error reading permissions from localStorage", e);
      }
    }
    return DEFAULT_ROLE_PERMISSIONS;
  });

  const [viewMode, setViewMode] = useState<"detail" | "matrix">("detail");

  // Sync role whenever prop changes or dialog opens
  useEffect(() => {
    if (roleName) {
      setActiveRole(roleName);
    }
  }, [roleName, isOpen]);

  if (!isOpen) return null;

  const currentGroups = allPermissions[activeRole] || DEFAULT_ROLE_PERMISSIONS[activeRole] || DEFAULT_ROLE_PERMISSIONS["Supervisor de Tienda"];

  const handleToggle = (groupIdx: number, permIdx: number) => {
    setAllPermissions((prev) => {
      const nextRoleGroups = JSON.parse(JSON.stringify(prev[activeRole] || DEFAULT_ROLE_PERMISSIONS[activeRole]));
      nextRoleGroups[groupIdx].permissions[permIdx].enabled = !nextRoleGroups[groupIdx].permissions[permIdx].enabled;
      
      const updated = {
        ...prev,
        [activeRole]: nextRoleGroups,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return updated;
    });
  };

  const handleToggleAll = (enable: boolean) => {
    setAllPermissions((prev) => {
      const nextRoleGroups = JSON.parse(JSON.stringify(prev[activeRole] || DEFAULT_ROLE_PERMISSIONS[activeRole]));
      nextRoleGroups.forEach((g: PermissionGroup) => {
        g.permissions.forEach((p: PermissionItem) => {
          p.enabled = enable;
        });
      });

      const updated = {
        ...prev,
        [activeRole]: nextRoleGroups,
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return updated;
    });

    toast.success(
      enable
        ? `Todos los permisos activados para ${activeRole}`
        : `Todos los permisos revocados para ${activeRole}`
    );
  };

  const handleResetDefaults = () => {
    setAllPermissions((prev) => {
      const updated = {
        ...prev,
        [activeRole]: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS[activeRole])),
      };

      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }

      return updated;
    });

    toast.info(`Permisos de "${activeRole}" restablecidos a valores recomendados.`);
  };

  const handleSave = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPermissions));
    }
    toast.success(`Matriz de permisos de seguridad guardada y aplicada exitosamente.`);
    onClose();
  };

  // Count active permissions
  const totalCount = currentGroups.reduce((acc, g) => acc + g.permissions.length, 0);
  const activeCount = currentGroups.reduce(
    (acc, g) => acc + g.permissions.filter((p) => p.enabled).length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[hsl(224,71%,4%)] rounded-3xl p-6 shadow-2xl border border-slate-800 space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Shield className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white tracking-tight">
                  Matriz de Permisos & Seguridad RBAC
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 text-[10px] font-bold border border-indigo-800">
                  En Tiempo Real
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Configura los privilegios granulares y módulos habilitados para cada rol del sistema
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white self-end sm:self-auto cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Role Tabs Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {ALL_ROLES.map((r) => {
            const isSelected = activeRole === r.id;
            const Icon = r.icon;
            const rGroups = allPermissions[r.id] || DEFAULT_ROLE_PERMISSIONS[r.id] || [];
            const rTotal = rGroups.reduce((acc, g) => acc + g.permissions.length, 0);
            const rActive = rGroups.reduce((acc, g) => acc + g.permissions.filter((p) => p.enabled).length, 0);

            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setActiveRole(r.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                  isSelected
                    ? "bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50"
                    : "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-white"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                    <Icon className={`size-3.5 ${r.color}`} />
                    <span className="truncate">{r.label}</span>
                  </div>
                  {isSelected && <div className="size-2 rounded-full bg-indigo-400 animate-pulse" />}
                </div>

                <div className="text-[10px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Privilegios:</span>
                  <strong className={isSelected ? "text-indigo-300" : "text-slate-300"}>
                    {rActive}/{rTotal}
                  </strong>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Rol activo:</span>
            <span className="px-2.5 py-0.5 rounded-xl bg-slate-900 text-white font-bold border border-slate-700 text-xs">
              {activeRole}
            </span>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              ({activeCount} de {totalCount} activos)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleToggleAll(true)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Activar todos los permisos para este rol"
            >
              <Check className="size-3 text-emerald-400" /> Marcar Todo
            </button>
            <button
              type="button"
              onClick={() => handleToggleAll(false)}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Desactivar todos los permisos"
            >
              <X className="size-3 text-rose-400" /> Desmarcar
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              title="Restablecer a valores por defecto"
            >
              <RotateCcw className="size-3 text-amber-400" /> Reset
            </button>
          </div>
        </div>

        {/* Permissions Lists with Smooth Interactive Toggle Controls */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
          {currentGroups.map((group, groupIdx) => (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <group.icon className="size-4 text-blue-400" />
                <span>{group.category}</span>
              </div>

              <div className="space-y-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 p-2">
                {group.permissions.map((perm, permIdx) => {
                  const isEnabled = perm.enabled;

                  const getBadge = () => {
                    switch (perm.level) {
                      case "critico":
                        return (
                          <span className="px-2 py-0.5 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 text-[9px] font-extrabold tracking-wider uppercase">
                            🛡️ Crítico
                          </span>
                        );
                      case "sensible":
                        return (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800 text-[9px] font-extrabold tracking-wider uppercase">
                            ⚠️ Sensible
                          </span>
                        );
                      default:
                        return (
                          <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800 text-[9px] font-extrabold tracking-wider uppercase">
                            ⚡ Operativo
                          </span>
                        );
                    }
                  };

                  return (
                    <div
                      key={perm.id}
                      onClick={() => handleToggle(groupIdx, permIdx)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer select-none ${
                        isEnabled
                          ? "bg-slate-900/90 border-blue-500/30 hover:border-blue-500/60 shadow-sm"
                          : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 opacity-75"
                      }`}
                    >
                      <div className="pr-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {perm.label}
                          </span>
                          {getBadge()}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {perm.description}
                        </p>
                      </div>

                      {/* Custom Animated iOS Switch */}
                      <button
                        type="button"
                        aria-pressed={isEnabled}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggle(groupIdx, permIdx);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isEnabled ? "bg-blue-600 shadow-md shadow-blue-600/30" : "bg-slate-800"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                            isEnabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        >
                          {isEnabled ? (
                            <Check className="size-3 text-blue-600 stroke-[3]" />
                          ) : (
                            <Lock className="size-2.5 text-slate-500" />
                          )}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-[11px] text-slate-500 font-mono">
            * Los cambios se aplican inmediatamente a la sesión de usuarios de este rol.
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="size-4" /> Guardar & Aplicar Permisos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
