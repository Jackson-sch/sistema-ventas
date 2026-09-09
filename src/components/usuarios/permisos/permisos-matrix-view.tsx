"use client";

import { Fragment } from "react";
import {
  Shield,
  AlertTriangle,
  Check,
  Folder,
} from "lucide-react";
import {
  RolePermissionMatrix,
  RiskLevel,
  MasterPermission,
} from "@/lib/permissions-data";

interface PermisosMatrixViewProps {
  data: RolePermissionMatrix;
  matrix: Record<string, Record<string, boolean>>;
  filteredCategories: { id: string; name: string; permissions: MasterPermission[] }[];
  totalPermissionsCount: number;
  onToggleCell: (roleId: string, permId: string) => void;
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

export function PermisosMatrixView({
  data,
  matrix,
  filteredCategories,
  totalPermissionsCount,
  onToggleCell,
}: PermisosMatrixViewProps) {
  return (
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
              <Fragment key={category.id}>
                {/* Category Divider Header */}
                <tr className="bg-slate-900/60 border-y border-slate-800">
                  <td
                    colSpan={2 + data.roles.length}
                    className="py-2.5 px-5 text-xs font-black text-indigo-300 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <Folder className="size-3.5 text-indigo-400" />
                    <span>{category.name} ({category.permissions.length} privilegios)</span>
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
                      <RiskBadge risk={perm.risk} />
                    </td>

                    {data.roles.map((r) => {
                      const isEnabled = !!matrix[r.id]?.[perm.id];
                      return (
                        <td
                          key={r.id}
                          className="py-3 px-4 text-center align-middle border-l border-slate-800/60 cursor-pointer hover:bg-slate-800/30 transition-colors"
                        >
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isEnabled}
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleCell(r.id, perm.id);
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
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
