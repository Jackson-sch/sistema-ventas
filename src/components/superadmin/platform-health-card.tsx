"use client";

import {
  Server,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Wifi,
  Layers,
  Sparkles,
} from "lucide-react";
import { PlatformHealth } from "@/actions/superadmin-actions";

interface PlatformHealthCardProps {
  health: PlatformHealth;
}

export function PlatformHealthCard({ health }: PlatformHealthCardProps) {
  return (
    <div className="p-5 rounded-3xl bg-[hsl(224,71%,4%)] border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
            <Server className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight">
              Telemetría e Infraestructura Global
            </h3>
            <p className="text-[11px] text-slate-400">Estado de servidores y microservicios en vivo</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span> Todos los sistemas operativos
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SUNAT OSE Node */}
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">SUNAT SEE-SOL / OSE</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold">
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
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">PostgreSQL (Supabase)</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 text-[10px] font-bold">
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
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">Terminales POS Activos</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 text-[10px] font-bold">
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
        <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold">Sync Workers Offline</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-400 text-[10px] font-bold">
              ACTIVOS
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-black text-purple-400 font-mono">{health.backgroundSyncWorkers}</span>
            <span className="text-[10px] text-slate-500 font-mono">Hilos paralelos</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: "100%" }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
