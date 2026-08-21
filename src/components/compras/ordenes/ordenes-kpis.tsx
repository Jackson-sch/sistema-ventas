"use client";

import { ShoppingCart, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PurchaseOrderRecord } from "@/actions/purchase-order-actions";

interface OrdenesKpisProps {
  orders: PurchaseOrderRecord[];
}

export function OrdenesKpis({ orders }: OrdenesKpisProps) {
  const totalTransito = orders
    .filter((o) => o.estado === "ENVIADA_PROVEEDOR" || o.estado === "RECEPCION_PARCIAL")
    .reduce((acc, o) => acc + (o.total || 0), 0);

  const pendientesRecepcion = orders.filter(
    (o) => o.estado === "ENVIADA_PROVEEDOR" || o.estado === "RECEPCION_PARCIAL"
  ).length;

  const recibidasCompletas = orders.filter((o) => o.estado === "RECEPCIONADA_TOTAL").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
      {/* 1. Total Órdenes */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Total Órdenes Emitidas</div>
          <div className="text-2xl font-mono font-extrabold text-white mt-1">
            {orders.length} <span className="text-xs text-slate-500 font-sans font-normal">pedidos</span>
          </div>
          <div className="text-[10px] text-amber-400 font-mono mt-0.5">Control de abastecimiento</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <ShoppingCart className="size-5" />
        </div>
      </div>

      {/* 2. Monto en Tránsito */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Monto en Tránsito</div>
          <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
            {formatCurrency(totalTransito)}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Pendiente de ingreso</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
          <TrendingUp className="size-5" />
        </div>
      </div>

      {/* 3. Pendientes de Recepción */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Pendientes en Muelle</div>
          <div className="text-2xl font-mono font-extrabold text-blue-400 mt-1">
            {pendientesRecepcion} <span className="text-xs text-slate-500 font-sans font-normal">por recibir</span>
          </div>
          <div className="text-[10px] text-blue-400/80 font-mono mt-0.5">Esperando descarga</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <Clock className="size-5" />
        </div>
      </div>

      {/* 4. Órdenes Completadas */}
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
        <div>
          <div className="text-[11px] font-semibold uppercase text-slate-400">Recepción 100% Completa</div>
          <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
            {recibidasCompletas} <span className="text-xs text-slate-500 font-sans font-normal">órdenes</span>
          </div>
          <div className="text-[10px] text-emerald-400/80 font-mono mt-0.5">Ingresadas al Kardex</div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 className="size-5" />
        </div>
      </div>
    </div>
  );
}
