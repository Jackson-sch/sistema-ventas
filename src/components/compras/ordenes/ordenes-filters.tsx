"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrdenesFiltersProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
}

export function OrdenesFilters({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
}: OrdenesFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
      {/* 1. Global Search */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Buscar por N° Orden (OC-2026-...), proveedor o RUC..."
          className="w-full h-9 pl-10 pr-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono placeholder:text-slate-600"
        />
      </div>

      {/* 2. Filter by Status (Shadcn Select) */}
      <div className="w-full md:w-56">
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-amber-500">
            <SelectValue placeholder="Estado de la Orden" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
            <SelectItem value="all" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Todos los Estados
            </SelectItem>
            <SelectItem value="ENVIADA_PROVEEDOR" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Enviada / En Tránsito
            </SelectItem>
            <SelectItem value="RECEPCION_PARCIAL" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Recepción Parcial
            </SelectItem>
            <SelectItem value="RECEPCIONADA_TOTAL" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Recibida Completa
            </SelectItem>
            <SelectItem value="BORRADOR" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Borrador
            </SelectItem>
            <SelectItem value="ANULADA" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
              Anulada
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
