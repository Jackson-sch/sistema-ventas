"use client";

import { useState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  applyKardexAdjustmentAction,
  InventoryCountItem,
} from "@/actions/inventory-count-actions";

interface ConteoAdjustDialogProps {
  isOpen: boolean;
  onClose: () => void;
  codigoSesion: string;
  items: InventoryCountItem[];
  onSuccess: () => void;
}

export function ConteoAdjustDialog({
  isOpen,
  onClose,
  codigoSesion,
  items,
  onSuccess,
}: ConteoAdjustDialogProps) {
  const [motivoAjuste, setMotivoAjuste] = useState(
    "Regularización por toma física de inventario general"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const itemsConDiferencia = items.filter((i) => i.diferencia !== 0);
  const sobrantes = itemsConDiferencia.filter((i) => i.diferencia > 0);
  const faltantes = itemsConDiferencia.filter((i) => i.diferencia < 0);

  const totalSobrantesImpacto = sobrantes.reduce((acc, i) => acc + i.impactoMonetario, 0);
  const totalFaltantesImpacto = faltantes.reduce((acc, i) => acc + i.impactoMonetario, 0);
  const netoImpacto = totalSobrantesImpacto + totalFaltantesImpacto;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (itemsConDiferencia.length === 0) {
      toast.info("No hay diferencias registradas para regularizar.");
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await applyKardexAdjustmentAction({
        codigoSesion,
        motivoAjuste,
        items: itemsConDiferencia.map((i) => ({
          productoId: i.productoId,
          sku: i.sku,
          nombre: i.nombre,
          stockTeorico: i.stockTeorico,
          conteoFisico: i.conteoFisico,
          diferencia: i.diferencia,
          costoUnitario: i.costoUnitario,
        })),
      });

      if (res.success) {
        toast.success("¡Ajuste de inventario procesado en base de datos!", {
          description: res.message,
        });
        onClose();
        onSuccess();
      } else {
        toast.error(res.message || "Error al aplicar el ajuste en Kardex.");
      }
    } catch {
      toast.error("Error inesperado al aplicar el ajuste.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)]">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Regularizar Diferencias en Kardex
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Sesión: {codigoSesion} • Actualización atómica en PostgreSQL
            </p>
          </div>
        </div>

        {/* Differences Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30">
            <div className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <TrendingDown className="size-3" /> Faltantes ({faltantes.length} ítems)
            </div>
            <div className="text-base font-mono font-bold text-rose-400 mt-1">
              {formatCurrency(totalFaltantesImpacto)}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30">
            <div className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <TrendingUp className="size-3" /> Sobrantes ({sobrantes.length} ítems)
            </div>
            <div className="text-base font-mono font-bold text-emerald-400 mt-1">
              +{formatCurrency(totalSobrantesImpacto)}
            </div>
          </div>
        </div>

        {/* Impact Warning */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Impacto Neto Total:</span>
          <span
            className={`font-bold text-sm ${
              netoImpacto < 0 ? "text-rose-400" : netoImpacto > 0 ? "text-emerald-400" : "text-slate-300"
            }`}
          >
            {netoImpacto > 0 ? `+${formatCurrency(netoImpacto)}` : formatCurrency(netoImpacto)}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Motivo del Ajuste Contable
            </label>
            <textarea
              rows={2}
              value={motivoAjuste}
              onChange={(e) => setMotivoAjuste(e.target.value)}
              placeholder="Detallar justificación de la regularización..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || itemsConDiferencia.length === 0}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Procesando en BD..." : "Confirmar y Aplicar Ajuste"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
