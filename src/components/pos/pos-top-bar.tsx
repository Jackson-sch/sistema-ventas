"use client";

import {
  Lock,
  Clock,
  Monitor,
  Printer,
  Scale,
  Receipt,
  ArrowUpRight,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ConnectivityBadge } from "./connectivity-badge";
import { customerDisplayChannel } from "@/lib/hardware/customer-display-channel";

interface PosTopBarProps {
  isShiftOpen: boolean;
  shiftNumber: string;
  registerName: string;
  cashierName: string;
  systemCashExpected: number;
  heldCartsCount: number;
  onOpenShift: () => void;
  onMovement: () => void;
  onClosing: () => void;
  onCancelTicket: () => void;
  onReportX: () => void;
  onHoldCartsOpen: () => void;
  onPrinterSettings: () => void;
  onScaleOpen: () => void;
}

export function PosTopBar({
  isShiftOpen,
  shiftNumber,
  registerName,
  cashierName,
  systemCashExpected,
  heldCartsCount,
  onOpenShift,
  onMovement,
  onClosing,
  onCancelTicket,
  onReportX,
  onHoldCartsOpen,
  onPrinterSettings,
  onScaleOpen,
}: PosTopBarProps) {
  return (
    <div className="glass-panel rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${isShiftOpen ? "bg-emerald-400 animate-pulse" : "bg-rose-500"}`}></span>
          <span className="text-white font-bold">
            {isShiftOpen ? `Turno Activo: #${shiftNumber}` : "Caja Cerrada"}
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400">Caja: <strong className="text-slate-200">{registerName}</strong></span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400">Cajero: <strong className="text-slate-200">{cashierName}</strong></span>
        <span className="text-slate-700">|</span>
        <span className="text-slate-400">
          Efectivo en Gaveta: <strong className="text-emerald-400 font-mono">{formatCurrency(systemCashExpected)}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ConnectivityBadge />
        {!isShiftOpen ? (
          <button
            onClick={onOpenShift}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <Lock className="size-3.5" /> Abrir Turno
          </button>
        ) : (
          <>
            <button
              onClick={onHoldCartsOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-800/60 bg-amber-950/40 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
              title="Carritos en espera (Parking de Ventas)"
            >
              <Clock className="size-3.5" /> Espera
              {heldCartsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {heldCartsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => customerDisplayChannel.openCustomerWindow()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-800/60 bg-blue-950/40 text-xs font-bold text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer"
              title="Abrir pantalla secundaria para el cliente (Pole Display)"
            >
              <Monitor className="size-3.5 text-blue-400" /> Pantalla Cliente
            </button>
            <button
              onClick={onPrinterSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
              title="Configuración de Impresora Térmica & Gaveta ESC/POS"
            >
              <Printer className="size-3.5 text-blue-400" /> Impresora
            </button>
            <button
              onClick={onScaleOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-800/60 bg-emerald-950/40 text-xs font-bold text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              <Scale className="size-3.5" /> Balanza (kg)
            </button>
            <button
              onClick={onReportX}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-blue-800/60 bg-blue-950/40 text-xs font-bold text-blue-300 hover:bg-blue-900/60 transition-colors cursor-pointer"
            >
              <Receipt className="size-3.5 text-blue-400" /> Reporte X
            </button>
            <button
              onClick={onMovement}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/90 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowUpRight className="size-3.5 text-amber-400" /> Movimiento
            </button>
            <button
              onClick={onClosing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-800/60 bg-amber-950/40 text-xs font-bold text-amber-300 hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              <Calculator className="size-3.5" /> Arqueo & Cierre (Z)
            </button>
            <button
              onClick={onCancelTicket}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900/80 text-xs font-semibold text-slate-400 hover:bg-rose-950/60 hover:text-rose-400 hover:border-rose-800/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" /> Cancelar Ticket
            </button>
          </>
        )}
      </div>
    </div>
  );
}
