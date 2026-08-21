"use client";

import { ClipboardCheck, ArrowUpDown, TrendingDown, TrendingUp, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ConteoKpisProps {
  totalItems: number;
  itemsContados: number;
  totalDiferencias: number;
  impactoTotalSoles: number;
  totalPorVencer: number;
}

export function ConteoKpis({
  totalItems,
  itemsContados,
  totalDiferencias,
  impactoTotalSoles,
  totalPorVencer,
}: ConteoKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {/* 1. Cobertura de Conteo */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Progreso de Auditoría</div>
          <div className="text-2xl font-mono font-extrabold text-white mt-1">
            {itemsContados} <span className="text-xs text-slate-500 font-sans font-normal">/ {totalItems} ítems</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Catálogo 100% verificado</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <ClipboardCheck className="size-5" />
        </div>
      </div>

      {/* 2. Total Diferencias */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Diferencias Físicas</div>
          <div className={`text-2xl font-mono font-extrabold mt-1 ${
            totalDiferencias === 0 ? "text-emerald-400" : totalDiferencias < 0 ? "text-rose-400" : "text-blue-400"
          }`}>
            {totalDiferencias > 0 ? `+${totalDiferencias}` : totalDiferencias} <span className="text-xs text-slate-500 font-sans font-normal">unds</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {totalDiferencias === 0 ? "Inventario cuadrado" : "Desviación vs sistema"}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <ArrowUpDown className="size-5" />
        </div>
      </div>

      {/* 3. Impacto Financiero */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Impacto Neto (Costo)</div>
          <div className={`text-2xl font-mono font-extrabold mt-1 ${
            impactoTotalSoles < 0 ? "text-rose-400" : impactoTotalSoles > 0 ? "text-emerald-400" : "text-slate-300"
          }`}>
            {impactoTotalSoles > 0 ? `+${formatCurrency(impactoTotalSoles)}` : formatCurrency(impactoTotalSoles)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Valorización contable</div>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          impactoTotalSoles < 0 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        }`}>
          {impactoTotalSoles < 0 ? <TrendingDown className="size-5" /> : <TrendingUp className="size-5" />}
        </div>
      </div>

      {/* 4. Lotes Críticos */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Lotes por Vencer / Vencidos</div>
          <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
            {totalPorVencer} <span className="text-xs text-slate-500 font-sans font-normal">lotes</span>
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">Control de perecibilidad</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="size-5" />
        </div>
      </div>
    </div>
  );
}
