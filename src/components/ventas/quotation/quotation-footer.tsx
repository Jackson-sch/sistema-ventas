"use client";

import { CheckCircle2 } from "lucide-react";

interface QuotationFooterProps {
  observaciones: string;
  onObservacionesChange: (v: string) => void;
  subtotal: number;
  igv: number;
  total: number;
  currencySymbol: string;
  isSubmitting: boolean;
  itemsCount: number;
  isEdit: boolean;
  onClose: () => void;
}

export function QuotationFooter({
  observaciones,
  onObservacionesChange,
  subtotal,
  igv,
  total,
  currencySymbol,
  isSubmitting,
  itemsCount,
  isEdit,
  onClose,
}: QuotationFooterProps) {
  return (
    <>
      {/* Observations & Financial Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Términos & Observaciones Comerciales
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => onObservacionesChange(e.target.value)}
            placeholder="Condiciones de pago, tiempo de entrega, cuenta bancaria..."
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Op. Gravada (Subtotal):</span>
            <span className="font-bold text-slate-200">{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>I.G.V. (18% SUNAT):</span>
            <span className="font-bold text-slate-200">{currencySymbol}{igv.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-300 uppercase font-sans">Total Cotización:</span>
            <span className="text-xl font-black text-emerald-400">
              {currencySymbol}{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Modal Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting || itemsCount === 0}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          {isSubmitting ? "Emitiendo Proforma..." : isEdit ? "Guardar Cambios" : "Emitir Proforma Oficial"}
        </button>
      </div>
    </>
  );
}
