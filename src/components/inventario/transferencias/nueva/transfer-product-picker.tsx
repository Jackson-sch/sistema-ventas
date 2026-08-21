"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Search, Barcode, Plus, Loader2, Package, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";

export interface TransferCartItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  stockDisponible: number;
  cantidad: number;
  unidadMedida: string;
  pesoUnitarioKgm: number;
  precioUnitario: number;
}

interface TransferProductPickerProps {
  onAddItem: (item: TransferCartItem) => void;
}

export function TransferProductPicker({ onAddItem }: TransferProductPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchProductsAction(searchQuery, 10);
        setSearchResults(results);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectProduct = (prod: ProductSearchResult) => {
    const estimatedWeight = prod.tipoVenta === "peso" ? 1.0 : 0.5;
    onAddItem({
      productoId: prod.id,
      sku: prod.sku,
      nombre: prod.nombre,
      categoria: prod.categoria,
      stockDisponible: prod.stock,
      cantidad: 1,
      unidadMedida: prod.tipoVenta === "peso" ? "kg" : "und",
      pesoUnitarioKgm: estimatedWeight,
      precioUnitario: prod.precioVenta || prod.precioCosto || 3.5,
    });
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  return (
    <div ref={searchContainerRef} className="relative">
      <div className="relative">
        <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          placeholder="Buscar producto por nombre, SKU o escanear código de barras para agregar..."
          className="w-full h-11 pl-10 pr-10 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
        />
        {isSearching ? (
          <Loader2 className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
        ) : (
          <Barcode className="size-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        )}
      </div>

      {/* Dropdown Floating Results */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800 backdrop-blur-xl">
          {searchResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 font-sans">
              {isSearching ? "Buscando en catálogo..." : "No se encontraron productos coincidentes"}
            </div>
          ) : (
            searchResults.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleSelectProduct(prod)}
                className="w-full px-4 py-2.5 text-left hover:bg-blue-600/20 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs text-white group-hover:text-blue-400 truncate">
                    {prod.nombre}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span>SKU: {prod.sku}</span>
                    <span>•</span>
                    <span className="text-slate-500">{prod.categoria}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono font-bold text-emerald-400">
                    Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {formatCurrency(prod.precioVenta)}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
