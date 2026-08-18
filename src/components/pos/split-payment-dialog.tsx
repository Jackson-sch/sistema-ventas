"use client";

import { useState, useEffect } from "react";
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Percent,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { SplitPaymentInput } from "@/actions/pos-actions";

interface SplitPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  totalVenta: number;
  onConfirmSplitPayment: (payments: SplitPaymentInput[]) => void;
}

export function SplitPaymentDialog({
  isOpen,
  onClose,
  totalVenta,
  onConfirmSplitPayment,
}: SplitPaymentDialogProps) {
  const [payments, setPayments] = useState<SplitPaymentInput[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Initialize with half cash and half card, or 0
      const half = +(totalVenta / 2).toFixed(2);
      const rest = +(totalVenta - half).toFixed(2);
      setPayments([
        { medioPago: "efectivo", monto: half, montoRecibido: half, vuelto: 0 },
        { medioPago: "yape", monto: rest, referencia: "" },
      ]);
    }
  }, [isOpen, totalVenta]);

  if (!isOpen) return null;

  const totalAsignado = +(payments.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)).toFixed(2);
  const saldoPendiente = +(totalVenta - totalAsignado).toFixed(2);
  const isComplete = Math.abs(saldoPendiente) < 0.01;

  const handleAddPayment = (medio: "efectivo" | "tarjeta" | "yape" | "plin" | "transferencia") => {
    const defaultMonto = Math.max(0, saldoPendiente);
    setPayments((prev) => [
      ...prev,
      {
        medioPago: medio,
        monto: defaultMonto,
        montoRecibido: medio === "efectivo" ? defaultMonto : undefined,
        vuelto: 0,
        referencia: "",
      },
    ]);
  };

  const handleUpdatePayment = (index: number, field: keyof SplitPaymentInput, val: any) => {
    setPayments((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: val };

      // Update cash change if relevant
      if (current.medioPago === "efectivo") {
        const received = Number(current.montoRecibido) || 0;
        const amt = Number(current.monto) || 0;
        current.vuelto = Math.max(0, +(received - amt).toFixed(2));
      }

      next[index] = current;
      return next;
    });
  };

  const handleRemovePayment = (index: number) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFillRemaining = (index: number) => {
    const currentMonto = payments[index]?.monto || 0;
    const newMonto = +(currentMonto + saldoPendiente).toFixed(2);
    if (newMonto >= 0) {
      handleUpdatePayment(index, "monto", newMonto);
    }
  };

  const handleConfirm = () => {
    if (!isComplete) {
      if (saldoPendiente > 0) {
        toast.error(`Falta asignar ${formatCurrency(saldoPendiente)} para completar el total.`);
      } else {
        toast.error(`El monto asignado excede el total por ${formatCurrency(Math.abs(saldoPendiente))}.`);
      }
      return;
    }

    onConfirmSplitPayment(payments);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
              Múltiples Medios de Pago
            </span>
            <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2 mt-1">
              <ArrowRightLeft className="size-5 text-blue-400" /> Cobro Mixto / Pago Dividido
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Venta</div>
            <div className="text-xl font-black text-white font-mono">{formatCurrency(totalVenta)}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">Asignado</div>
            <div className="text-xl font-black text-blue-400 font-mono">{formatCurrency(totalAsignado)}</div>
          </div>
          <div
            className={`p-3 rounded-2xl border space-y-1 ${
              isComplete
                ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                : saldoPendiente > 0
                ? "bg-amber-950/40 border-amber-800/60 text-amber-400"
                : "bg-rose-950/40 border-rose-800/60 text-rose-400"
            }`}
          >
            <div className="text-[10px] font-bold uppercase">
              {isComplete ? "Cuadre Exacto" : saldoPendiente > 0 ? "Saldo Pendiente" : "Excedente"}
            </div>
            <div className="text-xl font-black font-mono">
              {isComplete ? "S/ 0.00" : formatCurrency(Math.abs(saldoPendiente))}
            </div>
          </div>
        </div>

        {/* Dynamic Payment Legs List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {payments.map((p, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-2.5 relative group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <span className="size-6 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <select
                    value={p.medioPago}
                    onChange={(e) => handleUpdatePayment(idx, "medioPago", e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta (POS)</option>
                    <option value="yape">🟣 Yape</option>
                    <option value="plin">🔵 Plin</option>
                    <option value="transferencia">🏦 Transferencia</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1 rounded-xl">
                    <span className="text-xs text-slate-400 font-bold">S/</span>
                    <input
                      type="number"
                      step="0.10"
                      value={p.monto}
                      onChange={(e) => handleUpdatePayment(idx, "monto", parseFloat(e.target.value) || 0)}
                      className="w-24 bg-transparent text-xs font-mono font-bold text-white focus:outline-none text-right"
                    />
                  </div>
                  {payments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePayment(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded-lg hover:bg-slate-900 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Extra Details based on payment method */}
              {p.medioPago === "efectivo" ? (
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60 text-xs">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-slate-400 text-[11px]">Recibido:</span>
                    <input
                      type="number"
                      value={p.montoRecibido || p.monto}
                      onChange={(e) =>
                        handleUpdatePayment(idx, "montoRecibido", parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white text-right focus:outline-none"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="text-slate-400">Vuelto:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {formatCurrency(p.vuelto || 0)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                  <span className="text-[11px] text-slate-400 shrink-0">N° Operación / Ref:</span>
                  <input
                    type="text"
                    value={p.referencia || ""}
                    onChange={(e) => handleUpdatePayment(idx, "referencia", e.target.value)}
                    placeholder="Ej. OP-489123 o últimos 4 dígitos"
                    className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-white placeholder:text-slate-600 focus:outline-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Add Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] text-slate-400 font-bold">Agregar medio:</span>
          <button
            type="button"
            onClick={() => handleAddPayment("efectivo")}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 transition-colors"
          >
            + Efectivo
          </button>
          <button
            type="button"
            onClick={() => handleAddPayment("yape")}
            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-[11px] font-bold text-purple-300 transition-colors"
          >
            + Yape
          </button>
          <button
            type="button"
            onClick={() => handleAddPayment("tarjeta")}
            className="px-2.5 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/50 text-[11px] font-bold text-blue-300 transition-colors"
          >
            + Tarjeta
          </button>
          <button
            type="button"
            onClick={() => handleAddPayment("plin")}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/50 text-[11px] font-bold text-cyan-300 transition-colors"
          >
            + Plin
          </button>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isComplete}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-4" /> Confirmar y Cobrar {formatCurrency(totalVenta)}
          </button>
        </div>
      </div>
    </div>
  );
}
