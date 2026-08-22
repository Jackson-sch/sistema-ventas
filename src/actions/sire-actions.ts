"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  buildSireVentasFilename,
  buildSireComprasFilename,
  generateSireVentasTxt,
  generateSireComprasTxt,
  SireVentaRecord,
  SireCompraRecord,
} from "@/lib/sunat/sire-generator";

export interface SireOverviewData {
  ruc: string;
  razonSocial: string;
  periodo: string; // YYYY-MM
  año: string;
  mes: string;
  // Ventas 14.1
  ventasFilename: string;
  totalVentasRegistros: number;
  totalVentasBaseGravada: number;
  totalVentasIgv: number;
  totalVentasMonto: number;
  ventasTxtContent: string;
  ventasRecords: SireVentaRecord[];
  // Compras 8.1
  comprasFilename: string;
  totalComprasRegistros: number;
  totalComprasBaseGravada: number;
  totalComprasIgv: number;
  totalComprasMonto: number;
  comprasTxtContent: string;
  comprasRecords: SireCompraRecord[];
  // Balance Fiscal
  igvFiscalAPagar: number; // IGV Ventas - IGV Compras
}

const DEMO_VENTAS_RECORDS: SireVentaRecord[] = [
  {
    periodo: "20260800",
    cuo: "00000001",
    correlativoAsiento: "M00001",
    fechaEmision: "15/08/2026",
    tipoComprobante: "03",
    serie: "B001",
    numero: "00042918",
    tipoDocIdentidad: "1",
    numDocIdentidad: "45892144",
    razonSocialCliente: "Juan Pérez García",
    baseImponibleGravada: 72.88,
    igv: 13.12,
    totalComprobante: 86.00,
    moneda: "PEN",
    estadoOperacion: "1",
  },
  {
    periodo: "20260800",
    cuo: "00000002",
    correlativoAsiento: "M00002",
    fechaEmision: "15/08/2026",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00001249",
    tipoDocIdentidad: "6",
    numDocIdentidad: "20601234567",
    razonSocialCliente: "Inversiones Retail SAC",
    baseImponibleGravada: 381.36,
    igv: 68.64,
    totalComprobante: 450.00,
    moneda: "PEN",
    estadoOperacion: "1",
  },
];

const DEMO_COMPRAS_RECORDS: SireCompraRecord[] = [
  {
    periodo: "20260800",
    cuo: "00000001",
    correlativoAsiento: "M00001",
    fechaEmision: "10/08/2026",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00084512",
    tipoDocProveedor: "6",
    numDocProveedor: "20100190797",
    razonSocialProveedor: "LECHE GLORIA S.A.",
    baseImponibleGravada: 3520.0,
    igv: 633.6,
    totalComprobante: 4153.6,
    moneda: "PEN",
    estadoOperacion: "1",
  },
];

