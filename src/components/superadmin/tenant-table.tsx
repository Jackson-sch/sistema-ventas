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
  DollarSign,
  Crown,
  Eye,
  Filter,
  Shield,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { TenantSummary, toggleTenantStatusAction } from "@/actions/superadmin-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por RUC, empresa, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
          {/* Plan Filter */}
          <div className="w-44">
            <Select value={filterPlan} onValueChange={(val) => setFilterPlan(val)}>
              <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200">
                <SelectValue placeholder="Todos los Planes" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Todos los Planes
                </SelectItem>
                <SelectItem value="starter" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Starter ($49)
                </SelectItem>
                <SelectItem value="pro" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Pro ($149)
                </SelectItem>
                <SelectItem value="enterprise" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Enterprise ($299)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
              <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200">
                <SelectValue placeholder="Todos los Estados" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Todos los Estados
                </SelectItem>
                <SelectItem value="activo" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                  Activos
                </SelectItem>
                <SelectItem value="suspendido" className="text-xs cursor-pointer focus:bg-rose-600/20 focus:text-rose-300">
                  Suspendidos
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No se encontraron empresas con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                  {/* Company Name & RUC */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <Building2 className="size-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
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

                  {/* Plan & MRR */}
                  <td className="py-3.5 px-4">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          t.plan === "enterprise"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800/40"
                            : t.plan === "pro"
                            ? "bg-blue-950/80 text-blue-400 border border-blue-800/40"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {t.plan}
                      </span>
                      <div className="text-xs font-mono font-bold text-emerald-400 mt-1">
                        ${t.mrr} <span className="text-[10px] text-slate-500 font-normal">USD/mes</span>
                      </div>
                    </div>
                  </td>

                  {/* Infrastructure */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="text-xs font-bold text-white font-mono">
                      {t.sucursalesCount} {t.sucursalesCount === 1 ? "Sucursal" : "Sucursales"}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {t.cajasCount} {t.cajasCount === 1 ? "Caja POS" : "Cajas POS"}
                    </div>
                  </td>

                  {/* Monthly CPEs */}
                  <td className="py-3.5 px-4 text-right font-mono">
                    <div className="font-bold text-white text-xs">
                      {t.comprobantesMes.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-500">Comprobantes</div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 text-center">
                    {t.estado === "activo" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
                        <span className="size-1.5 rounded-full bg-emerald-400"></span> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-800/50 text-rose-400 text-[10px] font-bold">
                        <span className="size-1.5 rounded-full bg-rose-400"></span> Suspendido
                      </span>
                    )}
                  </td>

                  {/* Support Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleImpersonate(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-sm shadow-blue-600/30"
                        title="Iniciar sesión de soporte como administrador"
                      >
                        <LogIn className="size-3" /> Acceder
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t)}
                        className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                          t.estado === "activo"
                            ? "bg-slate-900 border-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 hover:border-rose-800"
                            : "bg-slate-900 border-slate-800 hover:bg-emerald-950/50 text-slate-400 hover:text-emerald-400 hover:border-emerald-800"
                        }`}
                        title={t.estado === "activo" ? "Suspender cuenta" : "Reactivar cuenta"}
                      >
                        {t.estado === "activo" ? (
                          <Lock className="size-3.5" />
                        ) : (
                          <Unlock className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
