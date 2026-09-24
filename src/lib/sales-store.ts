/**
 * Almacenamiento unificado de Ventas en tiempo de ejecución (Singleton)
 * Permite persistencia instantánea entre Server Actions y vistas del Dashboard.
 */

export interface SaleStoreRecord {
  id: string;
  comprobante: string;
  tipo: "Boleta" | "Factura" | "Nota de Crédito";
  cliente: string;
  docNumero: string;
  medioPago: "efectivo" | "tarjeta" | "yape" | "plin";
  caja: string;
  cajero: string;
  total: number;
  fecha: string;
  hora: string;
  estadoSunat: "aceptado" | "enviado" | "anulado";
  hashSunat: string;
  items: {
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad: string;
  }[];
}

const INITIAL_SALES: SaleStoreRecord[] = [];

declare global {
  // eslint-disable-next-line no-var
  var _memorySalesStore: SaleStoreRecord[] | undefined;
}

if (!globalThis._memorySalesStore) {
  globalThis._memorySalesStore = [...INITIAL_SALES];
}

/**
 * Agrega una nueva venta al almacén en memoria
 */
export function addSaleToMemoryStore(sale: SaleStoreRecord) {
  if (!globalThis._memorySalesStore) {
    globalThis._memorySalesStore = [...INITIAL_SALES];
  }
  // Evitar duplicados por id o comprobante
  const exists = globalThis._memorySalesStore.some(
    (s) => s.id === sale.id || s.comprobante === sale.comprobante
  );
  if (!exists) {
    globalThis._memorySalesStore.unshift(sale);
  }
}

/**
 * Obtiene todas las ventas almacenadas en memoria
 */
export function getSalesFromMemoryStore(): SaleStoreRecord[] {
  if (!globalThis._memorySalesStore) {
    globalThis._memorySalesStore = [...INITIAL_SALES];
  }
  return [...globalThis._memorySalesStore];
}

/**
 * Anula una venta registrada por emisión de Nota de Crédito
 */
export function markSaleAsAnuladoInStore(comprobanteOrId: string) {
  if (!globalThis._memorySalesStore) return;
  globalThis._memorySalesStore = globalThis._memorySalesStore.map((s) =>
    s.id === comprobanteOrId || s.comprobante === comprobanteOrId
      ? { ...s, estadoSunat: "anulado" as const }
      : s
  );
}
