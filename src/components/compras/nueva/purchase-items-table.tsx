"use client";

import {
  Trash2,
  Package,
  Calendar,
  Layers,
  AlertCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface PurchaseItemRow {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  total: number;
  lote: string;
  fechaVencimiento: string;
}

interface PurchaseItemsTableProps {
  items: PurchaseItemRow[];
  onUpdateItem: (index: number, field: keyof PurchaseItemRow, value: any) => void;
  onRemoveItem: (productoId: string) => void;
  currency: "PEN" | "USD";
}

export function PurchaseItemsTable({
  items,
  onUpdateItem,
  onRemoveItem,
  currency,
}: PurchaseItemsTableProps) {
  const totalUnits = items.reduce((acc, i) => acc + (parseFloat(String(i.cantidad)) || 0), 0);

  return (
    <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="size-3.5 text-emerald-400" /> Detalle de Mercadería & Lotes
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {items.length} productos • {totalUnits} unidades
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400">
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Producto / SKU</th>
              <th className="py-3 px-3 text-center w-24">Cantidad</th>
              <th className="py-3 px-3 text-right w-32">Costo Unitario</th>
              <th className="py-3 px-3 text-center w-36">N° Lote</th>
              <th className="py-3 px-3 text-center w-36">Vencimiento</th>
              <th className="py-3 px-4 text-right w-32">Total Línea</th>
              <th className="py-3 px-2 text-center w-12">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-slate-500 font-sans">
                  <Package className="size-10 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                  <p className="text-sm font-semibold text-slate-400">
                    No hay productos agregados al comprobante
                  </p>
                  <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
                    Usa la barra superior para buscar productos en el catálogo o dispara la pistola lectora de código de barras.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.productoId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 text-center font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-sans font-bold text-white text-xs">
                      {item.nombre}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      SKU: {item.sku}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateItem(idx, "cantidad", val);
                        onUpdateItem(idx, "total", +(val * item.costoUnitario).toFixed(2));
                      }}
                      className="w-20 h-8 text-center rounded-lg bg-slate-900 border border-slate-700 font-bold text-emerald-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.costoUnitario}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        onUpdateItem(idx, "costoUnitario", val);
                        onUpdateItem(idx, "total", +(item.cantidad * val).toFixed(2));
                      }}
                      className="w-24 h-8 text-right px-2 rounded-lg bg-slate-900 border border-slate-700 font-bold text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="text"
                      value={item.lote}
                      onChange={(e) => onUpdateItem(idx, "lote", e.target.value)}
                      placeholder="Lote"
                      className="w-28 h-8 text-center rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="date"
                      value={item.fechaVencimiento}
                      onChange={(e) => onUpdateItem(idx, "fechaVencimiento", e.target.value)}
                      className="w-32 h-8 text-center px-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="py-2.5 px-4 text-right font-extrabold text-white text-xs">
                    {currency === "USD" ? "$ " : "S/ "}
                    {item.total.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.productoId)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Quitar ítem"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
