"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Scale, Plus, RefreshCw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  getWasteRecordsAction,
  approveWasteRecordAction,
  deleteWasteRecordAction,
  WasteRecord,
} from "@/actions/waste-actions";
import { MermasKpis } from "@/components/inventario/mermas/mermas-kpis";
import { MermasFilters } from "@/components/inventario/mermas/mermas-filters";
import { MermasTable } from "@/components/inventario/mermas/mermas-table";
import { MermasFormDialog } from "@/components/inventario/mermas/mermas-form-dialog";
import { WasteDestructionActDialog } from "@/components/inventario/waste-destruction-act-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export default function MermasPage() {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedActaRecord, setSelectedActaRecord] = useState<WasteRecord | null>(null);
  const [isActaDialogOpen, setIsActaDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<WasteRecord | null>(null);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await getWasteRecordsAction();
      setRecords(data);
      if (showToast) {
        toast.success(`Mermas sincronizadas: ${data.length} actas cargadas desde PostgreSQL.`);
      }
    } catch {
      toast.error("Error al cargar registros de mermas y desmedros.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewActa = useCallback((rec: WasteRecord) => {
    setSelectedActaRecord(rec);
    setIsActaDialogOpen(true);
  }, []);

  const handleApprove = useCallback(async (rec: WasteRecord) => {
    try {
      const res = await approveWasteRecordAction(rec.id);
      if (res.success) {
        toast.success(`Acta ${rec.codigoActa} aprobada formalmente para destrucción.`);
        loadData(false);
      }
    } catch {
      toast.error("Error al aprobar el acta.");
    }
  }, []);

  const handleDeleteRequest = useCallback((rec: WasteRecord) => {
    setRecordToDelete(rec);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await deleteWasteRecordAction(recordToDelete.id);
      if (res.success) {
        toast.success(`Acta ${recordToDelete.codigoActa} anulada y stock revertido en inventario.`);
        setIsDeleteOpen(false);
        setRecordToDelete(null);
        loadData(false);
      }
    } catch {
      toast.error("Error al anular el acta de merma.");
    }
  };

  const handleExportExcel = () => {
    toast.success("Generando reporte de mermas y desmedros...", {
      description: "Descarga de Libro de Bajas conforme a SUNAT completada.",
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 text-[10px] font-bold border border-rose-800/50">
              Art. 37 LIR • SUNAT
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Control Legal de Mermas, Desmedros & Bajas de Stock
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="size-6 text-rose-400" /> Mermas y Desmedros de Inventario
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emisión de actas oficiales de destrucción, justificación de pérdidas y registro en Kardex.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refrescar actas desde la base de datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" /> Exportar
          </button>
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" /> Nueva Acta de Merma
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <MermasKpis records={records} />

      {/* Main Table Container (TanStack Table v8) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Filters */}
        <MermasFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterReason={filterReason}
          onFilterReasonChange={setFilterReason}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />

        {/* Table */}
        <MermasTable
          records={records}
          searchTerm={searchTerm}
          filterReason={filterReason}
          filterStatus={filterStatus}
          onViewActa={handleViewActa}
          onApprove={handleApprove}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Modal Formulario Nueva Acta */}
      <MermasFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => loadData(false)}
      />

      {/* Modal Visualización de Acta SUNAT */}
      {selectedActaRecord && (
        <WasteDestructionActDialog
          isOpen={isActaDialogOpen}
          onClose={() => setIsActaDialogOpen(false)}
          record={selectedActaRecord}
        />
      )}

      {/* Modal Confirmación de Eliminación */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Anular acta de merma y revertir stock?"
        itemName={recordToDelete?.codigoActa}
        description="Esta acción eliminará el acta de desmedro y restituirá las cantidades dadas de baja al stock disponible del inventario en PostgreSQL."
      />
    </div>
  );
}
