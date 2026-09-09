"use client";

interface PosTabProps {
  limiteGaveta: string;
  onLimiteGavetaChange: (v: string) => void;
  inactivityTimeout: string;
  onInactivityTimeoutChange: (v: string) => void;
  autoPrintTicket: boolean;
  onAutoPrintTicketChange: (v: boolean) => void;
  beepScanner: boolean;
  onBeepScannerChange: (v: boolean) => void;
}

export function PosTab({
  limiteGaveta,
  onLimiteGavetaChange,
  inactivityTimeout,
  onInactivityTimeoutChange,
  autoPrintTicket,
  onAutoPrintTicketChange,
  beepScanner,
  onBeepScannerChange,
}: PosTabProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
      <div className="pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white tracking-tight">Reglas Operativas de Caja & POS</h3>
        <p className="text-xs text-slate-400">Límites de efectivo en gaveta física, timeouts de seguridad y hardware.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Límite de Efectivo en Gaveta para Alerta (S/)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
            <input
              type="number"
              value={limiteGaveta}
              onChange={(e) => onLimiteGavetaChange(e.target.value)}
              placeholder="1200"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Al sobrepasar este saldo, el sistema sugerirá un retiro preventivo a bóveda.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Bloqueo Automático por Inactividad (Minutos)
          </label>
          <input
            type="number"
            value={inactivityTimeout}
            onChange={(e) => onInactivityTimeoutChange(e.target.value)}
            placeholder="15"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            La terminal solicitará el PIN del cajero tras este tiempo sin actividad.
          </span>
        </div>

        {/* Checkboxes */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Impresión Automática de Ticket</span>
            <span className="text-[11px] text-slate-400">Imprimir en papel térmico de 80mm inmediatamente al cobrar.</span>
          </div>
          <input
            type="checkbox"
            checked={autoPrintTicket}
            onChange={(e) => onAutoPrintTicketChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
          />
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-white block">Sonido de Confirmación de Escáner</span>
            <span className="text-[11px] text-slate-400">Emitir beep auditivo al leer código de barras en el POS.</span>
          </div>
          <input
            type="checkbox"
            checked={beepScanner}
            onChange={(e) => onBeepScannerChange(e.target.checked)}
            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}
