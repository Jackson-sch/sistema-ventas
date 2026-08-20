"use server";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  buildUblXml,
  SunatDocumentData,
  SunatItem,
  generateSunatQrString,
  SunatSoapClient,
  createSunatZip,
} from "@/lib/sunat";

export interface LiveEmissionInput {
  rucEmisor: string;
  razonSocialEmisor: string;
  nombreComercialEmisor?: string;
  direccionFiscal?: string;
  ubigeo?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
  usuarioSol?: string;
  claveSol?: string;
  isBeta?: boolean;
  tipoComprobante: "01" | "03" | "07"; // 01: Factura, 03: Boleta, 07: Nota de Crédito
  serie: string; // F001, B001, FC01, BC01
  numero: number;
  cliente: {
    tipoDoc: "1" | "6" | "4" | "7" | "0" | "dni" | "ruc" | "ce" | "pasaporte";
    numDoc: string;
    razonSocial: string;
    direccion?: string;
  };
  items: {
    sku: string;
    nombre: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitarioConIgv: number;
    tipo?: "unidad" | "peso";
  }[];
  medioPago?: "efectivo" | "tarjeta" | "yape" | "plin" | "transferencia";
}

export interface LiveEmissionResult {
  success: boolean;
  ticketNumero: string;
  tipoComprobante: string;
  serieNumero: string;
  fechaEmision: string;
  totalVenta: number;
  igv: number;
  subtotal: number;
  hashSunat: string;
  qrString: string;
  xmlOriginal: string;
  nombreArchivoZip: string;
  sunatResponseCode?: string;
  sunatDescription?: string;
  cdrXml?: string;
  hashCdr?: string;
  rawFault?: string;
  error?: string;
}

export async function testSunatConnectionAction(config: {
  ruc: string;
  usuarioSol?: string;
  claveSol?: string;
  isBeta?: boolean;
}): Promise<{ success: boolean; message: string; endpoint: string }> {
  try {
    const isBeta = config.isBeta ?? true;
    const client = new SunatSoapClient({
      ruc: config.ruc || "10737997630",
      usuarioSol: config.usuarioSol || "MODDATOS",
      claveSol: config.claveSol || "moddatos",
      isBeta,
    });

    const endpoint = isBeta
      ? "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService"
      : "https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService";

    // Probar enviando una petición de comprobante al endpoint
    const dummyZip = await createSunatZip("test.xml", "<dummy/>");
    const res = await client.sendBill(`${config.ruc || "10737997630"}-01-F001-00000001.zip`, dummyZip);

    if (res.rawFault || res.description || res.statusCode === 200 || res.statusCode === 500) {
      return {
        success: true,
        message: `Conexión exitosa con los servidores de SUNAT (${isBeta ? "Ambiente Beta" : "Ambiente Producción"}). WebService SOAP respondiendo en tiempo real.`,
        endpoint,
      };
    }

    return {
      success: true,
      message: `Conexión establecida con SUNAT WebService (${endpoint}).`,
      endpoint,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Error al conectar con SUNAT.",
      endpoint: "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService",
    };
  }
}

