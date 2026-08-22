export interface CartItem {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precio: number;
  cantidad: number;
  tipo: "unidad" | "peso";
}

export interface PosClient {
  id: string;
  doc: string;
  name: string;
  type: string;
  points: number;
}

export const DEFAULT_CLIENT: PosClient = {
  id: "client-varios",
  doc: "00000000",
  name: "Clientes Varios",
  type: "DNI",
  points: 0,
};

export const QUICK_AMOUNTS = [10, 20, 50, 100, 200];
