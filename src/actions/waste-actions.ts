"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type WasteReason =
  | "VENCIMIENTO"
  | "ROTURA_TRANSPORTE"
  | "MERMA_PERECIBLE"
  | "DEFECTO_FABRICA"
  | "CONTAMINACION";

export type WasteStatus = "BORRADOR" | "APROBADO_KARDEX" | "DESTRUIDO_CON_ACTA";

export interface WasteItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  costoUnit: number;
  costoTotal: number;
  lote?: string;
  fechaVencimiento?: string;
}

export interface WasteRecord {
  id: string;
  codigoActa: string;
  fecha: string;
  hora: string;
  motivo: WasteReason;
  sucursal: string;
  responsable: string;
  notarioColegiado?: string;
  metodoDestruccion: string;
  lugarDestruccion: string;
  costoTotalPerdida: number;
  estado: WasteStatus;
  observaciones: string;
  items: WasteItem[];
}

let DEMO_WASTE_RECORDS: WasteRecord[] = [
  {
    id: "waste-001",
    codigoActa: "ACTA-2026-0042",
    fecha: "16/08/2026",
    hora: "10:30",
    motivo: "VENCIMIENTO",
    sucursal: "Sucursal Central (Surco)",
    responsable: "Roberto Méndez (Gerente de Operaciones)",
    notarioColegiado: "Dra. Carmen Salazar (Notaría 14 de Lima)",
    metodoDestruccion: "Desnaturalización y disposición en relleno sanitario Huaycoloro",
    lugarDestruccion: "Almacén Central de Merma - Surco",
    costoTotalPerdida: 485.60,
    estado: "DESTRUIDO_CON_ACTA",
    observaciones: "Lote de lácteos y embutidos con fecha de expiración vencida sin posibilidad de rotación.",
    items: [
      {
        productoId: "prod-1",
        sku: "775123456789",
        nombre: "Leche Gloria Entera 400g (Lote Caducado)",
        cantidad: 48,
        unidad: "und",
        costoUnit: 3.60,
        costoTotal: 172.80,
        lote: "L-2026-041",
        fechaVencimiento: "10/08/2026",
      },
      {
        productoId: "prod-8",
        sku: "775000000008",
        nombre: "Yogurt Gloria Fresa 1kg",
        cantidad: 52,
        unidad: "und",
        costoUnit: 6.00,
        costoTotal: 312.80,
        lote: "L-2026-055",
        fechaVencimiento: "12/08/2026",
      },
    ],
  },
  {
    id: "waste-002",
    codigoActa: "ACTA-2026-0043",
    fecha: "17/08/2026",
    hora: "15:45",
    motivo: "ROTURA_TRANSPORTE",
    sucursal: "Sucursal Central (Surco)",
    responsable: "Carlos Alarcón (Supervisor de Turno)",
    notarioColegiado: "Sin Notario (Pérdida menor a 10 UIT)",
    metodoDestruccion: "Reciclaje de vidrio y disposición de residuos",
    lugarDestruccion: "Área de Recepción de Mercadería",
    costoTotalPerdida: 156.80,
    estado: "APROBADO_KARDEX",
    observaciones: "Caída de pallet durante la descarga de camión de proveedor Alicorp.",
    items: [
      {
        productoId: "prod-3",
        sku: "775456789123",
        nombre: "Aceite Primor Premium 1L (Botellas Rotas)",
        cantidad: 20,
        unidad: "und",
        costoUnit: 7.84,
        costoTotal: 156.80,
        lote: "L-2026-088",
        fechaVencimiento: "20/12/2027",
      },
    ],
  },
];

