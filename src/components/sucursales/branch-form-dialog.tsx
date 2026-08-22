"use client";

import { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  X,
  Building2,
  Hash,
  Activity,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface BranchData {
  id: string;
  codigoSunat: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  encargado: string;
  cajasCount: number;
  estado: "Activa" | "En Mantenimiento";
}

interface BranchFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchToEdit?: BranchData | null;
  onSave: (branch: BranchData) => void;
}

export function BranchFormDialog({
  isOpen,
  onClose,
  branchToEdit,
  onSave,
}: BranchFormDialogProps) {
  const [codigoSunat, setCodigoSunat] = useState("0001");
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("Lima - Surco");
  const [telefono, setTelefono] = useState("");
  const [encargado, setEncargado] = useState("");
  const [estado, setEstado] = useState<"Activa" | "En Mantenimiento">("Activa");

  useEffect(() => {
    if (branchToEdit) {
      setCodigoSunat(branchToEdit.codigoSunat);
      setNombre(branchToEdit.nombre);
      setDireccion(branchToEdit.direccion);
      setCiudad(branchToEdit.ciudad);
      setTelefono(branchToEdit.telefono);
      setEncargado(branchToEdit.encargado);
      setEstado(branchToEdit.estado);
    } else {
      setCodigoSunat("0001");
      setNombre("");
      setDireccion("");
      setCiudad("Lima");
      setTelefono("");
      setEncargado("");
      setEstado("Activa");
    }
  }, [branchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !direccion.trim()) {
      toast.error("El nombre y la dirección de la sucursal son obligatorios.");
      return;
    }

    const payload: BranchData = {
      id: branchToEdit?.id || Date.now().toString(),
      codigoSunat: codigoSunat.trim() || "0001",
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim() || "Lima",
      telefono: telefono.trim(),
      encargado: encargado.trim() || "Por Asignar",
      cajasCount: branchToEdit?.cajasCount || 0,
      estado,
    };

    onSave(payload);
    toast.success(
      branchToEdit ? "Sucursal actualizada correctamente." : "Nueva sucursal creada con éxito."
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900/95 rounded-3xl p-6 shadow-2xl border border-slate-800/90 space-y-6 my-auto relative">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Store className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {branchToEdit ? "Editar Sucursal / Local" : "Nueva Sucursal / Tienda"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 text-[10px] font-bold border border-blue-800/40">
                Punto Fiscal
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Configuración de local físico y punto de emisión tributario
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Identificación */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Building2 className="size-3.5 text-blue-400" /> Identificación del Establecimiento
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Código SUNAT *
                </label>
                <div className="relative">
                  <Hash className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={codigoSunat}
                    onChange={(e) => setCodigoSunat(e.target.value)}
                    placeholder="0001"
                    maxLength={4}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-bold text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Nombre Comercial de la Sucursal *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sucursal San Isidro - Begonias"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ubicación & Contacto */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-3.5">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                Dirección Fiscal del Local *
              </label>
              <div className="relative">
                <MapPin className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Javier Prado Este 4200 - Surco"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Distrito / Ciudad
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Lima - San Isidro"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="(01) 619-8000"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Administración & Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Encargado / Administrador
              </label>
              <div className="relative">
                <User className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={encargado}
                  onChange={(e) => setEncargado(e.target.value)}
                  placeholder="Ej: Marcos Ramos"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Estado Operativo
              </label>
              <Select
                value={estado}
                onValueChange={(val: "Activa" | "En Mantenimiento") => setEstado(val)}
              >
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-700/80 text-xs text-slate-200">
                  <SelectValue placeholder="Estado de la sucursal" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem
                    value="Activa"
                    className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300"
                  >
                    Activa / En Servicio
                  </SelectItem>
                  <SelectItem
                    value="En Mantenimiento"
                    className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300"
                  >
                    En Mantenimiento
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="size-4" />
              {branchToEdit ? "Guardar Cambios" : "Crear Sucursal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
