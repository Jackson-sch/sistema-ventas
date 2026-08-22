"use client";

import {
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Wifi,
  Radio,
  Layers,
  Sparkles,
} from "lucide-react";
import { PlatformHealth } from "@/actions/superadmin-actions";

interface PlatformHealthCardProps {
  health: PlatformHealth;
}

export function PlatformHealthCard({ health }: PlatformHealthCardProps) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Server className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Telemetría e Infraestructura Global
            </h3>
            <p className="text-xs text-slate-400">Estado de servicios y microservicios en vivo</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold self-start sm:self-auto">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span> Todos los sistemas operativos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SUNAT OSE Node */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">SUNAT SEE-SOL</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/30">
              {health.sunatApiStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">{health.sunatLatencyMs} ms</span>
            <span className="text-[10px] text-slate-500 font-mono">Latencia RTT</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "95%" }}></div>
          </div>
        </div>

        {/* Database Supabase */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">PostgreSQL (Supabase)</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/30">
              {health.databaseStatus.toUpperCase()}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-white font-mono">{health.databaseLatencyMs} ms</span>
            <span className="text-[10px] text-slate-500 font-mono">Pool Activo</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: "98%" }}></div>
          </div>
        </div>

        {/* Active POS Terminals */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Terminales POS</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 text-[10px] font-bold border border-blue-800/30">
              EN VIVO
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-blue-400 font-mono">{health.activeRegistersCount}</span>
            <span className="text-[10px] text-slate-500 font-mono">Cajas transmitiendo</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: "88%" }}></div>
          </div>
        </div>

        {/* Background Sync Workers */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Sync Workers</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-400 text-[10px] font-bold border border-purple-800/30">
              ACTIVOS
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-400 font-mono">{health.backgroundSyncWorkers}</span>
            <span className="text-[10px] text-slate-500 font-mono">Hilos paralelos</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "92%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
