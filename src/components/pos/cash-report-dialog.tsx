"use client";

import { useRef } from "react";
import {
  Printer,
  FileText,
  Building2,
  Receipt,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  Download,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface CashShiftReportData {
  tipoReporte: "X" | "Z"; // X = Corte Parcial (no cierra turno), Z = Cierre Definitivo
  turnoNumero: string;
  cajaNombre: string;
  cajeroNombre: string;
  fechaApertura: string;
  horaApertura: string;
  fechaCierre?: string;
  horaCierre?: string;
  montoApertura: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  ventasYape: number;
  ventasPlin: number;
  totalVentas: number;
  egresosCaja: number;
  efectivoEsperado: number;
  efectivoDeclarado?: number;
  diferencia?: number;
  conteoBoletas: number;
  conteoFacturas: number;
  conteoNotasCredito: number;
  totalTransacciones: number;
}

interface CashReportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  report: CashShiftReportData | null;
}

export function CashReportDialog({ isOpen, onClose, report }: CashReportDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !report) return null;

  const isZReport = report.tipoReporte === "Z";

  const handlePrint = () => {
    toast.success(`Enviando Reporte ${report.tipoReporte} a impresora térmica de 80mm...`);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                isZReport
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }`}
            >
              {report.tipoReporte}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                {isZReport ? "Reporte Z — Cierre Fiscal Definitivo" : "Reporte X — Corte Parcial de Turno"}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Turno #{report.turnoNumero} — {report.cajaNombre}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Printer className="size-3.5" />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Physical 80mm Thermal Receipt Simulation */}
        <div
          id="printable-cash-report"
          ref={printRef}
          className="bg-white text-black p-5 rounded-2xl shadow-xl font-mono text-xs space-y-3 select-all border border-slate-300"
        >
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-400 pb-3 space-y-1">
            <div className="font-extrabold text-sm tracking-wider">NOVAMARKET SUPERMERCADOS</div>
            <div className="text-[10px] text-gray-700">RUC: 20608945123</div>
            <div className="text-[10px] text-gray-700">Av. Javier Prado Este 4200 - Santiago de Surco</div>
            <div className="font-bold text-xs mt-2 border-y border-black py-0.5 uppercase">
              {isZReport ? "REPORTE Z (CIERRE DIARIO)" : "REPORTE X (CORTE PARCIAL)"}
            </div>
            <div className="text-[10px] font-semibold mt-1">
              TURNO: #{report.turnoNumero} | CAJA: {report.cajaNombre}
            </div>
            <div className="text-[10px] text-gray-700">CAJERO: {report.cajeroNombre}</div>
            <div className="text-[10px] text-gray-600">
              APERTURA: {report.fechaApertura} {report.horaApertura}
            </div>
            {report.fechaCierre && (
              <div className="text-[10px] text-gray-600">
                CIERRE: {report.fechaCierre} {report.horaCierre}
              </div>
            )}
          </div>

          {/* Totals by Payment Method */}
          <div className="space-y-1.5 text-[11px] py-2 border-b border-dashed border-gray-400">
            <div className="font-bold text-[11px] text-gray-900 uppercase">RESUMEN POR MEDIO DE PAGO:</div>
            <div className="flex justify-between">
              <span>( + ) Efectivo:</span>
              <span className="font-bold">{formatCurrency(report.ventasEfectivo)}</span>
            </div>
            <div className="flex justify-between">
              <span>( + ) Tarjeta Débito/Crédito:</span>
              <span className="font-bold">{formatCurrency(report.ventasTarjeta)}</span>
            </div>
            <div className="flex justify-between">
              <span>( + ) Billeteras (Yape/Plin):</span>
              <span className="font-bold">{formatCurrency(report.ventasYape + report.ventasPlin)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-1 font-bold text-xs">
              <span>TOTAL VENTAS DEL TURNO:</span>
              <span>{formatCurrency(report.totalVentas)}</span>
            </div>
          </div>

          {/* Cash Balancing */}
          <div className="space-y-1.5 text-[11px] py-2 border-b border-dashed border-gray-400">
            <div className="font-bold text-[11px] text-gray-900 uppercase">ARQUEO FÍSICO DE EFECTIVO:</div>
            <div className="flex justify-between">
              <span>Fondo Inicial de Caja:</span>
              <span>{formatCurrency(report.montoApertura)}</span>
            </div>
            <div className="flex justify-between">
              <span>( + ) Ventas en Efectivo:</span>
              <span>{formatCurrency(report.ventasEfectivo)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>( - ) Egresos / Retiros:</span>
              <span>{formatCurrency(report.egresosCaja)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-300 pt-1">
              <span>EFECTIVO ESPERADO EN CAJA:</span>
              <span>{formatCurrency(report.efectivoEsperado)}</span>
            </div>
            {report.efectivoDeclarado !== undefined && (
              <>
                <div className="flex justify-between font-bold">
                  <span>EFECTIVO DECLARADO (CONTEO):</span>
                  <span>{formatCurrency(report.efectivoDeclarado)}</span>
                </div>
                <div
                  className={`flex justify-between font-bold text-xs p-1 rounded ${
                    (report.diferencia || 0) === 0
                      ? "bg-gray-100 text-gray-900"
                      : (report.diferencia || 0) > 0
                      ? "bg-emerald-100 text-emerald-900"
                      : "bg-red-100 text-red-900"
                  }`}
                >
                  <span>DIFERENCIA:</span>
                  <span>
                    {(report.diferencia || 0) > 0 ? "+" : ""}
                    {formatCurrency(report.diferencia || 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Tax Documents Summary */}
          <div className="space-y-1 text-[10px] py-1 border-b border-dashed border-gray-400">
            <div className="font-bold text-[11px] text-gray-900 uppercase">COMPROBANTES EMITIDOS:</div>
            <div className="flex justify-between">
              <span>Boletas Electrónicas (03):</span>
              <span className="font-bold">{report.conteoBoletas}</span>
            </div>
            <div className="flex justify-between">
              <span>Facturas Electrónicas (01):</span>
              <span className="font-bold">{report.conteoFacturas}</span>
            </div>
            <div className="flex justify-between">
              <span>Notas de Crédito (07):</span>
              <span className="font-bold">{report.conteoNotasCredito}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 pt-0.5">
              <span>TOTAL TRANSACCIONES:</span>
              <span>{report.totalTransacciones}</span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 pb-2 grid grid-cols-2 gap-4 text-center text-[9px]">
            <div className="border-t border-black pt-1">
              <div>FIRMA DEL CAJERO</div>
              <div className="text-gray-500">{report.cajeroNombre}</div>
            </div>
            <div className="border-t border-black pt-1">
              <div>FIRMA SUPERVISOR</div>
              <div className="text-gray-500">AUTORIZADO</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
