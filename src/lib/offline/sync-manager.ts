/**
 * Administrador de Sincronización en Segundo Plano (Background Sync)
 * Detecta cambios de red y sincroniza las ventas guardadas en IndexedDB hacia SUNAT/Servidor.
 */

import { offlineStorage, OfflineSale } from "./offline-storage";
import { completeSaleTransactionAction } from "@/actions/pos-actions";

export interface SyncStatus {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

export class BackgroundSyncManager {
  private isSyncing: boolean = false;
  private listeners: ((status: SyncStatus) => void)[] = [];
  private lastSyncTime: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.notifyStatus();
        this.syncPendingSales();
      });

      window.addEventListener("offline", () => {
        this.notifyStatus();
      });

      // Chequeo periódico cada 30 segundos si hay conexión
      setInterval(() => {
        if (navigator.onLine && !this.isSyncing) {
          this.syncPendingSales();
        }
      }, 30000);
    }
  }

  public isOnline(): boolean {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  }

  public subscribe(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    this.notifyStatus();
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private async notifyStatus() {
    const pending = typeof window !== "undefined" ? await offlineStorage.getPendingSales() : [];
    const status: SyncStatus = {
      isOnline: this.isOnline(),
      pendingCount: pending.length,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
    };
    this.listeners.forEach((cb) => cb(status));
  }

  /**
   * Ejecuta la sincronización de todas las ventas pendientes en segundo plano
   */
  public async syncPendingSales(): Promise<{ synced: number; failed: number }> {
    if (this.isSyncing || !this.isOnline()) {
      return { synced: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyStatus();

    let synced = 0;
    let failed = 0;

    try {
      const pendingSales = await offlineStorage.getPendingSales();

      for (const sale of pendingSales) {
        try {
          await offlineStorage.updateSaleSyncStatus(sale.localId, "syncing");

          const res = await completeSaleTransactionAction({
            docType: sale.docType,
            clienteDoc: sale.clienteDoc,
            clienteNombre: sale.clienteNombre,
            medioPago: sale.medioPago as any,
            pagos: sale.pagos,
            montoRecibido: sale.montoRecibido,
            vuelto: sale.vuelto,
            items: sale.items.map((it) => ({
              id: it.id,
              sku: it.sku,
              nombre: it.nombre,
              precio: it.precio,
              cantidad: it.cantidad,
              tipo: it.tipo || "unidad",
            })),
          });

          if (res.success) {
            await offlineStorage.removeSyncedSale(sale.localId);
            synced++;
          } else {
            await offlineStorage.updateSaleSyncStatus(sale.localId, "failed", res.error);
            failed++;
          }
        } catch (err: any) {
          await offlineStorage.updateSaleSyncStatus(sale.localId, "failed", err?.message || "Error de red");
          failed++;
        }
      }

      this.lastSyncTime = new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
    } catch (err) {
      console.warn("BackgroundSyncManager: Error general en sincronización:", err);
    } finally {
      this.isSyncing = false;
      this.notifyStatus();
    }

    return { synced, failed };
  }
}

export const syncManager = new BackgroundSyncManager();
