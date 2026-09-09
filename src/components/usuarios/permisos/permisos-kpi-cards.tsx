"use client";

import {
  Shield,
  CheckCircle2,
  Users2,
  Layers,
} from "lucide-react";

interface PermisosKpiCardsProps {
  totalPermissionsCount: number;
  criticalPermissionsCount: number;
  rolesCount: number;
  categoriesCount: number;
}

export function PermisosKpiCards({
  totalPermissionsCount,
  criticalPermissionsCount,
  rolesCount,
  categoriesCount,
}: PermisosKpiCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            PRIVILEGIOS DEFINIDOS
          </span>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {totalPermissionsCount} Acciones
          </div>            <span className="text-[11px] text-slate-500">Mapeados en {categoriesCount} categorías</span>
        </div>
        <div className="size-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
          <Layers className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            ROLES CORPORATIVOS
          </span>
          <div className="text-2xl font-black text-indigo-400 font-mono mt-1">
            {rolesCount} Perfiles
          </div>
          <span className="text-[11px] text-slate-500">Cajero, Supervisor, Almacén, Admin</span>
        </div>
        <div className="size-11 rounded-2xl bg-indigo-950/60 border border-indigo-800/50 flex items-center justify-center text-indigo-400">
          <Users2 className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            ACCIONES CRÍTICAS
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {criticalPermissionsCount} Protegidas
          </div>
          <span className="text-[11px] text-slate-500">Bóveda, Costos, SUNAT y SIRE</span>
        </div>
        <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
          <Shield className="size-5" />
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            ESTADO DE POLÍTICAS
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            100% Blindado
          </div>
          <span className="text-[11px] text-slate-500">Bloqueo activo por RouteGuard</span>
        </div>
        <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
          <CheckCircle2 className="size-5" />
        </div>
      </div>
    </div>
  );
}
