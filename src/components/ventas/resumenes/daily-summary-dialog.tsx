"use client";

import { useState } from "react";
import {
  FileCheck2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  Sparkles,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface DailySummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (fecha: string) => Promise<void>;
}

export function DailySummaryDialog({
  isOpen,
  onClose,
  onSubmit,
}: DailySummaryDialogProps) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSetToday = () => {
    setFecha(new Date().toISOString().slice(0, 10));
  };

  const handleSetYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setFecha(d.toISOString().slice(0, 10));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fecha) {
      toast.error("Seleccione una fecha de referencia.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(fecha);
      onClose();
    } catch {
      toast.error("Error al procesar el resumen diario RC.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4 bg-[hsl(224,71%,4%)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Generar Resumen Diario (RC)
                <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                  UBL 2.1
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">Lote masivo de boletas y notas de crédito asociadas</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Date Selector & Presets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Calendar className="size-3.5 text-blue-400" /> Fecha de Emisión de Boletas:
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetToday}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={handleSetYesterday}
                  className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Ayer
                </button>
              </div>
            </div>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          {/* Operational Guidance Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-slate-300">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px] uppercase tracking-wider">
              <Layers className="size-3.5" /> Procesamiento Automático
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              El sistema agrupará todas las <strong>Boletas de Venta (B001, B002)</strong> y <strong>Notas de Crédito (BC01)</strong> emitidas en la fecha seleccionada, generando la firma digital con certificado tributario y transmitiéndola al OSE / SUNAT.
            </p>
            <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-amber-400">
              <Clock className="size-3 shrink-0" />
              <span>Plazo normativo SUNAT: Hasta 7 días calendario posteriores a la fecha de emisión.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Emitiendo Lote..." : "Firmar y Enviar a SUNAT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
