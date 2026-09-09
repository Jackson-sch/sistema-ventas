"use client";

import { useRef } from "react";
import {
  Search,
  Barcode,
  Package,
  Plus,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { ProductSearchResult } from "@/actions/inventory-actions";

interface QuotationProductSearchProps {
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
  inputPrice: string;
  onInputPriceChange: (v: string) => void;
  onAddItem: () => void;
  itemsCount: number;
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
}

export function QuotationProductSearch({
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
  inputPrice,
  onInputPriceChange,
  onAddItem,
  itemsCount,
  searchContainerRef,
}: QuotationProductSearchProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3 relative z-30">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <Barcode className="size-3.5" /> 2. Búsqueda & Adición de Productos
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {itemsCount} productos en la proforma
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Product Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1">
          {selectedProd ? (
            <div className="flex items-center justify-between h-9 px-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs">
              <span className="font-bold text-white truncate flex items-center gap-1.5">
                <Package className="size-3.5 text-blue-400 shrink-0" />
                {selectedProd.nombre}
                <span className="text-slate-400 font-mono text-[10px]">({selectedProd.sku})</span>
              </span>
              <button
                type="button"
                onClick={onClearSelectedProd}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  onSearchQueryChange(e.target.value);
                  onDropdownOpenChange(true);
                }}
                onFocus={() => onDropdownOpenChange(true)}
                placeholder="Buscar producto por nombre o código de barras..."
                className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
              />
              <Barcode className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          )}

          {/* Dropdown search popup */}
          {isDropdownOpen && !selectedProd && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  {isSearching ? "Buscando..." : "No se encontraron productos"}
                </div>
              ) : (
                searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => onSelectProduct(prod)}
                    className="w-full px-3.5 py-2 text-left hover:bg-blue-600/20 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{prod.nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {prod.sku} • Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                      </div>
                    </div>
                    <div className="font-mono text-emerald-400 text-xs shrink-0 font-bold">
                      {formatCurrency(prod.precioVenta)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Quantity */}
        <div className="w-24">
          <input
            type="number"
            step="1"
            min="1"
            value={inputQty}
            onChange={(e) => onInputQtyChange(e.target.value)}
            placeholder="Cant."
            className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Unit Price */}
        <div className="w-28">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={inputPrice}
            onChange={(e) => onInputPriceChange(e.target.value)}
            placeholder="Precio U."
            className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Add button */}
        <button
          type="button"
          onClick={onAddItem}
          className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
        >
          <Plus className="size-3.5" /> Agregar
        </button>
      </div>
    </div>
  );
}
