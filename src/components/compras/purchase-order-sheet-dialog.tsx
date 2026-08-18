"use client";

import {
  Printer,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Package,
  Truck,
  CheckCircle2,
  MessageSquare,
  Clock,
  Send,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PurchaseOrderRecord } from "@/actions/purchase-order-actions";

interface PurchaseOrderSheetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrderRecord | null;
  onOpenReceiveModal?: (order: PurchaseOrderRecord) => void;
}

export function PurchaseOrderSheetDialog({
  isOpen,
  onClose,
  order,
  onOpenReceiveModal,
}: PurchaseOrderSheetDialogProps) {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const itemsText = order.items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.nombre} - ${i.cantidadPedida} und. x S/ ${i.costoUnitario.toFixed(2)} = S/ ${i.total.toFixed(2)}`
      )
      .join("\n");

    const message =
      `📦 *ORDEN DE COMPRA FORMAL - NOVAMARKET SUPERMERCADOS*\n\n` +
      `📄 *N° Orden:* ${order.codigoOC}\n` +
      `🏢 *Proveedor:* ${order.proveedorRazonSocial} (RUC: ${order.proveedorRuc})\n` +
      `📅 *Emisión:* ${order.fechaEmision} | *Entrega Solicitada:* ${order.fechaEntregaEstimada}\n` +
      `💳 *Condición de Pago:* ${order.condicionPago.replace("_", " ")}\n` +
      `📍 *Destino:* ${order.sucursalDestino}\n\n` +
      `*Detalle de Productos Solicitados:*\n${itemsText}\n\n` +
      `💰 *SUBTOTAL:* S/ ${order.subtotal.toFixed(2)}\n` +
      `🏛️ *IGV (18%):* S/ ${order.igv.toFixed(2)}\n` +
      `💵 *TOTAL ORDEN:* S/ ${order.total.toFixed(2)} ${order.moneda}\n\n` +
      `_Agradeceremos confirmar recepción de pedido y programar rampa de descarga._`;

    const phone = order.proveedorTelefono?.replace(/\D/g, "");
    const targetUrl = phone
      ? `https://wa.me/51${phone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(targetUrl, "_blank");
    toast.success("Abriendo WhatsApp para enviar orden de compra al proveedor.");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        {/* Actions Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Truck className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Orden de Compra a Proveedor
              </h3>
              <p className="text-xs text-slate-400 font-mono">{order.codigoOC}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWhatsApp}
              className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title="Enviar por WhatsApp"
            >
              <MessageSquare className="size-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Imprimir Orden A4"
            >
              <Printer className="size-4" />
            </button>
            {order.estado !== "RECEPCIONADA_TOTAL" && order.estado !== "ANULADA" && onOpenReceiveModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenReceiveModal(order);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                title="Recepcionar mercadería en muelle"
              >
                <Package className="size-3.5" /> Recepcionar en Muelle
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Official Purchase Order Sheet */}
        <div
          id="printable-purchase-order"
          className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-6 text-xs text-slate-200"
        >
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
              <p className="text-slate-400 text-[11px]">RUC: 20608945123 • Sede Central Surco</p>
              <p className="text-slate-500 text-[11px]">Av. Javier Prado Este 4200 - Santiago de Surco - Lima</p>
              <p className="text-slate-500 text-[11px]">Tel: (01) 619-8000 • compras@novamarket.pe</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-1 sm:min-w-52">
              <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                ORDEN DE COMPRA OFICIAL
              </span>
              <p className="text-lg font-black text-white font-mono">{order.codigoOC}</p>
              <div className="text-[11px] text-slate-400 space-y-0.5 font-mono">
                <div>Emisión: {order.fechaEmision}</div>
                <div>Entrega Req: {order.fechaEntregaEstimada}</div>
              </div>
            </div>
          </div>

          {/* Supplier & Delivery Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                DATOS DEL PROVEEDOR:
              </span>
              <p className="font-bold text-white text-sm">{order.proveedorRazonSocial}</p>
              <p className="text-slate-300 font-mono">RUC: {order.proveedorRuc}</p>
              <p className="text-slate-400">Contacto: {order.proveedorContacto}</p>
              <p className="text-slate-400">Tel: {order.proveedorTelefono} • {order.proveedorEmail}</p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                CONDICIONES COMERCIALES:
              </span>
              <p className="text-slate-300">
                Condición de Pago: <strong className="text-white font-bold">{order.condicionPago.replace("_", " ")}</strong>
              </p>
              <p className="text-slate-300">
                Moneda: <strong className="text-white font-bold">{order.moneda === "PEN" ? "Soles (PEN)" : "Dólares (USD)"}</strong>
              </p>
              <p className="text-slate-300">
                Lugar de Entrega: <span className="text-amber-400 font-medium">{order.sucursalDestino}</span>
              </p>
              <p className="text-slate-400 text-[11px]">Estado: <strong className="text-blue-400 font-bold">{order.estado.replace("_", " ")}</strong></p>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Detalle de Mercadería Solicitada:
            </span>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Ítem / SKU</th>
                    <th className="py-2.5 px-3 text-center">Cant. Pedida</th>
                    <th className="py-2.5 px-3 text-center">Cant. Recibida</th>
                    <th className="py-2.5 px-3 text-right">Costo Unit. (s/ IGV)</th>
                    <th className="py-2.5 px-3 text-right">Importe Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {order.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="text-white font-bold">{item.nombre}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{item.sku}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-white">
                        {item.cantidadPedida}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.cantidadRecibida >= item.cantidadPedida
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : item.cantidadRecibida > 0
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-slate-900 text-slate-400"
                        }`}>
                          {item.cantidadRecibida} / {item.cantidadPedida}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {formatCurrency(item.costoUnitario)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-white">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-2">
            <div className="max-w-md space-y-1 text-slate-400 text-[11px]">
              <span className="font-bold text-slate-300 block uppercase">INSTRUCCIONES DE ENTREGA:</span>
              <p>{order.observaciones}</p>
            </div>

            <div className="sm:min-w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Operaciones:</span>
                <span className="font-bold text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>IGV (18%):</span>
                <span className="font-bold text-white">{formatCurrency(order.igv)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                <span>TOTAL ORDEN:</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Goods Receipt Logs if any */}
          {order.recepciones.length > 0 && (
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Historial de Recepciones en Muelle:
              </span>
              <div className="space-y-2">
                {order.recepciones.map((rec) => (
                  <div key={rec.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-300 font-semibold">
                      <span>Guía Remisión: <strong className="text-white font-mono">{rec.guiaRemisionProveedor}</strong> • Factura: <strong className="text-white font-mono">{rec.facturaProveedor}</strong></span>
                      <span className="text-slate-500 font-mono">{rec.fecha} {rec.hora}</span>
                    </div>
                    <div className="text-slate-400">
                      Recibido por: <span className="text-white">{rec.responsable}</span>
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Ítems: {rec.itemsRecibidos.map((i) => `${i.nombre} (${i.cantidad} und - Lote ${i.lote})`).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signature Boxes */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-center text-[10px] text-slate-400">
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <div className="font-bold text-white">Roberto Méndez</div>
              <div>Jefe de Compras & Abastecimiento</div>
            </div>
            <div className="border-t border-slate-700 pt-2 space-y-0.5">
              <div className="font-bold text-white">{order.proveedorRazonSocial}</div>
              <div>Conformidad del Proveedor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
