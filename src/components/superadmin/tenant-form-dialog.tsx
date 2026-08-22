"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  CheckCircle2,
  Search,
  Sparkles,
  Crown,
  Mail,
  User,
  MapPin,
  FileText,
  X,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { lookupIdentityAction } from "@/actions/identity-lookup";
import { createTenantAction, CreateTenantInput, TenantSummary } from "@/actions/superadmin-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TenantFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTenant: TenantSummary) => void;
}

export function TenantFormDialog({
  isOpen,
  onClose,
  onSuccess,
}: TenantFormDialogProps) {
  const [ruc, setRuc] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [razonSocial, setRazonSocial] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise">("pro");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminNombre, setAdminNombre] = useState("");
  const [direccionPrincipal, setDireccionPrincipal] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLookupRuc = async () => {
    if (!ruc || ruc.trim().length !== 11) {
      toast.error("Ingrese un RUC válido de 11 dígitos.");
      return;
    }

    setIsLookingUp(true);
    try {
      const res = await lookupIdentityAction("RUC", ruc.trim());
      if (res.success && res.found) {
        setRazonSocial(res.nombreRazonSocial);
        if (!nombreComercial) {
          setNombreComercial(res.nombreRazonSocial.split(" ")[0] + " Market");
        }
        if (res.direccionFiscal) {
          setDireccionPrincipal(res.direccionFiscal);
        }
        toast.success("Datos de empresa obtenidos de SUNAT.", {
          description: `${res.nombreRazonSocial} (${res.estado || "ACTIVO"})`,
        });
      } else {
        toast.error(res.error || "No se encontraron datos para el RUC ingresado.");
      }
    } catch {
      toast.error("Error al consultar RUC en línea.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruc || !nombreComercial || !adminEmail) {
      toast.error("Complete los campos obligatorios (RUC, Nombre Comercial y Email Admin).");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTenantInput = {
        ruc: ruc.trim(),
        nombreComercial: nombreComercial.trim(),
        razonSocial: razonSocial.trim() || nombreComercial.trim(),
        plan,
        adminEmail: adminEmail.trim(),
        adminNombre: adminNombre.trim() || "Administrador",
        direccionPrincipal: direccionPrincipal.trim(),
      };

      const res = await createTenantAction(payload);
      if (res.success && res.tenant) {
        toast.success(`Empresa ${res.tenant.nombreComercial} aprovisionada exitosamente.`, {
          description: `Plan: ${plan.toUpperCase()} • Sucursal y usuario admin creados.`,
        });
        onSuccess(res.tenant);
        onClose();
      } else {
        toast.error(res.error || "No se pudo aprovisionar el tenant.");
      }
    } catch {
      toast.error("Error al crear nueva empresa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto relative">
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
          <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Aprovisionar Nueva Empresa (Tenant)
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/50">
                Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Crea un espacio aislado con esquema fiscal, catálogo y usuario administrador
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: RUC & Razón Social */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">
                RUC de la Empresa (SUNAT) *
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    maxLength={11}
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                    placeholder="20601234567"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLookupRuc}
                  disabled={isLookingUp || ruc.length !== 11}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Search className="size-3.5" />
                  {isLookingUp ? "Consultando..." : "Consultar SUNAT"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  value={nombreComercial}
                  onChange={(e) => setNombreComercial(e.target.value)}
                  placeholder="Ej: NovaMarket Surco"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Razón Social Fiscal
                </label>
                <input
                  type="text"
                  value={razonSocial}
                  onChange={(e) => setRazonSocial(e.target.value)}
                  placeholder="Ej: SUPERMERCADOS PERÚ S.A.C."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Plan SaaS */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <label className="block text-[11px] font-medium text-slate-300">
              Plan SaaS de Suscripción
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "starter", name: "Starter", price: "$49/mes", desc: "1 Tienda / 2 Cajas" },
                { id: "pro", name: "Pro", price: "$149/mes", desc: "5 Tiendas / 10 Cajas" },
                { id: "enterprise", name: "Enterprise", price: "$299/mes", desc: "Ilimitado + API" },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setPlan(p.id as any)}
                  className={`p-3 rounded-xl border text-center cursor-pointer transition-all ${
                    plan === p.id
                      ? "bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/10 ring-1 ring-amber-500/30"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className={`text-xs font-bold ${plan === p.id ? "text-amber-400" : "text-white"}`}>
                    {p.name}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 font-bold">{p.price}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Administrador Inicial */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Email Administrador *
                </label>
                <div className="relative">
                  <Mail className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="gerencia@empresa.pe"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                  Nombre del Administrador
                </label>
                <div className="relative">
                  <User className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={adminNombre}
                    onChange={(e) => setAdminNombre(e.target.value)}
                    placeholder="Ej: Roberto Ramos"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                Dirección Sede Principal
              </label>
              <div className="relative">
                <MapPin className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={direccionPrincipal}
                  onChange={(e) => setDireccionPrincipal(e.target.value)}
                  placeholder="Av. Principal 123 - Lima"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-3.5" />
              {isSubmitting ? "Aprovisionando..." : "Aprovisionar Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
