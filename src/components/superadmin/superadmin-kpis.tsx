"use client";

import {
  Building2,
  DollarSign,
  Receipt,
  TrendingUp,
  Activity,
  Server,
  Zap,
} from "lucide-react";

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
      <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-xl space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>Empresas (Tenants)</span>
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Building2 className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-white font-mono tracking-tight">{summary.activeTenants}</div>
          <span className="text-xs text-slate-500 font-medium">de {summary.totalTenants} registradas</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold pt-0.5">
          <TrendingUp className="size-3.5" />
          <span>+{summary.growthPercentage}% este mes</span>
        </div>
      </div>

      {/* Monthly Recurring Revenue */}
      <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-xl space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>MRR Plataforma</span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <DollarSign className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
            ${summary.totalMrrUsd.toLocaleString()} <span className="text-xs font-semibold text-slate-400">USD/mes</span>
          </div>
        </div>
        <div className="text-xs text-slate-400 font-medium font-mono pt-0.5">
          ≈ S/ {(summary.totalMrrUsd * 3.75).toLocaleString("es-PE", { minimumFractionDigits: 2 })} PEN
        </div>
      </div>

      {/* CPEs Issued Network-Wide */}
      <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-xl space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>CPEs Procesados (Mes)</span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Receipt className="size-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-black text-purple-400 font-mono tracking-tight">
            {summary.totalComprobantesMes.toLocaleString()}
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/80 text-purple-300 font-mono font-bold border border-purple-800/40">
            UBL 2.1
          </span>
        </div>
        <div className="text-xs text-slate-400 font-medium pt-0.5">
          Boletas, Facturas y Guías en la red
        </div>
      </div>

      {/* System Uptime & Latency */}
      <div className="p-4.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all shadow-xl space-y-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span>Salud de Plataforma</span>
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Activity className="size-4" />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
            {health.uptimePercentage}%
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span> Online
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono pt-0.5">
          <span>SUNAT: <strong className="text-slate-300">{health.sunatLatencyMs}ms</strong></span>
          <span>•</span>
          <span>DB: <strong className="text-slate-300">{health.databaseLatencyMs}ms</strong></span>
        </div>
      </div>
    </div>
  );
}
