"use client";

import {
  Shield,
  AlertTriangle,
  Check,
  RotateCcw,
  CheckCheck,
  X,
  Folder,
} from "lucide-react";
import {
  RolePermissionMatrix,
  RiskLevel,
  MasterPermission,
} from "@/lib/permissions-data";

interface PermisosDetailViewProps {
  data: RolePermissionMatrix;
  matrix: Record<string, Record<string, boolean>>;
  filteredCategories: { id: string; name: string; permissions: MasterPermission[] }[];
  totalPermissionsCount: number;
  activeRoleTab: string;
  onActiveRoleTabChange: (v: string) => void;
  onToggleCell: (roleId: string, permId: string) => void;
  onToggleRoleAll: (roleId: string, enable: boolean) => void;
  onResetRole: (roleId?: string) => void;
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
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
}

export function PermisosDetailView({
  data,
  matrix,
  filteredCategories,
  totalPermissionsCount,
  activeRoleTab,
  onActiveRoleTabChange,
  onToggleCell,
  onToggleRoleAll,
  onResetRole,
}: PermisosDetailViewProps) {
  return (
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
              onClick={() => onActiveRoleTabChange(r.id)}
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
            onClick={() => onToggleRoleAll(activeRoleTab, true)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="size-3.5 text-emerald-400" /> Marcar Todos
          </button>
          <button
            type="button"
            onClick={() => onToggleRoleAll(activeRoleTab, false)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <X className="size-3.5 text-rose-400" /> Desmarcar Todos
          </button>
          <button
            type="button"
            onClick={() => onResetRole(activeRoleTab)}
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
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-300 uppercase tracking-wider">
              <Folder className="size-3.5 text-indigo-400" />
              <span>{category.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {category.permissions.map((perm) => {
                const isEnabled = !!matrix[activeRoleTab]?.[perm.id];
                return (
                  <div
                    key={perm.id}
                    onClick={() => onToggleCell(activeRoleTab, perm.id)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isEnabled
                        ? "bg-slate-900/90 border-indigo-500/40 shadow-sm"
                        : "bg-slate-950/50 border-slate-850 hover:bg-slate-900/40 opacity-75"
                    }`}
                  >
                    <div className="pr-4 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{perm.label}</span>
                        <RiskBadge risk={perm.risk} />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{perm.description}</p>
                    </div>

                    {/* Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={isEnabled}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCell(activeRoleTab, perm.id);
                      }}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                        isEnabled
                          ? "bg-indigo-600 shadow-sm shadow-indigo-600/40"
                          : "bg-slate-800 border border-slate-700/60"
                      }`}
                    >
                      <span
                        className={`pointer-events-none block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out ${
                          isEnabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
