"use server";

import { revalidatePath } from "next/cache";

export interface QuotationItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnit: number;
  total: number;
  tipo: "unidad" | "peso";
}

export interface QuotationRecord {
  id: string;
  codigo: string; // ej: COT-2026-00042
  fechaEmision: string;
  fechaVencimiento: string;
  clienteDoc: string;
  clienteNombre: string;
  clienteTipoDoc: "DNI" | "RUC";
  clienteEmail?: string;
  clienteTelefono?: string;
  moneda: "PEN" | "USD";
  subtotal: number;
  igv: number;
  total: number;
  estado: "vigente" | "convertida" | "vencida" | "anulada";
  ventaComprobante?: string;
  vendedor: string;
  items: QuotationItem[];
  observaciones?: string;
}

let inMemoryQuotations: QuotationRecord[] = [
  {
    id: "cot-1",
    codigo: "COT-2026-00042",
    fechaEmision: "17/08/2026",
    fechaVencimiento: "24/08/2026",
    clienteDoc: "20601234567",
    clienteNombre: "Inversiones Retail SAC",
    clienteTipoDoc: "RUC",
    clienteEmail: "compras@inversionesretail.pe",
    clienteTelefono: "987654321",
    moneda: "PEN",
    subtotal: 508.47,
    igv: 91.53,
    total: 600.00,
    estado: "vigente",
    vendedor: "Carlos Alarcón",
    items: [
      { productoId: "1", sku: "775123456789", nombre: "Leche Gloria Entera 400g (Caja x 24)", cantidad: 2, precioUnit: 108.00, total: 216.00, tipo: "unidad" },
      { productoId: "2", sku: "775987654321", nombre: "Arroz Costeño Extra 1kg (Saco x 50kg)", cantidad: 1, precioUnit: 240.00, total: 240.00, tipo: "unidad" },
      { productoId: "3", sku: "775456789123", nombre: "Aceite Primor Premium 1L (Caja x 12)", cantidad: 1, precioUnit: 144.00, total: 144.00, tipo: "unidad" },
    ],
    observaciones: "Precios incluyen IGV. Entrega en almacén central.",
  },
  {
    id: "cot-2",
    codigo: "COT-2026-00041",
    fechaEmision: "15/08/2026",
    fechaVencimiento: "22/08/2026",
    clienteDoc: "45892144",
    clienteNombre: "Juan Pérez García",
    clienteTipoDoc: "DNI",
    clienteTelefono: "998877665",
    moneda: "PEN",
    subtotal: 105.08,
    igv: 18.92,
    total: 124.00,
    estado: "convertida",
    ventaComprobante: "B001-00042918",
    vendedor: "María Gómez",
    items: [
      { productoId: "1", sku: "775123456789", nombre: "Leche Gloria Entera 400g", cantidad: 12, precioUnit: 4.50, total: 54.00, tipo: "unidad" },
      { productoId: "3", sku: "775456789123", nombre: "Aceite Primor Premium 1L", cantidad: 5, precioUnit: 9.80, total: 49.00, tipo: "unidad" },
      { productoId: "4", sku: "200000012345", nombre: "Manzana Delicia Nacional (kg)", cantidad: 4.375, precioUnit: 4.80, total: 21.00, tipo: "peso" },
    ],
    observaciones: "Convertida a Boleta Electrónica en Caja 01.",
  },
  {
    id: "cot-3",
    codigo: "COT-2026-00040",
    fechaEmision: "05/08/2026",
    fechaVencimiento: "12/08/2026",
    clienteDoc: "20547896321",
    clienteNombre: "Corporación Gastronómica Lima SAC",
    clienteTipoDoc: "RUC",
    clienteTelefono: "912345678",
    moneda: "PEN",
    subtotal: 780.00,
    igv: 140.40,
    total: 920.40,
    estado: "vencida",
    vendedor: "Carlos Alarcón",
    items: [
      { productoId: "2", sku: "775987654321", nombre: "Arroz Costeño Extra 1kg (Saco x 50kg)", cantidad: 3, precioUnit: 240.00, total: 720.00, tipo: "unidad" },
      { productoId: "3", sku: "775456789123", nombre: "Aceite Primor Premium 1L (Caja x 12)", cantidad: 1, precioUnit: 144.00, total: 144.00, tipo: "unidad" },
    ],
    observaciones: "Plazo de 7 días culminado sin confirmación de pago.",
  },
];

