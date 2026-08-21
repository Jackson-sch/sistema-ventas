"use client";

import { Search } from "lucide-react";
import { useMemo } from "react";
import { KardexRecord } from "./kardex-columns";

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
      {/* Product Filter from Recorded History */}
      <div className="w-full md:w-72">
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Filtrar por Producto
        </label>
        <select
          value={selectedProduct}
          onChange={(e) => onSelectProduct(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
        >
          <option value="all">
            Todos los Productos ({uniqueProducts.length} registrados)
          </option>
          {uniqueProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>
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
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>
      </div>

      {/* Operation Filter Pills */}
      <div>
        <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
          Tipo de Movimiento
        </label>
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onSelectOperation("all")}
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
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
            className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
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
