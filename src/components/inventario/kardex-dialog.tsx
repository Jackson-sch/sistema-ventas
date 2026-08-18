"use client";

import { useState } from "react";
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface KardexMovement {
  id: string;
  fecha: string;
  tipoOperacion: "compra" | "venta" | "merma" | "ajuste" | "transferencia";
  documentoRef: string;
  detalle: string;
  entradaCantidad?: number;
  entradaCostoUnit?: number;
  salidaCantidad?: number;
  salidaCostoUnit?: number;
  saldoCantidad: number;
  saldoCostoUnit: number;
  saldoTotal: number;
}

interface KardexDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  sku: string;
  categoria: string;
}

const DEMO_MOVEMENTS: KardexMovement[] = [
  { id: "1", fecha: "15/08/2026 11:42", tipoOperacion: "venta", documentoRef: "B001-00042918", detalle: "Venta en Caja 01 (POS)", salidaCantidad: 2, salidaCostoUnit: 3.40, saldoCantidad: 142, saldoCostoUnit: 3.40, saldoTotal: 482.80 },
  { id: "2", fecha: "15/08/2026 10:30", tipoOperacion: "venta", documentoRef: "B001-00042914", detalle: "Venta en Caja 03 Autoservicio", salidaCantidad: 4, salidaCostoUnit: 3.40, saldoCantidad: 144, saldoCostoUnit: 3.40, saldoTotal: 489.60 },
  { id: "3", fecha: "14/08/2026 16:15", tipoOperacion: "merma", documentoRef: "AJ-00012", detalle: "Merma por rotura / abolladura", salidaCantidad: 1, salidaCostoUnit: 3.40, saldoCantidad: 148, saldoCostoUnit: 3.40, saldoTotal: 503.20 },
  { id: "4", fecha: "12/08/2026 09:00", tipoOperacion: "compra", documentoRef: "F001-008921", detalle: "Recepción de Orden Compra #OC-442 (Gloria SA)", entradaCantidad: 100, entradaCostoUnit: 3.40, saldoCantidad: 149, saldoCostoUnit: 3.40, saldoTotal: 506.60 },
  { id: "5", fecha: "10/08/2026 08:00", tipoOperacion: "ajuste", documentoRef: "INV-INICIAL", detalle: "Inventario Inicial del Mes", entradaCantidad: 49, entradaCostoUnit: 3.40, saldoCantidad: 49, saldoCostoUnit: 3.40, saldoTotal: 166.60 },
];

export function KardexDialog({
  isOpen,
  onClose,
  productName,
  sku,
  categoria,
}: KardexDialogProps) {
  const [movements] = useState<KardexMovement[]>(DEMO_MOVEMENTS);

  if (!isOpen) return null;

  const currentSaldo = movements[0]?.saldoCantidad || 0;
  const currentCost = movements[0]?.saldoCostoUnit || 0;
  const currentValued = +(currentSaldo * currentCost).toFixed(2);

  const handleExport = () => {
    toast.success(`Exportando Kardex Valorado de: ${productName} (Excel)`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Archive className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{productName}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                  {categoria}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                SKU: {sku} | Método de Valuación: Promedio Ponderado / PEPS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="size-3.5 text-blue-400" /> Exportar Excel
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>

        {/* Summary Mini Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Stock Actual en Almacén</span>
              <div className="text-xl font-mono font-bold text-white mt-0.5">{currentSaldo} und</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Layers className="size-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Costo Unitario Ponderado</span>
              <div className="text-xl font-mono font-bold text-slate-300 mt-0.5">{formatCurrency(currentCost)}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="size-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Valor Total de Existencias</span>
              <div className="text-xl font-mono font-bold text-emerald-400 mt-0.5">{formatCurrency(currentValued)}</div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <Archive className="size-4" />
            </div>
          </div>
        </div>

        {/* Movements Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                <th className="py-3 px-3.5">Fecha / Hora</th>
                <th className="py-3 px-3.5">Tipo Operación</th>
                <th className="py-3 px-3.5">Doc. Referencia</th>
                <th className="py-3 px-3.5">Detalle / Motivo</th>
                <th className="py-3 px-3.5 text-center bg-emerald-950/30 text-emerald-400">Entradas</th>
                <th className="py-3 px-3.5 text-center bg-rose-950/30 text-rose-400">Salidas</th>
                <th className="py-3 px-3.5 text-right bg-blue-950/30 text-blue-300">Saldo Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {movements.map((mov) => (
                <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3.5 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {mov.fecha}
                  </td>
                  <td className="py-3 px-3.5">
                    {mov.tipoOperacion === "compra" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        <ArrowDownRight className="size-2.5" /> Compra
                      </span>
                    )}
                    {mov.tipoOperacion === "venta" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/50">
                        <ArrowUpRight className="size-2.5" /> Venta POS
                      </span>
                    )}
                    {mov.tipoOperacion === "merma" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50">
                        <TrendingDown className="size-2.5" /> Merma
                      </span>
                    )}
                    {mov.tipoOperacion === "ajuste" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        <RefreshCw className="size-2.5" /> Ajuste Inicial
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-xs text-white font-bold whitespace-nowrap">
                    {mov.documentoRef}
                  </td>
                  <td className="py-3 px-3.5 text-slate-300 max-w-[200px] truncate text-xs">
                    {mov.detalle}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono bg-emerald-950/10">
                    {mov.entradaCantidad ? (
                      <div className="font-bold text-emerald-400">+{mov.entradaCantidad} und</div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-center font-mono bg-rose-950/10">
                    {mov.salidaCantidad ? (
                      <div className="font-bold text-rose-400">-{mov.salidaCantidad} und</div>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                  <td className="py-3 px-3.5 text-right font-mono bg-blue-950/10">
                    <div className="font-bold text-white">{mov.saldoCantidad} und</div>
                    <div className="text-[10px] text-slate-400 font-sans">({formatCurrency(mov.saldoTotal)})</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
