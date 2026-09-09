"use client";

import { useState } from "react";
import {
  Search,
  User,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  Sparkles,
  Award,
  ArrowRightLeft,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { PosClient } from "./types";
import { SplitPaymentInput } from "@/actions/pos-actions";
import { CustomerCreditAccount } from "@/actions/customer-credit-actions";
import { POS_DEFAULTS } from "@/lib/constants";

interface PosCheckoutSidebarProps {
  cartLength: number;
  total: number;
  rawSubtotal: number;
  promoSavings: number;
  pointsDiscount: number;
  subtotal: number;
  igv: number;
  puntosAcumuladosVenta: number;
  selectedPayment: "efectivo" | "tarjeta" | "yape" | "plin" | "mixto" | "credito";
  setSelectedPayment: (p: "efectivo" | "tarjeta" | "yape" | "plin" | "mixto" | "credito") => void;
  docType: "boleta" | "factura";
  setDocType: (d: "boleta" | "factura") => void;
  customerDoc: string;
  setCustomerDoc: (d: string) => void;
  customerName: string;
  setCustomerName: (n: string) => void;
  customerPoints: number;
  setCustomerPoints: (p: number) => void;
  clients: PosClient[];
  setSelectedClientId: (id: string | null) => void;
  isLookingUpClient: boolean;
  setIsLookingUpClient: (v: boolean) => void;
  lookupClient: (query?: string) => Promise<void>;
  cashReceived: string;
  setCashReceived: (v: string) => void;
  change: number;
  splitPaymentsList: SplitPaymentInput[] | null;
  activeCreditAccount: CustomerCreditAccount | null;
  setActiveCreditAccount: (a: CustomerCreditAccount | null) => void;
  isPointsRedeemActive: boolean;
  setIsPointsRedeemActive: (v: boolean) => void;
  setIsSplitPaymentOpen: (v: boolean) => void;
  isProcessingSale?: boolean;
  onCheckout: () => void;
}



export function PosCheckoutSidebar({
  cartLength,
  total,
  rawSubtotal,
  promoSavings,
  pointsDiscount,
  subtotal,
  igv,
  puntosAcumuladosVenta,
  selectedPayment,
  setSelectedPayment,
  docType,
  setDocType,
  customerDoc,
  setCustomerDoc,
  customerName,
  setCustomerName,
  customerPoints,
  setCustomerPoints,
  clients,
  setSelectedClientId,
  isLookingUpClient,
  setIsLookingUpClient,
  lookupClient,
  cashReceived,
  setCashReceived,
  change,
  splitPaymentsList,
  activeCreditAccount,
  setActiveCreditAccount,
  isPointsRedeemActive,
  setIsPointsRedeemActive,
  setIsSplitPaymentOpen,
  isProcessingSale = false,
  onCheckout,
}: PosCheckoutSidebarProps) {
  const handleSelectClient = (c: PosClient) => {
    setCustomerName(c.name);
    setCustomerDoc(c.doc);
    setCustomerPoints(c.points);
    setSelectedClientId(c.id || null);
    if (c.type === "RUC") {
      setDocType("factura");
    }
    toast.success(`Cliente seleccionado: ${c.name} (${c.points} pts)`);
  };

  const handleQuickAmount = (amt: number) => {
    setCashReceived(amt.toString());
  };

  return (
    <div className="w-full lg:w-96 flex flex-col glass-panel rounded-2xl p-5 justify-between space-y-4">
      <div className="space-y-4">
        {/* Comprobante & Cliente selector */}
        <div className="space-y-2.5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Comprobante SUNAT</span>
            <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => setDocType("boleta")}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  docType === "boleta" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                Boleta
              </button>
              <button
                onClick={() => setDocType("factura")}
                className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                  docType === "factura" ? "bg-blue-600 text-white" : "text-slate-400"
                }`}
              >
                Factura
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={customerDoc}
                  onChange={(e) => setCustomerDoc(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      lookupClient(customerDoc);
                    }
                  }}
                  placeholder="DNI (8 d.) o RUC (11 d.)..."
                  className="w-full pl-8 pr-20 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => lookupClient(customerDoc)}
                  disabled={isLookingUpClient}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-[10px] font-bold text-white flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {isLookingUpClient ? (
                    <span className="size-2.5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  ) : (
                    <Search className="size-2.5" />
                  )}
                  SUNAT
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-slate-400 font-medium">Razón Social / Nombre:</div>
                <div className="text-xs font-bold text-white truncate">{customerName}</div>
              </div>
              {customerPoints > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPointsRedeemActive(!isPointsRedeemActive);
                    toast.info(
                      isPointsRedeemActive
                        ? "Canje de puntos desactivado."
                        : `Canje de ${customerPoints} pts activado (-S/ ${(customerPoints / 10).toFixed(2)}).`
                    );
                  }}
                  className={`flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                    isPointsRedeemActive
                      ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/20"
                      : "bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30"
                  }`}
                  title="Haga clic para canjear puntos de fidelidad como descuento"
                >
                  <Award className="size-3" /> {customerPoints} pts {isPointsRedeemActive ? "(Canjeado)" : "(Canjear)"}
                </button>
              )}
            </div>

            {/* Quick Client Pills */}
            <div className="flex flex-wrap items-center gap-1">
              {clients.map((c, idx) => (
                <button
                  key={c.id ? `client-${c.id}` : `client-${c.doc}-${idx}`}
                  type="button"
                  onClick={() => handleSelectClient(c)}
                  className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border transition-colors cursor-pointer ${
                    customerDoc === c.doc
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {c.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payment Method Selector (4 Grid) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Medio de Pago
            </span>
            {selectedPayment === "mixto" && (
              <span className="text-[10px] text-blue-400 font-bold font-mono">
                {splitPaymentsList?.length || 0} Medios Asignados
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedPayment("efectivo")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold gap-1 transition-all cursor-pointer ${
                selectedPayment === "efectivo"
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <Banknote className="size-4 shrink-0 text-emerald-400" />
              <span>Efectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPayment("tarjeta")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold gap-1 transition-all cursor-pointer ${
                selectedPayment === "tarjeta"
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <CreditCard className="size-4 shrink-0 text-blue-400" />
              <span>Tarjeta</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedPayment("yape")}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold gap-1 transition-all cursor-pointer ${
                selectedPayment === "yape"
                  ? "border-blue-500 bg-blue-600/20 text-blue-400 shadow-md shadow-blue-500/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="size-4 shrink-0 text-purple-400" />
              <span>Yape / Plin</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (customerDoc === "00000000" || customerName === "Clientes Varios") {
                  toast.error("Seleccione un cliente identificado con DNI o RUC para venta al crédito.");
                  return;
                }
                const { getCreditAccountByClientDocAction } = await import("@/actions/customer-credit-actions");
                const acc = await getCreditAccountByClientDocAction(customerDoc);
                if (acc) {
                  setActiveCreditAccount(acc);
                  if (acc.estado === "bloqueado") {
                    toast.error("La cuenta de crédito del cliente está BLOQUEADA.");
                  } else {
                    toast.info(`Línea activa: Disponible ${formatCurrency(acc.creditoDisponible)}`);
                  }
                }
                setSelectedPayment("credito");
              }}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-[11px] font-bold gap-1 transition-all cursor-pointer ${
                selectedPayment === "credito"
                  ? "border-rose-500 bg-rose-600/20 text-rose-300 shadow-md shadow-rose-500/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-rose-300"
              }`}
            >
              <CreditCard className="size-4 shrink-0 text-rose-400" />
              <span>Crédito / Fiado</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPayment("mixto");
                setIsSplitPaymentOpen(true);
              }}
              className={`col-span-2 flex items-center justify-center p-2 rounded-xl border text-[11px] font-bold gap-2 transition-all cursor-pointer ${
                selectedPayment === "mixto"
                  ? "border-amber-500 bg-amber-600/20 text-amber-300 shadow-md shadow-amber-500/20"
                  : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-amber-300"
              }`}
            >
              <ArrowRightLeft className="size-4 shrink-0 text-amber-400" />
              <span>Cobro Mixto</span>
            </button>
          </div>
        </div>

        {/* Credit Account Info Pill */}
        {selectedPayment === "credito" && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-rose-300">
              <span>Línea de Crédito Cliente:</span>
              <span className="font-mono">
                {activeCreditAccount ? formatCurrency(activeCreditAccount.creditoDisponible) : "Consultando..."}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Plazo de pago: <strong className="text-white">{activeCreditAccount?.diasPlazo || 30} días</strong> • Condición SUNAT: Crédito
            </div>
          </div>
        )}

        {/* Split Payment Active Details Card */}
        {selectedPayment === "mixto" && (
          <div className="space-y-2 p-3.5 rounded-xl bg-amber-950/20 border border-amber-800/40">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <ArrowRightLeft className="size-3.5" /> Desglose Mixto Configurado
              </span>
              <button
                type="button"
                onClick={() => setIsSplitPaymentOpen(true)}
                className="text-[11px] text-blue-400 hover:underline font-bold"
              >
                Modificar
              </button>
            </div>
            <div className="space-y-1 text-[11px] font-mono">
              {(splitPaymentsList || []).map((p, idx) => (
                <div key={idx} className="flex justify-between text-slate-300">
                  <span className="capitalize">• {p.medioPago}{p.referencia ? ` (Ref: ${p.referencia})` : ""}:</span>
                  <span className="font-bold text-white">{formatCurrency(p.monto)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cash Calculator if Efectivo */}
        {selectedPayment === "efectivo" && (
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Monto Recibido:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-slate-500 font-bold">S/</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-right font-mono font-bold text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1">
              {POS_DEFAULTS.quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="flex-1 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                >
                  {amt}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 font-semibold">
              <span className="text-slate-400">Vuelto a Entregar:</span>
              <span className="font-mono text-emerald-400 font-extrabold text-base">
                {formatCurrency(change)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Totals & Submit */}
      <div>
        <div className="space-y-1.5 mb-4 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal Bruto</span>
            <span className="font-mono text-slate-300">{formatCurrency(rawSubtotal)}</span>
          </div>
          {promoSavings > 0 && (
            <div className="flex justify-between text-purple-400 font-bold">
              <span className="flex items-center gap-1"><Sparkles className="size-3" /> Ahorro Promociones</span>
              <span className="font-mono">-{formatCurrency(promoSavings)}</span>
            </div>
          )}
          {pointsDiscount > 0 && (
            <div className="flex justify-between text-amber-400 font-bold">
              <span className="flex items-center gap-1"><Award className="size-3" /> Canje Puntos ({customerPoints} pts)</span>
              <span className="font-mono">-{formatCurrency(pointsDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>IGV (18% incluido)</span>
            <span className="font-mono text-slate-300">{formatCurrency(igv)}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
            <div>
              <span className="text-sm font-bold text-white uppercase tracking-wider block">Total a Cobrar</span>
              {puntosAcumuladosVenta > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono font-semibold">
                  +{puntosAcumuladosVenta} pts por esta compra
                </span>
              )}
            </div>
            <span className="text-3xl font-black text-white font-mono tracking-tight text-right">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <button
          onClick={onCheckout}
          disabled={cartLength === 0 || isProcessingSale}
          className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessingSale ? (
            <>
              <Loader2 className="size-5 animate-spin text-white" />
              <span>Procesando Pago...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="size-5" />
              <span>Cobrar {formatCurrency(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
