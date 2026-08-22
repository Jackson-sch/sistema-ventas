"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Share2,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  ShoppingCart,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { QuotationRecord } from "@/actions/quotation-actions";

interface QuotationSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotation: QuotationRecord | null;
}

export function QuotationSheetDialog({
  isOpen,
  onClose,
  quotation,
}: QuotationSheetDialogProps) {
  const router = useRouter();

  if (!isOpen || !quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const phone = quotation.clienteTelefono ? quotation.clienteTelefono.replace(/\D/g, "") : "";
    const itemsText = quotation.items
      .map((i) => `• ${i.cantidad} ${i.tipo === "peso" ? "kg" : "und"} ${i.nombre} - S/ ${i.total.toFixed(2)}`)
      .join("\n");

    const message = `Estimado(a) *${quotation.clienteNombre}*, le compartimos su Cotización Oficial de *NovaMarket Supermercados*:\n\n` +
      `*N° Proforma:* ${quotation.codigo}\n` +
      `*Emisión:* ${quotation.fechaEmision} | *Válida hasta:* ${quotation.fechaVencimiento}\n\n` +
      `*Detalle de Productos:*\n${itemsText}\n\n` +
      `*TOTAL A PAGAR:* S/ ${quotation.total.toFixed(2)} (Incluye IGV)\n\n` +
      `Puede acercarse a cualquiera de nuestras cajas o confirmar su pedido respondiendo a este mensaje.`;

    const targetUrl = phone
      ? `https://wa.me/51${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(targetUrl, "_blank");
    toast.success("Abriendo WhatsApp para enviar proforma...");
  };

  const handleGoToPos = () => {
    onClose();
    router.push(`/pos?cotizacion=${quotation.id}`);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Proforma Comercial / Cotización
              </h3>
              <p className="text-xs text-slate-400 font-mono">{quotation.codigo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title="Compartir por WhatsApp"
            >
              <MessageSquare className="size-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Imprimir Proforma"
            >
              <Printer className="size-4" />
            </button>
            {quotation.estado === "vigente" && (
              <button
                onClick={handleGoToPos}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
                title="Cargar y cobrar esta cotización en la caja POS"
              >
                <ShoppingCart className="size-3.5" /> Cobrar en POS
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Printable Proforma Sheet */}
        <div id="printable-quotation-sheet" className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6 text-xs">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs">
                  N
                </div>
                <h4 className="text-base font-black text-white uppercase tracking-tight">
                  NOVAMARKET SUPERMERCADOS S.A.C.
                </h4>
              </div>
              <p className="text-slate-400 text-[11px]">RUC: 20608945123 • Central Surco</p>
              <p className="text-slate-500 text-[11px]">Av. Javier Prado Este 4200 - Santiago de Surco - Lima</p>
              <p className="text-slate-500 text-[11px]">Tel: (01) 619-8000 • ventas@novamarket.pe</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-1 sm:min-w-48">
              <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
                COTIZACIÓN FORMAL
              </span>
              <div className="text-base font-black text-white font-mono">{quotation.codigo}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                Emisión: <strong>{quotation.fechaEmision}</strong>
              </div>
              <div className="text-[10px] text-amber-400 font-mono">
                Válida hasta: <strong>{quotation.fechaVencimiento}</strong>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">DATOS DEL CLIENTE:</span>
              <div className="text-sm font-bold text-white">{quotation.clienteNombre}</div>
              <div className="text-slate-400 font-mono">
                {quotation.clienteTipoDoc}: {quotation.clienteDoc}
              </div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase text-slate-400 font-bold block">ASESOR COMERCIAL:</span>
              <div className="text-slate-200 font-bold">{quotation.vendedor}</div>
              {quotation.clienteTelefono && (
                <div className="text-slate-400">Tel: {quotation.clienteTelefono}</div>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-2 px-2">Cant</th>
                  <th className="py-2 px-2">Descripción del Producto</th>
                  <th className="py-2 px-2 text-right">P. Unitario</th>
                  <th className="py-2 px-2 text-right">Importe Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {quotation.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-2 font-mono text-slate-300">
                      {item.cantidad} {item.tipo === "peso" ? "kg" : "und"}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-white font-bold block">{item.nombre}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.sku}</span>
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-slate-300">
                      {formatCurrency(item.precioUnit)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-white">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals & Conditions */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-slate-800">
            <div className="space-y-2 flex-1 max-w-sm">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                TÉRMINOS Y CONDICIONES:
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {quotation.observaciones || "Precios expresados en Soles peruanos (PEN) e incluyen el 18% de IGV. Stock sujeto a disponibilidad al momento de confirmar el pago."}
              </p>
              {quotation.ventaComprobante && (
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="size-4" /> Venta formalizada con {quotation.ventaComprobante}
                </div>
              )}
            </div>

            <div className="space-y-1.5 sm:w-64">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal (Op. Gravada):</span>
                <span className="font-mono text-slate-200">{formatCurrency(quotation.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>IGV (18%):</span>
                <span className="font-mono text-slate-200">{formatCurrency(quotation.igv)}</span>
              </div>
              <div className="flex justify-between text-white font-extrabold text-sm pt-2 border-t border-slate-800">
                <span className="uppercase text-blue-400">TOTAL PROFORMA:</span>
                <span className="font-mono text-base">{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
