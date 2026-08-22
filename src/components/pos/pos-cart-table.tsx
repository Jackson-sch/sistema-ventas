"use client";

import { Minus, Plus, Trash2, Receipt, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { CartItemWithPromo } from "@/lib/promotions/promotion-engine";

interface PosCartTableProps {
  items: CartItemWithPromo[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string, name: string) => void;
}

export function PosCartTable({ items, onUpdateQuantity, onRemoveItem }: PosCartTableProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4">
      {items.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
          <Receipt className="size-16 stroke-[1.2] opacity-30 text-slate-400" />
          <p className="text-sm font-semibold text-slate-400">El ticket de venta está vacío</p>
          <p className="text-xs text-slate-600">Escanea un código de barras para comenzar la venta rápida</p>
        </div>
      ) : (
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <th className="pb-3 pl-2">Producto / Código</th>
              <th className="pb-3 text-right">Precio Unit.</th>
              <th className="pb-3 text-center">Cantidad / Peso</th>
              <th className="pb-3 text-right">Subtotal</th>
              <th className="pb-3 pr-2 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50 font-medium">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="py-3.5 pl-2">
                  <div className="text-white font-bold text-sm tracking-tight flex flex-wrap items-center gap-1.5">
                    <span>{item.nombre}</span>
                    {item.promoAplicada && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-950/90 text-purple-300 border border-purple-800/60 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                        <Sparkles className="size-2.5 text-purple-400" /> {item.promoAplicada}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-500 text-[11px]">{item.sku}</span>
                    {item.descuentoTotalItem > 0 && (
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">
                        Ahorro: -S/ {item.descuentoTotalItem.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono text-slate-300 text-sm">
                  {item.descuentoTotalItem > 0 ? (
                    <div>
                      <span className="line-through text-slate-500 text-[11px] block">{formatCurrency(item.precioOriginal)}</span>
                      <span className="text-emerald-400 font-bold">{formatCurrency(item.precioFinalUnitario)}</span>
                    </div>
                  ) : (
                    formatCurrency(item.precioOriginal)
                  )}
                </td>
                <td className="py-3.5">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-14 text-center font-mono font-bold text-white text-sm">
                      {item.cantidad} <span className="text-[10px] font-sans text-slate-400">{item.tipo === "peso" ? "kg" : "und"}</span>
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                </td>
                <td className="py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                  {formatCurrency(item.total)}
                </td>
                <td className="py-3.5 pr-2 text-center">
                  <button
                    onClick={() => onRemoveItem(item.id, item.nombre)}
                    title="Eliminar con autorización de supervisor"
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
