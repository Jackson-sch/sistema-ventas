"use client";

import {
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
import { Badge } from "@/components/ui/badge";

interface ClientOption {
  id: string;
  nombre: string;
  numDoc: string;
  tipoDoc: "DNI" | "RUC" | "CE";
  telefono?: string;
  email?: string;
}

interface QuotationClientFormProps {
  availableClients: ClientOption[];
  selectedClientId: string;
  onClientSelect: (clientId: string) => void;
  clientTypeDoc: "DNI" | "RUC";
  onClientTypeDocChange: (v: "DNI" | "RUC") => void;
  clientDoc: string;
  onClientDocChange: (v: string) => void;
  clientName: string;
  onClientNameChange: (v: string) => void;
  clientPhone: string;
  onClientPhoneChange: (v: string) => void;
  clientEmail: string;
  onClientEmailChange: (v: string) => void;
  validityDays: number;
  onValidityDaysChange: (v: number) => void;
  currency: "PEN" | "USD";
  onCurrencyChange: (v: "PEN" | "USD") => void;
}

export function QuotationClientForm({
  availableClients,
  selectedClientId,
  onClientSelect,
  clientTypeDoc,
  onClientTypeDocChange,
  clientDoc,
  onClientDocChange,
  clientName,
  onClientNameChange,
  clientPhone,
  onClientPhoneChange,
  clientEmail,
  onClientEmailChange,
  validityDays,
  onValidityDaysChange,
  currency,
  onCurrencyChange,
}: QuotationClientFormProps) {
  return (
    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
          <User className="size-3.5" /> 1. Datos del Cliente & Condiciones Comerciales
        </span>
        <div className="w-64">
          <Select value={selectedClientId} onValueChange={onClientSelect}>
            <SelectTrigger className="h-8 rounded-xl bg-slate-900 border-slate-700 text-xs text-white">
              <SelectValue placeholder="Cargar desde Directorio..." />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-56">
              <SelectItem value="manual" className="text-xs font-semibold text-amber-400">
                Entrada Manual / Nuevo Cliente
              </SelectItem>
              {availableClients.map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  <div className="flex items-center justify-between gap-3 w-full">
                    <span className="font-bold">{c.nombre}</span>
                    <span className="text-slate-400 font-mono text-[10px]">({c.numDoc})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Tipo Doc */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Tipo Doc *</label>
          <Select value={clientTypeDoc} onValueChange={(v: any) => onClientTypeDocChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="DNI" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                DNI (Persona Natural)
              </SelectItem>
              <SelectItem value="RUC" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                RUC (Empresa / Persona Jurídica)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* N° Documento */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">N° Documento (DNI/RUC) *</label>
          <input
            type="text"
            value={clientDoc}
            onChange={(e) => onClientDocChange(e.target.value)}
            placeholder={clientTypeDoc === "RUC" ? "20601234567" : "45892144"}
            className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Razón Social / Nombre */}
        <div className="sm:col-span-2">
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Razón Social / Nombre Completo *</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => onClientNameChange(e.target.value)}
            placeholder="Ej: Inversiones Retail SAC o Juan Pérez García"
            className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Teléfono WhatsApp */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Phone className="size-3 text-emerald-400" /> WhatsApp / Celular
          </label>
          <input
            type="text"
            value={clientPhone}
            onChange={(e) => onClientPhoneChange(e.target.value)}
            placeholder="987654321"
            className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Mail className="size-3 text-blue-400" /> Correo Electrónico
          </label>
          <input
            type="email"
            value={clientEmail}
            onChange={(e) => onClientEmailChange(e.target.value)}
            placeholder="cliente@empresa.pe"
            className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Validez */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="size-3 text-amber-400" /> Validez Comercial
          </label>
          <Select value={String(validityDays)} onValueChange={(v) => onValidityDaysChange(Number(v))}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="3" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">3 días calendario</SelectItem>
              <SelectItem value="7" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-bold">7 días calendario (Estándar)</SelectItem>
              <SelectItem value="15" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">15 días calendario</SelectItem>
              <SelectItem value="30" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">30 días calendario</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Moneda */}
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
            <DollarSign className="size-3 text-slate-400" /> Moneda
          </label>
          <Select value={currency} onValueChange={(v: any) => onCurrencyChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="PEN" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-mono">PEN (S/)</SelectItem>
              <SelectItem value="USD" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-mono">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
