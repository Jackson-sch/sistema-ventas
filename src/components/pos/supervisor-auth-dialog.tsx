"use client";

import { useState } from "react";
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, KeyRound } from "lucide-react";
import { toast } from "sonner";

interface SupervisorAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  actionDetails?: string;
  onAuthorized: (supervisorName: string, reason: string) => void;
}

export function SupervisorAuthDialog({
  isOpen,
  onClose,
  actionTitle,
  actionDetails,
  onAuthorized,
}: SupervisorAuthDialogProps) {
  const [pin, setPin] = useState("");
  const [reason, setReason] = useState("Anulación solicitada por cliente antes de pagar");
  const [supervisorUser, setSupervisorUser] = useState("admin_central");

  if (!isOpen) return null;

  const handleNumClick = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
    }
  };

  const handleClear = () => {
    setPin("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin !== "1234" && pin !== "9999") {
      toast.error("PIN de supervisor inválido", {
        description: "El PIN ingresado no coincide o no tiene permisos suficientes.",
      });
      setPin("");
      return;
    }

    onAuthorized(supervisorUser === "admin_central" ? "Admin Central (Supervisor)" : "Jefe de Turno", reason);
    toast.success("¡Autorización de Supervisor Aprobada!", {
      description: `Acción autorizada: ${actionTitle}`,
    });
    setPin("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Autorización Requerida</h3>
            <p className="text-xs text-rose-400 font-semibold">{actionTitle}</p>
          </div>
        </div>

        {actionDetails && (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
            {actionDetails}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Motivo de Autorización
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="Anulación solicitada por cliente antes de pagar">Cliente desistió de compra</option>
              <option value="Error de digitación o escaneo incorrecto">Error de escaneo / Ítem repetido</option>
              <option value="Producto dañado o defectuoso">Producto defectuoso</option>
              <option value="Descuento especial por supervisor">Descuento especial / Cortesía</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5 text-center">
              PIN de Supervisor (4-6 dígitos)
            </label>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono font-bold text-lg ${
                    pin.length > idx
                      ? "border-rose-500 bg-rose-950/40 text-rose-300"
                      : "border-slate-800 bg-slate-950/80 text-slate-600"
                  }`}
                >
                  {pin.length > idx ? "•" : ""}
                </div>
              ))}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "OK"].map((key) => {
                if (key === "C") {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={handleClear}
                      className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      C
                    </button>
                  );
                }
                if (key === "OK") {
                  return (
                    <button
                      key={key}
                      type="submit"
                      className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-md shadow-rose-600/30 transition-all"
                    >
                      OK
                    </button>
                  );
                }
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleNumClick(key)}
                    className="py-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-sm text-slate-200 hover:bg-slate-800 hover:text-white transition-colors active:scale-95"
                  >
                    {key}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-500 text-center mt-2">
              (PIN demo: <strong className="text-slate-400 font-mono">1234</strong>)
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