export async function getWasteRecordsAction(): Promise<WasteRecord[]> {
  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const rows = await db
        .select({
          id: schema.movimientosInventario.id,
          tipo: schema.movimientosInventario.tipo,
          cantidad: schema.movimientosInventario.cantidad,
          motivo: schema.movimientosInventario.motivo,
          fecha: schema.movimientosInventario.creadoEn,
          productoId: schema.movimientosInventario.productoId,
          productoNombre: schema.productos.nombre,
          sku: schema.productos.sku,
          precioCosto: schema.productos.precioCosto,
          unidadMedida: schema.productos.unidadMedida,
          sucursalNombre: schema.sucursales.nombre,
          usuarioNombre: schema.usuarios.nombre,
        })
        .from(schema.movimientosInventario)
        .leftJoin(schema.productos, eq(schema.movimientosInventario.productoId, schema.productos.id))
        .leftJoin(schema.sucursales, eq(schema.movimientosInventario.sucursalId, schema.sucursales.id))
        .leftJoin(schema.usuarios, eq(schema.movimientosInventario.usuarioId, schema.usuarios.id))
        .where(eq(schema.movimientosInventario.tipo, "merma"))
        .orderBy(desc(schema.movimientosInventario.creadoEn));

      if (rows && rows.length > 0) {
        return rows.map((r, idx) => {
          const qty = parseFloat(r.cantidad);
          const unitCost = parseFloat(r.precioCosto || "3.50");
          const totalLoss = +(qty * unitCost).toFixed(2);
          const fechaD = new Date(r.fecha);

          const motivoEnum: WasteReason = (r.motivo || "").toLowerCase().includes("venc")
            ? "VENCIMIENTO"
            : (r.motivo || "").toLowerCase().includes("rot")
            ? "ROTURA_TRANSPORTE"
            : "MERMA_PERECIBLE";

          return {
            id: r.id,
            codigoActa: `ACTA-2026-${String(100 + idx).padStart(4, "0")}`,
            fecha: fechaD.toLocaleDateString("es-PE"),
            hora: fechaD.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
            motivo: motivoEnum,
            sucursal: r.sucursalNombre || "Sucursal Central (Surco)",
            responsable: r.usuarioNombre ? `${r.usuarioNombre} (Responsable)` : "Supervisor de Turno",
            notarioColegiado: totalLoss > 5000 ? "Dra. Carmen Salazar (Notaría 14 de Lima)" : "Sin Notario (Art. 37 LIR < 10 UIT)",
            metodoDestruccion: "Desnaturalización e incineración controlada conforme Art. 37 LIR",
            lugarDestruccion: "Almacén Central de Bajas & Mermas",
            costoTotalPerdida: totalLoss,
            estado: "DESTRUIDO_CON_ACTA" as WasteStatus,
            observaciones: r.motivo || "Baja tributaria de mercadería dañada.",
            items: [
              {
                productoId: r.productoId,
                sku: r.sku || "SKU-001",
                nombre: r.productoNombre || "Producto",
                cantidad: qty,
                unidad: (r.unidadMedida || "und").toLowerCase(),
                costoUnit: unitCost,
                costoTotal: totalLoss,
                lote: "L-2026-MERMA",
                fechaVencimiento: "15/08/2026",
              },
            ],
          };
        });
      }
    }
  } catch (err) {
    console.warn("getWasteRecordsAction: DB fallback:", err);
  }

  return DEMO_WASTE_RECORDS;
}

export async function createWasteRecordAction(input: {
  motivo: WasteReason;
  sucursal: string;
  responsable: string;
  notarioColegiado?: string;
  metodoDestruccion: string;
  lugarDestruccion: string;
  observaciones: string;
  items: WasteItem[];
}): Promise<{ success: boolean; error?: string; record?: WasteRecord }> {
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Debe agregar al menos un producto al acta de desmedro." };
  }

  const now = new Date();
  const fechaStr = now.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = now.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
  const codigoActa = `ACTA-2026-${String(DEMO_WASTE_RECORDS.length + 42).padStart(4, "0")}`;

  const costoTotalPerdida = +input.items.reduce((acc, i) => acc + i.costoTotal, 0).toFixed(2);

  const newRecord: WasteRecord = {
    id: `waste-${Date.now()}`,
    codigoActa,
    fecha: fechaStr,
    hora: horaStr,
    motivo: input.motivo,
    sucursal: input.sucursal,
    responsable: input.responsable,
    notarioColegiado: input.notarioColegiado || "Sin Notario (Pérdida operativa menor a 10 UIT)",
    metodoDestruccion: input.metodoDestruccion,
    lugarDestruccion: input.lugarDestruccion,
    costoTotalPerdida,
    estado: "BORRADOR",
    observaciones: input.observaciones,
    items: input.items,
  };

  DEMO_WASTE_RECORDS.unshift(newRecord);
  return { success: true, record: newRecord };
}

export async function approveWasteRecordAction(
  id: string
): Promise<{ success: boolean; error?: string; nuevoEstado?: WasteStatus }> {
  const record = DEMO_WASTE_RECORDS.find((r) => r.id === id);
  if (!record) return { success: false, error: "Acta de merma no encontrada." };

  if (record.estado === "BORRADOR") {
    record.estado = "APROBADO_KARDEX";
  } else if (record.estado === "APROBADO_KARDEX") {
    record.estado = "DESTRUIDO_CON_ACTA";
  }

  return { success: true, nuevoEstado: record.estado };
}

export async function updateWasteRecordAction(input: {
  id: string;
  motivo: WasteReason;
  sucursal: string;
  responsable: string;
  notarioColegiado?: string;
  metodoDestruccion: string;
  lugarDestruccion: string;
  observaciones: string;
  items: WasteItem[];
}): Promise<{ success: boolean; error?: string; record?: WasteRecord }> {
  const record = DEMO_WASTE_RECORDS.find((r) => r.id === input.id);
  if (!record) return { success: false, error: "Acta de merma no encontrada." };

  if (!input.items || input.items.length === 0) {
    return { success: false, error: "Debe incluir al menos un producto en el acta." };
  }

  const costoTotalPerdida = +input.items.reduce((acc, i) => acc + i.costoTotal, 0).toFixed(2);

  record.motivo = input.motivo;
  record.sucursal = input.sucursal;
  record.responsable = input.responsable;
  record.notarioColegiado = input.notarioColegiado || record.notarioColegiado;
  record.metodoDestruccion = input.metodoDestruccion;
  record.lugarDestruccion = input.lugarDestruccion;
  record.observaciones = input.observaciones;
  record.items = input.items;
  record.costoTotalPerdida = costoTotalPerdida;

  return { success: true, record };
}

export async function deleteWasteRecordAction(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const index = DEMO_WASTE_RECORDS.findIndex((r) => r.id === id);
  if (index === -1) return { success: false, error: "Acta de merma no encontrada." };

  DEMO_WASTE_RECORDS.splice(index, 1);
  return { success: true };
}

