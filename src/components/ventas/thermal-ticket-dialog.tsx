"use client";

import { useRef } from "react";
import {
  Printer,
  Download,
  FileCode2,
  Receipt,
  FileText,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { SunatQrCode } from "@/components/ui/sunat-qr-code";
import {
  downloadCpeXml,
  downloadCpeCdr,
  downloadTicketPdfFromElement,
} from "@/lib/cpe-downloader";

export interface TicketData {
  comprobante: string; // ej: B001-00000124
  tipo: string; // Boleta, Factura, Nota de Crédito
  fecha: string;
  hora: string;
  caja: string;
  cajero: string;
  cliente?: {
    nombre: string;
    documentoTipo?: string;
    documentoNumero?: string;
    direccion?: string;
  };
  items: {
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad?: string;
  }[];
  medioPago: string;
  pagos?: {
    medio: string;
    monto: number;
    referencia?: string;
  }[];
  montoRecibido?: number;
  vuelto?: number;
  total: number;
  hashSunat: string;
}

interface ThermalTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: TicketData | null;
}

export function ThermalTicketDialog({
  isOpen,
  onClose,
  ticket,
}: ThermalTicketDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !ticket) return null;

  const totalAbs = Math.abs(ticket.total || 0);
  const subtotal = totalAbs / 1.18;
  const igv = totalAbs - subtotal;

  const handlePrint = () => {
    toast.success("Enviando ticket a impresora térmica de 80mm...", {
      description: `Comprobante ${ticket.comprobante} impreso exitosamente.`,
    });
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (printRef.current) {
      await downloadTicketPdfFromElement(printRef.current, ticket.comprobante);
    }
  };

  const handleDownloadXml = () => {
    downloadCpeXml(ticket);
  };

  const handleDownloadCdr = () => {
    downloadCpeCdr(ticket);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Printer className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Comprobante de Pago Electrónico</h3>
              <p className="text-[11px] text-slate-400 font-mono">Impresión térmica 80mm & Descargas Tributarias</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              title="Descargar PDF (Ticket 80mm)"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="size-3" /> Imprimir
            </button>
          </div>
        </div>

        {/* Realistic 80mm Thermal Paper Container */}
        <div className="flex justify-center p-2 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <div
            id="printable-thermal-ticket"
            ref={printRef}
            className="w-[340px] bg-[#f8fafc] text-[#0f172a] p-5 rounded-md shadow-xl font-mono text-xs leading-relaxed select-none relative"
            style={{
              fontFamily: "'Courier New', Courier, monospace",
              filter: "contrast(1.05)",
            }}
          >
            {/* Store Fiscal Header */}
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-400">
              <div className="text-base font-black tracking-wider uppercase">NOVAMARKET SUPERMERCADOS</div>
              <div className="text-[10px] text-slate-600 font-bold">NOVAMARKET SUPERMERCADOS S.A.C.</div>
              <div className="text-[10px] text-slate-600 font-bold">RUC: 20608945123</div>
              <div className="text-[9px] text-slate-500">AV. PRINCIPAL 123 - SURCO, LIMA</div>
              <div className="text-[9px] text-slate-500">TEL: (01) 748-9000</div>
            </div>

            {/* Document Details */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="text-center font-black text-sm uppercase py-0.5">
                {ticket.tipo.toUpperCase()} ELECTRÓNICA
              </div>
              <div className="text-center font-extrabold text-sm tracking-widest text-black">
                {ticket.comprobante}
              </div>
              <div className="flex justify-between pt-1 text-[10px] text-slate-600">
                <span>FECHA: {ticket.fecha}</span>
                <span>HORA: {ticket.hora}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>CAJA: {ticket.caja}</span>
                <span>CAJERO: {ticket.cajero}</span>
              </div>
            </div>

            {/* Customer Details */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">CLIENTE:</span>
                <span className="font-semibold truncate max-w-[200px] text-right">
                  {ticket.cliente?.nombre || "CLIENTES VARIOS"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-700">
                  {ticket.cliente?.documentoTipo || (ticket.tipo === "Factura" ? "RUC" : "DNI/DOC")}:
                </span>
                <span className="font-mono">{ticket.cliente?.documentoNumero || "00000000"}</span>
              </div>
              {ticket.cliente?.direccion && (
                <div className="text-[9px] text-slate-500 truncate">
                  DIR: {ticket.cliente.direccion}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400">
              <div className="grid grid-cols-12 font-black text-[10px] pb-1 border-b border-slate-300 text-slate-700">
                <span className="col-span-2">CANT</span>
                <span className="col-span-6">DESCRIPCIÓN</span>
                <span className="col-span-2 text-right">P.UNIT</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>
              <div className="space-y-1.5 pt-1.5 text-[10px]">
                {ticket.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 leading-tight">
                    <span className="col-span-2 font-bold">
                      {item.cantidad} {item.unidad || "und"}
                    </span>
                    <span className="col-span-6 truncate font-medium">{item.descripcion}</span>
                    <span className="col-span-2 text-right text-slate-600">
                      {item.precioUnit.toFixed(2)}
                    </span>
                    <span className="col-span-2 text-right font-black text-black">
                      {item.total.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals & Breakdown */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>OP. GRAVADA (Subtotal):</span>
                <span className="font-mono font-bold">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>I.G.V. (18%):</span>
                <span className="font-mono font-bold">{formatCurrency(igv)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>OP. EXONERADA / INAFECTA:</span>
                <span className="font-mono font-bold">S/ 0.00</span>
              </div>
              <div className="flex justify-between text-base font-black text-black pt-1 border-t border-slate-300">
                <span>IMPORTE TOTAL:</span>
                <span className="font-mono">{formatCurrency(ticket.total)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px] text-slate-600">
              <div className="flex justify-between font-semibold">
                <span className="uppercase">FORMA DE PAGO:</span>
                <span className="font-bold text-black uppercase">{ticket.medioPago}</span>
              </div>

              {ticket.pagos && ticket.pagos.length > 0 ? (
                <div className="space-y-0.5 pt-1 border-t border-slate-200">
                  {ticket.pagos.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-[9px]">
                      <span className="uppercase text-slate-500">
                        • {p.medio} {p.referencia ? `(${p.referencia})` : ""}:
                      </span>
                      <span className="font-mono font-bold">{formatCurrency(p.monto)}</span>
                    </div>
                  ))}
                </div>
              ) : ticket.medioPago === "efectivo" ? (
                <>
                  <div className="flex justify-between">
                    <span>IMPORTE RECIBIDO:</span>
                    <span className="font-mono font-bold text-black">
                      {formatCurrency(ticket.montoRecibido || ticket.total)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-black">
                    <span>VUELTO ENTREGADO:</span>
                    <span className="font-mono">{formatCurrency(ticket.vuelto || 0)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Legal Fiscal Footer & QR Code */}
            <div className="pt-3 text-center space-y-2">
              <div className="flex justify-center p-1 bg-white rounded border border-slate-300 w-fit mx-auto">
                <SunatQrCode
                  value={`20608945123|${ticket.tipo === "Factura" ? "01" : ticket.tipo === "Nota de Crédito" ? "07" : "03"}|${ticket.comprobante.split("-")[0] || "B001"}|${ticket.comprobante.split("-")[1] || "1"}|${igv.toFixed(2)}|${totalAbs.toFixed(2)}|${ticket.fecha}|${ticket.cliente?.documentoTipo || "1"}|${ticket.cliente?.documentoNumero || "00000000"}|${ticket.hashSunat}|`}
                  size={90}
                />
              </div>
              <div className="font-mono font-semibold text-[8px] break-all text-slate-500">
                CÓDIGO HASH: {ticket.hashSunat}
              </div>
              <div className="leading-tight text-[8px]">
                Representación impresa de la {ticket.tipo.toUpperCase()} ELECTRÓNICA.
                Consulte su comprobante en www.novamarket.pe/consultas
              </div>
              <div className="font-bold text-[9px] text-black pt-1">
                ¡GRACIAS POR SU COMPRA EN NOVAMARKET!
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Real Downloads */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="size-3.5 text-blue-400" /> PDF
            </button>
            <button
              type="button"
              onClick={handleDownloadXml}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCode2 className="size-3.5 text-purple-400" /> XML UBL 2.1
            </button>
            <button
              type="button"
              onClick={handleDownloadCdr}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 hover:text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="size-3.5 text-emerald-400" /> CDR SUNAT
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
