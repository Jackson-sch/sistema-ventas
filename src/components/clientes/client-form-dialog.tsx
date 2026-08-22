"use client";

import { useState, useEffect } from "react";
import {
  User,
  Building2,
  Search,
  Sparkles,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Award,
  CreditCard,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { lookupIdentityAction } from "@/actions/identity-lookup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ClientData {
  id: string;
  tipoDoc: "DNI" | "RUC" | "CE";
  numDoc: string;
  nombre: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  categoria: "Estándar" | "VIP / Frecuente" | "Mayorista";
  puntos: number;
  totalCompras: number;
  ultimoConsumo?: string;
}

interface ClientFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: ClientData | null;
  onSave: (client: ClientData) => void;
}

export function ClientFormDialog({
  isOpen,
  onClose,
  clientToEdit,
  onSave,
}: ClientFormDialogProps) {
  const [tipoDoc, setTipoDoc] = useState<"DNI" | "RUC" | "CE">("DNI");
  const [numDoc, setNumDoc] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [categoria, setCategoria] = useState<"Estándar" | "VIP / Frecuente" | "Mayorista">("Estándar");
  const [puntos, setPuntos] = useState("0");
  const [isSearchingApi, setIsSearchingApi] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setTipoDoc(clientToEdit.tipoDoc);
      setNumDoc(clientToEdit.numDoc);
      setNombre(clientToEdit.nombre);
      setEmail(clientToEdit.email || "");
      setTelefono(clientToEdit.telefono || "");
      setDireccion(clientToEdit.direccion || "");
      setCategoria(clientToEdit.categoria);
      setPuntos(clientToEdit.puntos.toString());
    } else {
      setTipoDoc("DNI");
      setNumDoc("");
      setNombre("");
      setEmail("");
      setTelefono("");
      setDireccion("");
      setCategoria("Estándar");
      setPuntos("0");
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleQueryDocument = async () => {
    if (!numDoc.trim()) {
      toast.error("Por favor ingrese el número de documento");
      return;
    }

    setIsSearchingApi(true);
    try {
      const docTypeToQuery = tipoDoc === "CE" ? "DNI" : tipoDoc;
      const res = await lookupIdentityAction(docTypeToQuery, numDoc);

      if (res.success && res.nombreRazonSocial) {
        setNombre(res.nombreRazonSocial);
        if (res.direccionFiscal) {
          setDireccion(res.direccionFiscal);
        }
        if (tipoDoc === "RUC") {
          setCategoria("Mayorista");
          toast.success(`SUNAT: ${res.nombreRazonSocial}`, {
            description: `Estado: ${res.estado || "ACTIVO"} • Condición: ${res.condicion || "HABIDO"}`,
          });
        } else {
          toast.success(`RENIEC: ${res.nombreRazonSocial}`);
        }
      } else {
        toast.error(res.error || "No se encontraron datos para el documento ingresado.");
      }
    } catch (err) {
      toast.error("Error al consultar el documento.");
    } finally {
      setIsSearchingApi(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!numDoc.trim() || !nombre.trim()) {
      toast.error("El número de documento y nombre son obligatorios");
      return;
    }

    const payload: ClientData = {
      id: clientToEdit?.id || Date.now().toString(),
      tipoDoc,
      numDoc: numDoc.trim(),
      nombre: nombre.trim(),
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      categoria,
      puntos: parseInt(puntos) || 0,
      totalCompras: clientToEdit?.totalCompras || 0,
      ultimoConsumo: clientToEdit?.ultimoConsumo || "15/08/2026",
    };

    onSave(payload);
    toast.success(clientToEdit ? "Cliente actualizado exitosamente" : "Nuevo cliente registrado exitosamente");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <User className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              {clientToEdit ? "Editar Ficha de Cliente" : "Nuevo Cliente & Fidelización"}
            </h3>
            <p className="text-xs text-slate-400">
              Consulta en línea RENIEC / SUNAT y programa de puntos
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Document Type and Number with API Button */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Tipo & Número de Documento *
            </label>
            <div className="flex gap-2">
              <div className="w-32">
                <Select value={tipoDoc} onValueChange={(val: any) => setTipoDoc(val)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950/80 border-slate-800 text-xs font-bold text-slate-200 focus:ring-1 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="DNI" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      DNI (8 dígitos)
                    </SelectItem>
                    <SelectItem value="RUC" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      RUC (11 dígitos)
                    </SelectItem>
                    <SelectItem value="CE" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      Carnet Extr. (CE)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={numDoc}
                  onChange={(e) => setNumDoc(e.target.value)}
                  placeholder={tipoDoc === "RUC" ? "20601234567" : "45892144"}
                  className="w-full h-10 px-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="button"
                onClick={handleQueryDocument}
                disabled={isSearchingApi}
                className="h-10 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                {isSearchingApi ? (
                  <Sparkles className="size-3.5 animate-spin" />
                ) : (
                  <Search className="size-3.5" />
                )}
                <span>Consultar</span>
              </button>
            </div>
          </div>

          {/* Full Name / Razón Social */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Nombre Completo / Razón Social *
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez García o Inversiones Retail SAC"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Contact Details (Phone & Email) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Teléfono / WhatsApp
              </label>
              <div className="relative">
                <Phone className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="987 654 321"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@gmail.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Dirección Fiscal / Domicilio
            </label>
            <div className="relative">
              <MapPin className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Av. Principal 123 - Lima"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Loyalty Category & Initial Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Categoría de Cliente
              </label>
              <Select value={categoria} onValueChange={(val: any) => setCategoria(val)}>
                <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem value="Estándar" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Estándar
                  </SelectItem>
                  <SelectItem value="VIP / Frecuente" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-bold text-amber-400">
                    VIP / Frecuente
                  </SelectItem>
                  <SelectItem value="Mayorista" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-bold text-blue-400">
                    Mayorista
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                <span>Puntos Acumulados</span>
                <span className="text-[10px] text-amber-400 font-mono">1 punto x S/ 10</span>
              </label>
              <div className="relative">
                <Award className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
                <input
                  type="number"
                  value={puntos}
                  onChange={(e) => setPuntos(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
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
              <CheckCircle2 className="size-4" /> {clientToEdit ? "Guardar Cambios" : "Registrar Cliente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
