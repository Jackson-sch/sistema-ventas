/**
 * Almacenamiento Local Resiliente (IndexedDB) para Terminal POS Offline-First
 * Permite seguir cobrando y emitiendo comprobantes sin conexión a internet.
 */

const DB_NAME = "novamarket_offline_db";
const DB_VERSION = 1;

export interface OfflineSale {
  localId: string;
  offlineComprobante: string;
  docType: "boleta" | "factura";
  clienteDoc: string;
  clienteNombre: string;
  medioPago: string;
  pagos?: any[];
  montoRecibido?: number;
  vuelto?: number;
  total: number;
  items: {
    id: string;
    sku: string;
    nombre: string;
    precio: number;
    cantidad: number;
    tipo?: "unidad" | "peso";
  }[];
  creadoEn: string;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  retryCount: number;
  error?: string;
}

export interface CachedProduct {
  id: string;
  sku: string;
  nombre: string;
  precio: number;
  stock: number;
  tipo?: "unidad" | "peso";
  categoria?: string;
}

export class OfflineStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (typeof window === "undefined") {
      return Promise.reject(new Error("IndexedDB is only available in browser"));
    }

    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;

          // Store for offline sales
          if (!db.objectStoreNames.contains("offline_sales")) {
            const salesStore = db.createObjectStore("offline_sales", { keyPath: "localId" });
            salesStore.createIndex("syncStatus", "syncStatus", { unique: false });
            salesStore.createIndex("creadoEn", "creadoEn", { unique: false });
          }

          // Store for cached catalog
          if (!db.objectStoreNames.contains("cached_catalog")) {
            const catStore = db.createObjectStore("cached_catalog", { keyPath: "sku" });
            catStore.createIndex("id", "id", { unique: true });
          }
        };

        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }

    return this.dbPromise;
  }

  /**
   * Guarda una venta emitida en modo Offline en IndexedDB
   */
  public async saveOfflineSale(sale: Omit<OfflineSale, "localId" | "offlineComprobante" | "syncStatus" | "retryCount" | "creadoEn">): Promise<OfflineSale> {
    const db = await this.getDB();
    const localId = `off-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const offlineComprobante = `OFF-${sale.docType === "factura" ? "F001" : "B001"}-${Date.now().toString().slice(-6)}`;

    const fullRecord: OfflineSale = {
      ...sale,
      localId,
      offlineComprobante,
      creadoEn: new Date().toISOString(),
      syncStatus: "pending",
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_sales", "readwrite");
      const store = tx.objectStore("offline_sales");
      const req = store.put(fullRecord);

      req.onsuccess = () => resolve(fullRecord);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Obtiene todas las ventas pendientes de sincronizar
   */
  public async getPendingSales(): Promise<OfflineSale[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_sales", "readonly");
      const store = tx.objectStore("offline_sales");
      const req = store.getAll();

      req.onsuccess = () => {
        const all: OfflineSale[] = req.result || [];
        resolve(all.filter((s) => s.syncStatus === "pending" || s.syncStatus === "failed"));
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Obtiene todas las ventas almacenadas localmente (historial offline)
   */
  public async getAllSales(): Promise<OfflineSale[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_sales", "readonly");
      const store = tx.objectStore("offline_sales");
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Actualiza el estado de sincronización de una venta offline
   */
  public async updateSaleSyncStatus(
    localId: string,
    status: "pending" | "syncing" | "synced" | "failed",
    error?: string
  ): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_sales", "readwrite");
      const store = tx.objectStore("offline_sales");
      const getReq = store.get(localId);

      getReq.onsuccess = () => {
        const item: OfflineSale = getReq.result;
        if (item) {
          item.syncStatus = status;
          if (status === "failed") {
            item.retryCount = (item.retryCount || 0) + 1;
            item.error = error;
          }
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  /**
   * Elimina una venta ya sincronizada exitosamente
   */
  public async removeSyncedSale(localId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("offline_sales", "readwrite");
      const store = tx.objectStore("offline_sales");
      const req = store.delete(localId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Almacena en caché local el catálogo completo de productos para escaneo 0ms offline
   */
  public async cacheProductCatalog(products: CachedProduct[]): Promise<void> {
    if (!products || products.length === 0) return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cached_catalog", "readwrite");
      const store = tx.objectStore("cached_catalog");
      products.forEach((p) => store.put(p));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Busca un producto en el catálogo local por SKU o código de barra
   */
  public async getCachedProductBySku(sku: string): Promise<CachedProduct | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("cached_catalog", "readonly");
      const store = tx.objectStore("cached_catalog");
      const req = store.get(sku);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }
}

export const offlineStorage = new OfflineStorageManager();
