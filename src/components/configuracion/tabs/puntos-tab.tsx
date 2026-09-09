"use client";

interface PuntosTabProps {
  montoPorPunto: string;
  onMontoPorPuntoChange: (v: string) => void;
  puntosMinimosCanje: string;
  onPuntosMinimosCanjeChange: (v: string) => void;
  descuentoPorCanje: string;
  onDescuentoPorCanjeChange: (v: string) => void;
}

export function PuntosTab({
  montoPorPunto,
  onMontoPorPuntoChange,
  puntosMinimosCanje,
  onPuntosMinimosCanjeChange,
  descuentoPorCanje,
  onDescuentoPorCanjeChange,
}: PuntosTabProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
      <div className="pb-3 border-b border-slate-800">
        <h3 className="text-base font-bold text-white tracking-tight">Reglas del Programa de Fidelización</h3>
        <p className="text-xs text-slate-400">Definición de tasas de acumulación y valor monetario del canje en caja.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-amber-400">Monto de Compra por 1 Punto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
            <input
              type="number"
              value={montoPorPunto}
              onChange={(e) => onMontoPorPuntoChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white"
            />
          </div>
          <span className="text-[10px] text-slate-500 block">Ej: S/ 10.00 en compras = 1 punto acumulado</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-amber-400">Puntos Mínimos para Canje</label>
          <input
            type="number"
            value={puntosMinimosCanje}
            onChange={(e) => onPuntosMinimosCanjeChange(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white text-center"
          />
          <span className="text-[10px] text-slate-500 block">Cantidad requerida para solicitar un vale de descuento</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <label className="block text-xs font-bold text-emerald-400">Descuento Otorgado por Canje</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
            <input
              type="number"
              value={descuentoPorCanje}
              onChange={(e) => onDescuentoPorCanjeChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400"
            />
          </div>
          <span className="text-[10px] text-slate-500 block">Descuento aplicado al ticket al canjear 50 puntos</span>
        </div>
      </div>
    </div>
  );
}
