"use client";

import {
  Building2,
  DollarSign,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Activity,
  Server,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SuperadminKpisProps {
  summary: {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    totalMrrUsd: number;
    totalComprobantesMes: number;
    growthPercentage: number;
  };
  health: {
    sunatApiStatus: "operativo" | "degradado" | "caido";
    sunatLatencyMs: number;
    databaseLatencyMs: number;
    uptimePercentage: number;
  };
}

export function SuperadminKpis({ summary, health }: SuperadminKpisProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Active Tenants */}
      <div className="p-4 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-1.5 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>Empresas (Tenants)</span>
          <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Building2 className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-white font-mono">{summary.activeTenants}</div>
          <span className="text-xs text-slate-500 font-medium">de {summary.totalTenants} registradas</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-1">
          <TrendingUp className="size-3.5" />
          <span>+{summary.growthPercentage}% este mes</span>
        </div>
      </div>

      {/* Monthly Recurring Revenue */}
      <div className="p-4 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-1.5 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>MRR Plataforma</span>
          <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-emerald-400 font-mono">
            ${summary.totalMrrUsd.toLocaleString()} <span className="text-sm font-normal text-slate-400">USD/mes</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium pt-1">
          ≈ S/ {(summary.totalMrrUsd * 3.75).toLocaleString("es-PE", { minimumFractionDigits: 2 })} PEN
        </div>
      </div>

      {/* CPEs Issued Network-Wide */}
      <div className="p-4 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-1.5 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>CPEs Procesados (Mes)</span>
          <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Receipt className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-purple-400 font-mono">
            {summary.totalComprobantesMes.toLocaleString()}
          </div>
          <span className="text-xs text-slate-500 font-medium">UBL 2.1</span>
        </div>
        <div className="text-xs text-slate-400 font-medium pt-1">
          Boletas, Facturas y Guías en la red
        </div>
      </div>

      {/* System Uptime & Latency */}
      <div className="p-4 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-1.5 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider">
          <span>Salud de Plataforma</span>
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Activity className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-cyan-400 font-mono">
            {health.uptimePercentage}%
          </div>
          <span className="size-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pt-1">
          <span>SUNAT: {health.sunatLatencyMs}ms</span>
          <span>•</span>
          <span>DB: {health.databaseLatencyMs}ms</span>
        </div>
      </div>
    </div>
  );
}
