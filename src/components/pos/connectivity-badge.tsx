"use client";

import { useState, useEffect } from "react";
import { Wifi, WifiOff, RefreshCw, Layers } from "lucide-react";
import { syncManager, SyncStatus } from "@/lib/offline/sync-manager";
import { OfflineSyncDialog } from "./offline-sync-dialog";

export function ConnectivityBadge() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingCount: 0,
    isSyncing: false,
    lastSyncTime: null,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const unsub = syncManager.subscribe((newStatus) => {
      setStatus(newStatus);
    });
    return unsub;
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsDialogOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
          !status.isOnline
            ? "bg-rose-950/80 border-rose-800/80 text-rose-300 shadow-md shadow-rose-900/30 animate-pulse"
            : status.pendingCount > 0
            ? "bg-amber-950/80 border-amber-800/80 text-amber-300 shadow-md shadow-amber-900/30"
            : "bg-slate-900/90 border-slate-800 text-slate-300 hover:text-white"
        }`}
        title="Estado de Red & Sincronización Offline (IndexedDB)"
      >
        {!status.isOnline ? (
          <>
            <WifiOff className="size-3.5 text-rose-400" />
            <span>OFFLINE {status.pendingCount > 0 ? `(${status.pendingCount})` : ""}</span>
          </>
        ) : status.isSyncing ? (
          <>
            <RefreshCw className="size-3.5 text-blue-400 animate-spin" />
            <span className="text-blue-300">Sincronizando...</span>
          </>
        ) : status.pendingCount > 0 ? (
          <>
            <Layers className="size-3.5 text-amber-400" />
            <span>{status.pendingCount} Offline Pendientes</span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400">En Línea (SUNAT)</span>
          </>
        )}
      </button>

      <OfflineSyncDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} />
    </>
  );
}
