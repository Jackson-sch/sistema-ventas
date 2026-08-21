"use client";

import { Layers, ArrowDownRight, ArrowUpRight, Boxes } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface KardexKpisProps {
  totalEntradasSoles: number;
  totalSalidasSoles: number;
  totalMovimientos: number;
}

export function KardexKpis({
  totalEntradasSoles,
  totalSalidasSoles,
  totalMovimientos,
}: KardexKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Método Contable</div>
          <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
            <span>Promedio Ponderado</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Norma Tributaria SUNAT</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <Layers className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Entradas / Compras</div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
            {formatCurrency(totalEntradasSoles)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Total recepciones</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <ArrowDownRight className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Salidas / Ventas</div>
          <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
            {formatCurrency(totalSalidasSoles)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ventas y mermas</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <ArrowUpRight className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Movimientos Registrados</div>
          <div className="text-2xl font-mono font-extrabold text-blue-400 mt-1">
            {totalMovimientos}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Asientos en Kardex</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <Boxes className="size-5" />
        </div>
      </div>
    </div>
  );
}
