"use client";

import {
  Printer,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Download,
  Share2,
  MessageSquare,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { CustomerCreditAccount } from "@/actions/customer-credit-actions";

interface CreditStatementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: CustomerCreditAccount | null;
}

export function CreditStatementDialog({
  isOpen,
  onClose,
  account,
}: CreditStatementDialogProps) {
  if (!isOpen || !account) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    const text = `*ESTADO DE CUENTA CORRIENTE - NOVAMARKET*\n` +
      `Estimado(a) *${account.clienteNombre}* (${account.clienteTipoDoc}: ${account.clienteDoc}):\n\n` +
      `📌 *Límite de Crédito:* ${formatCurrency(account.limiteCredito)}\n` +
      `🔴 *Saldo Deudor Actual:* ${formatCurrency(account.saldoDeudor)}\n` +
      `🟢 *Crédito Disponible:* ${formatCurrency(account.creditoDisponible)}\n` +
      `📅 *Próximo Vencimiento:* ${account.fechaVencimientoProxima || "Sin vencimientos pendientes"}\n` +
      `Estado: *${account.estado.toUpperCase()}*\n\n` +
      `Para coordinar sus abonos bancarios o pagos en caja, puede acercarse a cualquiera de nuestras sucursales.\n` +
      `_NovaMarket Supermercados S.A.C._`;

    const phone = account.telefono.replace(/\s+/g, "");
    const encoded = encodeURIComponent(text);
    const url = `https://api.whatsapp.com/send?phone=51${phone}&text=${encoded}`;
    window.open(url, "_blank");
    toast.success("Abriendo WhatsApp para enviar estado de cuenta.");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header / Actions */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              <CreditCard className="size-5 text-blue-400" /> Estado de Cuenta Corriente & Créditos
            </h3>
            <p className="text-xs text-slate-400">
              Historial de consumos, ventas al crédito y abonos registrados
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <MessageSquare className="size-3.5" /> WhatsApp
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Printer className="size-3.5" /> Imprimir
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-6 text-xs text-slate-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="text-base font-black text-white">NOVAMARKET SUPERMERCADOS S.A.C.</span>
              <div className="text-[11px] text-slate-400 font-mono">RUC: 20608945123 • Sucursal Central</div>
              <div className="text-[11px] text-slate-400">Av. El Polo 670, Santiago de Surco, Lima</div>
            </div>

            <div className="text-right sm:text-right">
              <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 font-bold border border-blue-800 uppercase text-[10px]">
                ESTADO DE CUENTA CORRIENTE
              </span>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Fecha de Emisión: {new Date().toLocaleDateString("es-PE")}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">DATOS DEL CLIENTE:</span>
              <div className="text-sm font-bold text-white">{account.clienteNombre}</div>
              <div className="font-mono text-slate-300">
                {account.clienteTipoDoc}: {account.clienteDoc}
              </div>
              <div className="text-slate-400">Tel: {account.telefono} • {account.email}</div>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">LÍNEA DE CRÉDITO Y PLAZO:</span>
              <div className="font-mono text-slate-300">
                Límite Autorizado: <strong className="text-white">{formatCurrency(account.limiteCredito)}</strong>
              </div>
              <div className="font-mono text-slate-300">
                Plazo de Pago: <strong className="text-blue-400">{account.diasPlazo} días calendario</strong>
              </div>
              <div className="text-slate-400">
                Próx. Vencimiento: <strong className="text-amber-400">{account.fechaVencimientoProxima || "N/A"}</strong>
              </div>
            </div>
          </div>

          {/* Credit Balances KPI */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">LÍNEA TOTAL</span>
              <strong className="text-sm font-black text-white font-mono">{formatCurrency(account.limiteCredito)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-900/50 text-center">
              <span className="text-[10px] text-rose-300 uppercase font-bold block">SALDO DEUDOR</span>
              <strong className="text-sm font-black text-rose-400 font-mono">{formatCurrency(account.saldoDeudor)}</strong>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/50 text-center">
              <span className="text-[10px] text-emerald-300 uppercase font-bold block">DISPONIBLE</span>
              <strong className="text-sm font-black text-emerald-400 font-mono">{formatCurrency(account.creditoDisponible)}</strong>
            </div>
          </div>

          {/* Movements Table */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Historial de Movimientos (Cargos y Abonos):
            </span>
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Fecha</th>
                    <th className="py-2.5 px-3">Operación</th>
                    <th className="py-2.5 px-3">Comprobante</th>
                    <th className="py-2.5 px-3 text-right">Monto</th>
                    <th className="py-2.5 px-3 text-right">Saldo Deudor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {account.movimientos.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-800/20">
                      <td className="py-2.5 px-3 text-slate-300">
                        {m.fecha} <span className="text-[10px] text-slate-500">{m.hora}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {m.tipo === "CARGO_VENTA" ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/50 text-[10px] font-bold">
                            Cargo (Venta)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                            Abono (Pago)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white">
                        {m.comprobanteReferencia}
                        {m.medioPagoAbono && (
                          <span className="block text-[10px] text-slate-400 font-sans">{m.medioPagoAbono}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black">
                        {m.tipo === "CARGO_VENTA" ? (
                          <span className="text-rose-400">+{formatCurrency(m.monto)}</span>
                        ) : (
                          <span className="text-emerald-400">-{formatCurrency(m.monto)}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-200">
                        {formatCurrency(m.saldoResultante)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
