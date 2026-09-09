"use client";

import { Database, Download } from "lucide-react";
import { toast } from "sonner";

export function DatabaseTab() {
  const handleGenerateBackup = () => {
    toast.success("Generando copia de seguridad de la base de datos...", {
      description: "Archivo 'novamarket_backup_20260815.sql' descargado exitosamente.",
    });
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
      <div className="pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white tracking-tight">Estado del Motor de Base de Datos</h3>
        <p className="text-xs text-slate-400">Persistencia con Drizzle ORM y Supabase PostgreSQL.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Database className="size-4 text-emerald-400" /> Supabase PostgreSQL
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-ping"></span> Conectado
            </span>
          </div>
          <div className="text-xs text-slate-400 space-y-1 font-mono text-[11px]">
            <div>Motor: PostgreSQL 16.2</div>
            <div>Latencia: 24 ms</div>
            <div>ORM: Drizzle ORM v0.45.1</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <span className="text-xs font-bold text-white block">Copia de Seguridad Manual</span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Descarga una instantánea completa de productos, ventas, clientes y kardex.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateBackup}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-white font-bold text-xs transition-colors self-start"
          >
            <Download className="size-3.5 text-blue-400" /> Descargar Backup (.SQL)
          </button>
        </div>
      </div>
    </div>
  );
}
