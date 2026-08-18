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
} from "lucide-react";
import { toast } from "sonner";
import { lookupIdentityAction } from "@/actions/identity-lookup";
import { createTenantAction, CreateTenantInput, TenantSummary } from "@/actions/superadmin-actions";

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
        toast.success(`¡Empresa ${res.tenant.nombreComercial} aprovisionada exitosamente!`, {
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
      <div className="w-full max-w-xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Building2 className="size-5" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
                SaaS Multi-Tenant
              </span>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Aprovisionar Nueva Empresa / Tenant
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* RUC Lookup Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">RUC de la Empresa (11 dígitos):</label>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={11}
                value={ruc}
                onChange={(e) => setRuc(e.target.value.replace(/\D/g, ""))}
                placeholder="Ej. 20608945123"
                className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleLookupRuc}
                disabled={isLookingUp || ruc.length !== 11}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Search className="size-3.5" />
                {isLookingUp ? "Consultando..." : "SUNAT"}
              </button>
            </div>
          </div>

          {/* Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Razón Social:</label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Razón Social SUNAT"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400">Nombre Comercial (Marca):</label>
              <input
                type="text"
                value={nombreComercial}
                onChange={(e) => setNombreComercial(e.target.value)}
                placeholder="Ej. Supermercados Nova"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white font-bold"
              />
            </div>
          </div>

          {/* Subscription Plan Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Plan de Suscripción SaaS:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPlan("starter")}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                  plan === "starter"
                    ? "border-slate-500 bg-slate-800/40 text-white"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-[10px] font-bold uppercase">Starter</div>
                <div className="text-sm font-black font-mono">$49/m</div>
                <div className="text-[9px] text-slate-500">1 Tienda • 2 Cajas</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan("pro")}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                  plan === "pro"
                    ? "border-blue-500 bg-blue-950/40 text-blue-300 shadow-md shadow-blue-500/20"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-blue-400">Pro (Recomendado)</div>
                <div className="text-sm font-black font-mono text-blue-300">$149/m</div>
                <div className="text-[9px] text-blue-400/80">3 Tiendas • 6 Cajas</div>
              </button>

              <button
                type="button"
                onClick={() => setPlan("enterprise")}
                className={`p-3 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
                  plan === "enterprise"
                    ? "border-amber-500 bg-amber-950/40 text-amber-300 shadow-md shadow-amber-500/20"
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-[10px] font-bold uppercase text-amber-400">Enterprise</div>
                <div className="text-sm font-black font-mono text-amber-300">$299/m</div>
                <div className="text-[9px] text-amber-400/80">Ilimitado • GRE • API</div>
              </button>
            </div>
          </div>

          {/* Admin User Info */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
            <span className="font-bold text-slate-300">Usuario Administrador Inicial:</span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">Email de Acceso:</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@empresa.pe"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block">Nombre del Administrador:</label>
                <input
                  type="text"
                  value={adminNombre}
                  onChange={(e) => setAdminNombre(e.target.value)}
                  placeholder="Ej. Carlos Alarcón"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-400">Dirección Sede Principal:</label>
            <input
              type="text"
              value={direccionPrincipal}
              onChange={(e) => setDireccionPrincipal(e.target.value)}
              placeholder="Av. Javier Prado Este 4200, Lima"
              className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Aprovisionando Tenant..." : "Aprovisionar y Crear Tenant"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
