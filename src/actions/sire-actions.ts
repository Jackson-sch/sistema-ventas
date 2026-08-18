"use server";

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
  {
    periodo: "20260800",
    cuo: "00000003",
    correlativoAsiento: "M00003",
    fechaEmision: "15/08/2026",
    tipoComprobante: "03",
    serie: "B001",
    numero: "00042917",
    tipoDocIdentidad: "0",
    numDocIdentidad: "00000000",
    razonSocialCliente: "Clientes Varios",
    baseImponibleGravada: 20.34,
    igv: 3.66,
    totalComprobante: 24.00,
    moneda: "PEN",
    estadoOperacion: "1",
  },
  {
    periodo: "20260800",
    cuo: "00000004",
    correlativoAsiento: "M00004",
    fechaEmision: "15/08/2026",
    tipoComprobante: "03",
    serie: "B001",
    numero: "00042915",
    tipoDocIdentidad: "1",
    numDocIdentidad: "72109845",
    razonSocialCliente: "Ana Torres Silva",
    baseImponibleGravada: 55.00,
    igv: 9.90,
    totalComprobante: 64.90,
    moneda: "PEN",
    estadoOperacion: "1",
  },
  {
    periodo: "20260800",
    cuo: "00000005",
    correlativoAsiento: "M00005",
    fechaEmision: "15/08/2026",
    tipoComprobante: "07",
    serie: "FC01",
    numero: "00000012",
    tipoDocIdentidad: "6",
    numDocIdentidad: "20601234567",
    razonSocialCliente: "Inversiones Retail SAC",
    baseImponibleGravada: -42.37,
    igv: -7.63,
    totalComprobante: -50.00,
    moneda: "PEN",
    docModificadoFecha: "14/08/2026",
    docModificadoTipo: "01",
    docModificadoSerie: "F001",
    docModificadoNumero: "00001248",
    estadoOperacion: "1",
  },
];

const DEMO_COMPRAS_RECORDS: SireCompraRecord[] = [
  {
    periodo: "20260800",
    cuo: "00000001",
    correlativoAsiento: "M00001",
    fechaEmision: "12/08/2026",
    tipoComprobante: "01",
    serie: "F001",
    numero: "00084521",
    tipoDocProveedor: "6",
    numDocProveedor: "20100010724",
    razonSocialProveedor: "LECHE GLORIA S.A.",
    baseImponibleGravada: 1450.00,
    igv: 261.00,
    totalComprobante: 1711.00,
    moneda: "PEN",
    estadoOperacion: "1",
  },
  {
    periodo: "20260800",
    cuo: "00000002",
    correlativoAsiento: "M00002",
    fechaEmision: "13/08/2026",
    tipoComprobante: "01",
    serie: "E001",
    numero: "00019482",
    tipoDocProveedor: "6",
    numDocProveedor: "20258963147",
    razonSocialProveedor: "ALICORP S.A.A.",
    baseImponibleGravada: 2100.00,
    igv: 378.00,
    totalComprobante: 2478.00,
    moneda: "PEN",
    estadoOperacion: "1",
  },
  {
    periodo: "20260800",
    cuo: "00000003",
    correlativoAsiento: "M00003",
    fechaEmision: "14/08/2026",
    tipoComprobante: "01",
    serie: "F102",
    numero: "00004512",
    tipoDocProveedor: "6",
    numDocProveedor: "20547896321",
    razonSocialProveedor: "DISTRIBUIDORA COSTEÑO S.A.C.",
    baseImponibleGravada: 980.00,
    igv: 176.40,
    totalComprobante: 1156.40,
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

  const ventasFilename = buildSireVentasFilename(ruc, año, mes);
  const comprasFilename = buildSireComprasFilename(ruc, año, mes);

  const ventasTxtContent = generateSireVentasTxt(DEMO_VENTAS_RECORDS);
  const comprasTxtContent = generateSireComprasTxt(DEMO_COMPRAS_RECORDS);

  const totalVentasBaseGravada = +DEMO_VENTAS_RECORDS.reduce(
    (acc, r) => acc + r.baseImponibleGravada,
    0
  ).toFixed(2);
  const totalVentasIgv = +DEMO_VENTAS_RECORDS.reduce((acc, r) => acc + r.igv, 0).toFixed(2);
  const totalVentasMonto = +DEMO_VENTAS_RECORDS.reduce(
    (acc, r) => acc + r.totalComprobante,
    0
  ).toFixed(2);

  const totalComprasBaseGravada = +DEMO_COMPRAS_RECORDS.reduce(
    (acc, r) => acc + r.baseImponibleGravada,
    0
  ).toFixed(2);
  const totalComprasIgv = +DEMO_COMPRAS_RECORDS.reduce((acc, r) => acc + r.igv, 0).toFixed(2);
  const totalComprasMonto = +DEMO_COMPRAS_RECORDS.reduce(
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
    totalVentasRegistros: DEMO_VENTAS_RECORDS.length,
    totalVentasBaseGravada,
    totalVentasIgv,
    totalVentasMonto,
    ventasTxtContent,
    ventasRecords: DEMO_VENTAS_RECORDS,
    comprasFilename,
    totalComprasRegistros: DEMO_COMPRAS_RECORDS.length,
    totalComprasBaseGravada,
    totalComprasIgv,
    totalComprasMonto,
    comprasTxtContent,
    comprasRecords: DEMO_COMPRAS_RECORDS,
    igvFiscalAPagar,
  };
}
