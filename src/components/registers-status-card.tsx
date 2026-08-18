import { Monitor, User, Clock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface RegisterStatus {
  id: string;
  name: string;
  type: "Física" | "Autoservicio" | "Rápida";
  cashier: string;
  status: "cobrando" | "libre" | "arqueo";
  openedAt: string;
  totalCollected: number;
  ticketCount: number;
}

const FALLBACK_REGISTERS: RegisterStatus[] = [
  { id: "1", name: "Caja 01 - Principal", type: "Física", cashier: "Carlos Alarcón", status: "cobrando", openedAt: "08:00 AM", totalCollected: 12450.00, ticketCount: 642 },
  { id: "2", name: "Caja 02 - Rápida", type: "Rápida", cashier: "María Gómez", status: "libre", openedAt: "08:15 AM", totalCollected: 9820.00, ticketCount: 512 },
  { id: "3", name: "Caja 03 - Autoservicio", type: "Autoservicio", cashier: "Terminal Auto 01", status: "cobrando", openedAt: "07:30 AM", totalCollected: 6180.00, ticketCount: 328 },
];

export function RegistersStatusCard({ data }: { data?: RegisterStatus[] }) {
  const REGISTERS = data && data.length > 0 ? data : FALLBACK_REGISTERS;
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Monitor className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Monitor de Cajas en Vivo</h3>
              <p className="text-[11px] text-slate-400">Sucursal Central — 3 Cajas operativas</p>
            </div>
          </div>
          <Link href="/pos" className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1">
            Entrar a Caja <ArrowRight className="size-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {REGISTERS.map((reg) => (
            <div
              key={reg.id}
              className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/90 hover:border-blue-500/40 transition-colors flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white">{reg.name}</span>
                {reg.status === "cobrando" && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Cobrando
                  </span>
                )}
                {reg.status === "libre" && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50">
                    <CheckCircle2 className="size-2.5" /> Disponible
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="flex items-center gap-1 text-[11px]">
                    <User className="size-3 text-slate-500" /> {reg.cashier}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                    <Clock className="size-2.5" /> {reg.openedAt}
                  </span>
                </div>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-[11px] text-slate-400">Recaudado:</span>
                  <span className="font-mono font-extrabold text-white text-sm">
                    {formatCurrency(reg.totalCollected)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>{reg.ticketCount} transacciones</span>
                <span className="text-blue-400 hover:underline cursor-pointer">Arqueo</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
