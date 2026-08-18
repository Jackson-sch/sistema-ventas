"use server";

import { revalidatePath } from "next/cache";

export interface InventoryCountItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  stockTeorico: number;
  conteoFisico: number;
  diferencia: number; // conteoFisico - stockTeorico
  costoUnitario: number;
  impactoMonetario: number; // diferencia * costoUnitario
  lote?: string;
  fechaVencimiento?: string;
  estadoVencimiento?: "vigente" | "por_vencer" | "vencido";
}

export interface InventoryAuditSession {
  id: string;
  codigoSesion: string; // ej: AUD-20260818-01
  fecha: string;
  responsable: string;
  sucursal: string;
  estado: "en_proceso" | "ajustado" | "cancelado";
  totalItemsContados: number;
  totalDiferencias: number;
  impactoTotalSoles: number;
  items: InventoryCountItem[];
}

const INITIAL_AUDIT_ITEMS: InventoryCountItem[] = [
  {
    productoId: "1",
    sku: "775123456789",
    nombre: "Leche Gloria Entera 400g",
    categoria: "Lácteos",
    stockTeorico: 120,
    conteoFisico: 118,
    diferencia: -2,
    costoUnitario: 3.80,
    impactoMonetario: -7.60,
    lote: "L-260815A",
    fechaVencimiento: "2026-09-10",
    estadoVencimiento: "por_vencer",
  },
  {
    productoId: "2",
    sku: "775987654321",
    nombre: "Arroz Costeño Extra 1kg",
    categoria: "Abarrotes",
    stockTeorico: 85,
    conteoFisico: 85,
    diferencia: 0,
    costoUnitario: 4.20,
    impactoMonetario: 0.00,
    lote: "L-260601B",
    fechaVencimiento: "2027-06-01",
    estadoVencimiento: "vigente",
  },
  {
    productoId: "3",
    sku: "775456789123",
    nombre: "Aceite Primor Premium 1L",
    categoria: "Abarrotes",
    stockTeorico: 45,
    conteoFisico: 46,
    diferencia: 1,
    costoUnitario: 8.10,
    impactoMonetario: 8.10,
    lote: "L-260512C",
    fechaVencimiento: "2027-05-12",
    estadoVencimiento: "vigente",
  },
  {
    productoId: "4",
    sku: "200000012345",
    nombre: "Yogurt Gloria Fresa 1L",
    categoria: "Lácteos",
    stockTeorico: 30,
    conteoFisico: 28,
    diferencia: -2,
    costoUnitario: 5.50,
    impactoMonetario: -11.00,
    lote: "L-260810D",
    fechaVencimiento: "2026-08-25",
    estadoVencimiento: "por_vencer",
  },
];

let inMemorySessions: InventoryAuditSession[] = [
  {
    id: "audit-1",
    codigoSesion: "AUD-20260818-01",
    fecha: "18/08/2026 01:25",
    responsable: "Carlos Alarcón (Supervisor de Turno)",
    sucursal: "Sucursal Central (Surco)",
    estado: "en_proceso",
    totalItemsContados: 4,
    totalDiferencias: -3,
    impactoTotalSoles: -10.50,
    items: INITIAL_AUDIT_ITEMS,
  },
];

export async function getActiveAuditSessionAction(): Promise<InventoryAuditSession> {
  return inMemorySessions[0];
}

export async function updateCountItemAction(
  productoId: string,
  conteoFisico: number
): Promise<{ success: boolean; session: InventoryAuditSession }> {
  const session = inMemorySessions[0];
  const item = session.items.find((i) => i.productoId === productoId);
  if (item) {
    item.conteoFisico = conteoFisico;
    item.diferencia = conteoFisico - item.stockTeorico;
    item.impactoMonetario = +(item.diferencia * item.costoUnitario).toFixed(2);
  }

  session.totalDiferencias = session.items.reduce((acc, i) => acc + i.diferencia, 0);
  session.impactoTotalSoles = +session.items.reduce((acc, i) => acc + i.impactoMonetario, 0).toFixed(2);

  revalidatePath("/inventario/conteo");
  return { success: true, session };
}

export async function applyKardexAdjustmentAction(
  motivoAjuste: string
): Promise<{ success: boolean; message: string }> {
  const session = inMemorySessions[0];
  session.estado = "ajustado";

  // Simulate updating stock and inserting Kardex records
  revalidatePath("/inventario/conteo");
  revalidatePath("/inventario");
  revalidatePath("/inventario/kardex");

  return {
    success: true,
    message: `Ajuste masivo de inventario aplicado con éxito. Movimientos registrados en Kardex por motivo: "${motivoAjuste}".`,
  };
}
