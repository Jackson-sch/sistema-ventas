"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Store,
  Hash,
} from "lucide-react";
import { toast } from "sonner";

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
      setCodigoSunat(`000${Math.floor(Math.random() * 90) + 10}`);
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
      toast.error("El nombre y dirección de la sucursal son obligatorios");
      return;
    }

    const payload: BranchData = {
      id: branchToEdit?.id || Date.now().toString(),
      codigoSunat: codigoSunat.trim(),
      nombre: nombre.trim(),
      direccion: direccion.trim(),
      ciudad: ciudad.trim(),
      telefono: telefono.trim(),
      encargado: encargado.trim() || "Por Asignar",
      cajasCount: branchToEdit?.cajasCount || 1,
      estado,
    };

    onSave(payload);
    toast.success(branchToEdit ? "Sucursal actualizada" : "Nueva sucursal creada con éxito");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Store className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {branchToEdit ? "Editar Sucursal / Tienda" : "Nueva Sucursal / Tienda"}
            </h3>
            <p className="text-xs text-slate-400">
              Configuración de local físico y punto de emisión tributario
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Código Establecimiento SUNAT
              </label>
              <input
                type="text"
                value={codigoSunat}
                onChange={(e) => setCodigoSunat(e.target.value)}
                placeholder="0001"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombre Comercial de la Sucursal *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Sucursal San Isidro - Begonias"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Address & City */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Dirección Fiscal del Local *
              </label>
              <div className="relative">
                <MapPin className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Av. Javier Prado Este 4200 - Surco"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Distrito / Ciudad
                </label>
                <input
                  type="text"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                  placeholder="Lima - San Isidro"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <Phone className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="(01) 619-8000"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manager & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Encargado / Administrador
              </label>
              <div className="relative">
                <User className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={encargado}
                  onChange={(e) => setEncargado(e.target.value)}
                  placeholder="Ej: Marcos Ramos"
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Estado Operativo
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as any)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Activa">Activa / En Servicio</option>
                <option value="En Mantenimiento">En Mantenimiento</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95"
            >
              <CheckCircle2 className="size-4" /> {branchToEdit ? "Guardar Cambios" : "Crear Sucursal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
