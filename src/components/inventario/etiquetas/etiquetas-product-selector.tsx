"use client";

import {
  Search,
  CheckCircle2,
  Minus,
  Flame,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { ProductLabelItem, CATEGORIES } from "./types";

interface EtiquetasProductSelectorProps {
  products: ProductLabelItem[];
  filtered: ProductLabelItem[];
  selectedProducts: ProductLabelItem[];
  totalLabelsToPrint: number;
  isAllFilteredSelected: boolean;
  isSomeFilteredSelected: boolean;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  selectedCategory: string;
  onSelectedCategoryChange: (cat: string) => void;
  onToggleMasterCheckbox: () => void;
  onSelectAllGlobal: (select: boolean) => void;
  onSelectOnlyPromotions: () => void;
  onToggleProduct: (id: string) => void;
  onUpdateCopies: (id: string, delta: number) => void;
  onAddCopiesToAll: (amount: number) => void;
}

export function EtiquetasProductSelector({
  products,
  filtered,
  selectedProducts,
  totalLabelsToPrint,
  isAllFilteredSelected,
  isSomeFilteredSelected,
  searchTerm,
  onSearchTermChange,
  selectedCategory,
  onSelectedCategoryChange,
  onToggleMasterCheckbox,
  onSelectAllGlobal,
  onSelectOnlyPromotions,
  onToggleProduct,
  onUpdateCopies,
  onAddCopiesToAll,
}: EtiquetasProductSelectorProps) {
  return (
    <div className="xl:col-span-5 space-y-4">
      {/* Master Selection Toolbar */}
      <div className="glass-panel rounded-2xl p-4 space-y-3.5">
        {/* Master Checkbox Header Banner */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
          <button
            type="button"
            onClick={onToggleMasterCheckbox}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div
              className={`size-5 rounded-md flex items-center justify-center border transition-all ${
                isAllFilteredSelected
                  ? "bg-blue-600 border-blue-500 text-white"
                  : isSomeFilteredSelected
                  ? "bg-blue-950 border-blue-500 text-blue-400"
                  : "border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
              }`}
            >
              {isAllFilteredSelected ? (
                <CheckCircle2 className="size-3.5" />
              ) : isSomeFilteredSelected ? (
                <Minus className="size-3.5" />
              ) : null}
            </div>

            <div>
              <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                {isAllFilteredSelected ? "Desmarcar todos los filtrados" : "Marcar todos los filtrados"}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {selectedProducts.length} de {products.length} productos marcados ({totalLabelsToPrint} etiquetas)
              </div>
            </div>
          </button>

          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => onSelectAllGlobal(true)}
              title="Marcar todo el catálogo"
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => onSelectAllGlobal(false)}
              title="Desmarcar todo el catálogo"
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* Smart Filters and Promo Selector */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              placeholder="Buscar por nombre, SKU o código de barra..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>

          {/* Category Pills & Promo Filter */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            <div className="flex items-center gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectedCategoryChange(cat)}
                  className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-600 text-white font-semibold"
                      : "bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onSelectOnlyPromotions}
              className="px-2.5 py-1 rounded-lg bg-amber-950/50 border border-amber-800/50 hover:bg-amber-900/50 text-amber-300 text-[10px] font-bold whitespace-nowrap flex items-center gap-1 transition-colors"
            >
              <Flame className="size-3 text-amber-400" /> Solo Ofertas
            </button>
          </div>
        </div>

        {/* Batch copies buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-400">
          <span>Copias masivas:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onAddCopiesToAll(1)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 font-bold hover:text-white transition-colors"
            >
              +1 a Marcados
            </button>
            <button
              type="button"
              onClick={() => onAddCopiesToAll(5)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-blue-400 font-bold hover:text-white transition-colors"
            >
              +5 a Marcados
            </button>
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {filtered.map((prod) => (
            <div
              key={prod.id}
              onClick={() => onToggleProduct(prod.id)}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2.5 cursor-pointer transition-all ${
                prod.selected
                  ? "bg-blue-950/40 border-blue-600/70 shadow-sm"
                  : "bg-slate-900/40 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`size-4 rounded flex items-center justify-center border transition-colors ${
                    prod.selected
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-slate-700 bg-slate-900"
                  }`}
                >
                  {prod.selected && <CheckCircle2 className="size-3" />}
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white truncate">{prod.nombre}</span>
                    {prod.badgePromo && (
                      <span className="px-1.5 py-0.2 rounded bg-amber-500 text-black text-[9px] font-black uppercase tracking-wider">
                        {prod.badgePromo}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <span>SKU: {prod.sku}</span>
                    <span>•</span>
                    <strong className="text-emerald-400 font-bold text-xs">{formatCurrency(prod.precioVenta)}</strong>
                    {prod.precioAnterior && (
                      <span className="line-through text-slate-600 text-[10px]">{formatCurrency(prod.precioAnterior)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Spinner */}
              {prod.selected && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono font-bold shrink-0"
                >
                  <button
                    onClick={() => onUpdateCopies(prod.id, -1)}
                    className="px-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    -
                  </button>
                  <span className="text-blue-400 min-w-[18px] text-center">{prod.copias}</span>
                  <button
                    onClick={() => onUpdateCopies(prod.id, 1)}
                    className="px-1.5 text-slate-400 hover:text-white transition-colors"
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
