"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Search,
  Barcode,
  Plus,
  Loader2,
  Package,
  X,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";

interface PurchaseProductScannerProps {
  onAddProduct: (item: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
    lote: string;
    fechaVencimiento: string;
  }) => void;
}

export function PurchaseProductScanner({ onAddProduct }: PurchaseProductScannerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedProd, setSelectedProd] = useState<ProductSearchResult | null>(null);
  const [inputQty, setInputQty] = useState("10");
  const [inputCost, setInputCost] = useState("10.00");
  const [inputLote, setInputLote] = useState("");
  const [inputVenc, setInputVenc] = useState("");

  // Setup default lote & vencimiento on mount
  useEffect(() => {
    setInputLote(`L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    const targetVenc = new Date();
    targetVenc.setFullYear(targetVenc.getFullYear() + 2);
    setInputVenc(targetVenc.toISOString().split("T")[0]);
  }, []);

  // Click outside listener
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

  // Live product search
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
    setSelectedProd(prod);
    setInputCost(prod.precioCosto.toFixed(2));
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleAdd = () => {
    if (!selectedProd) {
      toast.error("Busque y seleccione un producto del catálogo.");
      return;
    }

    const qty = parseFloat(inputQty) || 0;
    const cost = parseFloat(inputCost) || 0;
    if (qty <= 0 || cost <= 0) {
      toast.error("La cantidad y el costo deben ser mayores a cero.");
      return;
    }

    const loteVal = inputLote.trim() || `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const vencVal = inputVenc || "2027-12-31";

    onAddProduct({
      productoId: selectedProd.id,
      sku: selectedProd.sku,
      nombre: selectedProd.nombre,
      cantidad: qty,
      costoUnitario: cost,
      lote: loteVal,
      fechaVencimiento: vencVal,
    });

    setSelectedProd(null);
    setInputQty("10");
    setInputLote(`L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
  };

  return (
    <div className="glass-panel p-4 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
          <Barcode className="size-3.5" /> Escáner de Productos & Búsqueda Rápida
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          Pistola de código de barras o búsqueda manual
        </span>
      </div>

      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Search input or selected product banner */}
        <div ref={searchContainerRef} className="relative flex-1">
          {selectedProd ? (
            <div className="flex items-center justify-between h-10 px-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
              <span className="font-bold text-white truncate flex items-center gap-1.5">
                <Package className="size-3.5 text-emerald-400 shrink-0" />
                {selectedProd.nombre}
                <span className="text-slate-400 font-mono text-[10px]">({selectedProd.sku})</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedProd(null)}
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
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Escanear código de barras o buscar producto por nombre / SKU..."
                className="w-full h-10 pl-10 pr-9 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
              />
              {isSearching ? (
                <Loader2 className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
              ) : (
                <Barcode className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
              )}
            </div>
          )}

          {/* Search Dropdown */}
          {isDropdownOpen && !selectedProd && (
            <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
              {searchResults.length === 0 ? (
                <div className="p-3.5 text-center text-xs text-slate-500 font-sans">
                  {isSearching ? "Buscando en catálogo..." : "No se encontraron productos"}
                </div>
              ) : (
                searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-emerald-600/20 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{prod.nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SKU: {prod.sku} • Stock actual: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                      </div>
                    </div>
                    <div className="font-mono text-emerald-400 text-xs shrink-0 font-bold">
                      Costo: {formatCurrency(prod.precioCosto)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Input Quantity */}
        <div className="w-full sm:w-28">
          <input
            type="number"
            step="1"
            min="1"
            value={inputQty}
            onChange={(e) => setInputQty(e.target.value)}
            placeholder="Cant."
            className="w-full h-10 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Input Cost */}
        <div className="w-full sm:w-32">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={inputCost}
            onChange={(e) => setInputCost(e.target.value)}
            placeholder="Costo U."
            className="w-full h-10 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Input Lote */}
        <div className="w-full sm:w-36">
          <input
            type="text"
            value={inputLote}
            onChange={(e) => setInputLote(e.target.value)}
            placeholder="N° Lote"
            className="w-full h-10 px-3 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Input Vencimiento */}
        <div className="w-full sm:w-36">
          <input
            type="date"
            value={inputVenc}
            onChange={(e) => setInputVenc(e.target.value)}
            className="w-full h-10 px-2 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Add Button */}
        <button
          type="button"
          onClick={handleAdd}
          className="h-10 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95 shrink-0"
        >
          <Plus className="size-4" /> Añadir
        </button>
      </div>
    </div>
  );
}
