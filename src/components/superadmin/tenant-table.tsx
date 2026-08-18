"use client";

import { useState } from "react";
import {
  Building2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  LogIn,
  Store,
  Receipt,
  Mail,
  MoreVertical,
  Sliders,
  DollarSign,
  Crown,
  Eye,
  Filter,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { TenantSummary, toggleTenantStatusAction } from "@/actions/superadmin-actions";

interface TenantTableProps {
  tenants: TenantSummary[];
  onOpenNewModal: () => void;
}

export function TenantTable({ tenants, onOpenNewModal }: TenantTableProps) {
  const [tenantList, setTenantList] = useState<TenantSummary[]>(tenants);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = tenantList.filter((t) => {
    const matchesSearch =
      t.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ruc.includes(searchTerm) ||
      t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlan = filterPlan === "all" || t.plan === filterPlan;
    const matchesStatus = filterStatus === "all" || t.estado === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const handleToggleStatus = async (tenant: TenantSummary) => {
    const nextStatus = tenant.estado === "activo" ? "suspendido" : "activo";
    try {
      const res = await toggleTenantStatusAction(tenant.id, nextStatus);
      if (res.success) {
        setTenantList((prev) =>
          prev.map((t) => (t.id === tenant.id ? { ...t, estado: nextStatus } : t))
        );
        toast.success(
          `Empresa ${tenant.nombreComercial} ${nextStatus === "activo" ? "activada" : "suspendida"}.`
        );
      } else {
        toast.error("No se pudo actualizar el estado.");
      }
    } catch {
      toast.error("Error al cambiar estado.");
    }
  };

  const handleImpersonate = (tenant: TenantSummary) => {
    toast.success(`Iniciando sesión de soporte como administrador de: ${tenant.nombreComercial}`, {
      description: "Modo Impersonation activo. Redirigiendo a terminal...",
    });
    setTimeout(() => {
      window.location.href = "/pos";
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[hsl(224,71%,4%)] border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por RUC, empresa, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {/* Plan Filter */}
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todos los Planes</option>
            <option value="starter">Starter ($49)</option>
            <option value="pro">Pro ($149)</option>
            <option value="enterprise">Enterprise ($299)</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="suspendido">Suspendidos</option>
          </select>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-3xl border border-slate-800 bg-[hsl(224,71%,4%)] overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Empresa / Razón Social</th>
              <th className="py-3.5 px-4">Plan & MRR</th>
              <th className="py-3.5 px-4 text-center">Infraestructura</th>
              <th className="py-3.5 px-4 text-right">CPEs Emitidos (Mes)</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-right">Acciones de Soporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filtered.map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                {/* Company Name & RUC */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                      <Building2 className="size-4" />
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-sm flex items-center gap-2">
                        {t.nombreComercial}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.razonSocial}</div>
                      <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                        <span>RUC: {t.ruc}</span>
                        <span>•</span>
                        <span className="text-slate-400">{t.adminEmail}</span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* Subscription Plan & MRR */}
                <td className="py-3.5 px-4">
                  <div className="space-y-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                        t.plan === "enterprise"
                          ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                          : t.plan === "pro"
                          ? "bg-blue-950/80 text-blue-400 border-blue-800/60"
                          : "bg-slate-900 text-slate-400 border-slate-800"
                      }`}
                    >
                      {t.plan === "enterprise" && <Crown className="size-3" />}
                      {t.plan}
                    </span>
                    <div className="text-xs font-mono font-bold text-white">
                      ${t.mrr} <span className="text-[10px] text-slate-500 font-normal">USD/mes</span>
                    </div>
                  </div>
                </td>

                {/* Infrastructure */}
                <td className="py-3.5 px-4 text-center font-mono">
                  <div className="font-bold text-white">{t.sucursalesCount} Sucursales</div>
                  <span className="text-[10px] text-slate-500">{t.cajasCount} Cajas POS</span>
                </td>

                {/* CPEs Issued */}
                <td className="py-3.5 px-4 text-right font-mono">
                  <div className="font-black text-white text-sm">
                    {t.comprobantesMes.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans">Comprobantes</span>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 text-center">
                  {t.estado === "activo" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-400 text-[10px] font-bold">
                      <Lock className="size-3" /> Suspendido
                    </span>
                  )}
                </td>

                {/* Actions */}
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleImpersonate(t)}
                      className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                      title="Ingresar a la consola del cliente (Modo Soporte)"
                    >
                      <LogIn className="size-3.5" /> Acceder
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleStatus(t)}
                      className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                        t.estado === "activo"
                          ? "border-rose-900/60 bg-rose-950/40 text-rose-400 hover:bg-rose-900/60"
                          : "border-emerald-900/60 bg-emerald-950/40 text-emerald-400 hover:bg-emerald-900/60"
                      }`}
                      title={t.estado === "activo" ? "Suspender cuenta" : "Reactivar cuenta"}
                    >
                      {t.estado === "activo" ? <Lock className="size-3.5" /> : <Unlock className="size-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
