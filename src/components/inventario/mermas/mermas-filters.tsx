"use client";

import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MermasFiltersProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  filterReason: string;
  onFilterReasonChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
}

export function MermasFilters({
  searchTerm,
  onSearchTermChange,
  filterReason,
  onFilterReasonChange,
  filterStatus,
  onFilterStatusChange,
}: MermasFiltersProps) {
  return (
    <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
      {/* 1. Global Search */}
      <div className="relative flex-1 min-w-[260px]">
        <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          placeholder="Buscar por código de acta, producto o responsable..."
          className="w-full h-9 pl-10 pr-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
        />
      </div>

      {/* 2. Filter by Reason (Shadcn Select) */}
      <div className="w-full md:w-56">
        <Select value={filterReason} onValueChange={onFilterReasonChange}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500">
            <SelectValue placeholder="Motivo de Desmedro" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
            <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Todos los Motivos
            </SelectItem>
            <SelectItem value="VENCIMIENTO" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Vencimiento / Caducidad
            </SelectItem>
            <SelectItem value="ROTURA_TRANSPORTE" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Rotura / Transporte
            </SelectItem>
            <SelectItem value="MERMA_PERECIBLE" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Merma Perecible
            </SelectItem>
            <SelectItem value="DEFECTO_FABRICA" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Defecto de Fábrica
            </SelectItem>
            <SelectItem value="CONTAMINACION" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Contaminación
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 3. Filter by Status (Shadcn Select) */}
      <div className="w-full md:w-52">
        <Select value={filterStatus} onValueChange={onFilterStatusChange}>
          <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500">
            <SelectValue placeholder="Estado Legal" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
            <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Todos los Estados
            </SelectItem>
            <SelectItem value="APROBADO_KARDEX" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Aprobado en Kardex
            </SelectItem>
            <SelectItem value="DESTRUIDO_CON_ACTA" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Destruido con Acta
            </SelectItem>
            <SelectItem value="BORRADOR" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
              Borrador
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
