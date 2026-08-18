"use client";

import { useState } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PurchaseOrderRecord, receivePurchaseOrderAction } from "@/actions/purchase-order-actions";

interface ReceiveOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrderRecord | null;
  onSuccess: () => void;
}

export function ReceiveOrderDialog({
  isOpen,
  onClose,
  order,
  onSuccess,
}: ReceiveOrderDialogProps) {
  if (!isOpen || !order) return null;

  const [guiaRemision, setGuiaRemision] = useState(`T001-000${Math.floor(Math.random() * 8000 + 1000)}`);
  const [factura, setFactura] = useState(`F001-000${Math.floor(Math.random() * 8000 + 1000)}`);
  const [responsable, setResponsable] = useState("Carlos Alarcón (Supervisor de Almacén)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize receipt quantities with remaining amounts
  const [receiptItems, setReceiptItems] = useState(
    order.items.map((i) => {
      const remaining = Math.max(0, i.cantidadPedida - i.cantidadRecibida);
      return {
        productoId: i.productoId,
        nombre: i.nombre,
        sku: i.sku,
        cantidadPedida: i.cantidadPedida,
        cantidadYaRecibida: i.cantidadRecibida,
        cantidadRecibir: remaining,
        lote: i.loteSugerido || `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`,
        fechaVencimiento: i.fechaVencimiento || "31/12/2027",
      };
    })
  );

  const handleQtyChange = (idx: number, val: number) => {
    const next = [...receiptItems];
    const maxAllowed = next[idx].cantidadPedida - next[idx].cantidadYaRecibida;
    next[idx].cantidadRecibir = Math.max(0, Math.min(val, maxAllowed));
    setReceiptItems(next);
  };

  const handleLoteChange = (idx: number, val: string) => {
    const next = [...receiptItems];
    next[idx].lote = val;
    setReceiptItems(next);
  };

  const handleVenceChange = (idx: number, val: string) => {
    const next = [...receiptItems];
    next[idx].fechaVencimiento = val;
    setReceiptItems(next);
  };

  const handleReceiveAll = () => {
    const next = receiptItems.map((i) => ({
      ...i,
      cantidadRecibir: Math.max(0, i.cantidadPedida - i.cantidadYaRecibida),
    }));
    setReceiptItems(next);
    toast.success("Cantidades completadas al 100% de la orden.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guiaRemision || !factura) {
      toast.error("Ingrese el número de Guía de Remisión y Factura del Proveedor.");
      return;
    }

    const itemsToReceive = receiptItems
      .filter((i) => i.cantidadRecibir > 0)
      .map((i) => ({
        productoId: i.productoId,
        cantidad: i.cantidadRecibir,
        lote: i.lote,
        fechaVencimiento: i.fechaVencimiento,
      }));

    if (itemsToReceive.length === 0) {
      toast.error("Debe recibir al menos una unidad de algún producto.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await receivePurchaseOrderAction({
        orderId: order.id,
        guiaRemisionProveedor: guiaRemision,
        facturaProveedor: factura,
        responsable,
        itemsRecibidos: itemsToReceive,
      });

      if (res.success) {
        toast.success(`Recepción de mercadería registrada con éxito.`, {
          description: `Nuevo estado de la orden: ${res.nuevoEstado}. Stock actualizado en inventario.`,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Error al procesar la recepción.");
      }
    } catch {
      toast.error("Error de conexión al registrar recepción en muelle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Package className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Recepción de Mercadería en Muelle
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {order.codigoOC} • {order.proveedorRazonSocial}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Supplier delivery documents */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="space-y-1">
              <label className="text-slate-400 font-bold">N° Guía de Remisión:</label>
              <input
                type="text"
                value={guiaRemision}
                onChange={(e) => setGuiaRemision(e.target.value)}
                placeholder="Ej: T001-0004512"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">N° Factura Proveedor:</label>
              <input
                type="text"
                value={factura}
                onChange={(e) => setFactura(e.target.value)}
                placeholder="Ej: F001-0023491"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-bold">Supervisor Receptor:</label>
              <input
                type="text"
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                required
              />
            </div>
          </div>

          {/* Items check table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Cotejo de Mercadería Físico vs Pedido:
              </span>
              <button
                type="button"
                onClick={handleReceiveAll}
                className="px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/80 hover:bg-emerald-900/60 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Sparkles className="size-3" /> Recibir Todo al 100%
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Producto / SKU</th>
                    <th className="py-2.5 px-2 text-center">Pedidas</th>
                    <th className="py-2.5 px-2 text-center">Previas</th>
                    <th className="py-2.5 px-2 text-center">A Recibir</th>
                    <th className="py-2.5 px-2">Lote Ingreso</th>
                    <th className="py-2.5 px-2">Vencimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {receiptItems.map((item, idx) => {
                    const remaining = item.cantidadPedida - item.cantidadYaRecibida;
                    return (
                      <tr key={idx} className="hover:bg-slate-800/20">
                        <td className="py-2.5 px-3 font-sans">
                          <div className="text-white font-bold">{item.nombre}</div>
                          <span className="text-[10px] text-slate-500 font-mono">{item.sku}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center text-white font-bold">
                          {item.cantidadPedida}
                        </td>
                        <td className="py-2.5 px-2 text-center text-slate-400">
                          {item.cantidadYaRecibida}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <input
                            type="number"
                            min={0}
                            max={remaining}
                            value={item.cantidadRecibir}
                            onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                            className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-center font-bold text-emerald-400 font-mono focus:border-emerald-500"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.lote}
                            onChange={(e) => handleLoteChange(idx, e.target.value)}
                            placeholder="L-2026-X"
                            className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px]"
                          />
                        </td>
                        <td className="py-2.5 px-2">
                          <input
                            type="text"
                            value={item.fechaVencimiento}
                            onChange={(e) => handleVenceChange(idx, e.target.value)}
                            placeholder="DD/MM/AAAA"
                            className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px]"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-400">
              Total unidades a recepcionar:{" "}
              <strong className="text-emerald-400 font-mono">
                {receiptItems.reduce((acc, i) => acc + i.cantidadRecibir, 0)} und.
              </strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="size-4" />
                {isSubmitting ? "Ingresando a Stock..." : "Confirmar Recepción & Stock"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
