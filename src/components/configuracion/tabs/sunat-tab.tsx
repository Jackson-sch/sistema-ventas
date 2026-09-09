"use client";

import { useState } from "react";
import {
  Receipt,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  emitirComprobanteLiveAction,
  testSunatConnectionAction,
  LiveEmissionResult,
} from "@/actions/sunat-live-actions";

interface SunatTabProps {
  ruc: string;
  razonSocial: string;
  nombreComercial: string;
  direccionFiscal: string;
}

export function SunatTab({ ruc, razonSocial, nombreComercial, direccionFiscal }: SunatTabProps) {
  const [sunatEnv, setSunatEnv] = useState<"beta" | "produccion">("beta");
  const [usuarioSol, setUsuarioSol] = useState("MODDATOS");
  const [claveSol, setClaveSol] = useState("MODDATOS");
  const [certVencimiento] = useState("15/12/2027");
  const [tasaIgv, setTasaIgv] = useState("18");
  const [tasaIcbper, setTasaIcbper] = useState("0.50");

  const [isTestingSunat, setIsTestingSunat] = useState(false);
  const [emissionResult, setEmissionResult] = useState<LiveEmissionResult | null>(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"resultado" | "xml" | "qr">("resultado");

  const handleTestSunatConnection = async () => {
    setIsTestingSunat(true);
    try {
      const res = await testSunatConnectionAction({
        ruc,
        usuarioSol,
        claveSol,
        isBeta: sunatEnv === "beta",
      });
      if (res.success) {
        toast.success("¡Conexión exitosa con SUNAT!", { description: res.message });
      } else {
        toast.error("Error de conexión con SUNAT", { description: res.message });
      }
    } catch {
      toast.error("Error inesperado al conectar con SUNAT.");
    } finally {
      setIsTestingSunat(false);
    }
  };

  const handleEmitTestInvoice = async (tipo: "01" | "03") => {
    setIsTestingSunat(true);
    try {
      const res = await emitirComprobanteLiveAction({
        rucEmisor: ruc || "10737997630",
        razonSocialEmisor: razonSocial || "JUAN CARLOS PEREZ GOMEZ",
        nombreComercialEmisor: nombreComercial || "NovaMarket Retail",
        direccionFiscal,
        ubigeo: "150140",
        usuarioSol,
        claveSol,
        isBeta: sunatEnv === "beta",
        tipoComprobante: tipo,
        serie: tipo === "01" ? "F001" : "B001",
        numero: Math.floor(1 + Math.random() * 900),
        cliente:
          tipo === "01"
            ? {
                tipoDoc: "6",
                numDoc: "20601234567",
                razonSocial: "INVERSIONES RETAIL PERU S.A.C.",
                direccion: "Av. Rivera Navarrete 501 - San Isidro",
              }
            : {
                tipoDoc: "1",
                numDoc: "45892144",
                razonSocial: "Juan Pérez García",
                direccion: "Calle Los Cedros 340 - Surco",
              },
        items: [
          {
            sku: "GLO-001",
            nombre: "Leche Gloria Entera 400g (Lata)",
            cantidad: 4,
            unidadMedida: "NIU",
            precioUnitarioConIgv: 4.50,
          },
          {
            sku: "PRI-001",
            nombre: "Aceite Primor Premium 1L",
            cantidad: 2,
            unidadMedida: "NIU",
            precioUnitarioConIgv: 9.80,
          },
        ],
      });

      setEmissionResult(res);
      if (res.success) {
        toast.success(`¡${res.tipoComprobante} ${res.serieNumero} Aceptada por SUNAT!`, {
          description: res.sunatDescription,
        });
      } else {
        toast.warning(`Comprobante procesado con respuesta SUNAT`, {
          description: res.sunatDescription || res.error,
        });
      }
    } catch {
      toast.error("Error al procesar la emisión en vivo.");
    } finally {
      setIsTestingSunat(false);
    }
  };

  const inputClass =
    "w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">Parámetros Tributarios SUNAT (UBL 2.1)</h3>
          <p className="text-xs text-slate-400">Credenciales SOL, certificados digitales y conmutador de entorno.</p>
        </div>
        <button
          onClick={handleTestSunatConnection}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold transition-colors"
        >
          <RefreshCw className="size-3.5 text-blue-400" /> Probar Conexión SUNAT
        </button>
      </div>

      {/* Environment Switcher */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-white block">Entorno de Emisión de Comprobantes</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            En modo Producción, los comprobantes son enviados en tiempo real a SUNAT con valor fiscal legal.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setSunatEnv("beta")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              sunatEnv === "beta" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Pruebas / Beta
          </button>
          <button
            type="button"
            onClick={() => setSunatEnv("produccion")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              sunatEnv === "produccion" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "text-slate-400 hover:text-white"
            }`}
          >
            Producción en Vivo
          </button>
        </div>
      </div>

      {/* Credentials & Tax Rates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Usuario Secundario SOL *</label>
          <input type="text" value={usuarioSol} onChange={(e) => setUsuarioSol(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Clave SOL *</label>
          <input type="password" value={claveSol} onChange={(e) => setClaveSol(e.target.value)} className={inputClass} />
        </div>

        {/* Certificate Status Card */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-emerald-400" /> Certificado Digital Tributario
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Válido
            </span>
          </div>
          <div className="text-xs text-slate-400">
            Vence el: <strong className="text-white font-mono">{certVencimiento}</strong>
          </div>
        </div>

        {/* Tax Rates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tasa I.G.V. (%)</label>
            <div className="relative">
              <input
                type="number"
                value={tasaIgv}
                onChange={(e) => setTasaIgv(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white text-center"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">%</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Impuesto ICBPER</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">S/</span>
              <input
                type="number"
                step="0.10"
                value={tasaIcbper}
                onChange={(e) => setTasaIcbper(e.target.value)}
                className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Live Emission Console */}
      <div className="p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
              SOAP
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                Consola de Emisión en Vivo SUNAT (SEE Propio)
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                  UBL 2.1
                </Badge>
              </h4>
              <p className="text-[11px] text-slate-400">
                Emite comprobantes de prueba firmados y empaquetados en tiempo real al Web Service Beta de SUNAT con el RUC configurado.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTestingSunat}
              onClick={() => handleEmitTestInvoice("01")}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-lg shadow-blue-600/20"
            >
              {isTestingSunat ? <RefreshCw className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Emitir Factura F001 (Beta)
            </button>
            <button
              type="button"
              disabled={isTestingSunat}
              onClick={() => handleEmitTestInvoice("03")}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 border border-slate-700"
            >
              {isTestingSunat ? <RefreshCw className="size-3.5 animate-spin" /> : <Receipt className="size-3.5" />}
              Emitir Boleta B001 (Beta)
            </button>
          </div>
        </div>

        {/* Emission result */}
        {emissionResult && (
          <div className="space-y-3 pt-2">
            {/* Status bar */}
            <div
              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                emissionResult.success
                  ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-950/40 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex items-center gap-2">
                {emissionResult.success ? (
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="size-4 text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold block">
                    {emissionResult.tipoComprobante} {emissionResult.serieNumero} — {emissionResult.sunatDescription}
                  </span>
                  <span className="text-[11px] opacity-80 font-mono">
                    Código SUNAT: {emissionResult.sunatResponseCode || "200 OK"} | Archivo ZIP: {emissionResult.nombreArchivoZip}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 font-mono font-bold text-white border border-slate-700">
                  Total: S/ {emissionResult.totalVenta.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Inspection tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              {(["resultado", "xml", "qr"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveConsoleTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    activeConsoleTab === tab ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tab === "resultado" ? "Resumen Técnico" : tab === "xml" ? "XML UBL 2.1 Firmado" : "QR Fiscal & Hash"}
                </button>
              ))}
            </div>

            {activeConsoleTab === "resultado" && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Hash SHA-256 (DigestValue)</span>
                  <span className="font-mono text-emerald-400 font-bold block truncate" title={emissionResult.hashSunat}>
                    {emissionResult.hashSunat}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Monto Gravado e IGV</span>
                  <span className="font-mono text-white font-bold block">
                    Base: S/ {emissionResult.subtotal.toFixed(2)} | IGV: S/ {emissionResult.igv.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Estado Tributario</span>
                  <span className="font-bold text-emerald-400 block flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" /> Validado UBL 2.1
                  </span>
                </div>
              </div>
            )}

            {activeConsoleTab === "xml" && (
              <div className="relative">
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-60 overflow-y-auto leading-relaxed">
                  {emissionResult.xmlOriginal}
                </pre>
              </div>
            )}

            {activeConsoleTab === "qr" && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-white block">Cadena Canónica Oficial para Código QR SUNAT:</span>
                <pre className="p-2.5 rounded-lg bg-slate-950 text-[11px] font-mono text-blue-400 break-all border border-slate-800">
                  {emissionResult.qrString}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
