"use client";

import { useRef } from "react";
import {
  Printer,
  Download,
  QrCode,
  CheckCircle2,
  FileText,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface TicketPaymentItem {
  medio: string;
  monto: number;
  referencia?: string;
  montoRecibido?: number;
  vuelto?: number;
}

export interface TicketData {
  comprobante: string;
  tipo: "Boleta" | "Factura" | "Nota de Crédito";
  fecha: string;
  hora: string;
  caja: string;
  cajero: string;
  cliente: {
    nombre: string;
    documentoTipo: "DNI" | "RUC" | "VARIOS";
    documentoNumero: string;
    direccion?: string;
  };
  items: {
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad: string;
  }[];
  medioPago: "efectivo" | "tarjeta" | "yape" | "plin" | "mixto";
  pagos?: TicketPaymentItem[];
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

  const handleDownloadPdf = () => {
    toast.success(`Descargando comprobante en PDF: ${ticket.comprobante}.pdf`);
  };

  const handleDownloadXml = () => {
    toast.success(`Descargando archivo XML firmado por SUNAT: ${ticket.comprobante}.xml`);
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
              <h3 className="text-sm font-bold text-white tracking-tight">Simulador de Ticket Térmico 80mm</h3>
              <p className="text-[11px] text-slate-400 font-mono">Protocolo ESC/POS — Epson & Bixolon</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleDownloadPdf}
              title="Descargar PDF"
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="size-3.5" />
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all"
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
              <div className="text-[11px] font-bold text-slate-700">R.U.C. 20608912345</div>
              <div className="text-[10px] text-slate-600 leading-tight">
                AV. JAVIER PRADO ESTE 4200 - SURCO - LIMA
              </div>
              <div className="text-[10px] text-slate-600">TEL: (01) 619-8000</div>
              <div className="text-[10px] font-semibold text-slate-800 uppercase mt-1">
                SUCURSAL CENTRAL (TIENDA 01)
              </div>
            </div>

            {/* Document Header */}
            <div className="text-center py-2.5 border-b border-dashed border-slate-400 space-y-0.5">
              <div className="text-xs font-black uppercase tracking-wide">
                {ticket.tipo.toUpperCase()} ELECTRÓNICA
              </div>
              <div className="text-sm font-black tracking-tight text-black">{ticket.comprobante}</div>
            </div>

            {/* Transaction Metadata */}
            <div className="py-2.5 text-[10px] space-y-1 border-b border-dashed border-slate-400">
              <div className="flex justify-between">
                <span>FECHA: {ticket.fecha}</span>
                <span>HORA: {ticket.hora}</span>
              </div>
              <div className="flex justify-between">
                <span>CAJA: {ticket.caja}</span>
                <span>CAJERO: {ticket.cajero}</span>
              </div>
              <div className="pt-1">
                <div>CLIENTE: <strong className="uppercase">{ticket.cliente?.nombre || "Clientes Varios"}</strong></div>
                <div>{ticket.cliente?.documentoTipo || "DNI"}: {ticket.cliente?.documentoNumero || "00000000"}</div>
                {ticket.cliente?.direccion && <div>DIR: {ticket.cliente.direccion}</div>}
              </div>
            </div>

            {/* Itemized Table */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1.5 text-[10px]">
              <div className="flex justify-between font-bold pb-1 border-b border-slate-300 uppercase">
                <span className="w-8">CANT</span>
                <span className="flex-1 px-1">DESCRIPCIÓN</span>
                <span className="w-12 text-right">P.U.</span>
                <span className="w-14 text-right">TOTAL</span>
              </div>

              {(ticket.items || []).map((item, idx) => (
                <div key={idx} className="flex justify-between items-baseline leading-snug">
                  <span className="w-8 font-semibold">{item.cantidad} {item.unidad}</span>
                  <span className="flex-1 px-1 truncate uppercase font-bold">{item.descripcion}</span>
                  <span className="w-12 text-right">{(item.precioUnit || 0).toFixed(2)}</span>
                  <span className="w-14 text-right font-black">{(item.total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-700">
                <span>OP. GRAVADA:</span>
                <span>S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>I.G.V. (18%):</span>
                <span>S/ {igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300">
                <span>TOTAL A PAGAR:</span>
                <span className="text-base">S/ {totalAbs.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Details (Single or Multi/Split Payments) */}
            <div className="py-2 border-b border-dashed border-slate-400 text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>FORMA DE PAGO:</span>
                <span className="font-bold uppercase">
                  {ticket.pagos && ticket.pagos.length > 1 ? "PAGO MIXTO / DIVIDIDO" : ticket.medioPago}
                </span>
              </div>

              {ticket.pagos && ticket.pagos.length > 0 ? (
                <div className="space-y-1 pt-1 border-t border-dotted border-slate-300">
                  {ticket.pagos.map((p, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-slate-800">
                        <span>• {p.medio.toUpperCase()}{p.referencia ? ` (Ref: ${p.referencia})` : ""}:</span>
                        <span className="font-bold">S/ {p.monto.toFixed(2)}</span>
                      </div>
                      {p.medio.toLowerCase() === "efectivo" && p.montoRecibido && p.montoRecibido > p.monto && (
                        <div className="flex justify-between text-[9px] text-slate-600 pl-2">
                          <span>RECIBIDO: S/ {p.montoRecibido.toFixed(2)}</span>
                          <span>VUELTO: S/ {(p.vuelto || 0).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : ticket.medioPago === "efectivo" && ticket.montoRecibido ? (
                <>
                  <div className="flex justify-between">
                    <span>IMPORTE RECIBIDO:</span>
                    <span>S/ {ticket.montoRecibido.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>VUELTO:</span>
                    <span>S/ {(ticket.vuelto || 0).toFixed(2)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {/* Official SUNAT Footer & QR Representation */}
            <div className="pt-3 text-center space-y-2 text-[9px] text-slate-600">
              <div className="flex justify-center my-1">
                <div className="p-1.5 bg-white border border-slate-300 rounded">
                  <QrCode className="size-20 text-black stroke-[1.5]" />
                </div>
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleDownloadXml}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
          >
            <FileText className="size-3.5" /> Descargar XML / CDR SUNAT
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
