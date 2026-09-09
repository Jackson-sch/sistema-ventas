"use client";

import {
  Settings,
  Building2,
  Receipt,
  Award,
  Database,
  Save,
  Printer,
} from "lucide-react";
import { Hash } from "lucide-react";

export type ConfigTab = "empresa" | "sunat" | "series" | "pos" | "puntos" | "database";

interface ConfigPageHeaderProps {
  activeTab: ConfigTab;
  onTabChange: (tab: ConfigTab) => void;
  onSave: () => void;
}

const TABS: { key: ConfigTab; label: string; icon: React.ReactNode }[] = [
  { key: "empresa", label: "Datos de la Empresa", icon: <Building2 className="size-4" /> },
  { key: "sunat", label: "Facturación SUNAT", icon: <Receipt className="size-4" /> },
  { key: "series", label: "Series & Correlativos", icon: <Hash className="size-4" /> },
  { key: "pos", label: "Políticas POS & Caja", icon: <Printer className="size-4" /> },
  { key: "puntos", label: "Programa de Puntos", icon: <Award className="size-4" /> },
  { key: "database", label: "Base de Datos & Respaldo", icon: <Database className="size-4" /> },
];

export function ConfigPageHeader({ activeTab, onTabChange, onSave }: ConfigPageHeaderProps) {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Settings className="size-6 text-blue-400" /> Configuración de Empresa & Parámetros Fiscales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Identidad tributaria SUNAT, credenciales SOL, políticas de caja y programa de fidelización
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onSave}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Save className="size-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </>
  );
}
