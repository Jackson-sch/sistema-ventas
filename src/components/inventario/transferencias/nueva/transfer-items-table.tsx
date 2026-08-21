"use client";

import { Package, Trash2, Plus, Minus, Weight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { TransferCartItem } from "./transfer-product-picker";

interface TransferItemsTableProps {
  items: TransferCartItem[];
  onUpdateQty: (productoId: string, delta: number) => void;
  onSetQty: (productoId: string, qty: number) => void;
  onSetWeight: (productoId: string, weight: number) => void;
  onRemoveItem: (productoId: string) => void;
}

export function TransferItemsTable({
  items,
  onUpdateQty,
  onSetQty,
  onSetWeight,
  onRemoveItem,
}: TransferItemsTableProps) {
  if (items.length === 0) {
    return (
      <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-950/40">
        <Package className="size-10 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2.5" />
        <h4 className="text-sm font-bold text-white">No hay productos agregados al despacho</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Utilice el buscador superior o la pistola de código de barras para añadir los productos que se trasladarán.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-800 overflow-hidden bg-slate-950/40">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase">
              <th className="py-3 px-4">Producto & SKU</th>
              <th className="py-3 px-3 text-center">Stock Disp.</th>
              <th className="py-3 px-3 text-center">Cantidad a Trasladar</th>
              <th className="py-3 px-3 text-right">Peso Unit. (kg)</th>
              <th className="py-3 px-3 text-right">Peso Total</th>
              <th className="py-3 px-3 text-center">Quitar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {items.map((it) => {
              const lineWeight = +(it.cantidad * it.pesoUnitarioKgm).toFixed(2);
              return (
                <tr key={it.productoId} className="hover:bg-slate-900/40 transition-colors">
                  {/* Product */}
                  <td className="py-3 px-4 font-sans">
                    <div className="font-bold text-white text-xs">{it.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      SKU: {it.sku} • {it.categoria}
                    </div>
                  </td>

                  {/* Stock Disponible */}
                  <td className="py-3 px-3 text-center text-slate-400">
                    {it.stockDisponible} {it.unidadMedida}
                  </td>

                  {/* Quantity Controls */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.productoId, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <Minus className="size-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={it.cantidad}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 1;
                          onSetQty(it.productoId, Math.max(1, val));
                        }}
                        className="w-16 h-7 text-center rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => onUpdateQty(it.productoId, 1)}
                        className="w-7 h-7 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </td>

                  {/* Unit Weight */}
                  <td className="py-3 px-3 text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="0.05"
                      value={it.pesoUnitarioKgm}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 0.1;
                        onSetWeight(it.productoId, Math.max(0.01, w));
                      }}
                      className="w-16 h-7 text-right px-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>

                  {/* Total Line Weight */}
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    {lineWeight} kg
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(it.productoId)}
                      className="p-1.5 hover:bg-rose-600/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar producto del despacho"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