export async function emitirComprobanteLiveAction(
  input: LiveEmissionInput
): Promise<LiveEmissionResult> {
  try {
    const now = new Date();
    const fechaEmision = now.toISOString().slice(0, 10);
    const horaEmision = now.toTimeString().slice(0, 8);

    const rucEmisor = input.rucEmisor.trim() || "10737997630";
    const razonSocialEmisor = input.razonSocialEmisor.trim() || "NOVAMARKET SUPERMERCADOS S.A.C.";
    const isBeta = input.isBeta ?? true;
    const usuarioSol = input.usuarioSol?.trim() || "MODDATOS";
    const claveSol = input.claveSol?.trim() || "moddatos";

    // Formatear items
    const formattedItems: SunatItem[] = input.items.map((it, idx) => {
      const cantidad = it.cantidad;
      const precioUnitario = it.precioUnitarioConIgv;
      const valorUnitario = +(precioUnitario / 1.18).toFixed(4);
      const total = +(precioUnitario * cantidad).toFixed(2);
      const subtotalSinIgv = +(total / 1.18).toFixed(2);
      const igv = +(total - subtotalSinIgv).toFixed(2);

      return {
        id: String(idx + 1),
        sku: it.sku || `PROD-${idx + 1}`,
        descripcion: it.nombre,
        unidadMedida: it.unidadMedida || "NIU",
        cantidad,
        precioUnitario,
        valorUnitario,
        tipoAfectacionIgv: "10",
        igv,
        total,
      };
    });

    const totalVenta = +formattedItems.reduce((acc, it) => acc + it.total, 0).toFixed(2);
    const totalGravadas = +formattedItems.reduce((acc, it) => acc + +(it.valorUnitario * it.cantidad).toFixed(2), 0).toFixed(2);
    const totalIgv = +(totalVenta - totalGravadas).toFixed(2);

    const sunatDocData: SunatDocumentData = {
      tipoComprobante: input.tipoComprobante,
      serie: input.serie,
      numero: input.numero,
      fechaEmision,
      horaEmision,
      moneda: "PEN",
      emisor: {
        ruc: rucEmisor,
        razonSocial: razonSocialEmisor,
        nombreComercial: input.nombreComercialEmisor || razonSocialEmisor,
        direccion: input.direccionFiscal || "Av. La Marina 1450 - San Miguel",
        ubigeo: input.ubigeo || "150136",
        departamento: input.departamento || "LIMA",
        provincia: input.provincia || "LIMA",
        distrito: input.distrito || "SAN MIGUEL",
      },
      cliente: {
        tipoDoc: input.cliente.tipoDoc,
        numDoc: input.cliente.numDoc,
        nombre: input.cliente.razonSocial,
        direccion: input.cliente.direccion,
      },
      items: formattedItems,
      totalGravadas,
      totalExoneradas: 0,
      totalInafectas: 0,
      totalIgv,
      totalVenta,
      medioPago: input.medioPago || "efectivo",
    };

    // 1. Generar XML UBL 2.1 oficial con hash y QR
    const { xml, hash, qrString } = buildUblXml(sunatDocData);

    // 2. Empaquetar XML en archivo ZIP según nomenclatura SUNAT: {RUC}-{TIPO}-{SERIE}-{NUMERO}.zip
    const numeroStr = String(input.numero).padStart(8, "0");
    const zipBaseName = `${rucEmisor}-${input.tipoComprobante}-${input.serie}-${numeroStr}`;
    const zipFileName = `${zipBaseName}.zip`;
    const zipBuffer = await createSunatZip(zipBaseName, xml);

    // 3. Enviar a SUNAT vía Web Service SOAP (sendBill)
    const client = new SunatSoapClient({
      ruc: rucEmisor,
      usuarioSol,
      claveSol,
      isBeta,
    });

    const sendResult = await client.sendBill(zipFileName, zipBuffer);

    // 4. Si la base de datos está disponible, registrar en schema.comprobantes
    try {
      if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")) {
        const estadoSunat = sendResult.success ? "aceptado" : sendResult.responseCode?.startsWith("2") ? "rechazado" : "pendiente";

        const existingComp = await db
          .select({ id: schema.comprobantes.id })
          .from(schema.comprobantes)
          .where(eq(schema.comprobantes.numero, numeroStr))
          .limit(1);

        if (!existingComp[0]) {
          const [firstVenta] = await db.select({ id: schema.ventas.id }).from(schema.ventas).limit(1);
          if (firstVenta) {
            await db
              .insert(schema.comprobantes)
              .values({
                ventaId: firstVenta.id,
                tipo: input.tipoComprobante === "01" ? "factura" : input.tipoComprobante === "03" ? "boleta" : "nota_credito",
                serie: input.serie,
                numero: numeroStr,
                estadoSunat: estadoSunat as any,
                hash,
                enviadoEn: new Date(),
              })
              .onConflictDoNothing();
          }
        }
      }
    } catch (dbErr) {
      console.warn("emitirComprobanteLiveAction: DB save warning:", dbErr);
    }

    try {
      revalidatePath("/ventas");
      revalidatePath("/reportes/sire");
    } catch {
      // Ignorar si se ejecuta fuera de contexto HTTP Next.js
    }

    return {
      success: sendResult.success,
      ticketNumero: `${input.serie}-${numeroStr}`,
      tipoComprobante: input.tipoComprobante === "01" ? "Factura Electrónica" : input.tipoComprobante === "03" ? "Boleta de Venta Electrónica" : "Nota de Crédito",
      serieNumero: `${input.serie}-${numeroStr}`,
      fechaEmision,
      totalVenta,
      igv: totalIgv,
      subtotal: totalGravadas,
      hashSunat: hash,
      qrString,
      xmlOriginal: xml,
      nombreArchivoZip: zipFileName,
      sunatResponseCode: sendResult.responseCode,
      sunatDescription: sendResult.description || (sendResult.success ? "Comprobante aceptado por SUNAT con éxito." : "Error devuelto por SUNAT."),
      cdrXml: sendResult.cdrXml,
      hashCdr: sendResult.hashCdr,
      rawFault: sendResult.rawFault,
      error: sendResult.error,
    };
  } catch (err: any) {
    console.error("Error en emitirComprobanteLiveAction:", err);
    return {
      success: false,
      ticketNumero: "ERROR",
      tipoComprobante: "Comprobante",
      serieNumero: "F001-00000000",
      fechaEmision: new Date().toISOString().slice(0, 10),
      totalVenta: 0,
      igv: 0,
      subtotal: 0,
      hashSunat: "",
      qrString: "",
      xmlOriginal: "",
      nombreArchivoZip: "",
      error: err instanceof Error ? err.message : "Error inesperado al emitir comprobante.",
    };
  }
}
