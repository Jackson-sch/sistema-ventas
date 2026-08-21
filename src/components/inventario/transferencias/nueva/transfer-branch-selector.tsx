"use client";

import { Building2, MapPin, ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BranchItem {
  id: string;
  nombre: string;
  direccion?: string;
  codigoSunat?: string;
}

interface TransferBranchSelectorProps {
  branches: BranchItem[];
  sucursalOrigenId: string;
  onOrigenChange: (id: string) => void;
  sucursalDestinoId: string;
  onDestinoChange: (id: string) => void;
  onSwap: () => void;
}

export function TransferBranchSelector({
  branches,
  sucursalOrigenId,
  onOrigenChange,
  sucursalDestinoId,
  onDestinoChange,
  onSwap,
}: TransferBranchSelectorProps) {
  const sucursalOrigen = branches.find((b) => b.id === sucursalOrigenId);
  const sucursalDestino = branches.find((b) => b.id === sucursalDestinoId);

  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
            <Building2 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Puntos de Partida y Llegada (SUNAT)
            </h3>
            <p className="text-[11px] text-slate-400">
              Seleccione la sede emisora de origen y la sede receptora de destino
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSwap}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
          title="Intercambiar origen y destino"
        >
          <ArrowRightLeft className="size-3.5 text-blue-400" /> Invertir Ruta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sede Origen */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sede de Origen (Punto de Partida)
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              Código SUNAT: {sucursalOrigen?.codigoSunat || "0000"}
            </span>
          </div>

          <Select value={sucursalOrigenId} onValueChange={onOrigenChange}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-semibold">
              <SelectValue placeholder="Seleccione sucursal de origen" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              {branches.map((b) => (
                <SelectItem
                  key={b.id}
                  value={b.id}
                  disabled={b.id === sucursalDestinoId}
                  className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
                >
                  {b.nombre} {b.id === sucursalDestinoId ? "(Destino actual)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 font-mono">
            <MapPin className="size-3 text-slate-500 mt-0.5 shrink-0" />
            <span className="truncate">
              {sucursalOrigen?.direccion || "Av. Principal 123 - Almacén Central"}
            </span>
          </div>
        </div>

        {/* Sede Destino */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              Sede de Destino (Punto de Llegada)
            </label>
            <span className="text-[10px] font-mono text-slate-500">
              Código SUNAT: {sucursalDestino?.codigoSunat || "0001"}
            </span>
          </div>

          <Select value={sucursalDestinoId} onValueChange={onDestinoChange}>
            <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-semibold">
              <SelectValue placeholder="Seleccione sucursal de destino" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              {branches.map((b) => (
                <SelectItem
                  key={b.id}
                  value={b.id}
                  disabled={b.id === sucursalOrigenId}
                  className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
                >
                  {b.nombre} {b.id === sucursalOrigenId ? "(Origen actual)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-start gap-1.5 text-[11px] text-slate-400 font-mono">
            <MapPin className="size-3 text-slate-500 mt-0.5 shrink-0" />
            <span className="truncate">
              {sucursalDestino?.direccion || "Av. Las Begonias 450 - San Isidro"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
