"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  itemName?: string;
}

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = "Esta acción no se puede deshacer y afectará los registros del sistema.",
  itemName,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-rose-500/30 space-y-5 my-auto">
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-slate-800">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
            <p className="text-xs text-slate-400">Confirmación requerida de seguridad</p>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3 text-xs">
          {itemName && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Elemento a eliminar:</span>
              <strong className="text-white text-sm font-semibold block mt-0.5">{itemName}</strong>
            </div>
          )}
          <p className="text-slate-400 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95"
          >
            <Trash2 className="size-3.5" /> Confirmar Eliminación
          </button>
        </div>
      </div>
    </div>
  );
}
