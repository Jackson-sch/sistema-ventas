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
  Eye,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getSunatBatchesAction,
  generateDailySummaryAction,
  sendVoidedDocumentAction,
  SunatBatchItem,
} from "@/actions/sunat-batch-actions";
import { SunatBatchDetailDialog } from "@/components/ventas/resumenes/sunat-batch-detail-dialog";
import { DailySummaryDialog } from "@/components/ventas/resumenes/daily-summary-dialog";
import { VoidedDocumentDialog } from "@/components/ventas/resumenes/voided-document-dialog";

export default function ResumenesSunatPage() {
  const [batches, setBatches] = useState<SunatBatchItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // URL state persistence
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterType, setFilterType] = useQueryState("tipo", parseAsString.withDefault("all"));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Modals state
  const [selectedBatch, setSelectedBatch] = useState<SunatBatchItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isRcModalOpen, setIsRcModalOpen] = useState(false);
  const [isRaModalOpen, setIsRaModalOpen] = useState(false);

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

  const handleGenerateRc = async (fecha: string) => {
    const res = await generateDailySummaryAction(fecha);
    if (res.success && res.batch) {
      toast.success(`Resumen Diario ${res.batch.identificador} emitido y aceptado por SUNAT`, {
        description: `Ticket SUNAT: ${res.batch.ticketSunat} • ${res.batch.totalComprobantes} boletas agrupadas.`,
      });
      setBatches((prev) => [res.batch!, ...prev]);
    } else {
      toast.error(res.error || "No se pudo emitir el resumen diario.");
      throw new Error(res.error);
    }
  };

  const handleSendRa = async (comprobante: string, motivo: string) => {
    const res = await sendVoidedDocumentAction(comprobante, motivo);
    if (res.success && res.batch) {
      toast.success(`Comunicación de Bajas ${res.batch.identificador} enviada a SUNAT`, {
        description: `Comprobante ${comprobante} anulado oficialmente. Ticket: ${res.batch.ticketSunat}`,
      });
      setBatches((prev) => [res.batch!, ...prev]);
    } else {
      toast.error(res.error || "No se pudo anular el comprobante.");
      throw new Error(res.error);
    }
  };

  const handleOpenDetail = (batch: SunatBatchItem) => {
    setSelectedBatch(batch);
    setIsDetailModalOpen(true);
  };

  const handleDownloadXml = (batch: SunatBatchItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"} xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:${batch.tipo === "RC" ? "SummaryDocuments-1" : "VoidedDocuments-1"}">
    <cbc:ID>${batch.identificador}</cbc:ID>
    <cbc:ReferenceDate>${batch.fechaReferencia}</cbc:ReferenceDate>
    <cbc:IssueDate>${batch.fechaEnvio.split(" ")[0]}</cbc:IssueDate>
    <cac:Signature>
        <cbc:ID>20608945123</cbc:ID>
        <ds:DigestValue>${batch.hashSunat}</ds:DigestValue>
    </cac:Signature>
</${batch.tipo === "RC" ? "SummaryDocuments" : "VoidedDocuments"}>`;

    const blob = new Blob([xmlContent], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${batch.identificador}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Descargando XML UBL 2.1: ${batch.identificador}.xml`);
  };

  const filtered = batches.filter((b) => {
    const matchesType = filterType === "all" || b.tipo === filterType;
    const matchesSearch =
      b.identificador.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.ticketSunat.includes(searchTerm) ||
      b.fechaReferencia.includes(searchTerm);
    return matchesType && matchesSearch;
  });

  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

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
            Control y transmisión de lotes masivos de boletas electrónicas y anulación formal de facturas ante SUNAT
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 hover:text-white hover:bg-rose-900/60 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileX2 className="size-3.5 text-rose-400" /> Comunicación de Bajas (RA)
          </button>
          <button
            type="button"
            onClick={() => setIsRcModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-95"
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

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por lote (RC-2026...), Ticket SUNAT o fecha..."
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0 font-medium">Filtrar por Tipo:</span>
          <div className="w-48">
            <Select value={filterType} onValueChange={(val) => setFilterType(val)}>
              <SelectTrigger className="h-9 rounded-xl bg-slate-950 border-slate-800 text-xs text-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Todos los Lotes
                </SelectItem>
                <SelectItem value="RC" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Resúmenes Diarios (RC)
                </SelectItem>
                <SelectItem value="RA" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                  Comunicaciones de Bajas (RA)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recargar Lotes"
          >
            <RefreshCw className="size-4" />
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">Identificador / Tipo</th>
                <th className="py-3.5 px-4">Fecha Ref.</th>
                <th className="py-3.5 px-4">Fecha Envío</th>
                <th className="py-3.5 px-4 text-center">CPEs Agrupados</th>
                <th className="py-3.5 px-4 font-mono">Ticket SUNAT</th>
                <th className="py-3.5 px-4 text-center">Estado CDR</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    <FileSpreadsheet className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-1.5" />
                    <p className="text-xs text-slate-400 font-semibold">
                      No se encontraron transmisiones por lotes
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Usa los botones superiores para emitir un Resumen Diario o dar de baja una factura.
                    </p>
                  </td>
                </tr>
              ) : (
                paginated.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => handleOpenDetail(b)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
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
                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {b.totalComprobantes} CPEs
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{b.ticketSunat}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/50 text-emerald-400 text-[10px] font-bold">
                        <CheckCircle2 className="size-3" /> {b.estadoSunat}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleOpenDetail(b)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Inspeccionar Ficha Técnica"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadXml(b, e)}
                          className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors cursor-pointer"
                          title="Descargar XML UBL 2.1"
                        >
                          <Download className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-800">
          <TablePagination
            totalItems={filtered.length}
            pageSize={pageSize}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>

      {/* Batch Detail Dialog */}
      <SunatBatchDetailDialog
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        batch={selectedBatch}
      />

      {/* Daily Summary (RC) Dialog */}
      <DailySummaryDialog
        isOpen={isRcModalOpen}
        onClose={() => setIsRcModalOpen(false)}
        onSubmit={handleGenerateRc}
      />

      {/* Voided Document (RA) Dialog */}
      <VoidedDocumentDialog
        isOpen={isRaModalOpen}
        onClose={() => setIsRaModalOpen(false)}
        onSubmit={handleSendRa}
      />
    </div>
  );
}
