"use client";

import { useState } from "react";
import {
  User,
  ShoppingBag,
  Award,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  TrendingUp,
  Receipt,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ClientData } from "./client-form-dialog";

interface ClientHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
}

interface PurchaseItem {
  id: string;
  comprobante: string;
  fecha: string;
  hora: string;
  caja: string;
  total: number;
  puntosGanados: number;
  itemsCount: number;
}

const DEMO_PURCHASES: PurchaseItem[] = [
  { id: "1", comprobante: "B001-00042917", fecha: "15/08/2026", hora: "11:35", caja: "Caja 01", total: 45.80, puntosGanados: 4, itemsCount: 4 },
  { id: "2", comprobante: "B001-00041820", fecha: "08/08/2026", hora: "18:20", caja: "Caja 02", total: 112.50, puntosGanados: 11, itemsCount: 8 },
  { id: "3", comprobante: "B001-00039841", fecha: "01/08/2026", hora: "12:10", caja: "Caja 01", total: 84.00, puntosGanados: 8, itemsCount: 6 },
  { id: "4", comprobante: "B001-00037190", fecha: "25/07/2026", hora: "19:40", caja: "Caja 03", total: 68.90, puntosGanados: 6, itemsCount: 5 },
];

export function ClientHistoryDialog({
  isOpen,
  onClose,
  client,
}: ClientHistoryDialogProps) {
  if (!isOpen || !client) return null;

  const totalAcumulado = DEMO_PURCHASES.reduce((acc, p) => acc + p.total, 0);

  const handleRedeemPoints = () => {
    if (client.puntos < 50) {
      toast.error("El cliente necesita mínimo 50 puntos para canjear un vale de descuento");
      return;
    }
    toast.success(`Vale de S/ 10.00 generado con éxito por 50 puntos`, {
      description: `Saldo restante: ${client.puntos - 50} puntos.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
              {client.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{client.nombre}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {client.categoria}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {client.tipoDoc}: {client.numDoc} {client.telefono ? `| Tel: ${client.telefono}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors self-start sm:self-auto"
          >
            Cerrar
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Puntos Acumulados</span>
              <div className="text-2xl font-mono font-extrabold text-amber-400 mt-0.5">
                {client.puntos} <span className="text-xs font-sans text-slate-400 font-normal">pts</span>
              </div>
            </div>
            <button
              onClick={handleRedeemPoints}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 border border-amber-500/40 text-[10px] font-bold text-amber-300 hover:bg-amber-600 hover:text-white transition-colors"
            >
              Canjear
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Compras (Turno/Mes)</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400 mt-0.5">
                {formatCurrency(totalAcumulado)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="size-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Tickets Frecuentes</span>
              <div className="text-xl font-mono font-extrabold text-white mt-0.5">
                {DEMO_PURCHASES.length} <span className="text-xs font-sans text-slate-400 font-normal">compras</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Receipt className="size-4" />
            </div>
          </div>
        </div>

        {/* Purchase History Table */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="size-3.5 text-blue-400" /> Historial de Comprobantes & Compras
          </h4>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-2.5 px-3.5">Comprobante</th>
                  <th className="py-2.5 px-3.5">Fecha & Hora</th>
                  <th className="py-2.5 px-3.5 text-center">Caja</th>
                  <th className="py-2.5 px-3.5 text-center">Ítems</th>
                  <th className="py-2.5 px-3.5 text-center">Puntos Ganados</th>
                  <th className="py-2.5 px-3.5 text-right">Total Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
                {DEMO_PURCHASES.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3.5 font-mono font-bold text-white text-xs">
                      {p.comprobante}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-slate-400 text-[11px]">
                      {p.fecha} {p.hora}
                    </td>
                    <td className="py-2.5 px-3.5 text-center text-slate-300 text-xs">
                      {p.caja}
                    </td>
                    <td className="py-2.5 px-3.5 text-center font-mono text-slate-300">
                      {p.itemsCount} und
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className="font-mono font-bold text-amber-400 text-xs">
                        +{p.puntosGanados} pts
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400 text-xs">
                      {formatCurrency(p.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
