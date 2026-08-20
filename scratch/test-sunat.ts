import { emitirComprobanteLiveAction, testSunatConnectionAction } from "../src/actions/sunat-live-actions";

async function main() {
  console.log("===============================================================");
  console.log("🚀 Iniciando prueba de facturación electrónica SUNAT (Beta)...");
  console.log("   • RUC Emisor: 10737997630 (Persona Natural)");
  console.log("   • Ambiente: BETA Oficial SUNAT (e-beta.sunat.gob.pe)");
  console.log("===============================================================");

  // 1. Probar conexión básica
  console.log("\n1️⃣ Probando conexión con Web Service SOAP de SUNAT...");
  const connTest = await testSunatConnectionAction({
    ruc: "10737997630",
    usuarioSol: "MODDATOS",
    claveSol: "moddatos",
    isBeta: true,
  });
  console.log("   → Resultado Conexión:", connTest.message);

  // 2. Emitir Factura Electrónica de Prueba
  console.log("\n2️⃣ Emitiendo Factura Electrónica F001-00000001...");
  const facturaResult = await emitirComprobanteLiveAction({
    rucEmisor: "10737997630",
    razonSocialEmisor: "JUAN CARLOS PEREZ GOMEZ",
    nombreComercialEmisor: "NovaMarket Retail",
    direccionFiscal: "Av. La Marina 1450 - San Miguel - Lima",
    ubigeo: "150136",
    usuarioSol: "MODDATOS",
    claveSol: "moddatos",
    isBeta: true,
    tipoComprobante: "01", // Factura
    serie: "F001",
    numero: 1,
    cliente: {
      tipoDoc: "6", // RUC
      numDoc: "20601234567",
      razonSocial: "INVERSIONES RETAIL PERU S.A.C.",
      direccion: "Av. Rivera Navarrete 501 - San Isidro",
    },
    items: [
      {
        sku: "GLO-001",
        nombre: "Leche Gloria Entera 400g (Lata)",
        cantidad: 10,
        unidadMedida: "NIU",
        precioUnitarioConIgv: 4.50,
      },
      {
        sku: "PRI-001",
        nombre: "Aceite Primor Premium 1L",
        cantidad: 5,
        unidadMedida: "NIU",
        precioUnitarioConIgv: 9.80,
      },
    ],
  });

  console.log("\n===============================================================");
  console.log("📄 RESULTADO DE EMISIÓN SUNAT:");
  console.log("   • Comprobante:", facturaResult.serieNumero);
  console.log("   • Subtotal: S/", facturaResult.subtotal.toFixed(2));
  console.log("   • IGV (18%): S/", facturaResult.igv.toFixed(2));
  console.log("   • Total Venta: S/", facturaResult.totalVenta.toFixed(2));
  console.log("   • Hash SHA-256 (DigestValue):", facturaResult.hashSunat);
  console.log("   • Código QR SUNAT:", facturaResult.qrString);
  console.log("   • Archivo ZIP generado:", facturaResult.nombreArchivoZip);
  console.log("   • Código de Respuesta SUNAT:", facturaResult.sunatResponseCode);
  console.log("   • Descripción SUNAT:", facturaResult.sunatDescription);
  if (facturaResult.hashCdr) {
    console.log("   • Hash del CDR SUNAT:", facturaResult.hashCdr);
  }
  if (facturaResult.rawFault) {
    console.log("   ⚠️ Detalle SOAP:", facturaResult.rawFault.slice(0, 300));
  }
  console.log("===============================================================");
}

main();
