"use client";

import { Truck, User, Calendar, ShieldCheck } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransferTransportCardProps {
  motivoTraslado: "04" | "01" | "02" | "13";
  onMotivoChange: (val: "04" | "01" | "02" | "13") => void;
  modalidadTransporte: "02" | "01";
  onModalidadChange: (val: "02" | "01") => void;
  fechaSalida: string;
  onFechaSalidaChange: (val: string) => void;
  // Conductor Privado
  choferNombre: string;
  onChoferNombreChange: (val: string) => void;
  choferDoc: string;
  onChoferDocChange: (val: string) => void;
  choferLicencia: string;
  onChoferLicenciaChange: (val: string) => void;
  vehiculoPlaca: string;
  onVehiculoPlacaChange: (val: string) => void;
  vehiculoMarca: string;
  onVehiculoMarcaChange: (val: string) => void;
  // Transportista Público
  transportistaRuc: string;
  onTransportistaRucChange: (val: string) => void;
  transportistaRazonSocial: string;
  onTransportistaRazonSocialChange: (val: string) => void;
}

export function TransferTransportCard({
  motivoTraslado,
  onMotivoChange,
  modalidadTransporte,
  onModalidadChange,
  fechaSalida,
  onFechaSalidaChange,
  choferNombre,
  onChoferNombreChange,
  choferDoc,
  onChoferDocChange,
  choferLicencia,
  onChoferLicenciaChange,
  vehiculoPlaca,
  onVehiculoPlacaChange,
  vehiculoMarca,
  onVehiculoMarcaChange,
  transportistaRuc,
  onTransportistaRucChange,
  transportistaRazonSocial,
  onTransportistaRazonSocialChange,
}: TransferTransportCardProps) {
  return (
    <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
          <Truck className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Datos de Traslado y Despacho SUNAT
          </h3>
          <p className="text-[11px] text-slate-400">
            Información del transporte, conductor y vehículo para la Guía de Remisión Electrónica
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Motivo de Traslado */}
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
            Motivo del Traslado
          </label>
          <Select value={motivoTraslado} onValueChange={(v: any) => onMotivoChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="04" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                04 - Traslado entre establecimientos
              </SelectItem>
              <SelectItem value="01" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                01 - Venta
              </SelectItem>
              <SelectItem value="02" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                02 - Compra
              </SelectItem>
              <SelectItem value="13" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                13 - Otros motivos
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Modalidad de Transporte */}
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
            Modalidad de Transporte
          </label>
          <Select value={modalidadTransporte} onValueChange={(v: any) => onModalidadChange(v)}>
            <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-blue-500">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
              <SelectItem value="02" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                02 - Transporte Privado (Propio)
              </SelectItem>
              <SelectItem value="01" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                01 - Transporte Público (Tercero)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Fecha de Inicio */}
        <div>
          <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
            Fecha de Inicio del Traslado
          </label>
          <div className="relative">
            <Calendar className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="date"
              value={fechaSalida}
              onChange={(e) => onFechaSalidaChange(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Conditional Transport Details */}
      {modalidadTransporte === "02" ? (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <User className="size-3.5 text-blue-400" />
            Datos del Conductor y Vehículo (Transporte Privado)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Nombre del Conductor
              </label>
              <input
                type="text"
                value={choferNombre}
                onChange={(e) => onChoferNombreChange(e.target.value)}
                placeholder="Nombre completo"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                DNI / Doc. Chofer
              </label>
              <input
                type="text"
                value={choferDoc}
                onChange={(e) => onChoferDocChange(e.target.value)}
                placeholder="8 dígitos"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Licencia de Conducir
              </label>
              <input
                type="text"
                value={choferLicencia}
                onChange={(e) => onChoferLicenciaChange(e.target.value)}
                placeholder="N° Licencia MTC"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Placa del Vehículo
              </label>
              <input
                type="text"
                value={vehiculoPlaca}
                onChange={(e) => onVehiculoPlacaChange(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Marca / Modelo del Vehículo
              </label>
              <input
                type="text"
                value={vehiculoMarca}
                onChange={(e) => onVehiculoMarcaChange(e.target.value)}
                placeholder="Ej. Camión Isuzu Forward"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Truck className="size-3.5 text-purple-400" />
            Empresa Transportista Tercerizada (Transporte Público)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                RUC de la Empresa de Transporte
              </label>
              <input
                type="text"
                value={transportistaRuc}
                onChange={(e) => onTransportistaRucChange(e.target.value)}
                placeholder="20XXXXXXXXX"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Razón Social del Transportista
              </label>
              <input
                type="text"
                value={transportistaRazonSocial}
                onChange={(e) => onTransportistaRazonSocialChange(e.target.value)}
                placeholder="Razón Social Oficial"
                className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
