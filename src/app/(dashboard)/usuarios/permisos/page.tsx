"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsString } from "nuqs";
import {
  getRolePermissionsMatrixAction,
  saveAllPermissionsMatrixAction,
  resetPermissionsAction,
} from "@/actions/permissions-actions";
import {
  RolePermissionMatrix,
  RiskLevel,
} from "@/lib/permissions-data";
import { PermisosKpiCards } from "@/components/usuarios/permisos/permisos-kpi-cards";
import { PermisosFilterBar } from "@/components/usuarios/permisos/permisos-filter-bar";
import { PermisosMatrixView } from "@/components/usuarios/permisos/permisos-matrix-view";
import { PermisosDetailView } from "@/components/usuarios/permisos/permisos-detail-view";
import { PermisosStickyBar } from "@/components/usuarios/permisos/permisos-sticky-bar";

export default function PermisosPage() {
  const [data, setData] = useState<RolePermissionMatrix | null>(null);
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // nuqs query state for deep-linking
  const [viewMode, setViewMode] = useQueryState<"matrix" | "detail">(
    "view",
    parseAsString.withDefault("matrix") as any
  );
  const [activeRoleTab, setActiveRoleTab] = useQueryState<string>(
    "rol",
    parseAsString.withDefault("supervisor")
  );
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [selectedRiskFilter, setSelectedRiskFilter] = useQueryState<"all" | RiskLevel>(
    "riesgo",
    parseAsString.withDefault("all") as any
  );

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

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/usuarios"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
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
            <RefreshCw className="size-3.5 text-amber-400" /> Reset Fábrica
          </button>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Shield className="size-3.5" />
            {isSaving ? "Aplicando..." : "Guardar & Aplicar Permisos"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <PermisosKpiCards
        totalPermissionsCount={totalPermissionsCount}
        criticalPermissionsCount={criticalPermissionsCount}
        rolesCount={data.roles.length}
        categoriesCount={data.categories.length}
      />

      {/* Filter Bar */}
      <PermisosFilterBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        selectedRiskFilter={selectedRiskFilter}
        onRiskFilterChange={setSelectedRiskFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* View 1: Panoramic Comparative Matrix */}
      {viewMode === "matrix" && (
        <PermisosMatrixView
          data={data}
          matrix={matrix}
          filteredCategories={filteredCategories}
          totalPermissionsCount={totalPermissionsCount}
          onToggleCell={handleToggleCell}
        />
      )}

      {/* View 2: Individual Role Tabs View */}
      {viewMode === "detail" && (
        <PermisosDetailView
          data={data}
          matrix={matrix}
          filteredCategories={filteredCategories}
          totalPermissionsCount={totalPermissionsCount}
          activeRoleTab={activeRoleTab}
          onActiveRoleTabChange={setActiveRoleTab}
          onToggleCell={handleToggleCell}
          onToggleRoleAll={handleToggleRoleAll}
          onResetRole={handleResetRole}
        />
      )}

      {/* Sticky Bottom Save Bar */}
      <PermisosStickyBar
        isSaving={isSaving}
        onSave={handleSaveMatrix}
        onReset={() => handleResetRole()}
      />
    </div>
  );
}
