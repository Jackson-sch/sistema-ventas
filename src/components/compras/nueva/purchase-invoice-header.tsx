"use client";

import {
  FileText,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierData } from "@/components/compras/supplier-form-dialog";

interface PurchaseInvoiceHeaderProps {
  invoiceNumber: string;
  onInvoiceNumberChange: (val: string) => void;
  selectedSupplierId: string;
  onSupplierChange: (id: string) => void;
  suppliers: SupplierData[];
  paymentCondition: string;
  onPaymentConditionChange: (val: string) => void;
  issueDate: string;
  onIssueDateChange: (val: string) => void;
  currency: "PEN" | "USD";
  onCurrencyChange: (val: "PEN" | "USD") => void;
}

export function PurchaseInvoiceHeader({
  invoiceNumber,
  onInvoiceNumberChange,
  selectedSupplierId,
  onSupplierChange,
  suppliers,
  paymentCondition,
  onPaymentConditionChange,
  issueDate,
  onIssueDateChange,
  currency,
  onCurrencyChange,
}: PurchaseInvoiceHeaderProps) {
  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <FileText className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">
              Cabecera del Comprobante de Compra
            </h2>
            <p className="text-[11px] text-slate-400">
              Datos tributarios del proveedor y factura de compra
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. N° Factura / Guía */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <FileText className="size-3 text-emerald-400" /> N° Factura / Guía *
          </label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => onInvoiceNumberChange(e.target.value)}
            placeholder="F001-00012345"
            className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-600"
            required
          />
        </div>

        {/* 2. Proveedor Mayorista (Shadcn Select) */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <Building2 className="size-3 text-blue-400" /> Proveedor Mayorista *
          </label>
          <Select value={selectedSupplierId} onValueChange={onSupplierChange}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500 font-medium">
              <SelectValue placeholder="Seleccione un proveedor..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-60">
              {suppliers.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300"
                >
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="font-bold">{s.razonSocial}</span>
                    <span className="text-slate-400 font-mono text-[10px] bg-slate-800/80 px-1.5 py-0.5 rounded">
                      RUC: {s.ruc}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 3. Condición de Pago */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <CreditCard className="size-3 text-amber-400" /> Condición de Pago
          </label>
          <Select value={paymentCondition} onValueChange={onPaymentConditionChange}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="Contado" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                Contado / Efectivo
              </SelectItem>
              <SelectItem value="Crédito 15 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                Crédito 15 días
              </SelectItem>
              <SelectItem value="Crédito 30 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                Crédito 30 días
              </SelectItem>
              <SelectItem value="Crédito 60 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                Crédito 60 días
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 4. Fecha de Emisión & Moneda */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="size-3 text-slate-400" /> Fecha
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => onIssueDateChange(e.target.value)}
              className="w-full h-10 px-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <DollarSign className="size-3 text-slate-400" /> Moneda
            </label>
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                <SelectItem value="PEN" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300 font-mono">
                  PEN (S/)
                </SelectItem>
                <SelectItem value="USD" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300 font-mono">
                  USD ($)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
