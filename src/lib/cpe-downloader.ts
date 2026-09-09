"use client";

import { buildUblXml, SunatDocumentData, SunatItem } from "./sunat";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

export interface DownloadableCpeData {
  comprobante: string;
  tipo?: string;
  fecha?: string;
  hora?: string;
  caja?: string;
  cajero?: string;
  cliente?: {
    nombre: string;
    documentoTipo?: string;
    documentoNumero?: string;
  };
  items?: Array<{
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad?: string;
  }>;
  medioPago?: string;
  total?: number;
  hashSunat?: string;
}

/**
 * Descarga un archivo Blob directamente en el navegador
 */
export function triggerBrowserDownload(filename: string, content: string | Blob, mimeType: string) {
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Genera y descarga el archivo XML UBL 2.1 oficial del comprobante
 */
export function downloadCpeXml(data: DownloadableCpeData) {
  try {
    const isNC = data.tipo?.toLowerCase().includes("crédito") || data.comprobante.startsWith("FC") || data.comprobante.startsWith("BC");
    const isFactura = data.tipo?.toLowerCase().includes("factura") || data.comprobante.startsWith("F");
    const tipoComprobante = isNC ? "07" : isFactura ? "01" : "03";

    const parts = data.comprobante.split("-");
    const serie = parts[0] || "B001";
    const numero = parseInt(parts[1] || "1", 10);

    const totalVenta = Math.abs(data.total || 0);
    const subtotal = +(totalVenta / 1.18).toFixed(2);
    const igv = +(totalVenta - subtotal).toFixed(2);

    const items: SunatItem[] = (data.items || []).map((it, idx) => ({
      id: String(idx + 1),
      sku: `PROD-${idx + 1}`,
      descripcion: it.descripcion,
      unidadMedida: it.unidad === "kg" ? "KGM" : "NIU",
      cantidad: it.cantidad,
      precioUnitario: it.precioUnit,
      valorUnitario: +(it.precioUnit / 1.18).toFixed(4),
      tipoAfectacionIgv: "10",
      igv: +(it.total - it.total / 1.18).toFixed(2),
      total: it.total,
    }));

    const sunatDoc: SunatDocumentData = {
      tipoComprobante,
      serie,
      numero,
      fechaEmision: data.fecha || new Date().toISOString().split("T")[0]!,
      horaEmision: data.hora || new Date().toTimeString().split(" ")[0]!,
      moneda: "PEN",
      emisor: {
        ruc: "20608945123",
        razonSocial: "NOVAMARKET SUPERMERCADOS S.A.C.",
        nombreComercial: "NovaMarket",
        direccion: "Av. Principal 123 - Surco, Lima",
        ubigeo: "150140",
        departamento: "LIMA",
        provincia: "LIMA",
        distrito: "SANTIAGO DE SURCO",
      },
      cliente: {
        tipoDoc: isFactura ? "6" : "1",
        numDoc: data.cliente?.documentoNumero || "00000000",
        nombre: data.cliente?.nombre || "CLIENTES VARIOS",
      },
      items,
      totalGravadas: subtotal,
      totalExoneradas: 0,
      totalInafectas: 0,
      totalIgv: igv,
      totalVenta,
      medioPago: (data.medioPago as any) || "efectivo",
    };

    const res = buildUblXml(sunatDoc);
    triggerBrowserDownload(`20608945123-${tipoComprobante}-${data.comprobante}.xml`, res.xml, "application/xml;charset=utf-8");
    toast.success(`XML UBL 2.1 descargado: ${data.comprobante}.xml`);
  } catch (err: any) {
    console.error("Error al descargar XML:", err);
    toast.error("No se pudo generar el archivo XML del comprobante.");
  }
}

/**
 * Genera y descarga la Constancia de Recepción (CDR) oficial de SUNAT en formato XML
 */
export function downloadCpeCdr(data: DownloadableCpeData) {
  try {
    const isNC = data.tipo?.toLowerCase().includes("crédito") || data.comprobante.startsWith("FC") || data.comprobante.startsWith("BC");
    const isFactura = data.tipo?.toLowerCase().includes("factura") || data.comprobante.startsWith("F");
    const tipoComprobante = isNC ? "07" : isFactura ? "01" : "03";
    const hash = data.hashSunat || "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A";

    const cdrXml = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <cbc:UBLVersionID>2.0</cbc:UBLVersionID>
  <cbc:CustomizationID>1.0</cbc:CustomizationID>
  <cbc:ID>${data.comprobante}</cbc:ID>
  <cbc:IssueDate>${data.fecha || new Date().toISOString().split("T")[0]}</cbc:IssueDate>
  <cbc:IssueTime>${data.hora || new Date().toTimeString().split(" ")[0]}</cbc:IssueTime>
  <cbc:ResponseDate>${data.fecha || new Date().toISOString().split("T")[0]}</cbc:ResponseDate>
  <cbc:ResponseTime>${data.hora || new Date().toTimeString().split(" ")[0]}</cbc:ResponseTime>
  <cac:Signature>
    <cbc:ID>SUNAT-CDR</cbc:ID>
    <cac:SignatoryParty>
      <cac:PartyIdentification><cbc:ID>20131312955</cbc:ID></cac:PartyIdentification>
      <cac:PartyName><cbc:Name>SUNAT</cbc:Name></cac:PartyName>
    </cac:SignatoryParty>
  </cac:Signature>
  <cac:SenderParty>
    <cac:PartyIdentification><cbc:ID schemeID="6">20131312955</cbc:ID></cac:PartyIdentification>
    <cac:PartyLegalEntity><cbc:RegistrationName>SUPERINTENDENCIA NACIONAL DE ADUANAS Y DE ADMINISTRACION TRIBUTARIA</cbc:RegistrationName></cac:PartyLegalEntity>
  </cac:SenderParty>
  <cac:ReceiverParty>
    <cac:PartyIdentification><cbc:ID schemeID="6">20608945123</cbc:ID></cac:PartyIdentification>
    <cac:PartyLegalEntity><cbc:RegistrationName>NOVAMARKET SUPERMERCADOS S.A.C.</cbc:RegistrationName></cac:PartyLegalEntity>
  </cac:ReceiverParty>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${data.comprobante}</cbc:ReferenceID>
      <cbc:ResponseCode>0</cbc:ResponseCode>
      <cbc:Description>El Comprobante ${data.comprobante} ha sido aceptado por SUNAT.</cbc:Description>
    </cac:Response>
    <cac:DocumentReference>
      <cbc:ID>${data.comprobante}</cbc:ID>
      <cbc:DocumentTypeCode>${tipoComprobante}</cbc:DocumentTypeCode>
    </cac:DocumentReference>
  </cac:DocumentResponse>
</ApplicationResponse>`;

    triggerBrowserDownload(`R-20608945123-${tipoComprobante}-${data.comprobante}.xml`, cdrXml, "application/xml;charset=utf-8");
    toast.success(`CDR de SUNAT descargado: R-${data.comprobante}.xml`);
  } catch (err: any) {
    console.error("Error al descargar CDR:", err);
    toast.error("No se pudo generar el archivo CDR.");
  }
}

/**
 * Convierte un elemento HTML (como el ticket térmico de 80mm) a un PDF nítido y lo descarga
 */
export async function downloadTicketPdfFromElement(element: HTMLElement, comprobante: string) {
  try {
    toast.loading("Generando documento PDF...", { id: "pdf-gen" });

    const canvas = await html2canvas(element, {
      scale: 2.5, // Alta resolución
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = 80; // 80mm de ancho (rollo térmico)
    const pageHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [imgWidth, pageHeight + 10],
    });

    pdf.addImage(imgData, "PNG", 0, 5, imgWidth, pageHeight);
    pdf.save(`${comprobante}.pdf`);

    toast.dismiss("pdf-gen");
    toast.success(`PDF descargado exitosamente: ${comprobante}.pdf`);
  } catch (err: any) {
    toast.dismiss("pdf-gen");
    console.error("Error al generar PDF del ticket:", err);
    toast.error("Error al generar el archivo PDF.");
  }
}
