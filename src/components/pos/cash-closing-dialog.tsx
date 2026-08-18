"use client";

import { useState } from "react";
import {
  RotateCcw,
  Banknote,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Printer,
  Calculator,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface CashClosingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  systemExpected: number;
  onConfirmClose: (declaredTotal: number, difference: number, denominations: Record<string, number>) => void;
}

const BILL_VALUES = [200, 100, 50, 20, 10];
const COIN_VALUES = [5, 2, 1, 0.5, 0.2, 0.1];

export function CashClosingDialog({
  isOpen,
  onClose,
  systemExpected,
  onConfirmClose,
}: CashClosingDialogProps) {
  const [counts, setCounts] = useState<Record<string, number>>({
    "200": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
    "5": 0,
    "2": 0,
    "1": 0,
    "0.5": 0,
    "0.2": 0,
    "0.1": 0,
  });

  if (!isOpen) return null;

  const handleCountChange = (valStr: string, countStr: string) => {
    const qty = parseInt(countStr) || 0;
    setCounts((prev) => ({ ...prev, [valStr]: Math.max(0, qty) }));
  };

  const totalBills = BILL_VALUES.reduce((acc, val) => acc + val * (counts[val.toString()] || 0), 0);
  const totalCoins = COIN_VALUES.reduce((acc, val) => acc + val * (counts[val.toString()] || 0), 0);
  const declaredTotal = +(totalBills + totalCoins).toFixed(2);
  const difference = +(declaredTotal - systemExpected).toFixed(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (declaredTotal === 0) {
      toast.error("El conteo declarado no puede ser cero");
      return;
    }

    onConfirmClose(declaredTotal, difference, counts);
    toast.success("¡Cierre de caja y arqueo finalizados!", {
      description: `Declarado: ${formatCurrency(declaredTotal)} | Diferencia: ${formatCurrency(difference)}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Calculator className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Cierre de Caja & Arqueo Ciego</h3>
              <p className="text-xs text-slate-400">Conteo físico por denominaciones de billetes y monedas</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Denominations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bills Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Banknote className="size-4" /> Billetes (S/ {totalBills.toFixed(2)})
              </div>

              <div className="space-y-2">
                {BILL_VALUES.map((val) => (
                  <div key={val} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300 w-16">S/ {val}.00</span>
                    <span className="text-slate-500 text-[11px]">&times;</span>
                    <input
                      type="number"
                      min="0"
                      value={counts[val.toString()] || ""}
                      onChange={(e) => handleCountChange(val.toString(), e.target.value)}
                      placeholder="0"
                      className="w-20 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="font-mono font-semibold text-slate-400 w-24 text-right">
                      {formatCurrency(val * (counts[val.toString()] || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Coins Section */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Coins className="size-4" /> Monedas (S/ {totalCoins.toFixed(2)})
              </div>

              <div className="space-y-2">
                {COIN_VALUES.map((val) => (
                  <div key={val} className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-300 w-16">S/ {val.toFixed(2)}</span>
                    <span className="text-slate-500 text-[11px]">&times;</span>
                    <input
                      type="number"
                      min="0"
                      value={counts[val.toString()] || ""}
                      onChange={(e) => handleCountChange(val.toString(), e.target.value)}
                      placeholder="0"
                      className="w-20 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <span className="font-mono font-semibold text-slate-400 w-24 text-right">
                      {formatCurrency(val * (counts[val.toString()] || 0))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Comparison Summary */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Físico Declarado:</span>
              <span className="font-mono font-bold text-white text-base">{formatCurrency(declaredTotal)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Monto Esperado por Sistema:</span>
              <span className="font-mono font-bold text-slate-300 text-sm">{formatCurrency(systemExpected)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Diferencia / Cuadre:
              </span>
              <div className="flex items-center gap-2">
                {difference === 0 && (
                  <span className="font-mono font-extrabold text-emerald-400 text-lg flex items-center gap-1">
                    <CheckCircle2 className="size-4" /> Cuadre Exacto (S/ 0.00)
                  </span>
                )}
                {difference > 0 && (
                  <span className="font-mono font-extrabold text-blue-400 text-lg">
                    +{formatCurrency(difference)} (Sobrante)
                  </span>
                )}
                {difference < 0 && (
                  <span className="font-mono font-extrabold text-rose-400 text-lg flex items-center gap-1">
                    <AlertTriangle className="size-4" /> {formatCurrency(difference)} (Faltante)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all active:scale-[0.98]"
            >
              <Printer className="size-4" /> Cerrar Turno & Imprimir Arqueo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
