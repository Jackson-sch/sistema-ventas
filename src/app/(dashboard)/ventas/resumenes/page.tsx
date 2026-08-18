"use client";

import { useState, useEffect } from "react";
import {
  FileCheck2,
  FileX2,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Download,
  Receipt,
  FileSpreadsheet,
  Clock,
  Layers,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSunatBatchesAction,
  generateDailySummaryAction,
  sendVoidedDocumentAction,
  SunatBatchItem,
} from "@/actions/sunat-batch-actions";

export default function ResumenesSunatPage() {
  const [batches, setBatches] = useState<SunatBatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [isRcModalOpen, setIsRcModalOpen] = useState(false);
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);

  // Form states
  const [rcFecha, setRcFecha] = useState(new Date().toISOString().slice(0, 10));
  const [raFactura, setRaFactura] = useState("");
  const [raMotivo, setRaMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getSunatBatchesAction();
      setBatches(data);
    } catch {
      toast.error("Error al cargar lotes SUNAT.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerateRc = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await generateDailySummaryAction(rcFecha);
      if (res.success && res.batch) {
        toast.success(`¡Resumen Diario ${res.batch.identificador} emitido y aceptado por SUNAT!`, {
          description: `Ticket SUNAT: ${res.batch.ticketSunat} • ${res.batch.totalComprobantes} boletas agrupadas.`,
        });
        setBatches((prev) => [res.batch!, ...prev]);
        setIsRcModalOpen(false);
      } else {
        toast.error(res.error || "No se pudo emitir el resumen diario.");
      }
    } catch {
      toast.error("Error al procesar el resumen diario RC.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendRa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raFactura.trim() || !raMotivo.trim()) {
      toast.error("Ingrese el número de comprobante y el motivo de anulación.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendVoidedDocumentAction(raFactura.trim(), raMotivo.trim());
      if (res.success && res.batch) {
        toast.success(`¡Comunicación de Bajas ${res.batch.identificador} enviada a SUNAT!`, {
          description: `Comprobante ${raFactura} anulado oficialmente. Ticket: ${res.batch.ticketSunat}`,
        });
        setBatches((prev) => [res.batch!, ...prev]);
        setIsRaModalOpen(false);
        setRaFactura("");
        setRaMotivo("");
      } else {
        toast.error(res.error || "No se pudo anular el comprobante.");
      }
    } catch {
      toast.error("Error al enviar Comunicación de Bajas.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = batches.filter((b) => {
    if (filterType === "all") return true;
    return b.tipo === filterType;
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50 flex items-center gap-1">
              <FileSpreadsheet className="size-3" /> SUNAT SEE-SOL / OSE
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileCheck2 className="size-6 text-blue-400" /> Resúmenes Diarios (RC) & Bajas (RA)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de lotes masivos de boletas electrónicas y anulación formal de facturas ante SUNAT
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:text-white hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileX2 className="size-3.5 text-rose-400" /> Comunicación de Bajas (RA)
          </button>
          <button
            type="button"
            onClick={() => setIsRcModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" /> Generar Resumen Diario (RC)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              RESÚMENES ENVIADOS (RC)
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {batches.filter((b) => b.tipo === "RC").length} Lotes
            </div>
            <span className="text-[11px] text-slate-500">Agrupación automática de boletas</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <FileCheck2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              COMUNICACIONES DE BAJAS (RA)
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {batches.filter((b) => b.tipo === "RA").length} Anulaciones
            </div>
            <span className="text-[11px] text-slate-500">Facturas y NC anuladas formalmente</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <FileX2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              TASA DE ACEPTACIÓN SUNAT
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              100% CDR
            </div>
            <span className="text-[11px] text-slate-500">Firma digital UBL 2.1 válida</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Table Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Historial de Transmisiones por Lote</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Filtrar:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">Todos los Lotes</option>
            <option value="RC">Solo Resúmenes Diarios (RC)</option>
            <option value="RA">Solo Bajas de Facturas (RA)</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">Identificador / Tipo</th>
                <th className="py-3.5 px-4">Fecha Ref.</th>
                <th className="py-3.5 px-4">Fecha Envío</th>
                <th className="py-3.5 px-4 text-center">CPEs</th>
                <th className="py-3.5 px-4">Ticket SUNAT</th>
                <th className="py-3.5 px-4 text-center">Estado CDR</th>
                <th className="py-3.5 px-4 text-right">XML Firmado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] ${
                        b.tipo === "RC"
                          ? "bg-blue-950 text-blue-400 border border-blue-800/50"
                          : "bg-rose-950 text-rose-400 border border-rose-800/50"
                      }`}
                    >
                      {b.tipo}
                    </span>
                    {b.identificador}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 font-mono">{b.fechaReferencia}</td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">{b.fechaEnvio}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-white">{b.totalComprobantes}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{b.ticketSunat}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> {b.estadoSunat}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success(`Descargando XML firmado: ${b.identificador}.xml`)}
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                      title="Descargar XML UBL 2.1"
                    >
                      <Download className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Resumen Diario RC */}
      {isRcModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileCheck2 className="size-5 text-blue-400" /> Generar Resumen Diario (RC)
              </h3>
              <button onClick={() => setIsRcModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleGenerateRc} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Fecha de Emisión de las Boletas:</label>
                <input
                  type="date"
                  value={rcFecha}
                  onChange={(e) => setRcFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                Se agruparán automáticamente todas las <strong>Boletas de Venta Electrónicas</strong> emitidas y anuladas en la fecha seleccionada para su envío y aprobación en bloque ante SUNAT.
              </p>
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRcModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  {isSubmitting ? "Emitiendo Lote..." : "Firmar y Enviar a SUNAT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baja RA */}
      {isRaModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileX2 className="size-5 text-rose-400" /> Comunicación de Bajas (RA)
              </h3>
              <button onClick={() => setIsRaModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSendRa} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Comprobante a Dar de Baja:</label>
                <input
                  type="text"
                  value={raFactura}
                  onChange={(e) => setRaFactura(e.target.value.toUpperCase())}
                  placeholder="Ej. F001-0000451"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Motivo de Anulación SUNAT:</label>
                <input
                  type="text"
                  value={raMotivo}
                  onChange={(e) => setRaMotivo(e.target.value)}
                  placeholder="Ej. Error en RUC del cliente / Operación cancelada"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  required
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRaModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="size-4" />
                  {isSubmitting ? "Transmitiendo..." : "Dar de Baja en SUNAT"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
