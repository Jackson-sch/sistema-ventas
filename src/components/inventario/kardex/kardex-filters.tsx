"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import { KardexRecord } from "./kardex-columns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface KardexFiltersProps {
  records: KardexRecord[];
  selectedProduct: string;
  onSelectProduct: (productId: string) => void;
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedOperation: string;
  onSelectOperation: (op: string) => void;
}

export function KardexFilters({
  records,
  selectedProduct,
  onSelectProduct,
  searchTerm,
  onSearchTermChange,
  selectedOperation,
  onSelectOperation,
}: KardexFiltersProps) {
  // Extract only unique products that actually appear in the Kardex history (O(N) memory efficiency)
  const uniqueProducts = useMemo(() => {
    const map = new Map<string, { id: string; name: string; sku: string }>();
    for (const r of records) {
      if (r.productoId && !map.has(r.productoId)) {
        map.set(r.productoId, {
          id: r.productoId,
          name: r.productoNombre,
          sku: r.sku,
        });
      }
    }
    return Array.from(map.values());
  }, [records]);

  return (
    <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
      {/* Product Filter using Shadcn Select */}
      <div className="w-full md:w-72">
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Filtrar por Producto
        </label>
        <Select value={selectedProduct} onValueChange={onSelectProduct}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 font-medium">
            <SelectValue placeholder="Todos los Productos" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl max-h-64 z-50">
            <SelectItem
              value="all"
              className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
            >
              Todos los Productos ({uniqueProducts.length} registrados)
            </SelectItem>
            {uniqueProducts.map((p) => (
              <SelectItem
                key={p.id}
                value={p.id}
                className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
              >
                {p.name} ({p.sku})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Global Search Input */}
      <div className="relative flex-1 w-full md:w-auto">
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Búsqueda Rápida
        </label>
        <div className="relative">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar por serie/número, producto o SKU..."
            className="w-full h-9 pl-9 pr-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Operation Filter Pills */}
      <div>
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Tipo de Movimiento
        </label>
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs h-9">
          <button
            type="button"
            onClick={() => onSelectOperation("all")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              selectedOperation === "all"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onSelectOperation("compra")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              selectedOperation === "compra"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Compras
          </button>
          <button
            type="button"
            onClick={() => onSelectOperation("venta")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              selectedOperation === "venta"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Ventas
          </button>
          <button
            type="button"
            onClick={() => onSelectOperation("transferencia")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              selectedOperation === "transferencia"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Traslados
          </button>
          <button
            type="button"
            onClick={() => onSelectOperation("merma")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer text-xs ${
              selectedOperation === "merma"
                ? "bg-blue-600 text-white"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Mermas / Ajustes
          </button>
        </div>
      </div>
    </div>
  );
}
