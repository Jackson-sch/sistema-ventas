"use client";

import { useState, useRef } from "react";
import { Barcode, Search, Zap } from "lucide-react";
import { toast } from "sonner";
import { InventoryCountItem } from "@/actions/inventory-count-actions";

interface ConteoScannerBarProps {
  items: InventoryCountItem[];
  onScanItem: (productoId: string, newCount: number) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  filterType: "todos" | "con_diferencias" | "por_vencer";
  onFilterTypeChange: (type: "todos" | "con_diferencias" | "por_vencer") => void;
}

export function ConteoScannerBar({
  items,
  onScanItem,
  searchTerm,
  onSearchTermChange,
  filterType,
  onFilterTypeChange,
}: ConteoScannerBarProps) {
  const [barcodeInput, setBarcodeInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const targetItem = items.find(
      (i) => i.sku.toLowerCase() === query || i.nombre.toLowerCase().includes(query)
    );

    if (targetItem) {
      const nextCount = targetItem.conteoFisico + 1;
      onScanItem(targetItem.productoId, nextCount);
      toast.success(`Escaneado: ${targetItem.nombre}`, {
        description: `Conteo Físico actualizado a: ${nextCount} unds`,
      });
    } else {
      toast.error(`Producto con código "${barcodeInput}" no encontrado.`);
    }

    setBarcodeInput("");
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
      {/* 1. Barcode Scanner Form */}
      <form onSubmit={handleScanSubmit} className="flex-1 min-w-[280px]">
        <div className="relative">
          <Barcode className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
          <input
            ref={inputRef}
            type="text"
            value={barcodeInput}
            onChange={(e) => setBarcodeInput(e.target.value)}
            placeholder="Pistola de código de barras o escaneo rápido (Enter para sumar)..."
            className="w-full h-9 pl-10 pr-24 rounded-xl bg-slate-950/80 border border-blue-500/40 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            autoFocus
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1 transition-all cursor-pointer"
          >
            <Zap className="size-3" /> Sumar +1
          </button>
        </div>
      </form>

      {/* 2. Text Search */}
      <div className="w-full md:w-64 relative">
        <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Filtrar por nombre o SKU..."
          className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
        />
      </div>

      {/* 3. Filter Pills */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs h-9">
        <button
          type="button"
          onClick={() => onFilterTypeChange("todos")}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
            filterType === "todos" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Todos
        </button>
        <button
          type="button"
          onClick={() => onFilterTypeChange("con_diferencias")}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
            filterType === "con_diferencias" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Con Diferencias
        </button>
        <button
          type="button"
          onClick={() => onFilterTypeChange("por_vencer")}
          className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
            filterType === "por_vencer" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
          }`}
        >
          Por Vencer
        </button>
      </div>
    </div>
  );
}
