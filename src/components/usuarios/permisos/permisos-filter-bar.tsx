"use client";

import {
  Search,
  Layers,
  Settings,
} from "lucide-react";
import { RiskLevel } from "@/lib/permissions-data";

interface PermisosFilterBarProps {
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  selectedRiskFilter: "all" | RiskLevel;
  onRiskFilterChange: (v: "all" | RiskLevel) => void;
  viewMode: "matrix" | "detail";
  onViewModeChange: (v: "matrix" | "detail") => void;
}

export function PermisosFilterBar({
  searchTerm,
  onSearchTermChange,
  selectedRiskFilter,
  onRiskFilterChange,
  viewMode,
  onViewModeChange,
}: PermisosFilterBarProps) {
  return (
    <div className="glass-panel rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 border border-slate-800/80">
      <div className="flex items-center gap-2 w-full md:w-auto">
        <div className="relative flex-1 md:w-72">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar acción o módulo..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
          />
        </div>

        <select
          value={selectedRiskFilter}
          onChange={(e) => onRiskFilterChange(e.target.value as "all" | RiskLevel)}
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
          onClick={() => onViewModeChange("matrix")}
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
          onClick={() => onViewModeChange("detail")}
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
  );
}
