"use client";

import { useState, useRef, useEffect } from "react";
import { Barcode, Search, Scale, Tag, ArrowUp, ArrowDown } from "lucide-react";
import { CartItem } from "./types";

interface PosScannerBarProps {
  catalogProducts: CartItem[];
  onProductSelect: (product: CartItem) => void;
}

export function PosScannerBar({ catalogProducts, onProductSelect }: PosScannerBarProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSearchResults =
    barcodeInput.trim().length >= 1
      ? catalogProducts
          .filter((p) => {
            const q = barcodeInput.trim().toLowerCase();
            return (
              p.sku.toLowerCase().includes(q) ||
              p.nombre.toLowerCase().includes(q) ||
              p.categoria.toLowerCase().includes(q)
            );
          })
          .slice(0, 8)
      : [];

  useEffect(() => {
    if (barcodeInput.trim().length >= 1 && filteredSearchResults.length > 0) {
      setIsSearchDropdownOpen(true);
      setSelectedSearchIndex(0);
    } else {
      setIsSearchDropdownOpen(false);
    }
  }, [barcodeInput, filteredSearchResults.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSelectProduct = (product: CartItem) => {
    onProductSelect(product);
    setBarcodeInput("");
    setIsSearchDropdownOpen(false);
    inputRef.current?.focus();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isSearchDropdownOpen && filteredSearchResults.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (prev + 1) % filteredSearchResults.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSearchIndex((prev) => (prev - 1 + filteredSearchResults.length) % filteredSearchResults.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const selected = filteredSearchResults[selectedSearchIndex];
        if (selected) {
          handleSelectProduct(selected);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setIsSearchDropdownOpen(false);
        return;
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    if (isSearchDropdownOpen && filteredSearchResults.length > 0) {
      const selected = filteredSearchResults[selectedSearchIndex] || filteredSearchResults[0];
      if (selected) {
        handleSelectProduct(selected);
        return;
      }
    }

    let match = catalogProducts.find(
      (p) => p.sku.toLowerCase() === query || p.id.toLowerCase() === query
    );

    if (!match) {
      match = catalogProducts.find((p) => p.nombre.toLowerCase().includes(query));
    }

    if (match) {
      handleSelectProduct(match);
      return;
    }

    setBarcodeInput("");
    setIsSearchDropdownOpen(false);
  };

  return (
    <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 relative z-30">
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="relative flex-1">
          <Barcode className="size-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Escanear código de barras o escribir producto (ej: leche, arroz, gloria)..."
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-950/90 border border-slate-800 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono shadow-inner placeholder:text-slate-600"
          />

          {isSearchDropdownOpen && filteredSearchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/98 backdrop-blur-2xl border border-blue-500/40 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3.5 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-400">
                  Resultados encontrados: <strong className="text-white font-bold">{filteredSearchResults.length}</strong>
                </span>
                <span className="text-slate-500 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold flex items-center gap-0.5">
                    <ArrowUp className="size-2.5" />
                    <ArrowDown className="size-2.5" />
                    <span>Navegar</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-500/30 font-mono font-bold">↵ Enter Seleccionar</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Esc</span>
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/40">
                {filteredSearchResults.map((prod, idx) => {
                  const isSelected = idx === selectedSearchIndex;
                  return (
                    <div
                      key={prod.id || prod.sku}
                      onClick={() => handleSelectProduct(prod)}
                      onMouseEnter={() => setSelectedSearchIndex(idx)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-600/25 border-l-4 border-blue-500 text-white"
                          : "hover:bg-slate-800/60 text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center shrink-0 text-blue-400 font-bold text-xs">
                          {prod.tipo === "peso" ? <Scale className="size-4 text-emerald-400" /> : <Tag className="size-4 text-blue-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-sm text-white truncate flex items-center gap-2">
                            <span>{prod.nombre}</span>
                            {prod.tipo === "peso" && (
                              <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                                Balanza (kg)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                            <span className="text-slate-500">{prod.sku}</span>
                            <span>•</span>
                            <span className="text-slate-400">{prod.categoria}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="text-sm font-bold font-mono text-emerald-400 block">
                            S/ {prod.precio.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-sans">
                            {prod.tipo === "peso" ? "por kg" : "por unidad"}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-1 rounded-lg bg-blue-600 text-white font-mono text-[10px] font-bold shadow">
                            ↵ Enter
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98] shrink-0"
        >
          Agregar
        </button>
      </form>
    </div>
  );
}
