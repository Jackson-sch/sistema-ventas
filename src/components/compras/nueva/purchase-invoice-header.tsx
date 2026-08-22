"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  DollarSign,
  Hash,
  Sparkles,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SupplierData } from "@/components/compras/supplier-form-dialog";
import { SerieItem } from "@/actions/series-actions";
import { Badge } from "@/components/ui/badge";

interface PurchaseInvoiceHeaderProps {
  invoiceNumber: string;
  onInvoiceNumberChange: (val: string) => void;
  selectedSupplierId: string;
  onSupplierChange: (id: string) => void;
  suppliers: SupplierData[];
  seriesList: SerieItem[];
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
  seriesList = [],
  paymentCondition,
  onPaymentConditionChange,
  issueDate,
  onIssueDateChange,
  currency,
  onCurrencyChange,
}: PurchaseInvoiceHeaderProps) {
  const [selectedSerieId, setSelectedSerieId] = useState<string>("manual");

  // On mount or series loaded, select default primary Factura (01) serie
  useEffect(() => {
    if (seriesList.length > 0) {
      const defaultSerie =
        seriesList.find((s) => s.tipoComprobante === "01" && s.esPrincipal && s.activo) ||
        seriesList.find((s) => s.tipoComprobante === "01" && s.activo) ||
        seriesList[0];

      if (defaultSerie) {
        setSelectedSerieId(defaultSerie.id);
        const nextCorrelativo = `${defaultSerie.serie}-${defaultSerie.proximoNumero.toString().padStart(8, "0")}`;
        onInvoiceNumberChange(nextCorrelativo);
      }
    }
  }, [seriesList]);

  const handleSerieSelect = (serieId: string) => {
    setSelectedSerieId(serieId);
    if (serieId === "manual") return;

    const serieObj = seriesList.find((s) => s.id === serieId);
    if (serieObj) {
      const nextNum = `${serieObj.serie}-${serieObj.proximoNumero.toString().padStart(8, "0")}`;
      onInvoiceNumberChange(nextNum);
    }
  };

  return (
    <div className="glass-panel p-5 rounded-3xl border border-slate-800 bg-slate-950/60 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
            <FileText className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Cabecera del Comprobante de Compra
              <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                Series DB
              </Badge>
            </h2>
            <p className="text-[11px] text-slate-400">
              Serie y correlativo sincronizados con la base de datos de comprobantes SUNAT
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Serie Configurada en Base de Datos */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <Hash className="size-3 text-emerald-400" /> Serie / Tipo Documento
          </label>
          <Select value={selectedSerieId} onValueChange={handleSerieSelect}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500 font-mono">
              <SelectValue placeholder="Seleccionar Serie..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-60">
              {seriesList.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300"
                >
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="font-bold text-emerald-400">{s.serie}</span>
                    <span className="text-slate-400 text-[11px] truncate max-w-[140px]">
                      {s.tipoNombre}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      (N° {s.proximoNumero})
                    </span>
                  </div>
                </SelectItem>
              ))}
              <SelectItem
                value="manual"
                className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300 text-amber-400 font-semibold"
              >
                Comprobante Físico / Manual
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 2. N° Factura / Guía (Correlativo) */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
            <FileText className="size-3 text-emerald-400" /> N° Correlativo *
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

        {/* 3. Proveedor Mayorista */}
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

        {/* 4. Condición de Pago */}
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

        {/* 5. Fecha & Moneda */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="size-3 text-slate-400" /> Fecha
            </label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => onIssueDateChange(e.target.value)}
              className="w-full h-10 px-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
