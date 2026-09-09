"use client";

import {
  Plus,
  Trash2,
  Search,
  Barcode,
  Loader2,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductSearchResult } from "@/actions/inventory-actions";

interface OrderItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadPedida: number;
  costoUnitario: number;
  total: number;
}

interface OrdeneProductPickerProps {
  items: OrderItem[];
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;
  searchResults: ProductSearchResult[];
  isSearching: boolean;
  isDropdownOpen: boolean;
  onDropdownOpenChange: (v: boolean) => void;
  selectedProd: ProductSearchResult | null;
  onSelectProduct: (prod: ProductSearchResult) => void;
  onClearSelectedProd: () => void;
  inputQty: string;
  onInputQtyChange: (v: string) => void;
  inputCost: string;
  onInputCostChange: (v: string) => void;
  onAddItem: () => void;
  onRemoveItem: (productoId: string) => void;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function OrdeneProductPicker({
  items,
  searchQuery,
  onSearchQueryChange,
  searchResults,
  isSearching,
  isDropdownOpen,
  onDropdownOpenChange,
  selectedProd,
  onSelectProduct,
  onClearSelectedProd,
  inputQty,
  onInputQtyChange,
  inputCost,
  onInputCostChange,
  onAddItem,
  onRemoveItem,
  searchContainerRef,
}: OrdeneProductPickerProps) {
  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
        <span>Agregar Productos al Pedido</span>
        <span className="text-[10px] text-slate-500 font-mono">{items.length} ítems en orden</span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div ref={searchContainerRef} className="relative flex-1">
          {selectedProd ? (
            <div className="flex items-center justify-between h-9 px-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
              <span className="font-bold text-white truncate">
                {selectedProd.nombre} ({selectedProd.sku})
              </span>
              <button type="button" onClick={onClearSelectedProd} className="p-1 text-slate-400 hover:text-white">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange(e.target.value);
                  onDropdownOpenChange(true);
                }}
                onFocus={() => onDropdownOpenChange(true)}
                placeholder="Buscar producto por nombre, SKU o código de barras..."
                className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              {isSearching ? (
                <Loader2 className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
              ) : (
                <Barcode className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              )}
            </div>
          )}

          {/* Dropdown search results */}
          {isDropdownOpen && !selectedProd && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500 font-sans">
                  {isSearching ? "Buscando en catálogo..." : "No se encontraron productos"}
                </div>
              ) : (
                searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onSelectProduct(prod)}
                    className="w-full px-3 py-2 text-left hover:bg-amber-600/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{prod.nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {prod.sku} • Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                      </div>
                    </div>
                    <div className="font-mono text-amber-400 text-xs shrink-0">
                      Costo: {formatCurrency(prod.precioCosto)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <div className="w-24">
          <input
            type="number"
            step="1"
            min="1"
            value={inputQty}
            onChange={(e) => onInputQtyChange(e.target.value)}
            placeholder="Cant."
            className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="w-28">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={inputCost}
            onChange={(e) => onInputCostChange(e.target.value)}
            placeholder="Costo U."
            className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <button
          type="button"
          onClick={onAddItem}
          className="h-9 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-amber-600/20"
        >
          <Plus className="size-3.5" /> Agregar
        </button>
      </div>

      {/* Added Items Table */}
      {items.length > 0 && (
        <div className="rounded-xl border border-slate-800 overflow-hidden mt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400">
              <tr>
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 text-center">Cant. Pedida</th>
                <th className="py-2.5 px-3 text-right">Costo Unitario</th>
                <th className="py-2.5 px-3 text-right">Total</th>
                <th className="py-2.5 px-2 text-center">Quitar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {items.map((item) => (
                <tr key={item.productoId} className="hover:bg-slate-900/30">
                  <td className="py-2.5 px-3 text-white font-sans font-medium">
                    {item.nombre} <span className="text-slate-500 text-[10px]">({item.sku})</span>
                  </td>
                  <td className="py-2.5 px-3 text-center text-amber-400 font-bold">{item.cantidadPedida}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(item.costoUnitario)}</td>
                  <td className="py-2.5 px-3 text-right text-white font-bold">{formatCurrency(item.total)}</td>
                  <td className="py-2.5 px-2 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.productoId)}
                      className="p-1 hover:bg-rose-600/20 text-rose-400 rounded-md transition-colors cursor-pointer"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
