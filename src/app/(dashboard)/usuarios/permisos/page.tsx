"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  Users2,
  Eye,
  AlertTriangle,
  Layers,
  KeyRound,
  Search,
  ArrowLeft,
  Save,
  CheckCheck,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getRolePermissionsMatrixAction,
  saveAllPermissionsMatrixAction,
  resetPermissionsAction,
} from "@/actions/permissions-actions";
import {
  RolePermissionMatrix,
  RiskLevel,
  MasterPermission,
} from "@/lib/permissions-data";

export default function PermisosPage() {
  const [data, setData] = useState<RolePermissionMatrix | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"matrix" | "detail">("matrix");
  const [activeRoleTab, setActiveRoleTab] = useState("supervisor");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<"all" | RiskLevel>("all");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getRolePermissionsMatrixAction();
      setData(res);
      setMatrix(JSON.parse(JSON.stringify(res.matrix)));
    } catch {
      toast.error("Error al cargar la matriz de permisos.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleCell = (roleId: string, permId: string) => {
    setMatrix((prev) => {
      const rolePerms = { ...(prev[roleId] || {}) };
      rolePerms[permId] = !rolePerms[permId];
      return {
        ...prev,
        [roleId]: rolePerms,
      };
    });
  };

  const handleToggleRoleAll = (roleId: string, enable: boolean) => {
    if (!data) return;
    setMatrix((prev) => {
      const rolePerms: Record<string, boolean> = {};
      data.categories.forEach((cat) => {
        cat.permissions.forEach((p) => {
          rolePerms[p.id] = enable;
        });
      });
      return {
        ...prev,
        [roleId]: rolePerms,
      };
    });
    toast.info(
      enable
        ? `Todos los privilegios activados para el rol seleccionado.`
        : `Todos los privilegios revocados para el rol seleccionado.`
    );
  };

  const handleResetRole = async (roleId?: string) => {
    try {
      const res = await resetPermissionsAction(roleId);
      if (res.success) {
        setMatrix(JSON.parse(JSON.stringify(res.matrix)));
        toast.success(
          roleId
            ? `Permisos de rol restablecidos a valores por defecto.`
            : `Toda la matriz de permisos fue restablecida a valores estándar.`
        );
      }
    } catch {
      toast.error("Error al restablecer permisos.");
    }
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    try {
      const res = await saveAllPermissionsMatrixAction(matrix);
      if (res.success) {
        toast.success("Matriz de permisos guardada y aplicada exitosamente a todo el sistema.");
      }
    } catch {
      toast.error("Error al guardar cambios de seguridad.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-indigo-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Matriz de Seguridad RBAC...</div>
      </div>
    );
  }

  // Flattened and filtered permissions
  const filteredCategories = data.categories
    .map((cat) => {
      const perms = cat.permissions.filter((p) => {
        const matchesSearch =
          p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRisk =
          selectedRiskFilter === "all" || p.risk === selectedRiskFilter;
        return matchesSearch && matchesRisk;
      });
      return { ...cat, permissions: perms };
    })
    .filter((cat) => cat.permissions.length > 0);

  const totalPermissionsCount = data.categories.reduce(
    (acc, c) => acc + c.permissions.length,
    0
  );
  const criticalPermissionsCount = data.categories.reduce(
    (acc, c) => acc + c.permissions.filter((p) => p.risk === "critico").length,
    0
  );

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case "critico":
        return (
          <span className="px-2 py-0.5 rounded-md bg-rose-950/90 text-rose-300 border border-rose-800 text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1">
            <Shield className="size-2.5" /> Crítico
          </span>
        );
      case "sensible":
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-950/90 text-amber-300 border border-amber-800 text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1">
            <AlertTriangle className="size-2.5" /> Sensible
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-950/90 text-blue-300 border border-blue-800 text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1">
            <Check className="size-2.5" /> Operativo
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/usuarios"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Volver a Colaboradores
            </Link>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 text-[10px] font-bold border border-indigo-800/60 flex items-center gap-1">
              <Shield className="size-3" /> Seguridad Corporativa & RBAC
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Shield className="size-6 text-indigo-400" /> Matriz de Permisos & Control de Acceso
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Audita, activa y revoca privilegios en tiempo real para todos los roles de la organización
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => handleResetRole()}
            className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Restablecer toda la matriz a los valores de fábrica"
          >
            <RotateCcw className="size-3.5 text-amber-400" /> Reset Fábrica
          </button>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="size-3.5" />
            {isSaving ? "Aplicando..." : "Guardar & Aplicar Permisos"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PRIVILEGIOS DEFINIDOS
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {totalPermissionsCount} Acciones
            </div>
            <span className="text-[11px] text-slate-500">Mapeados en 5 categorías</span>
          </div>
          <div className="size-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ROLES CORPORATIVOS
            </span>
            <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
              {data.roles.length} Perfiles
            </div>
            <span className="text-[11px] text-slate-500">Cajero, Supervisor, Almacén, Admin</span>
          </div>
          <div className="size-11 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
            <Users2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ACCIONES CRÍTICAS
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {criticalPermissionsCount} Protegidas
            </div>
            <span className="text-[11px] text-slate-500">Bóveda, Costos, SUNAT y SIRE</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <Shield className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ESTADO DE POLÍTICAS
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              100% Blindado
            </div>
            <span className="text-[11px] text-slate-500">Bloqueo activo por RouteGuard</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        </div>
      </div>

      {/* View Switcher and Search Filter Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar acción o módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          >
            <option value="all">Todos los Riesgos</option>
            <option value="operativo">⚡ Operativo</option>
            <option value="sensible">⚠️ Sensible</option>
            <option value="critico">🛡️ Crítico</option>
          </select>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1.5 self-end md:self-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode("matrix")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "matrix"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Layers className="size-3.5" /> Matriz Comparativa Global
          </button>
          <button
            type="button"
            onClick={() => setViewMode("detail")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === "detail"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Settings className="size-3.5" /> Vista por Rol
          </button>
        </div>
      </div>

      {/* VIEW 1: PANORAMIC COMPARATIVE MATRIX */}
      {viewMode === "matrix" && (
        <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/90 text-slate-400">
                  <th className="py-4 px-5 min-w-[320px] font-bold uppercase tracking-wider text-[11px]">
                    Privilegio / Acción de Seguridad
                  </th>
                  <th className="py-4 px-3 text-center min-w-[100px] font-bold uppercase tracking-wider text-[11px]">
                    Riesgo
                  </th>
                  {data.roles.map((r) => {
                    const activeCount = Object.keys(matrix[r.id] || {}).filter(
                      (k) => matrix[r.id][k]
                    ).length;
                    return (
                      <th
                        key={r.id}
                        className="py-4 px-4 text-center min-w-[160px] border-l border-slate-800/80"
                      >
                        <div className="font-extrabold text-sm text-white">{r.label}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {activeCount}/{totalPermissionsCount} activos
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="contents">
                    {/* Category Divider Header */}
                    <tr className="bg-slate-900/60 border-y border-slate-800">
                      <td
                        colSpan={2 + data.roles.length}
                        className="py-2.5 px-5 text-xs font-black text-indigo-300 uppercase tracking-wider"
                      >
                        📁 {category.name} ({category.permissions.length} privilegios)
                      </td>
                    </tr>

                    {/* Permissions rows */}
                    {category.permissions.map((perm) => (
                      <tr
                        key={perm.id}
                        className="hover:bg-slate-900/40 transition-colors group"
                      >
                        <td className="py-3 px-5 space-y-0.5">
                          <div className="font-bold text-white group-hover:text-indigo-300 transition-colors">
                            {perm.label}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug max-w-xl">
                            {perm.description}
                          </p>
                        </td>

                        <td className="py-3 px-3 text-center align-middle">
                          {getRiskBadge(perm.risk)}
                        </td>

                        {data.roles.map((r) => {
                          const isEnabled = !!matrix[r.id]?.[perm.id];
                          return (
                            <td
                              key={r.id}
                              onClick={() => handleToggleCell(r.id, perm.id)}
                              className="py-3 px-4 text-center align-middle border-l border-slate-800/60 cursor-pointer hover:bg-slate-800/30 transition-colors"
                            >
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleCell(r.id, perm.id);
                                  }}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    isEnabled
                                      ? "bg-indigo-600 shadow-md shadow-indigo-600/30"
                                      : "bg-slate-800"
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                      isEnabled ? "translate-x-5" : "translate-x-0"
                                    }`}
                                  >
                                    {isEnabled ? (
                                      <Check className="size-3 text-indigo-600 stroke-[3]" />
                                    ) : (
                                      <Lock className="size-2.5 text-slate-500" />
                                    )}
                                  </span>
                                </button>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </div>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: INDIVIDUAL ROLE TABS VIEW */}
      {viewMode === "detail" && (
        <div className="space-y-5">
          {/* Role selector cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.roles.map((r) => {
              const isSelected = activeRoleTab === r.id;
              const activeCount = Object.keys(matrix[r.id] || {}).filter(
                (k) => matrix[r.id][k]
              ).length;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setActiveRoleTab(r.id)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-500/10 ring-2 ring-indigo-500/40"
                      : "bg-slate-950/60 border-slate-800 hover:bg-slate-900/60 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-white">{r.label}</span>
                    {isSelected && <div className="size-2.5 rounded-full bg-indigo-400 animate-ping" />}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{r.description}</p>
                  <div className="text-[11px] font-mono text-indigo-300 font-bold pt-1 border-t border-slate-800/80">
                    {activeCount} de {totalPermissionsCount} activos
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Actions for Selected Role */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Rol seleccionado:</span>
              <strong className="text-sm text-white font-bold">
                {data.roles.find((r) => r.id === activeRoleTab)?.label}
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleToggleRoleAll(activeRoleTab, true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="size-3.5 text-emerald-400" /> Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => handleToggleRoleAll(activeRoleTab, false)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="size-3.5 text-rose-400" /> Desmarcar Todos
              </button>
              <button
                type="button"
                onClick={() => handleResetRole(activeRoleTab)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-400 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Valores por Defecto
              </button>
            </div>
          </div>

          {/* Permission list categorized */}
          <div className="space-y-4">
            {filteredCategories.map((category) => (
              <div key={category.id} className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
                  <span>📁 {category.name}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.permissions.map((perm) => {
                    const isEnabled = !!matrix[activeRoleTab]?.[perm.id];
                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleToggleCell(activeRoleTab, perm.id)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          isEnabled
                            ? "bg-slate-900/90 border-indigo-500/40 shadow-sm"
                            : "bg-slate-950/50 border-slate-850 hover:bg-slate-900/40 opacity-75"
                        }`}
                      >
                        <div className="pr-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{perm.label}</span>
                            {getRiskBadge(perm.risk)}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{perm.description}</p>
                        </div>

                        {/* Switch */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleCell(activeRoleTab, perm.id);
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? "bg-indigo-600 shadow-md shadow-indigo-600/30" : "bg-slate-800"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                              isEnabled ? "translate-x-5" : "translate-x-0"
                            }`}
                          >
                            {isEnabled ? (
                              <Check className="size-3 text-indigo-600 stroke-[3]" />
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
        </div>
      )}

      {/* Sticky Bottom Save Bar */}
      <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Shield className="size-4 text-indigo-400" />
          <span>Los cambios se replican en el guardián de rutas y en las sesiones activas.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleResetRole()}
            className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Descartar Cambios
          </button>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Save className="size-4" />
            {isSaving ? "Guardando..." : "Guardar & Aplicar Permisos"}
          </button>
        </div>
      </div>
    </div>
  );
}
