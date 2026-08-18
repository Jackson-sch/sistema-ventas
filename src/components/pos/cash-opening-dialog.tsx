"use client";

import { useState } from "react";
import { Lock, Banknote, CheckCircle2, ShieldCheck, Store } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface CashOpeningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (initialAmount: number, cashierName: string, registerName: string) => void;
}

export function CashOpeningDialog({ isOpen, onClose, onConfirm }: CashOpeningDialogProps) {
  const [initialAmount, setInitialAmount] = useState<string>("200.00");
  const [registerName, setRegisterName] = useState<string>("Caja 01 - Principal");
  const [cashierName, setCashierName] = useState<string>("Carlos Alarcón");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(initialAmount);
    if (isNaN(amountNum) || amountNum < 0) {
      toast.error("Por favor ingrese un monto inicial válido");
      return;
    }

    onConfirm(amountNum, cashierName, registerName);
    toast.success("¡Turno y Caja abiertos exitosamente!", {
      description: `Fondo inicial registrado: ${formatCurrency(amountNum)} en ${registerName}.`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Lock className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Apertura de Turno & Caja</h3>
            <p className="text-xs text-slate-400">Registro obligatorio del fondo inicial de sencillo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Caja Asignada
            </label>
            <div className="relative">
              <Store className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <select
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Caja 01 - Principal">Caja 01 - Principal (Física)</option>
                <option value="Caja 02 - Rápida">Caja 02 - Rápida (Física)</option>
                <option value="Caja 03 - Autoservicio">Caja 03 - Autoservicio (Digital)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Cajero Responsable
            </label>
            <input
              type="text"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Fondo Inicial de Sencillo (Efectivo)
            </label>
            <div className="relative">
              <span className="font-mono font-bold text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.10"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="200.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-lg font-mono font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                autoFocus
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Monto físico en gaveta para entrega de vuelto inicial.
            </p>
          </div>

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
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="size-4" /> Abrir Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
