"use client";

import { useState, useEffect } from "react";
import {
  User,
  Shield,
  KeyRound,
  Building2,
  Mail,
  Phone,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export interface UserData {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  rol: "Administrador General" | "Supervisor de Tienda" | "Cajero POS" | "Encargado de Almacén";
  sucursal: string;
  pin: string;
  estado: "Activo" | "Inactivo" | "Suspendido";
  cajaAsignada?: string;
  ultimoAcceso?: string;
  avatar?: string;
}

interface UserFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: UserData | null;
  onSave: (user: UserData) => void;
}

const BRANCH_OPTIONS = [
  "Sucursal Central - Surco",
  "Sucursal San Isidro - Begonias",
  "Sucursal Miraflores - Larco",
  "Todas las Sucursales (Global)",
];

export function UserFormDialog({
  isOpen,
  onClose,
  userToEdit,
  onSave,
}: UserFormDialogProps) {
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [rol, setRol] = useState<UserData["rol"]>("Cajero POS");
  const [sucursal, setSucursal] = useState("Sucursal Central - Surco");
  const [pin, setPin] = useState("1234");
  const [showPin, setShowPin] = useState(false);
  const [estado, setEstado] = useState<UserData["estado"]>("Activo");

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre);
      setDni(userToEdit.dni);
      setEmail(userToEdit.email);
      setTelefono(userToEdit.telefono);
      setRol(userToEdit.rol);
      setSucursal(userToEdit.sucursal);
      setPin(userToEdit.pin);
      setEstado(userToEdit.estado);
    } else {
      setNombre("");
      setDni("");
      setEmail("");
      setTelefono("");
      setRol("Cajero POS");
      setSucursal("Sucursal Central - Surco");
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
      setEstado("Activo");
    }
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !dni.trim() || !email.trim()) {
      toast.error("Nombre, DNI y correo son obligatorios");
      return;
    }

    if (pin.length < 4 || pin.length > 6) {
      toast.error("El PIN de seguridad debe tener entre 4 y 6 dígitos numéricos");
      return;
    }

    const payload: UserData = {
      id: userToEdit?.id || Date.now().toString(),
      nombre: nombre.trim(),
      dni: dni.trim(),
      email: email.trim(),
      telefono: telefono.trim() || "-",
      rol,
      sucursal,
      pin: pin.trim(),
      estado,
      ultimoAcceso: userToEdit?.ultimoAcceso || "Nunca",
    };

    onSave(payload);
    toast.success(userToEdit ? "Usuario actualizado exitosamente" : `Usuario "${nombre}" registrado`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {userToEdit ? "Editar Colaborador" : "Registrar Nuevo Colaborador"}
            </h3>
            <p className="text-xs text-slate-400">
              Asignación de rol, sucursal y PIN de seguridad para POS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name & DNI */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Nombres y Apellidos *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Carlos Alarcón Ramos"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                DNI / Documento *
              </label>
              <input
                type="text"
                maxLength={8}
                value={dni}
                onChange={(e) => setDni(e.target.value)}
                placeholder="45892144"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Correo Electrónico *
              </label>
              <div className="relative">
                <Mail className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@novamarket.pe"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Teléfono / Celular
              </label>
              <div className="relative">
                <Phone className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987 654 321"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Role & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Rol del Sistema (RBAC) *
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Cajero POS">Cajero POS</option>
                <option value="Supervisor de Tienda">Supervisor de Tienda</option>
                <option value="Encargado de Almacén">Encargado de Almacén</option>
                <option value="Administrador General">Administrador General</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Sucursal Asignada *
              </label>
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {BRANCH_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Security PIN for POS */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-white flex items-center gap-1.5">
                <KeyRound className="size-3.5 text-amber-400" /> PIN de Autorización POS (4-6 dígitos) *
              </label>
              <span className="text-[10px] text-amber-400/80 font-mono">Para desbloqueo en caja</span>
            </div>

            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <input
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono font-black text-amber-400 tracking-widest focus:outline-none focus:ring-1 focus:ring-amber-500 text-center"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                title={showPin ? "Ocultar PIN" : "Ver PIN"}
              >
                {showPin ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Estado de la Cuenta
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="Activo">Activo (Permite Iniciar Sesión)</option>
              <option value="Inactivo">Inactivo (Temporalmente sin acceso)</option>
              <option value="Suspendido">Suspendido (Bloqueado por Seguridad)</option>
            </select>
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
              <CheckCircle2 className="size-4" /> {userToEdit ? "Guardar Cambios" : "Registrar Usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