export async function getQuotationsAction(): Promise<QuotationRecord[]> {
  return inMemoryQuotations;
}

export async function getQuotationByIdAction(id: string): Promise<QuotationRecord | null> {
  const q = inMemoryQuotations.find((item) => item.id === id || item.codigo === id);
  return q || null;
}

export async function createQuotationAction(input: {
  clienteDoc: string;
  clienteNombre: string;
  clienteTipoDoc: "DNI" | "RUC";
  clienteTelefono?: string;
  clienteEmail?: string;
  diasValidez: number;
  items: QuotationItem[];
  observaciones?: string;
}): Promise<{ success: boolean; quotation: QuotationRecord }> {
  const nextNum = inMemoryQuotations.length + 42;
  const codigo = `COT-2026-${String(nextNum).padStart(5, "0")}`;

  const now = new Date();
  const fechaEmision = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  
  const expiryDate = new Date();
  expiryDate.setDate(now.getDate() + (input.diasValidez || 7));
  const fechaVencimiento = expiryDate.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });

  const total = +input.items.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  const newQuotation: QuotationRecord = {
    id: `cot-${Date.now()}`,
    codigo,
    fechaEmision,
    fechaVencimiento,
    clienteDoc: input.clienteDoc,
    clienteNombre: input.clienteNombre,
    clienteTipoDoc: input.clienteTipoDoc,
    clienteEmail: input.clienteEmail,
    clienteTelefono: input.clienteTelefono,
    moneda: "PEN",
    subtotal,
    igv,
    total,
    estado: "vigente",
    vendedor: "Carlos Alarcón",
    items: input.items,
    observaciones: input.observaciones || "Precios incluyen IGV. Proforma válida según fecha de vencimiento.",
  };

  inMemoryQuotations = [newQuotation, ...inMemoryQuotations];
  revalidatePath("/ventas/cotizaciones");
  return { success: true, quotation: newQuotation };
}

export async function markQuotationAsConvertedAction(
  quotationId: string,
  comprobante: string
): Promise<{ success: boolean }> {
  const target = inMemoryQuotations.find((q) => q.id === quotationId || q.codigo === quotationId);
  if (target) {
    target.estado = "convertida";
    target.ventaComprobante = comprobante;
    revalidatePath("/ventas/cotizaciones");
  }
  return { success: true };
}

export async function updateQuotationAction(input: {
  id: string;
  clienteDoc: string;
  clienteNombre: string;
  clienteTipoDoc: "DNI" | "RUC";
  clienteTelefono?: string;
  clienteEmail?: string;
  diasValidez: number;
  items: QuotationItem[];
  observaciones?: string;
}): Promise<{ success: boolean; error?: string; quotation?: QuotationRecord }> {
  const target = inMemoryQuotations.find((q) => q.id === input.id);
  if (!target) return { success: false, error: "Cotización no encontrada." };

  if (target.estado === "convertida") {
    return { success: false, error: "No se puede editar una cotización que ya fue cobrada/convertida a venta." };
  }

  const total = +input.items.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const subtotal = +(total / 1.18).toFixed(2);
  const igv = +(total - subtotal).toFixed(2);

  target.clienteDoc = input.clienteDoc;
  target.clienteNombre = input.clienteNombre;
  target.clienteTipoDoc = input.clienteTipoDoc;
  target.clienteTelefono = input.clienteTelefono;
  target.clienteEmail = input.clienteEmail;
  target.items = input.items;
  target.total = total;
  target.subtotal = subtotal;
  target.igv = igv;
  if (input.observaciones) target.observaciones = input.observaciones;

  revalidatePath("/ventas/cotizaciones");
  return { success: true, quotation: target };
}

export async function deleteQuotationAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const index = inMemoryQuotations.findIndex((q) => q.id === id);
  if (index === -1) return { success: false, error: "Cotización no encontrada." };

  inMemoryQuotations.splice(index, 1);
  revalidatePath("/ventas/cotizaciones");
  return { success: true };
}

