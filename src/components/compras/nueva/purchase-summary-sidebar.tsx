"use client";

import {
  DollarSign,
  CheckCircle2,
  Building2,
  Receipt,
  FileCheck2,
  Calendar,
  AlertCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SupplierData } from "@/components/compras/supplier-form-dialog";

interface PurchaseSummarySidebarProps {
  selectedSupplier: SupplierData | null;
  itemsCount: number;
  totalUnits: number;
  subtotal: number;
  igv: number;
  total: number;
  currency: "PEN" | "USD";
  observations: string;
  onObservationsChange: (val: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  isSubmitting: boolean;
}

export function PurchaseSummarySidebar({
  selectedSupplier,
  itemsCount,
  totalUnits,
  subtotal,
  igv,
  total,
  currency,
  observations,
  onObservationsChange,
  onSubmit,
  onClear,
  isSubmitting,
}: PurchaseSummarySidebarProps) {
  const currencySymbol = currency === "USD" ? "$ " : "S/ ";

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/70 space-y-5 sticky top-6">
      {/* 1. Supplier Quick Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
        <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
          <Building2 className="size-3.5 text-blue-400" /> Proveedor Seleccionado
        </div>
        {selectedSupplier ? (
          <div>
            <div className="text-sm font-bold text-white leading-snug">
              {selectedSupplier.razonSocial}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              RUC: <strong className="text-slate-200">{selectedSupplier.ruc}</strong>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Contacto: {selectedSupplier.contactoNombre}
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            Ningún proveedor seleccionado
          </div>
        )}
      </div>

      {/* 2. Financial Summary */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Receipt className="size-3.5 text-emerald-400" /> Liquidación del Documento
        </div>

        <div className="space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-400">
            <span>Ítems / Unidades:</span>
            <span className="font-bold text-slate-200">
              {itemsCount} prods • {totalUnits} unds
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Op. Gravada (Subtotal):</span>
            <span className="font-bold text-slate-200">
              {currencySymbol}{subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>I.G.V. (18% SUNAT):</span>
            <span className="font-bold text-slate-200">
              {currencySymbol}{igv.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-800 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-300 uppercase">Total Factura:</span>
            <span className="text-xl font-black text-emerald-400">
              {currencySymbol}{total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Observations */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
          Observaciones de Recepción en Almacén
        </label>
        <textarea
          rows={3}
          value={observations}
          onChange={(e) => onObservationsChange(e.target.value)}
          placeholder="Condiciones de entrega, temperatura de refrigeración, sellos de seguridad..."
          className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600 resize-none font-sans"
        />
      </div>

      {/* 4. Action Buttons */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || itemsCount === 0}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 className="size-4" />
          {isSubmitting ? "Ingresando a Kardex..." : "Ingresar Mercadería a Kardex"}
        </button>

        <button
          type="button"
          onClick={onClear}
          disabled={isSubmitting || itemsCount === 0}
          className="w-full py-2 px-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="size-3.5" /> Limpiar Documento
        </button>
      </div>
    </div>
  );
}
