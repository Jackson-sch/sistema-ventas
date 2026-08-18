"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  WifiOff,
  Wifi,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { offlineStorage, OfflineSale } from "@/lib/offline/offline-storage";
import { syncManager, SyncStatus } from "@/lib/offline/sync-manager";

interface OfflineSyncDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OfflineSyncDialog({ isOpen, onClose }: OfflineSyncDialogProps) {
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    try {
      const data = await offlineStorage.getAllSales();
      setSales(data);
      setIsOnline(syncManager.isOnline());
    } catch {}
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const unsub = syncManager.subscribe((status: SyncStatus) => {
      setIsOnline(status.isOnline);
      setIsSyncing(status.isSyncing);
      loadData();
    });
    return unsub;
  }, []);

  if (!isOpen || !mounted) return null;

  const pendingSales = sales.filter((s) => s.syncStatus !== "synced");
  const totalPendiente = pendingSales.reduce((acc, s) => acc + s.total, 0);

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("No hay conexión a internet para sincronizar.");
      return;
    }

    setIsSyncing(true);
    toast.info("Iniciando sincronización con SUNAT en segundo plano...");

    try {
      const { synced, failed } = await syncManager.syncPendingSales();
      await loadData();

      if (synced > 0) {
        toast.success(`¡${synced} ventas sincronizadas exitosamente con SUNAT!`);
      }
      if (failed > 0) {
        toast.warning(`${failed} comprobantes no pudieron ser procesados.`);
      }
    } catch {
      toast.error("Error al ejecutar la sincronización.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearSale = async (localId: string) => {
    await offlineStorage.removeSyncedSale(localId);
    toast.info("Venta eliminada del almacenamiento local.");
    loadData();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-2xl border flex items-center justify-center ${
              isOnline
                ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                : "bg-rose-600/20 border-rose-500/30 text-rose-400"
            }`}>
              {isOnline ? <Wifi className="size-5" /> : <WifiOff className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  isOnline
                    ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/50"
                    : "bg-rose-950/80 text-rose-400 border-rose-800/50"
                }`}>
                  {isOnline ? "🟢 Conectado a Internet" : "🔴 Modo Sin Conexión (Offline)"}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Cola de Sincronización Local (IndexedDB)
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs font-bold"
          >
            ✕
          </button>
        </div>

        {/* Status Box */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Comprobantes Offline</span>
            <div className="font-mono font-black text-white text-lg">{pendingSales.length}</div>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total Retenido</span>
            <div className="font-mono font-black text-amber-400 text-lg">{formatCurrency(totalPendiente)}</div>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Estado Sync</span>
            <div className="font-bold text-slate-300">
              {isSyncing ? "Sincronizando..." : isOnline ? "Listo para subir" : "Esperando red"}
            </div>
          </div>
        </div>

        {/* Pending Sales List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Comprobantes Almacenados en esta Máquina:</span>
            <span className="text-[11px] text-slate-500 font-mono">0 ms de latencia local</span>
          </div>

          {sales.length === 0 ? (
            <div className="p-8 rounded-2xl border border-dashed border-slate-800 text-center space-y-2 bg-slate-950/40">
              <CheckCircle2 className="size-8 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-white">Todos los comprobantes están sincronizados</div>
              <p className="text-[11px] text-slate-500">
                No hay ventas retenidas localmente en IndexedDB.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
              {sales.map((sale) => (
                <div
                  key={sale.localId}
                  className="p-3 bg-slate-950/80 flex items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{sale.offlineComprobante}</span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-800 text-slate-300 uppercase">
                        {sale.docType}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans">
                      {sale.clienteNombre} ({sale.items.length} productos)
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-white">{formatCurrency(sale.total)}</div>
                      <span className={`text-[10px] uppercase font-bold ${
                        sale.syncStatus === "syncing"
                          ? "text-blue-400 animate-pulse"
                          : sale.syncStatus === "failed"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}>
                        {sale.syncStatus === "syncing"
                          ? "Subiendo..."
                          : sale.syncStatus === "failed"
                          ? "Reintento pend."
                          : "Pendiente"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClearSale(sale.localId)}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Descartar del almacenamiento local"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing || pendingSales.length === 0 || !isOnline}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`size-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing
              ? "Sincronizando con SUNAT..."
              : `Sincronizar ${pendingSales.length} Ventas Ahora`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
