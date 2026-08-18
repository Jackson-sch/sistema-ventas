"use client";

import { useState, useEffect } from "react";
import {
  Crown,
  Building2,
  Plus,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { SuperadminKpis } from "@/components/superadmin/superadmin-kpis";
import { PlatformHealthCard } from "@/components/superadmin/platform-health-card";
import { PlansDistributionCard } from "@/components/superadmin/plans-distribution-card";
import { TenantTable } from "@/components/superadmin/tenant-table";
import { TenantFormDialog } from "@/components/superadmin/tenant-form-dialog";
import {
  getSuperadminOverviewData,
  SuperadminOverviewData,
  TenantSummary,
} from "@/actions/superadmin-actions";

export default function SuperadminPage() {
  const [data, setData] = useState<SuperadminOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getSuperadminOverviewData();
      setData(res);
    } catch {
      toast.error("Error al cargar la consola de Superadmin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTenantCreated = (newTenant: TenantSummary) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          totalTenants: prev.summary.totalTenants + 1,
          activeTenants: prev.summary.activeTenants + 1,
          totalMrrUsd: prev.summary.totalMrrUsd + newTenant.mrr,
        },
        tenants: [newTenant, ...prev.tenants],
      };
    });
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-amber-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Consola Global de Superadmin SaaS...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/50 flex items-center gap-1">
              <Crown className="size-3" /> Consola Global de Plataforma
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="size-6 text-amber-400" /> Superadmin SaaS & Multi-Tenant
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo macro de empresas clientes, suscripciones, facturación recurrente e infraestructura
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Recargar métricas"
          >
            <RefreshCw className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsNewTenantOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" /> Aprovisionar Nueva Empresa
          </button>
        </div>
      </div>

      {/* Global SaaS KPIs */}
      <SuperadminKpis summary={data.summary} health={data.health} />

      {/* Infrastructure & Plans Distribution Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlatformHealthCard health={data.health} />
        </div>
        <div className="lg:col-span-1">
          <PlansDistributionCard distribution={data.planDistribution} />
        </div>
      </div>

      {/* Multi-Tenant Management Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-white tracking-tight">
              Empresas Clientes (Tenants)
            </h2>
            <p className="text-xs text-slate-400">
              Administración de cuentas, planes y acceso de soporte remoto
            </p>
          </div>
        </div>
        <TenantTable tenants={data.tenants} onOpenNewModal={() => setIsNewTenantOpen(true)} />
      </div>

      {/* Provisioning Dialog */}
      <TenantFormDialog
        isOpen={isNewTenantOpen}
        onClose={() => setIsNewTenantOpen(false)}
        onSuccess={handleTenantCreated}
      />
    </div>
  );
}
