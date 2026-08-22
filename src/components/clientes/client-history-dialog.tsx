"use client";

import { useState, useEffect } from "react";
import {
  User,
  ShoppingBag,
  Award,
  Calendar,
  DollarSign,
  FileText,
  Printer,
  TrendingUp,
  Receipt,
  Download,
  Loader2,
  Package,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ClientData } from "./client-form-dialog";
import {
  getClientPurchaseHistoryAction,
  redeemPointsAction,
  ClientPurchaseRecord,
} from "@/actions/client-actions";

interface ClientHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientData | null;
  onPointsUpdated?: (newPoints: number) => void;
}

export function ClientHistoryDialog({
  isOpen,
  onClose,
  client,
  onPointsUpdated,
}: ClientHistoryDialogProps) {
  const [purchases, setPurchases] = useState<ClientPurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [currentPoints, setCurrentPoints] = useState(0);

  useEffect(() => {
    if (isOpen && client) {
      setCurrentPoints(client.puntos || 0);
      setIsLoading(true);
      getClientPurchaseHistoryAction(client.id)
        .then((data) => {
          setPurchases(data);
        })
        .catch(() => {
          toast.error("Error al cargar historial de compras.");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, client]);

  if (!isOpen || !client) return null;

  const totalAcumulado = purchases.reduce((acc, p) => acc + p.total, 0);

  const handleRedeemPoints = async () => {
    if (currentPoints < 50) {
      toast.error("El cliente necesita mínimo 50 puntos para canjear un vale de descuento.");
      return;
    }

    setIsRedeeming(true);
    try {
      const res = await redeemPointsAction(client.id, 50, 10.0);
      if (res.success) {
        const newPts = currentPoints - 50;
        setCurrentPoints(newPts);
        if (onPointsUpdated) onPointsUpdated(newPts);
        toast.success(`Vale de S/ 10.00 generado con éxito por 50 puntos`, {
          description: `Nuevo saldo disponible: ${newPts} puntos.`,
        });
      } else {
        toast.error(res.error || "No se pudo realizar el canje de puntos.");
      }
    } catch {
      toast.error("Error al procesar el canje de puntos.");
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 my-auto max-h-[90vh] overflow-y-auto bg-[hsl(224,71%,4%)]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-lg">
              {client.nombre.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">{client.nombre}</h3>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold border-amber-500/40 bg-amber-500/10 text-amber-400 font-sans"
                >
                  {client.categoria}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {client.tipoDoc}: {client.numDoc} {client.telefono && client.telefono !== "-" ? `| Tel: ${client.telefono}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer self-end sm:self-auto"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Puntos Acumulados</span>
              <div className="text-2xl font-mono font-extrabold text-amber-400 mt-0.5">
                {currentPoints} <span className="text-xs font-sans text-slate-400 font-normal">pts</span>
              </div>
            </div>
            <button
              onClick={handleRedeemPoints}
              disabled={isRedeeming || currentPoints < 50}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600/30 border border-amber-500/40 text-[10px] font-bold text-amber-300 hover:bg-amber-600 hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
            >
              {isRedeeming ? "Canjeando..." : "Canjear"}
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Compras Registradas</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400 mt-0.5">
                {formatCurrency(totalAcumulado > 0 ? totalAcumulado : client.totalCompras)}
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign className="size-4" />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500">Tickets Frecuentes</span>
              <div className="text-xl font-mono font-extrabold text-white mt-0.5">
                {purchases.length} <span className="text-xs font-sans text-slate-400 font-normal">comprobantes</span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Receipt className="size-4" />
            </div>
          </div>
        </div>

        {/* Purchase History Table */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShoppingBag className="size-3.5 text-blue-400" /> Historial de Comprobantes & Compras en PostgreSQL
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              {purchases.length} registros
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-2.5 px-3.5">Comprobante</th>
                  <th className="py-2.5 px-3.5">Fecha & Hora</th>
                  <th className="py-2.5 px-3.5 text-center">Caja</th>
                  <th className="py-2.5 px-3.5 text-center">Ítems</th>
                  <th className="py-2.5 px-3.5 text-center">Puntos</th>
                  <th className="py-2.5 px-3.5 text-right">Total Pagado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400">
                      <Loader2 className="size-5 animate-spin mx-auto mb-2 text-blue-400" />
                      <p className="text-xs">Consultando transacciones en la base de datos...</p>
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500 font-sans">
                      <Package className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-1.5" />
                      <p className="text-xs text-slate-400 font-semibold">
                        No se registran comprobantes para este cliente
                      </p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Al emitir una boleta o factura en el POS asociada a su DNI/RUC, aparecerá aquí.
                      </p>
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-white text-xs">
                        {p.comprobante}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-400 text-[11px]">
                        {p.fecha} {p.hora}
                      </td>
                      <td className="py-2.5 px-3.5 text-center text-slate-300 text-xs">
                        {p.caja}
                      </td>
                      <td className="py-2.5 px-3.5 text-center font-mono text-slate-300">
                        {p.itemsCount} und
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="font-mono font-bold text-amber-400 text-xs">
                          +{p.puntosGanados} pts
                        </span>
                      </td>
                      <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrency(p.total)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
