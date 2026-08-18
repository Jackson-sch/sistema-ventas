"use client";

import { useState } from "react";
import { ArrowDownRight, ArrowUpRight, Banknote, CheckCircle2, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface CashMovementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (type: "ingreso" | "egreso", amount: number, reason: string) => void;
}

export function CashMovementDialog({ isOpen, onClose, onConfirm }: CashMovementDialogProps) {
  const [movementType, setMovementType] = useState<"ingreso" | "egreso">("egreso");
  const [amount, setAmount] = useState<string>("500.00");
  const [reason, setReason] = useState<string>("Retiro de efectivo a bóveda principal por exceso");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor ingrese un monto válido");
      return;
    }
    if (!reason.trim()) {
      toast.error("Por favor especifique el motivo del movimiento");
      return;
    }

    onConfirm(movementType, amountNum, reason);
    toast.success(`Movimiento registrado: ${movementType === "ingreso" ? "Ingreso" : "Retiro"}`, {
      description: `${formatCurrency(amountNum)} - Motivo: ${reason}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
            movementType === "egreso"
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}>
            {movementType === "egreso" ? <ArrowUpRight className="size-5" /> : <ArrowDownRight className="size-5" />}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Movimiento de Caja Chica</h3>
            <p className="text-xs text-slate-400">Ingreso de sencillo o retiro parcial de efectivo</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Movement Type Switcher */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setMovementType("egreso");
                  setReason("Retiro de efectivo a bóveda principal por exceso");
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === "egreso"
                    ? "bg-amber-600/30 border border-amber-500/50 text-amber-300 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ArrowUpRight className="size-3.5" /> Retiro / Egreso
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType("ingreso");
                  setReason("Ingreso de sencillo adicional para vueltos");
                }}
                className={`py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  movementType === "ingreso"
                    ? "bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <ArrowDownRight className="size-3.5" /> Ingreso de Sencillo
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Monto en Efectivo
            </label>
            <div className="relative">
              <span className="font-mono font-bold text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">
                S/
              </span>
              <input
                type="number"
                step="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-lg font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                autoFocus
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Motivo / Justificación
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600 resize-none"
              placeholder="Especificar motivo detallado..."
              required
            />
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
              <CheckCircle2 className="size-4" /> Registrar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
