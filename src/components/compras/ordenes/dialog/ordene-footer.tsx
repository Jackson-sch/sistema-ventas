"use client";

import { CheckCircle2 } from "lucide-react";

interface OrdeneFooterProps {
  subtotal: number;
  igv: number;
  total: number;
  currencySymbol: string;
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  isSubmitting: boolean;
  itemsCount: number;
  onClose: () => void;
}

export function OrdeneFooter({
  subtotal,
  igv,
  total,
  currencySymbol,
  observaciones,
  onObservacionesChange,
  isSubmitting,
  itemsCount,
  onClose,
}: OrdeneFooterProps) {
  return (
    <>
      {/* Totals Summary Card */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-400">
          <span>Subtotal: <strong className="text-slate-200">{currencySymbol}{subtotal.toFixed(2)}</strong></span>
          <span>IGV (18%): <strong className="text-slate-200">{currencySymbol}{igv.toFixed(2)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase text-[10px] font-bold">Total a Facturar:</span>
          <span className="text-lg font-extrabold text-amber-400">{currencySymbol}{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Observations */}
      <div>
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Observaciones e Instrucciones de Entrega
        </label>
        <textarea
          rows={2}
          value={observaciones}
          onChange={(e) => onObservacionesChange(e.target.value)}
          placeholder="Detalles sobre horario de recepción, rampa, guías requeridas..."
          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || itemsCount === 0}
          className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          {isSubmitting ? "Emitiendo en BD..." : "Generar Orden de Compra"}
        </button>
      </div>
    </>
  );
}
