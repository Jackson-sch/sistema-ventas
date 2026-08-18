"use client";

import { useState } from "react";
import {
  PackagePlus,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Layers,
  Sparkles,
  Archive,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface PurchaseItem {
  productoId: string;
  nombre: string;
  sku: string;
  cantidad: number;
  costoUnitario: number;
  total: number;
  lote?: string;
  vencimiento?: string;
}

export interface PurchaseRecord {
  id: string;
  numeroFactura: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorRuc: string;
  fechaEmision: string;
  fechaRecepcion: string;
  items: PurchaseItem[];
  subtotal: number;
  igv: number;
  total: number;
  condicionPago: string;
  estado: "Recibido" | "En Tránsito" | "Pendiente";
}

interface PurchaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (purchase: PurchaseRecord) => void;
}

const DEMO_PRODUCTS = [
  { id: "1", sku: "GLO-001", nombre: "Leche Gloria Entera 400g", costo: 3.20 },
  { id: "2", sku: "PRI-001", nombre: "Aceite Primor Premium 1L", costo: 7.50 },
  { id: "3", sku: "COS-001", nombre: "Arroz Costeño Extra 1kg", costo: 3.80 },
  { id: "4", sku: "BOL-001", nombre: "Detergente Bolívar 1kg", costo: 6.20 },
  { id: "5", sku: "YOG-001", nombre: "Yogurt Gloria Fresa 1L", costo: 5.40 },
  { id: "6", sku: "DON-001", nombre: "Fideos Don Vittorio 1kg", costo: 3.10 },
];

export function PurchaseFormDialog({
  isOpen,
  onClose,
  onSave,
}: PurchaseFormDialogProps) {
  const [numeroFactura, setNumeroFactura] = useState("F001-0089123");
  const [proveedor, setProveedor] = useState("GLORIA S.A. (RUC 20100190797)");
  const [condicionPago, setCondicionPago] = useState("Crédito 30 días");
  const [fechaEmision, setFechaEmision] = useState("16/08/2026");

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      productoId: "1",
      nombre: "Leche Gloria Entera 400g",
      sku: "GLO-001",
      cantidad: 120,
      costoUnitario: 3.20,
      total: 384.00,
      lote: "L-2026-095",
      vencimiento: "15/03/2027",
    },
    {
      productoId: "5",
      nombre: "Yogurt Gloria Fresa 1L",
      sku: "YOG-001",
      cantidad: 48,
      costoUnitario: 5.40,
      total: 259.20,
      lote: "L-2026-102",
      vencimiento: "30/10/2026",
    },
  ]);

  const [selectedProdId, setSelectedProdId] = useState("2");
  const [inputQty, setInputQty] = useState("50");
  const [inputCost, setInputCost] = useState("7.50");
  const [inputLote, setInputLote] = useState("L-2026-099");
  const [inputVenc, setInputVenc] = useState("15/12/2027");

  if (!isOpen) return null;

  const totalCalculado = items.reduce((acc, it) => acc + it.total, 0);
  const subtotal = totalCalculado / 1.18;
  const igv = totalCalculado - subtotal;

  const handleAddItem = () => {
    const prod = DEMO_PRODUCTS.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const qty = parseFloat(inputQty) || 1;
    const cost = parseFloat(inputCost) || prod.costo;
    const totalItem = qty * cost;

    const newItem: PurchaseItem = {
      productoId: prod.id,
      nombre: prod.nombre,
      sku: prod.sku,
      cantidad: qty,
      costoUnitario: cost,
      total: totalItem,
      lote: inputLote.trim() || undefined,
      vencimiento: inputVenc.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);
    toast.success(`Producto "${prod.nombre}" añadido a la orden de compra.`);
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la compra");
      return;
    }

    const newPurchase: PurchaseRecord = {
      id: Date.now().toString(),
      numeroFactura: numeroFactura.trim(),
      proveedorId: "p1",
      proveedorNombre: proveedor.split("(")[0].trim(),
      proveedorRuc: proveedor.includes("RUC") ? proveedor.split("RUC ")[1].replace(")", "").trim() : "20100190797",
      fechaEmision,
      fechaRecepcion: "16/08/2026",
      items,
      subtotal,
      igv,
      total: totalCalculado,
      condicionPago,
      estado: "Recibido",
    };

    onSave(newPurchase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <PackagePlus className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Registrar Compra & Recepción de Mercadería
            </h3>
            <p className="text-xs text-slate-400">
              Ingreso masivo al almacén con actualización automática de costos en Kardex
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                N° Factura / Guía de Remisión *
              </label>
              <input
                type="text"
                value={numeroFactura}
                onChange={(e) => setNumeroFactura(e.target.value)}
                placeholder="F001-0089123"
                required
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Proveedor Mayorista *
              </label>
              <select
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="GLORIA S.A. (RUC 20100190797)">GLORIA S.A. (RUC 20100190797)</option>
                <option value="ALICORP S.A.A. (RUC 20100055237)">ALICORP S.A.A. (RUC 20100055237)</option>
                <option value="BACKUS Y JOHNSTON S.A.A. (RUC 20100070970)">BACKUS Y JOHNSTON S.A.A.</option>
                <option value="PROCTER & GAMBLE PERU S.R.L.">PROCTER & GAMBLE PERÚ S.R.L.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Condición de Pago
              </label>
              <select
                value={condicionPago}
                onChange={(e) => setCondicionPago(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Contado">Contado</option>
                <option value="Crédito 15 días">Crédito 15 días</option>
                <option value="Crédito 30 días">Crédito 30 días</option>
                <option value="Crédito 60 días">Crédito 60 días</option>
              </select>
            </div>
          </div>

          {/* Add Item Form Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Plus className="size-3.5 text-emerald-400" /> Añadir Producto al Documento:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-4">
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {DEMO_PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  placeholder="Cant"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="number"
                  step="0.10"
                  placeholder="Costo S/"
                  value={inputCost}
                  onChange={(e) => setInputCost(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-emerald-400 text-right"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder="Lote"
                  value={inputLote}
                  onChange={(e) => setInputLote(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 text-center"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full h-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all"
                >
                  <Plus className="size-3.5" /> Agregar
                </button>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Producto</th>
                  <th className="py-2 px-3 text-center">Cant</th>
                  <th className="py-2 px-3 text-right">Costo Unit.</th>
                  <th className="py-2 px-3 text-center">Lote / Venc.</th>
                  <th className="py-2 px-3 text-right">Subtotal</th>
                  <th className="py-2 px-2 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="py-2 px-3">
                      <div className="font-bold text-white text-[11px]">{it.nombre}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{it.sku}</div>
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-white font-bold">
                      {it.cantidad} und
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-300">
                      {formatCurrency(it.costoUnitario)}
                    </td>
                    <td className="py-2 px-3 text-center font-mono text-[10px] text-slate-400">
                      {it.lote ? `${it.lote} (${it.vencimiento || "-"})` : "-"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                      {formatCurrency(it.total)}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex justify-between items-center text-xs">
            <div className="space-y-0.5 text-slate-400">
              <div>Op. Gravada: <strong className="text-slate-200">{formatCurrency(subtotal)}</strong></div>
              <div>I.G.V. (18%): <strong className="text-slate-200">{formatCurrency(igv)}</strong></div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 uppercase font-semibold">Total Factura:</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400">
                {formatCurrency(totalCalculado)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
            >
              <CheckCircle2 className="size-4" /> Ingresar Mercadería al Almacén
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
