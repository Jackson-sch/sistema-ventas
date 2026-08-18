"use server";

export interface PublicCpeSearchResult {
  found: boolean;
  comprobante?: {
    tipo: "Boleta" | "Factura" | "Nota de Crédito";
    tipoCodigoSunat: "03" | "01" | "07";
    serieNumero: string;
    fechaEmision: string;
    horaEmision: string;
    rucEmisor: string;
    razonSocialEmisor: string;
    clienteDoc: string;
    clienteNombre: string;
    clienteTipoDoc: string;
    moneda: "PEN" | "USD";
    opGravada: number;
    opExonerada: number;
    opInafecta: number;
    igv: number;
    total: number;
    hashSunat: string;
    estadoSunat: "ACEPTADO" | "ENVIADO" | "ANULADO";
    cdrCodigo: string;
    cdrMensaje: string;
    items: {
      cantidad: number;
      unidad: string;
      descripcion: string;
      precioUnit: number;
      total: number;
    }[];
  };
  xmlContent?: string;
  cdrContent?: string;
  error?: string;
}

const DEMO_PUBLIC_CPES: Record<string, any> = {
  "B001-00042918": {
    tipo: "Boleta",
    tipoCodigoSunat: "03",
    serieNumero: "B001-00042918",
    fechaEmision: "15/08/2026",
    horaEmision: "11:42:15",
    rucEmisor: "20608945123",
    razonSocialEmisor: "NOVAMARKET SUPERMERCADOS S.A.C.",
    clienteDoc: "45892144",
    clienteNombre: "Juan Pérez García",
    clienteTipoDoc: "DNI",
    moneda: "PEN",
    opGravada: 72.88,
    opExonerada: 0,
    opInafecta: 0,
    igv: 13.12,
    total: 86.00,
    hashSunat: "a8F3k9Xp2M5n7Q1=",
    estadoSunat: "ACEPTADO",
    cdrCodigo: "0",
    cdrMensaje: "La Boleta de Venta Electrónica número B001-00042918 ha sido ACEPTADA.",
    items: [
      { cantidad: 4, unidad: "und", descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 18.00 },
      { cantidad: 2, unidad: "und", descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 10.40 },
      { cantidad: 5, unidad: "und", descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 49.00 },
      { cantidad: 1.8, unidad: "kg", descripcion: "Manzana Delicia Nacional (kg)", precioUnit: 4.80, total: 8.60 },
    ],
  },
  "F001-00001249": {
    tipo: "Factura",
    tipoCodigoSunat: "01",
    serieNumero: "F001-00001249",
    fechaEmision: "15/08/2026",
    horaEmision: "14:10:00",
    rucEmisor: "20608945123",
    razonSocialEmisor: "NOVAMARKET SUPERMERCADOS S.A.C.",
    clienteDoc: "20601234567",
    clienteNombre: "Inversiones Retail SAC",
    clienteTipoDoc: "RUC",
    moneda: "PEN",
    opGravada: 381.36,
    opExonerada: 0,
    opInafecta: 0,
    igv: 68.64,
    total: 450.00,
    hashSunat: "x9M2q7Rt4P1v8L6=",
    estadoSunat: "ACEPTADO",
    cdrCodigo: "0",
    cdrMensaje: "La Factura Electrónica número F001-00001249 ha sido ACEPTADA.",
    items: [
      { cantidad: 2, unidad: "und", descripcion: "Leche Gloria Entera 400g (Caja x 24)", precioUnit: 108.00, total: 216.00 },
      { cantidad: 1, unidad: "und", descripcion: "Arroz Costeño Extra 1kg (Saco x 50kg)", precioUnit: 234.00, total: 234.00 },
    ],
  },
  "B001-00042917": {
    tipo: "Boleta",
    tipoCodigoSunat: "03",
    serieNumero: "B001-00042917",
    fechaEmision: "15/08/2026",
    horaEmision: "11:20:05",
    rucEmisor: "20608945123",
    razonSocialEmisor: "NOVAMARKET SUPERMERCADOS S.A.C.",
    clienteDoc: "00000000",
    clienteNombre: "Clientes Varios",
    clienteTipoDoc: "DNI",
    moneda: "PEN",
    opGravada: 20.34,
    opExonerada: 0,
    opInafecta: 0,
    igv: 3.66,
    total: 24.00,
    hashSunat: "m7K1v5Zq8P2c4X9=",
    estadoSunat: "ACEPTADO",
    cdrCodigo: "0",
    cdrMensaje: "La Boleta de Venta Electrónica número B001-00042917 ha sido ACEPTADA.",
    items: [
      { cantidad: 2, unidad: "und", descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 19.60 },
      { cantidad: 1, unidad: "und", descripcion: "Leche Gloria Entera 400g", precioUnit: 4.40, total: 4.40 },
    ],
  },
};

export async function lookupPublicCpeAction(input: {
  tipoComprobante: string; // "01" | "03" | "07"
  serie: string;
  numero: string;
  fechaEmision: string;
  totalMonto: number;
}): Promise<PublicCpeSearchResult> {
  const serie = input.serie.trim().toUpperCase();
  const numero = input.numero.trim().padStart(8, "0");
  const fullKey = `${serie}-${numero}`;

  const match = DEMO_PUBLIC_CPES[fullKey];

  if (!match) {
    return {
      found: false,
      error: `No se encontró ningún comprobante electrónico con la numeración ${serie}-${numero} en la base de datos de SUNAT para los datos ingresados.`,
    };
  }

  // Generate official UBL 2.1 XML String representation
  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
  <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
  <cbc:CustomizationID>2.0</cbc:CustomizationID>
  <cbc:ID>${match.serieNumero}</cbc:ID>
  <cbc:IssueDate>2026-08-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode listID="0101">${match.tipoCodigoSunat}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${match.moneda}</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="6">${match.rucEmisor}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${match.razonSocialEmisor}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="${match.clienteTipoDoc === "RUC" ? "6" : "1"}">${match.clienteDoc}</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${match.clienteNombre}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${match.moneda}">${match.opGravada.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${match.moneda}">${match.total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${match.moneda}">${match.total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  <!-- SUNAT Hash Code: ${match.hashSunat} -->
</Invoice>`;

  const cdrContent = `<?xml version="1.0" encoding="UTF-8"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2">
  <cbc:ResponseDate>2026-08-15</cbc:ResponseDate>
  <cac:DocumentResponse>
    <cac:Response>
      <cbc:ReferenceID>${match.serieNumero}</cbc:ReferenceID>
      <cbc:ResponseCode>${match.cdrCodigo}</cbc:ResponseCode>
      <cbc:Description>${match.cdrMensaje}</cbc:Description>
    </cac:Response>
  </cac:DocumentResponse>
</ApplicationResponse>`;

  return {
    found: true,
    comprobante: match,
    xmlContent,
    cdrContent,
  };
}
