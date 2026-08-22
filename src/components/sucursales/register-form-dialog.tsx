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
  X,
  Layers,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      setNombre("Caja 01 - Principal");
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
      toast.error("El nombre de la caja es obligatorio.");
      return;
    }

    const payload: RegisterData = {
      id: registerToEdit?.id || Date.now().toString(),
      branchId,
      nombre: nombre.trim(),
      tipo,
      serieBoleta: serieBoleta.trim().toUpperCase() || "B001",
      serieFactura: serieFactura.trim().toUpperCase() || "F001",
      serieNotaCredito: serieNotaCredito.trim().toUpperCase() || "BC01",
      impresoraTipo,
      impresoraIp: impresoraTipo === "Red (Ethernet/WiFi)" ? impresoraIp.trim() : undefined,
      estado,
      cajeroActual: registerToEdit?.cajeroActual,
    };

    onSave(payload);
    toast.success(
      registerToEdit
        ? "Caja actualizada exitosamente."
        : `Caja "${nombre}" asignada a ${branchName}.`
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
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Cpu className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                {registerToEdit ? "Editar Caja & Series Fiscales" : "Nueva Caja / Terminal POS"}
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 text-[10px] font-bold border border-indigo-800/40">
                POS
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sucursal asignada: <strong className="text-blue-400">{branchName}</strong>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: General Info */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                  Nombre de la Terminal *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Caja 01 - Principal"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Tipo de Terminal
                </label>
                <Select
                  value={tipo}
                  onValueChange={(val: "Principal" | "Rápida" | "Autoservicio") => setTipo(val)}
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900/90 border-slate-700/80 text-xs text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="Principal" className="text-xs cursor-pointer focus:bg-indigo-600/20 focus:text-indigo-300">
                      Caja Tradicional / Principal
                    </SelectItem>
                    <SelectItem value="Rápida" className="text-xs cursor-pointer focus:bg-indigo-600/20 focus:text-indigo-300">
                      Caja Rápida (Menos de 10 ítems)
                    </SelectItem>
                    <SelectItem value="Autoservicio" className="text-xs cursor-pointer focus:bg-indigo-600/20 focus:text-indigo-300">
                      Kiosko Autoservicio (Self-Checkout)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: SUNAT Series */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Receipt className="size-3.5 text-emerald-400" /> Series de Facturación SUNAT
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Formatos Oficiales</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Boleta
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieBoleta}
                  onChange={(e) => setSerieBoleta(e.target.value)}
                  placeholder="B001"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-black text-emerald-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Factura
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieFactura}
                  onChange={(e) => setSerieFactura(e.target.value)}
                  placeholder="F001"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-black text-blue-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">
                  Nota Crédito
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={serieNotaCredito}
                  onChange={(e) => setSerieNotaCredito(e.target.value)}
                  placeholder="BC01"
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono font-black text-rose-400 text-center uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 3: Hardware Impresora */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/70 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-1 border-b border-slate-800/80">
              <span className="flex items-center gap-1.5">
                <Printer className="size-3.5 text-blue-400" /> Impresora Térmica de Tickets 80mm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Tipo de Conexión
                </label>
                <Select
                  value={impresoraTipo}
                  onValueChange={(val: "Red (Ethernet/WiFi)" | "USB / Directa" | "Virtual") =>
                    setImpresoraTipo(val)
                  }
                >
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900/90 border-slate-700/80 text-xs text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem
                      value="Red (Ethernet/WiFi)"
                      className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
                    >
                      Red (Ethernet / WiFi IP)
                    </SelectItem>
                    <SelectItem
                      value="USB / Directa"
                      className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
                    >
                      Conexión USB / Serial Directa
                    </SelectItem>
                    <SelectItem
                      value="Virtual"
                      className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300"
                    >
                      Virtual / Solo PDF & Ticket
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {impresoraTipo === "Red (Ethernet/WiFi)" && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Dirección IP del Dispositivo
                  </label>
                  <div className="relative">
                    <Wifi className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={impresoraIp}
                      onChange={(e) => setImpresoraIp(e.target.value)}
                      placeholder="192.168.1.150"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-98"
            >
              <CheckCircle2 className="size-4" />
              {registerToEdit ? "Guardar Terminal" : "Registrar Caja"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