export async function getSireOverviewDataAction(
  año: string = "2026",
  mes: string = "08"
): Promise<SireOverviewData> {
  const ruc = "20608945123";
  const razonSocial = "NOVAMARKET SUPERMERCADOS S.A.C.";
  const periodo = `${año}-${mes.padStart(2, "0")}`;

  let ventasRecords = DEMO_VENTAS_RECORDS;
  let comprasRecords = DEMO_COMPRAS_RECORDS;

  try {
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
      const [ventasRows, comprobantesRows, clientesRows, ordenesRows, ordenesDetalleRows, proveedoresRows] = await Promise.all([
        db.select().from(schema.ventas).orderBy(desc(schema.ventas.creadoEn)),
        db.select().from(schema.comprobantes),
        db.select().from(schema.clientes),
        db.select().from(schema.ordenesCompra).orderBy(desc(schema.ordenesCompra.creadoEn)),
        db.select().from(schema.ordenesCompraDetalle),
        db.select().from(schema.proveedores),
      ]);

      if (ventasRows && ventasRows.length > 0) {
        const compMap = new Map(comprobantesRows.map((c) => [c.ventaId, c]));
        const clientMap = new Map(clientesRows.map((cl) => [cl.id, cl]));

        ventasRecords = ventasRows.map((v, idx) => {
          const comp = compMap.get(v.id);
          const client = v.clienteId ? clientMap.get(v.clienteId) : null;
          const fechaD = new Date(v.creadoEn);
          const totalVal = parseFloat(v.total);
          const igvVal = parseFloat(v.igv || "0") || +(totalVal - totalVal / 1.18).toFixed(2);
          const subtotalVal = parseFloat(v.subtotal || "0") || +(totalVal / 1.18).toFixed(2);

          return {
            periodo: `${año}${mes.padStart(2, "0")}00`,
            cuo: String(idx + 1).padStart(8, "0"),
            correlativoAsiento: `M${String(idx + 1).padStart(5, "0")}`,
            fechaEmision: fechaD.toLocaleDateString("es-PE"),
            tipoComprobante: (comp?.tipo === "factura" ? "01" : "03") as "01" | "03",
            serie: comp?.serie || (client?.tipoDocumento === "ruc" ? "F001" : "B001"),
            numero: comp?.numero || String(42900 + idx).padStart(8, "0"),
            tipoDocIdentidad: (client?.tipoDocumento === "ruc" ? "6" : "1") as "1" | "6",
            numDocIdentidad: client?.numeroDocumento || "00000000",
            razonSocialCliente: client?.nombre || "Clientes Varios",
            baseImponibleGravada: subtotalVal,
            igv: igvVal,
            totalComprobante: totalVal,
            moneda: "PEN" as const,
            estadoOperacion: "1" as const,
          };
        });
      }

      if (ordenesRows && ordenesRows.length > 0) {
        const provMap = new Map(proveedoresRows.map((p) => [p.id, p]));
        const subtotalPorOrden = new Map<string, number>();
        for (const d of ordenesDetalleRows) {
          const lineTotal = parseFloat(d.cantidadPedida) * parseFloat(d.precioUnitarioCosto);
          subtotalPorOrden.set(d.ordenCompraId, (subtotalPorOrden.get(d.ordenCompraId) ?? 0) + lineTotal);
        }

        comprasRecords = ordenesRows.map((o, idx) => {
          const prov = provMap.get(o.proveedorId);
          const fechaD = o.fechaEmision ? new Date(`${o.fechaEmision}T00:00:00`) : new Date();
          const subtotalVal = +(subtotalPorOrden.get(o.id) ?? 1500.0).toFixed(2);
          const igvVal = +(subtotalVal * 0.18).toFixed(2);
          const totalVal = +(subtotalVal + igvVal).toFixed(2);

          return {
            periodo: `${año}${mes.padStart(2, "0")}00`,
            cuo: String(idx + 1).padStart(8, "0"),
            correlativoAsiento: `M${String(idx + 1).padStart(5, "0")}`,
            fechaEmision: fechaD.toLocaleDateString("es-PE"),
            tipoComprobante: "01" as const,
            serie: "F001",
            numero: o.numero ? o.numero.replace(/\D/g, "").padStart(8, "0") : String(8000 + idx).padStart(8, "0"),
            tipoDocProveedor: "6" as const,
            numDocProveedor: prov?.ruc || "20100190797",
            razonSocialProveedor: prov?.razonSocial || "Proveedor",
            baseImponibleGravada: subtotalVal,
            igv: igvVal,
            totalComprobante: totalVal,
            moneda: "PEN" as const,
            estadoOperacion: "1" as const,
          };
        });
      }
    }
  } catch (err) {
    console.warn("getSireOverviewDataAction: DB fallback:", err);
  }

  const ventasFilename = buildSireVentasFilename(ruc, año, mes);
  const comprasFilename = buildSireComprasFilename(ruc, año, mes);

  const ventasTxtContent = generateSireVentasTxt(ventasRecords);
  const comprasTxtContent = generateSireComprasTxt(comprasRecords);

  const totalVentasBaseGravada = +ventasRecords.reduce(
    (acc, r) => acc + r.baseImponibleGravada,
    0
  ).toFixed(2);
  const totalVentasIgv = +ventasRecords.reduce((acc, r) => acc + r.igv, 0).toFixed(2);
  const totalVentasMonto = +ventasRecords.reduce(
    (acc, r) => acc + r.totalComprobante,
    0
  ).toFixed(2);

  const totalComprasBaseGravada = +comprasRecords.reduce(
    (acc, r) => acc + r.baseImponibleGravada,
    0
  ).toFixed(2);
  const totalComprasIgv = +comprasRecords.reduce((acc, r) => acc + r.igv, 0).toFixed(2);
  const totalComprasMonto = +comprasRecords.reduce(
    (acc, r) => acc + r.totalComprobante,
    0
  ).toFixed(2);

  const igvFiscalAPagar = +(totalVentasIgv - totalComprasIgv).toFixed(2);

  return {
    ruc,
    razonSocial,
    periodo,
    año,
    mes,
    ventasFilename,
    totalVentasRegistros: ventasRecords.length,
    totalVentasBaseGravada,
    totalVentasIgv,
    totalVentasMonto,
    ventasTxtContent,
    ventasRecords,
    comprasFilename,
    totalComprasRegistros: comprasRecords.length,
    totalComprasBaseGravada,
    totalComprasIgv,
    totalComprasMonto,
    comprasTxtContent,
    comprasRecords,
    igvFiscalAPagar,
  };
}
