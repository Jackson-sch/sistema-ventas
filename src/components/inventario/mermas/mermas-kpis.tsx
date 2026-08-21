"use client";

import { Scale, TrendingDown, AlertTriangle, FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { WasteRecord } from "@/actions/waste-actions";

interface MermasKpisProps {
  records: WasteRecord[];
}

export function MermasKpis({ records }: MermasKpisProps) {
  const totalPerdida = records.reduce((acc, r) => acc + (r.costoTotalPerdida || 0), 0);

  const perdidasVencimiento = records
    .filter((r) => r.motivo === "VENCIMIENTO" || r.motivo === "MERMA_PERECIBLE")
    .reduce((acc, r) => acc + (r.costoTotalPerdida || 0), 0);

  const perdidasTransporte = records
    .filter((r) => r.motivo === "ROTURA_TRANSPORTE" || r.motivo === "DEFECTO_FABRICA" || r.motivo === "CONTAMINACION")
    .reduce((acc, r) => acc + (r.costoTotalPerdida || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {/* 1. Total Actas */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Actas Registradas</div>
          <div className="text-2xl font-mono font-extrabold text-white mt-1">
            {records.length} <span className="text-xs text-slate-500 font-sans font-normal">expedientes</span>
          </div>
          <div className="text-[10px] text-blue-400 font-mono mt-0.5">Control tributario SUNAT</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <FileText className="size-5" />
        </div>
      </div>

      {/* 2. Pérdida Total */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Pérdida Total Valorizada</div>
          <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
            {formatCurrency(totalPerdida)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Costo directo deducible</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
          <TrendingDown className="size-5" />
        </div>
      </div>

      {/* 3. Mermas Vencimiento */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Mermas por Caducidad</div>
          <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
            {formatCurrency(perdidasVencimiento)}
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">Perecibles y vencidos</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <AlertTriangle className="size-5" />
        </div>
      </div>

      {/* 4. Mermas Transporte & Operativas */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Mermas Operativas / Roturas</div>
          <div className="text-2xl font-mono font-extrabold text-purple-400 mt-1">
            {formatCurrency(perdidasTransporte)}
          </div>
          <div className="text-[10px] text-purple-400/80 font-mono mt-0.5">Transporte y manipulación</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
          <Scale className="size-5" />
        </div>
      </div>
    </div>
  );
}
