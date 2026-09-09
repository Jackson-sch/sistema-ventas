"use client";

import { Trash2, Package, Layers } from "lucide-react";
import { QuotationItem } from "@/actions/quotation-actions";

interface QuotationItemsTableProps {
  items: QuotationItem[];
  currencySymbol: string;
  onUpdateItem: (index: number, field: keyof QuotationItem, value: any) => void;
  onRemoveItem: (index: number) => void;
}

export function QuotationItemsTable({
  items,
  currencySymbol,
  onUpdateItem,
  onRemoveItem,
}: QuotationItemsTableProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden relative z-10">
      <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
        <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
          <Layers className="size-3.5 text-blue-400" /> Detalle de Productos Cotizados
        </span>
        <span className="text-slate-400 font-mono text-[10px]">Precios con I.G.V. incluido</span>
      </div>

      <div className="overflow-x-auto max-h-56 overflow-y-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
            <tr>
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Producto / SKU</th>
              <th className="py-2.5 px-3 text-center w-24">Cantidad</th>
              <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
              <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
              <th className="py-2.5 px-2 text-center w-12">Quitar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-500 font-sans">
                  <Package className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-1.5" />
                  <p className="text-xs text-slate-400 font-semibold">
                    No hay productos agregados a la cotización
                  </p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Usa el buscador superior para agregar productos con su precio sugerido.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.productoId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2 px-3 text-slate-500 text-center font-bold">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <div className="font-sans font-bold text-white text-xs">{item.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.cantidad}
                      onChange={(e) => onUpdateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                      className="w-16 h-7 text-center rounded-lg bg-slate-900 border border-slate-700 font-bold text-blue-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.precioUnit}
                      onChange={(e) => onUpdateItem(idx, "precioUnit", parseFloat(e.target.value) || 0)}
                      className="w-20 h-7 text-right px-1.5 rounded-lg bg-slate-900 border border-slate-700 font-bold text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-white">
                    {currencySymbol}{item.total.toFixed(2)}
                  </td>
                  <td className="py-2 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(idx)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
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
