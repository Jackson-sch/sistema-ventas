"use client";

import { Weight, Boxes, ShieldCheck, QrCode, CheckCircle2 } from "lucide-react";
import { TransferCartItem } from "./transfer-product-picker";

interface TransferSummarySidebarProps {
  items: TransferCartItem[];
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export function TransferSummarySidebar({
  items,
  isSubmitting,
  onSubmit,
}: TransferSummarySidebarProps) {
  const totalBultos = items.reduce((acc, i) => acc + i.cantidad, 0);
  const pesoBrutoTotalKgm = +items
    .reduce((acc, i) => acc + i.cantidad * i.pesoUnitarioKgm, 0)
    .toFixed(2);

  return (
    <div className="space-y-4">
      {/* 1. Control de Carga SUNAT */}
      <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4 bg-slate-950/40">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Weight className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Control de Carga SUNAT
            </h4>
            <p className="text-[10px] text-slate-500 font-mono">
              Pesos oficiales para fiscalización en ruta
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Boxes className="size-3 text-blue-400" /> Total Bultos
            </div>
            <div className="text-xl font-mono font-extrabold text-white mt-1">
              {totalBultos} <span className="text-xs font-normal text-slate-500">unds</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1.5">
              <Weight className="size-3" /> Peso Bruto Total
            </div>
            <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">
              {pesoBrutoTotalKgm} <span className="text-xs font-normal text-emerald-500">kg</span>
            </div>
          </div>
        </div>

        {/* Legal Certification Badge */}
        <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
            <ShieldCheck className="size-4 text-blue-400" />
            <span>Emisión Directa UBL 2.1</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Se generará la <strong>Guía de Remisión Electrónica (Serie T001)</strong> con firma digital XML y código QR oficial SUNAT para fiscalización en ruta.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || items.length === 0}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          {isSubmitting ? "Emitiendo GRE UBL 2.1..." : "Generar Guía y Despachar"}
        </button>
      </div>
    </div>
  );
}
