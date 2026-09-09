"use client";

import {
  Shield,
  Save,
  RotateCcw,
} from "lucide-react";

interface PermisosStickyBarProps {
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function PermisosStickyBar({
  isSaving,
  onSave,
  onReset,
}: PermisosStickyBarProps) {
  return (
    <div className="sticky bottom-4 z-20 flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700 shadow-2xl">
      <div className="flex items-center gap-2 text-xs text-slate-300">
        <Shield className="size-4 text-indigo-400" />
        <span>Los cambios se replican en el guardián de rutas y en las sesiones activas.</span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-950 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          Descartar Cambios
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Save className="size-4" />
          {isSaving ? "Guardando..." : "Guardar & Aplicar Permisos"}
        </button>
      </div>
    </div>
  );
}
