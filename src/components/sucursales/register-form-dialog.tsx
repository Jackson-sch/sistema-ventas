"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Printer,
  FileText,
  CreditCard,
  CheckCircle2,
  Cpu,
  Receipt,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

export interface RegisterData {
  id: string;
  branchId: string;
  nombre: string;
  tipo: "Principal" | "Rápida" | "Autoservicio";
  serieBoleta: string;
  serieFactura: string;
  serieNotaCredito: string;
  impresoraTipo: "Red (Ethernet/WiFi)" | "USB / Directa" | "Virtual";
  impresoraIp?: string;
  estado: "Operativa" | "En Turno" | "Inactiva";
  cajeroActual?: string;
}

interface RegisterFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
  branchName: string;
  registerToEdit?: RegisterData | null;
  onSave: (reg: RegisterData) => void;
}

export function RegisterFormDialog({
  isOpen,
  onClose,
  branchId,
  branchName,
  registerToEdit,
  onSave,
}: RegisterFormDialogProps) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"Principal" | "Rápida" | "Autoservicio">("Principal");
  const [serieBoleta, setSerieBoleta] = useState("B001");
  const [serieFactura, setSerieFactura] = useState("F001");
  const [serieNotaCredito, setSerieNotaCredito] = useState("BC01");
  const [impresoraTipo, setImpresoraTipo] = useState<"Red (Ethernet/WiFi)" | "USB / Directa" | "Virtual">("Red (Ethernet/WiFi)");
  const [impresoraIp, setImpresoraIp] = useState("192.168.1.150");
  const [estado, setEstado] = useState<"Operativa" | "En Turno" | "Inactiva">("Operativa");

  useEffect(() => {
    if (registerToEdit) {
      setNombre(registerToEdit.nombre);
      setTipo(registerToEdit.tipo);
      setSerieBoleta(registerToEdit.serieBoleta);
      setSerieFactura(registerToEdit.serieFactura);
      setSerieNotaCredito(registerToEdit.serieNotaCredito);
      setImpresoraTipo(registerToEdit.impresoraTipo);
      setImpresoraIp(registerToEdit.impresoraIp || "192.168.1.150");
      setEstado(registerToEdit.estado);
    } else {
      setNombre("Caja 01");
      setTipo("Principal");
      setSerieBoleta("B001");
      setSerieFactura("F001");
      setSerieNotaCredito("BC01");
      setImpresoraTipo("Red (Ethernet/WiFi)");
      setImpresoraIp("192.168.1.150");
      setEstado("Operativa");
    }
  }, [registerToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre de la caja es obligatorio");
      return;
    }

    const payload: RegisterData = {
      id: registerToEdit?.id || Date.now().toString(),
      branchId,
      nombre: nombre.trim(),
      tipo,
      serieBoleta: serieBoleta.trim().toUpperCase(),
      serieFactura: serieFactura.trim().toUpperCase(),
      serieNotaCredito: serieNotaCredito.trim().toUpperCase(),
      impresoraTipo,
      impresoraIp: impresoraTipo === "Red (Ethernet/WiFi)" ? impresoraIp.trim() : undefined,
      estado,
      cajeroActual: registerToEdit?.cajeroActual,
    };

    onSave(payload);
    toast.success(registerToEdit ? "Caja actualizada exitosamente" : `Caja "${nombre}" asignada a ${branchName}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {registerToEdit ? "Editar Caja & Series SUNAT" : "Nueva Caja / Terminal POS"}
            </h3>
            <p className="text-xs text-slate-400">
              Sucursal: <strong className="text-blue-400">{branchName}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Register Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombre de la Caja / Terminal *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Caja 01 - Principal"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tipo de Terminal
              </label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Principal">Caja Tradicional / Principal</option>
                <option value="Rápida">Caja Rápida (&lt; 10 ítems)</option>
                <option value="Autoservicio">Kiosko Autoservicio (Self-Checkout)</option>
              </select>
            </div>
          </div>

          {/* SUNAT Series Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-white pb-1.5 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Receipt className="size-3.5 text-emerald-400" /> Series de Facturación SUNAT
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">Resolución SUNAT</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Serie Boleta
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieBoleta}
                  onChange={(e) => setSerieBoleta(e.target.value)}
                  placeholder="B001"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-emerald-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Serie Factura
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieFactura}
                  onChange={(e) => setSerieFactura(e.target.value)}
                  placeholder="F001"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-blue-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Serie N. Crédito
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieNotaCredito}
                  onChange={(e) => setSerieNotaCredito(e.target.value)}
                  placeholder="BC01"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-black text-rose-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Thermal Printer Hardware Section */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Impresora Térmica 80mm
                </label>
                <select
                  value={impresoraTipo}
                  onChange={(e) => setImpresoraTipo(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Red (Ethernet/WiFi)">Red (Ethernet / WiFi IP)</option>
                  <option value="USB / Directa">Conexión USB / Serial</option>
                  <option value="Virtual">Virtual / Solo PDF</option>
                </select>
              </div>

              {impresoraTipo === "Red (Ethernet/WiFi)" && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Dirección IP de la Impresora
                  </label>
                  <div className="relative">
                    <Printer className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={impresoraIp}
                      onChange={(e) => setImpresoraIp(e.target.value)}
                      placeholder="192.168.1.150"
                      className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
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
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              <CheckCircle2 className="size-4" /> {registerToEdit ? "Guardar Cambios" : "Vincular Caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
