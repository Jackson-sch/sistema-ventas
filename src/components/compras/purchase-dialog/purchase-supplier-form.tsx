"use client";

import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_CONDITIONS } from "@/lib/constants";

interface SupplierOption {
  id: string;
  razonSocial: string;
  ruc: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
}

interface PurchaseSupplierFormProps {
  uniqueSuppliers: SupplierOption[];
  numeroFactura: string;
  onNumeroFacturaChange: (v: string) => void;
  selectedSupplierId: string;
  onSupplierSelect: (id: string) => void;
  condicionPago: string;
  onCondicionPagoChange: (v: string) => void;
}

export function PurchaseSupplierForm({
  uniqueSuppliers,
  numeroFactura,
  onNumeroFacturaChange,
  selectedSupplierId,
  onSupplierSelect,
  condicionPago,
  onCondicionPagoChange,
}: PurchaseSupplierFormProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* N° Factura */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
          N° Factura / Guía de Remisión *
        </label>
        <div className="relative">
          <FileText className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={numeroFactura}
            onChange={(e) => onNumeroFacturaChange(e.target.value)}
            placeholder="F001-0001234"
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            required
          />
        </div>
      </div>

      {/* Proveedor Selector */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
          Proveedor Mayorista *
        </label>
        <Select value={selectedSupplierId} onValueChange={onSupplierSelect}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500">
            <SelectValue placeholder="Seleccione un proveedor..." />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-56">
            {uniqueSuppliers.map((s) => (
              <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-bold">{s.razonSocial}</span>
                  <span className="text-slate-400 font-mono text-[10px]">({s.ruc})</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Condición de Pago */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
          Condición de Pago
        </label>
        <Select value={condicionPago} onValueChange={onCondicionPagoChange}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
            {PAYMENT_CONDITIONS.map((pc) => (
              <SelectItem key={pc.value} value={pc.value} className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                {pc.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
