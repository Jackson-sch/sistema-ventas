"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Sparkles,
  CheckCircle2,
  Tag,
  Gift,
  Award,
  Store,
  Clock,
  Banknote,
  QrCode,
  CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  customerDisplayChannel,
  CustomerDisplayPayload,
} from "@/lib/hardware/customer-display-channel";

export default function CustomerDisplayPage() {
  const [data, setData] = useState<CustomerDisplayPayload>({
    tipo: "STANDBY",
    cajaNombre: "Caja 01 - Principal",
    cajeroNombre: "Carlos Alarcón",
    items: [],
    total: 0,
  });

  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = customerDisplayChannel.subscribe((payload) => {
      setData(payload);
    });
    return () => unsubscribe();
  }, []);

  // Return to standby 8 seconds after sale is completed
  useEffect(() => {
    if (data.tipo === "SALE_COMPLETED") {
      const timer = setTimeout(() => {
        setData((prev) => ({
          tipo: "STANDBY",
          cajaNombre: prev.cajaNombre,
          cajeroNombre: prev.cajeroNombre,
          items: [],
          total: 0,
        }));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [data.tipo]);

  const items = data.items || [];
  const hasItems = items.length > 0;

  return (
    <div className="min-h-screen w-screen bg-[hsl(224,71%,4%)] text-slate-100 flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Top Header Bar */}
      <header className="px-8 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-4">
          <div className="size-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/30">
            N
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              NovaMarket <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60">Supermercados</span>
            </h1>
            <p className="text-xs text-slate-400">
              {data.cajaNombre || "Caja Principal"} • Atendido por: <strong className="text-slate-200">{data.cajeroNombre || "Cajero"}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {data.clienteNombre && data.clienteNombre !== "Clientes Varios" && (
            <div className="px-4 py-2 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
              <span className="text-slate-400 block text-[10px]">CLIENTE REGISTRADO:</span>
              <span className="font-bold text-white text-sm">{data.clienteNombre}</span>
            </div>
          )}
          <div className="text-right font-mono">
            <div className="text-lg font-bold text-slate-200">{currentTime || "12:00:00"}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Hora Oficial</div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex p-6 gap-6 overflow-hidden">
        {data.tipo === "SALE_COMPLETED" ? (
          /* Sale Completed Thank You Screen */
          <div className="flex-1 flex flex-col items-center justify-center bg-emerald-950/20 border border-emerald-800/40 rounded-3xl p-10 text-center space-y-6 animate-in zoom-in-95 duration-300">
            <div className="size-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="size-14" />
            </div>

            <div className="space-y-2">
              <span className="px-4 py-1.5 rounded-full bg-emerald-950 text-emerald-300 font-extrabold text-sm border border-emerald-700">
                ¡PAGO CONFIRMADO & COMPROBANTE EMITIDO!
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight mt-2">
                ¡Muchas Gracias por su Compra!
              </h2>
              <p className="text-slate-400 text-sm">
                Comprobante electrónico SUNAT: <strong className="text-white font-mono">{data.comprobante || "B001-00042920"}</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full max-w-2xl pt-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold">Total Pagado</span>
                <div className="text-2xl font-black text-white font-mono">{formatCurrency(data.total || 0)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold">Medio de Pago</span>
                <div className="text-lg font-bold text-blue-400 uppercase">{data.medioPago || "Efectivo"}</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold">Vuelto Entregado</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">{formatCurrency(data.vuelto || 0)}</div>
              </div>
            </div>
          </div>
        ) : hasItems ? (
          /* Live Scanning Split Screen */
          <div className="flex-1 flex gap-6 overflow-hidden">
            {/* Left: Product Feed */}
            <div className="flex-1 flex flex-col glass-panel rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
              <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="size-5 text-blue-400" />
                  <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">Productos Escaneados</h3>
                </div>
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-950 px-3 py-1 rounded-full border border-blue-800">
                  {items.length} {items.length === 1 ? "artículo" : "artículos"}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                {items.map((item, idx) => (
                  <div
                    key={`${item.id}-${idx}`}
                    className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-200"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white truncate">{item.nombre}</span>
                        {item.promoAplicada && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold flex items-center gap-1 shrink-0">
                            <Sparkles className="size-2.5" /> {item.promoAplicada}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center gap-3">
                        <span>Cant: <strong className="text-white">{item.cantidad}</strong></span>
                        <span>•</span>
                        <span>P. Unit: <strong className="text-slate-300">{formatCurrency(item.precioUnitario)}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <span className="text-xl font-black text-emerald-400">{formatCurrency(item.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Payment & Totals Summary */}
            <div className="w-96 flex flex-col justify-between glass-panel rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
              <div className="space-y-4">
                <div className="space-y-2 pb-4 border-b border-slate-800">
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Desglose de Compra</span>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal (Gravada)</span>
                    <span className="font-mono text-slate-200">{formatCurrency(data.subtotal || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>IGV (18% incluido)</span>
                    <span className="font-mono text-slate-200">{formatCurrency(data.igv || 0)}</span>
                  </div>

                  {(data.ahorroPromociones || 0) > 0 && (
                    <div className="flex justify-between text-sm text-purple-400 font-bold bg-purple-950/40 p-2.5 rounded-xl border border-purple-800/40">
                      <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> Ahorro en Ofertas</span>
                      <span className="font-mono">-{formatCurrency(data.ahorroPromociones || 0)}</span>
                    </div>
                  )}

                  {(data.descuentoPuntos || 0) > 0 && (
                    <div className="flex justify-between text-sm text-amber-400 font-bold bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                      <span className="flex items-center gap-1.5"><Award className="size-3.5" /> Canje de Puntos</span>
                      <span className="font-mono">-{formatCurrency(data.descuentoPuntos || 0)}</span>
                    </div>
                  )}
                </div>

                {(data.puntosGanados || 0) > 0 && (
                  <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <Award className="size-4 text-emerald-400" /> Puntos acumulados:
                    </span>
                    <span className="font-black text-emerald-400 font-mono text-sm">+{data.puntosGanados} pts</span>
                  </div>
                )}
              </div>

              {/* Huge Total */}
              <div className="p-5 rounded-3xl bg-blue-600/10 border-2 border-blue-500/40 text-center space-y-1">
                <span className="text-xs uppercase font-extrabold text-blue-300 tracking-wider">TOTAL A PAGAR</span>
                <div className="text-4xl font-black text-white font-mono tracking-tight">
                  {formatCurrency(data.total || 0)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standby Welcome Banner with Promotions */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-8 glass-panel rounded-3xl border border-slate-800">
            <div className="space-y-3 max-w-xl">
              <span className="px-3.5 py-1 rounded-full bg-blue-950 text-blue-400 text-xs font-extrabold border border-blue-800/60 uppercase tracking-wider">
                Bienvenido a NovaMarket
              </span>
              <h2 className="text-4xl font-black text-white tracking-tight">
                Caja Disponible para Atención
              </h2>
              <p className="text-slate-400 text-sm">
                Coloque sus productos en el mostrador o dicte su número de DNI para acumular puntos de fidelidad.
              </p>
            </div>

            {/* Rotating Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl pt-4">
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-left">
                <div className="size-10 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center">
                  <Gift className="size-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Promociones 2x1 y 3x2</h4>
                <p className="text-xs text-slate-400">Descuentos automáticos aplicados en tiempo real al pasar por caja.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-left">
                <div className="size-10 rounded-xl bg-emerald-950 text-emerald-400 flex items-center justify-center">
                  <Award className="size-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Puntos NovaClub</h4>
                <p className="text-xs text-slate-400">Gana 1 punto por cada S/ 10 de compra y canjéalos como dinero directo.</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-left">
                <div className="size-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center">
                  <QrCode className="size-5" />
                </div>
                <h4 className="font-extrabold text-white text-sm">Todos los Medios de Pago</h4>
                <p className="text-xs text-slate-400">Efectivo, Tarjetas Visa / Mastercard, Yape, Plin y Cobro Mixto.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="px-8 py-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
        <span>NovaMarket POS v2.6 • Comprobantes Electrónicos SUNAT UBL 2.1</span>
        <span>Consulte su comprobante en www.novamarket.pe/cpe</span>
      </footer>
    </div>
  );
}
