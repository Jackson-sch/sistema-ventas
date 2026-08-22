"use client";

import { useState } from "react";
import {
  FileX2,
  AlertTriangle,
  CheckCircle2,
  X,
  Clock,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VoidedDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (comprobante: string, motivo: string) => Promise<void>;
}

const COMMON_SUNAT_REASONS = [
  "Error en RUC o Razón Social del cliente",
  "Error en descripción, cantidad o precios de los productos",
  "Operación comercial cancelada / Devolución total de mercadería",
  "Duplicidad en la emisión del comprobante",
  "Error en forma de pago / Condición al crédito o contado",
  "Otro motivo tributario justificado",
];

export function VoidedDocumentDialog({
  isOpen,
  onClose,
  onSubmit,
}: VoidedDocumentDialogProps) {
  const [comprobante, setComprobante] = useState("");
  const [selectedReason, setSelectedReason] = useState(COMMON_SUNAT_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comprobante.trim()) {
      toast.error("Ingrese el número de comprobante a anular.");
      return;
    }

    const finalReason =
      selectedReason === "Otro motivo tributario justificado"
        ? customReason.trim()
        : selectedReason;

    if (!finalReason) {
      toast.error("Ingrese el motivo de anulación para SUNAT.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(comprobante.trim().toUpperCase(), finalReason);
      onClose();
    } catch {
      toast.error("Error al transmitir Comunicación de Bajas.");
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
            <div className="size-9 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <FileX2 className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Comunicación de Bajas (RA)
                <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-400 text-[10px] font-mono">
                  Baja Fiscal
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">Anulación irreversible de Facturas y Notas asociadas</p>
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
          {/* Document Number */}
          <div className="space-y-1">
            <label className="text-slate-300 font-bold flex items-center gap-1.5">
              <FileText className="size-3.5 text-rose-400" /> N° de Comprobante a Dar de Baja:
            </label>
            <input
              type="text"
              value={comprobante}
              onChange={(e) => setComprobante(e.target.value.toUpperCase())}
              placeholder="Ej. F001-00000124"
              className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
              required
            />
            <span className="text-[10px] text-slate-500 block">
              Formato: Serie de 4 caracteres y correlativo de hasta 8 dígitos (ej: F001-00000045)
            </span>
          </div>

          {/* Void Reason Selector */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-bold">
              Motivo Oficial de Anulación SUNAT:
            </label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white focus:ring-1 focus:ring-rose-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                {COMMON_SUNAT_REASONS.map((r, idx) => (
                  <SelectItem
                    key={idx}
                    value={r}
                    className="text-xs cursor-pointer focus:bg-rose-600/20 focus:text-rose-300"
                  >
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom reason input if "Otro motivo" selected */}
          {selectedReason === "Otro motivo tributario justificado" && (
            <div className="space-y-1">
              <label className="text-slate-300 font-bold">Describir Motivo de Baja:</label>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Especifique la justificación técnica/fiscal..."
                className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                required
              />
            </div>
          )}

          {/* Tax Warning Card */}
          <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-800/50 space-y-1.5 text-slate-300">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold text-[11px] uppercase tracking-wider">
              <ShieldAlert className="size-3.5" /> Aviso Tributario Obligatorio
            </div>
            <p className="text-[11px] leading-relaxed text-slate-400">
              La Comunicación de Bajas (RA) solo aplica a comprobantes electrónicos que <strong>no hayan sido entregados físicamente o que hayan sido rechazados</strong> dentro de los 7 días posteriores a su emisión.
            </p>
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
              className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Transmitiendo a SUNAT..." : "Dar de Baja en SUNAT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
