"use client";

import { CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PurchaseFooterProps {
  subtotal: number;
  igv: number;
  total: number;
  isSubmitting: boolean;
  itemsCount: number;
  onClose: () => void;
}

export function PurchaseFooter({
  subtotal,
  igv,
  total,
  isSubmitting,
  itemsCount,
  onClose,
}: PurchaseFooterProps) {
  return (
    <>
      {/* Totals Summary */}
      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-400">
          <span>Op. Gravada: <strong className="text-slate-200">{formatCurrency(subtotal)}</strong></span>
          <span>I.G.V. (18%): <strong className="text-slate-200">{formatCurrency(igv)}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 uppercase text-[10px] font-bold">TOTAL FACTURA:</span>
          <span className="text-lg font-extrabold text-emerald-400">
            {formatCurrency(total)}
          </span>
        </div>
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
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          {isSubmitting ? "Ingresando a Kardex..." : "Ingresar Mercadería al Almacén"}
        </button>
      </div>
    </>
  );
}
