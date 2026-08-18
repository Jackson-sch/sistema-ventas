import { TrendingUpIcon, DollarSign, Receipt, AlertTriangle, Percent, ArrowUpRight } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { formatCurrency } from "@/lib/utils"

export interface DashboardSummary {
  ventasTurno: number;
  metaVentas: number;
  tickets: number;
  ticketPromedio: number;
  stockCritico: number;
  agotadosHoy: number;
  margenBruto: number;
  gananciaNeta: number;
}

export function SectionCards({ data }: { data?: DashboardSummary }) {
  const stats: DashboardSummary = data ?? {
    ventasTurno: 28450,
    metaVentas: 25000,
    tickets: 1482,
    ticketPromedio: 19.2,
    stockCritico: 12,
    agotadosHoy: 4,
    margenBruto: 26.4,
    gananciaNeta: 7510.8,
  };
  const metaPct = stats.metaVentas > 0 ? ((stats.ventasTurno / stats.metaVentas) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 lg:px-6">
      {/* Total Sales */}
      <div className="glass-panel rounded-2xl p-5 hover:border-blue-500/60 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
              <DollarSign className="size-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Ventas del Turno</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 rounded-lg text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5">
            <TrendingUpIcon className="size-3" />
            {metaPct}%
          </Badge>
        </div>
        
        <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
          {formatCurrency(stats.ventasTurno)}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <span className="text-slate-400">Meta: {formatCurrency(stats.metaVentas)}</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
            {metaPct}% <ArrowUpRight className="size-3" />
          </span>
        </div>
      </div>

      {/* Tickets / Transactions */}
      <div className="glass-panel rounded-2xl p-5 hover:border-indigo-500/60 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <Receipt className="size-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Tickets Emitidos</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 rounded-lg text-[11px] border-blue-500/30 bg-blue-500/10 text-blue-300 font-semibold px-2 py-0.5">
            <TrendingUpIcon className="size-3" />
            +8.2%
          </Badge>
        </div>

        <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
          {stats.tickets.toLocaleString("es-PE")} <span className="text-xs font-sans text-slate-400 font-normal">comprobantes</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <span className="text-slate-400">Ticket Promedio</span>
          <span className="text-blue-400 font-mono font-semibold">{formatCurrency(stats.ticketPromedio)}</span>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="glass-panel rounded-2xl p-5 hover:border-amber-500/60 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-105 transition-transform">
              <AlertTriangle className="size-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Stock Crítico</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 rounded-lg text-[11px] border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5">
            {stats.stockCritico} Ítems
          </Badge>
        </div>

        <div className="text-3xl font-extrabold text-amber-400 tracking-tight font-mono">
          {stats.agotadosHoy} <span className="text-xs font-sans text-amber-300/80 font-normal">agotados hoy</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <span className="text-slate-400">Reposición sugerida</span>
          <span className="text-amber-400 font-semibold hover:underline cursor-pointer">Ver detalle</span>
        </div>
      </div>

      {/* Margin / Gross Profit */}
      <div className="glass-panel rounded-2xl p-5 hover:border-emerald-500/60 transition-all group">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <Percent className="size-4" />
            </div>
            <span className="text-xs font-semibold text-slate-400">Margen Bruto</span>
          </div>
          <Badge variant="outline" className="flex items-center gap-1 rounded-lg text-[11px] border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5">
            <TrendingUpIcon className="size-3" />
            +1.2%
          </Badge>
        </div>

        <div className="text-3xl font-extrabold text-white tracking-tight font-mono">
          {stats.margenBruto}% <span className="text-xs font-sans text-slate-400 font-normal">estimado</span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
          <span className="text-slate-400">Ganancia neta turno</span>
          <span className="text-emerald-400 font-mono font-semibold">{formatCurrency(stats.gananciaNeta)}</span>
        </div>
      </div>
    </div>
  )
}
