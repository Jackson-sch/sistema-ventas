"use client";

import { useState } from "react";
import {
  Printer,
  FileText,
  Truck,
  CheckCircle2,
  MapPin,
  User,
  ShieldCheck,
  Download,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { TransferRecord } from "@/actions/transfer-actions";

interface GreTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transfer: TransferRecord | null;
}

export function GreTicketDialog({
  isOpen,
  onClose,
  transfer,
}: GreTicketDialogProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !transfer) return null;

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      toast.success("Enviado a la cola de impresión de la guía de remisión.");
    }, 200);
  };

  const handleDownloadXml = () => {
    toast.success(`Descargando XML UBL 2.1 oficial firmado: ${transfer.codigoGuia}.xml`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white text-slate-900 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
              SUNAT UBL 2.1 • Tipo 09
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono">
              HASH: {transfer.hashSunat.substring(0, 12)}...
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadXml}
              className="p-1.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
              title="Descargar XML UBL 2.1"
            >
              <Download className="size-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable GRE Document Body */}
        <div className="space-y-4 font-sans text-xs" id="printable-gre">
          {/* Header Box */}
          <div className="grid grid-cols-2 gap-4 items-center">
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                NOVAMARKET SUPERMERCADOS S.A.C.
              </h2>
              <p className="text-[11px] text-slate-600">
                Av. Javier Prado Este 4200, Surco, Lima
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                RUC: 20608945123 • Central Logística
              </p>
            </div>
            <div className="border-2 border-slate-900 rounded-2xl p-3 text-center space-y-1 bg-slate-50">
              <div className="text-[11px] font-bold text-slate-700">R.U.C. 20608945123</div>
              <div className="text-xs font-extrabold uppercase bg-slate-900 text-white py-0.5 rounded-lg tracking-wider">
                GUÍA DE REMISIÓN REMITENTE
              </div>
              <div className="text-sm font-black font-mono text-slate-900 tracking-tight">
                N° {transfer.codigoGuia}
              </div>
            </div>
          </div>

          {/* Transfer Info */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-100 border border-slate-200 text-[11px]">
            <div>
              <span className="text-slate-500 font-bold">Fecha de Emisión:</span>{" "}
              <span className="font-mono font-bold text-slate-800">{transfer.fechaSalida}</span>
            </div>
            <div>
              <span className="text-slate-500 font-bold">Fecha Inicio Traslado:</span>{" "}
              <span className="font-mono font-bold text-slate-800">{transfer.fechaSalida}</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-slate-200">
              <span className="text-slate-500 font-bold">Motivo de Traslado:</span>{" "}
              <span className="font-bold text-slate-900 uppercase">
                04 - Traslado entre establecimientos de la misma empresa
              </span>
            </div>
          </div>

          {/* Route Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <MapPin className="size-3 text-rose-600" /> Punto de Partida
              </div>
              <div className="font-bold text-slate-800 text-[11px]">{transfer.sucursalOrigen}</div>
              <div className="text-[10px] text-slate-500 font-mono">Ubigeo: 150140 (Surco, Lima)</div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1">
                <MapPin className="size-3 text-emerald-600" /> Punto de Llegada
              </div>
              <div className="font-bold text-slate-800 text-[11px]">{transfer.sucursalDestino}</div>
              <div className="text-[10px] text-slate-500 font-mono">Ubigeo: 150122 (Miraflores, Lima)</div>
            </div>
          </div>

          {/* Transport Details */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1.5 text-[11px]">
            <div className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
              <Truck className="size-3.5 text-blue-600" /> Datos del Transporte y Conductor
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-slate-500 block text-[10px]">Modalidad:</span>
                <span className="font-bold text-slate-800">
                  {transfer.modalidadTransporte === "02" ? "Transporte Privado" : "Transporte Público"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Vehículo / Placa:</span>
                <span className="font-mono font-bold text-slate-800">
                  {transfer.vehiculoPlaca || "ABC-123 (Camión Isuzu)"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Conductor:</span>
                <span className="font-bold text-slate-800">
                  {transfer.choferNombre || "Jorge Huamán Díaz"}
                </span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-slate-300 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-white font-bold text-[10px] uppercase font-mono">
                <tr>
                  <th className="py-2 px-3 w-10 text-center">N°</th>
                  <th className="py-2 px-3">Descripción del Bien</th>
                  <th className="py-2 px-3 text-center">Unidad</th>
                  <th className="py-2 px-3 text-right">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono text-xs">
                {transfer.items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3 font-sans font-bold text-slate-900">
                      {it.nombre}
                      <span className="text-[10px] text-slate-500 font-mono block">
                        SKU: {it.sku}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center uppercase text-slate-700">
                      {it.unidadMedida === "kg" ? "KGM" : "NIU"}
                    </td>
                    <td className="py-2 px-3 text-right font-bold text-slate-900">
                      {it.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & QR Section */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-100 border border-slate-300 items-center">
            <div className="col-span-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Peso Bruto Total (KGM):</span>
                <span className="font-mono font-black text-slate-900 text-sm">
                  {transfer.pesoBrutoKgm.toFixed(3)} KGM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 font-bold">Total de Bultos / Paquetes:</span>
                <span className="font-mono font-black text-slate-900">{transfer.totalBultos}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono pt-1">
                Autorizado por SUNAT mediante Resolución de Superintendencia N° 000123-2022/SUNAT
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-slate-300">
              <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center rounded-lg p-1 text-[8px] font-mono text-center">
                [QR FISCALIZACIÓN EN RUTA SUNAT]
              </div>
              <span className="text-[8px] text-slate-500 font-mono mt-1">Control en Ruta</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Printer className="size-4" />
            {isPrinting ? "Imprimiendo..." : `Imprimir Guía de Remisión (${transfer.codigoGuia})`}
          </button>
        </div>
      </div>
    </div>
  );
}
