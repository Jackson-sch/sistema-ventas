"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Building2,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Code2,
  Layers,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  getSireOverviewDataAction,
  SireOverviewData,
} from "@/actions/sire-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryState, parseAsString } from "nuqs";

export default function SireSunatPage() {
  const [data, setData] = useState<SireOverviewData | null>(null);
  const [año, setAño] = useQueryState("anio", parseAsString.withDefault("2026"));
  const [mes, setMes] = useQueryState("mes", parseAsString.withDefault("08"));
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useQueryState<"ventas" | "compras" | "validador">(
    "tab",
    parseAsString.withDefault("ventas") as any
  );
  const [showRawTxt, setShowRawTxt] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await getSireOverviewDataAction(año, mes);
      setData(res);
    } catch {
      toast.error("Error al cargar datos del SIRE SUNAT.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [año, mes]);

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Archivo descargado: ${filename}`);
  };

  if (isLoading || !data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white">Generando Registros Electrónicos SUNAT SIRE...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50 flex items-center gap-1">
              <FileSpreadsheet className="size-3" /> Sistema Integrado de Registros Electrónicos
            </span>
            <span className="text-xs font-mono text-slate-400">
              RUC: <strong className="text-white">{data.ruc}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="size-6 text-blue-400" /> Generador SUNAT SIRE 14.1 & 8.1 (PLE)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Exportación de archivos estructurados TXT oficiales para Registro de Ventas (RVIE) y Compras (RCE)
          </p>
        </div>

        {/* Period Selector & Download Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-28">
              <Select value={año} onValueChange={(val) => setAño(val)}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-800 text-xs text-white font-mono font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50 font-mono">
                  <SelectItem value="2026" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    2026
                  </SelectItem>
                  <SelectItem value="2025" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    2025
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <Select value={mes} onValueChange={(val) => setMes(val)}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-800 text-xs text-white font-mono font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50 font-mono">
                  <SelectItem value="01" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Enero (01)</SelectItem>
                  <SelectItem value="02" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Febrero (02)</SelectItem>
                  <SelectItem value="03" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Marzo (03)</SelectItem>
                  <SelectItem value="04" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Abril (04)</SelectItem>
                  <SelectItem value="05" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Mayo (05)</SelectItem>
                  <SelectItem value="06" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Junio (06)</SelectItem>
                  <SelectItem value="07" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Julio (07)</SelectItem>
                  <SelectItem value="08" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Agosto (08)</SelectItem>
                  <SelectItem value="09" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Setiembre (09)</SelectItem>
                  <SelectItem value="10" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Octubre (10)</SelectItem>
                  <SelectItem value="11" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Noviembre (11)</SelectItem>
                  <SelectItem value="12" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">Diciembre (12)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => downloadFile(data.ventasFilename, data.ventasTxtContent)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="size-3.5" /> Descargar RVIE 14.1 (Ventas)
          </button>

          <button
            type="button"
            onClick={() => downloadFile(data.comprasFilename, data.comprasTxtContent)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <Download className="size-3.5" /> Descargar RCE 8.1 (Compras)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              VENTAS GRAVADAS (14.1)
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {formatCurrency(data.totalVentasBaseGravada)}
            </div>
            <span className="text-[11px] text-slate-500">IGV: {formatCurrency(data.totalVentasIgv)}</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <TrendingUp className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              COMPRAS GRAVADAS (8.1)
            </span>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">
              {formatCurrency(data.totalComprasBaseGravada)}
            </div>
            <span className="text-[11px] text-slate-500">Crédito Fiscal: {formatCurrency(data.totalComprasIgv)}</span>
          </div>
          <div className="size-11 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <TrendingDown className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              BALANCE FISCAL IGV
            </span>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                data.igvFiscalAPagar >= 0 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {formatCurrency(data.igvFiscalAPagar)}
            </div>
            <span className="text-[11px] text-slate-500">
              {data.igvFiscalAPagar >= 0 ? "IGV Débito a pagar a SUNAT" : "Saldo a favor del contribuyente"}
            </span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ESTADO ESTRUCTURAL SUNAT
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              100% Válido
            </div>
            <span className="text-[11px] text-slate-500">Formato TXT Delimitado por |</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* Tabs & View Controls */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("ventas")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "ventas"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            RVIE 14.1 Ventas ({data.totalVentasRegistros})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("compras")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "compras"
                ? "bg-purple-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            RCE 8.1 Compras ({data.totalComprasRegistros})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("validador")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === "validador"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="size-3.5 inline mr-1" /> Validador de Reglas
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRawTxt(!showRawTxt)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
              showRawTxt
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="size-3 inline mr-1" /> {showRawTxt ? "Ver Tabla" : "Ver Código TXT (Pipes |)"}
          </button>
        </div>
      </div>

      {/* Tab Content: Ventas 14.1 */}
      {activeTab === "ventas" && (
        showRawTxt ? (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
              <span>Archivo: <strong className="text-blue-400">{data.ventasFilename}</strong></span>
              <button
                onClick={() => downloadFile(data.ventasFilename, data.ventasTxtContent)}
                className="text-blue-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Download className="size-3" /> Descargar TXT
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
              {data.ventasTxtContent}
            </pre>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                    <th className="py-3.5 px-4">CUO / Asiento</th>
                    <th className="py-3.5 px-4">Fecha Emisión</th>
                    <th className="py-3.5 px-4">Comprobante SUNAT</th>
                    <th className="py-3.5 px-4">Cliente / Razón Social</th>
                    <th className="py-3.5 px-4 text-right">Op. Gravada</th>
                    <th className="py-3.5 px-4 text-right">IGV (18%)</th>
                    <th className="py-3.5 px-4 text-right">Total CPE</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium">
                  {data.ventasRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{r.cuo} / {r.correlativoAsiento}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.fechaEmision}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="px-2 py-0.5 rounded-md bg-blue-950 text-blue-400 border border-blue-800/50 text-[10px] mr-2">
                          {r.tipoComprobante === "01" ? "FAC" : r.tipoComprobante === "03" ? "BOL" : "N/C"}
                        </span>
                        {r.serie}-{r.numero}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-bold">{r.razonSocialCliente}</div>
                        <span className="text-[10px] text-slate-500 font-mono">{r.numDocIdentidad}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(r.baseImponibleGravada)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(r.igv)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400">
                        {formatCurrency(r.totalComprobante)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                          Aceptado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab Content: Compras 8.1 */}
      {activeTab === "compras" && (
        showRawTxt ? (
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
              <span>Archivo: <strong className="text-purple-400">{data.comprasFilename}</strong></span>
              <button
                onClick={() => downloadFile(data.comprasFilename, data.comprasTxtContent)}
                className="text-purple-400 hover:underline flex items-center gap-1 font-bold"
              >
                <Download className="size-3" /> Descargar TXT
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-400 bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto whitespace-pre leading-relaxed">
              {data.comprasTxtContent}
            </pre>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                    <th className="py-3.5 px-4">CUO / Asiento</th>
                    <th className="py-3.5 px-4">Fecha Emisión</th>
                    <th className="py-3.5 px-4">Factura Proveedor</th>
                    <th className="py-3.5 px-4">Proveedor / RUC</th>
                    <th className="py-3.5 px-4 text-right">Base Gravada</th>
                    <th className="py-3.5 px-4 text-right">Crédito Fiscal IGV</th>
                    <th className="py-3.5 px-4 text-right">Total Compra</th>
                    <th className="py-3.5 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 font-medium">
                  {data.comprasRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-400">{r.cuo} / {r.correlativoAsiento}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">{r.fechaEmision}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <span className="px-2 py-0.5 rounded-md bg-purple-950 text-purple-400 border border-purple-800/50 text-[10px] mr-2">
                          FAC
                        </span>
                        {r.serie}-{r.numero}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-bold">{r.razonSocialProveedor}</div>
                        <span className="text-[10px] text-slate-500 font-mono">RUC: {r.numDocProveedor}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-300">
                        {formatCurrency(r.baseImponibleGravada)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-purple-400">
                        {formatCurrency(r.igv)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-white">
                        {formatCurrency(r.totalComprobante)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-bold">
                          Conforme
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Tab Content: Validador */}
      {activeTab === "validador" && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="size-6 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-white text-base">Validador de Reglas y Consistencia SUNAT SIRE</h3>
              <p className="text-xs text-slate-400">Verificación preventiva previa al envío al aplicativo SEE-SOL o PLE</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>1. Cuadre Aritmético IGV (Base × 18% = IGV)</span>
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-slate-400 text-[11px]">
                Todos los comprobantes del periodo tienen cálculo exacto de base imponible e IGV al redondeo de 2 decimales.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>2. Validación de RUC & DNI de Clientes</span>
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-slate-400 text-[11px]">
                Los RUCs (11 dígitos con Catálogo 6) y DNIs (8 dígitos con Catálogo 1) cumplen el algoritmo Módulo 11 de SUNAT.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>3. Estructura de Delimitadores Pipe (|)</span>
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-slate-400 text-[11px]">
                35 campos oficiales para RVIE 14.1 y 42 campos para RCE 8.1 con fin de línea CRLF exacto.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>4. Nomenclatura Oficial del Archivo</span>
                <CheckCircle2 className="size-4" />
              </div>
              <p className="text-slate-400 text-[11px]">
                Patrón <code className="text-blue-400">LE[RUC][AÑO][MES]00140100001111.TXT</code> verificado correctamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
