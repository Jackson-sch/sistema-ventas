"use client";

import {
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentCondition } from "@/actions/purchase-order-actions";

interface SupplierItem {
  id: string;
  razonSocial: string;
  ruc: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
}

interface OrdeneSupplierFormProps {
  uniqueSuppliers: SupplierItem[];
  selectedSupplierId: string;
  onSupplierSelect: (id: string) => void;
  supplierRuc: string;
  onSupplierRucChange: (v: string) => void;
  supplierName: string;
  onSupplierNameChange: (v: string) => void;
  supplierContact: string;
  onSupplierContactChange: (v: string) => void;
  supplierPhone: string;
  onSupplierPhoneChange: (v: string) => void;
  supplierEmail: string;
  onSupplierEmailChange: (v: string) => void;
  paymentCondition: PaymentCondition;
  onPaymentConditionChange: (v: PaymentCondition) => void;
  currency: "PEN" | "USD";
  onCurrencyChange: (v: "PEN" | "USD") => void;
  deliveryDate: string;
  onDeliveryDateChange: (v: string) => void;
}

export function OrdeneSupplierForm({
  uniqueSuppliers,
  selectedSupplierId,
  onSupplierSelect,
  supplierRuc,
  onSupplierRucChange,
  supplierName,
  onSupplierNameChange,
  supplierContact,
  onSupplierContactChange,
  supplierPhone,
  onSupplierPhoneChange,
  supplierEmail,
  onSupplierEmailChange,
  paymentCondition,
  onPaymentConditionChange,
  currency,
  onCurrencyChange,
  deliveryDate,
  onDeliveryDateChange,
}: OrdeneSupplierFormProps) {
  return (
    <>
      {/* Supplier Selection Card */}
      <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Building2 className="size-3.5" /> Datos del Proveedor
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {uniqueSuppliers.length} proveedores registrados
          </span>
        </div>

        {uniqueSuppliers.length > 0 && (
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Seleccionar del Directorio de Proveedores
            </label>
            <Select value={selectedSupplierId} onValueChange={onSupplierSelect}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-500 font-semibold">
                <SelectValue placeholder="Seleccione un proveedor..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-60">
                {uniqueSuppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
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
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">RUC del Proveedor</label>
            <input
              type="text"
              value={supplierRuc}
              onChange={(e) => onSupplierRucChange(e.target.value)}
              placeholder="20XXXXXXXXX"
              className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono font-bold"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Razón Social</label>
            <input
              type="text"
              value={supplierName}
              onChange={(e) => onSupplierNameChange(e.target.value)}
              placeholder="Nombre de la empresa"
              className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
              required
            />
          </div>
        </div>

        {/* Optional Supplier Contacts Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300">
            <User className="size-3 text-slate-500 shrink-0" />
            <input
              type="text"
              value={supplierContact}
              onChange={(e) => onSupplierContactChange(e.target.value)}
              placeholder="Contacto Comercial"
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300">
            <Phone className="size-3 text-slate-500 shrink-0" />
            <input
              type="text"
              value={supplierPhone}
              onChange={(e) => onSupplierPhoneChange(e.target.value)}
              placeholder="Teléfono"
              className="bg-transparent border-none outline-none w-full text-xs font-mono placeholder:text-slate-600"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-slate-300">
            <Mail className="size-3 text-slate-500 shrink-0" />
            <input
              type="email"
              value={supplierEmail}
              onChange={(e) => onSupplierEmailChange(e.target.value)}
              placeholder="Email Pedidos"
              className="bg-transparent border-none outline-none w-full text-xs placeholder:text-slate-600"
            />
          </div>
        </div>
      </div>

      {/* Conditions & Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Condición de Pago</label>
          <Select value={paymentCondition} onValueChange={(v: any) => onPaymentConditionChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="CONTADO" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Contado / Anticipado</SelectItem>
              <SelectItem value="CREDITO_15D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Crédito 15 días</SelectItem>
              <SelectItem value="CREDITO_30D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Crédito 30 días</SelectItem>
              <SelectItem value="CREDITO_60D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Crédito 60 días</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Moneda</label>
          <Select value={currency} onValueChange={(v: any) => onCurrencyChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-amber-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="PEN" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Soles (PEN S/)</SelectItem>
              <SelectItem value="USD" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">Dólares (USD $)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">Fecha Estimada de Entrega</label>
          <div className="relative">
            <Calendar className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => onDeliveryDateChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              required
            />
          </div>
        </div>
      </div>
    </>
  );
}
