"use client";

import { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  Search,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingDown,
  FileText,
  Printer,
  Edit2,
  Trash2,
  RefreshCw,
  Building2,
  User,
  ShieldCheck,
  Package,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { TablePagination } from "@/components/ui/table-pagination";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { WasteDestructionActDialog } from "@/components/inventario/waste-destruction-act-dialog";
import {
  getWasteRecordsAction,
  createWasteRecordAction,
  updateWasteRecordAction,
  deleteWasteRecordAction,
  approveWasteRecordAction,
  WasteRecord,
  WasteItem,
  WasteReason,
  WasteStatus,
} from "@/actions/waste-actions";
import { getProductsData } from "@/actions/data-fetchers";

export default function MermasPage() {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // nuqs URL search params persistence
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterReason, setFilterReason] = useQueryState<string>("motivo", parseAsString.withDefault("all"));
  const [filterStatus, setFilterStatus] = useQueryState<string>("estado", parseAsString.withDefault("all"));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Modals
  const [selectedRecord, setSelectedRecord] = useState<WasteRecord | null>(null);
  const [isActDialogOpen, setIsActDialogOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<WasteRecord | null>(null);

  // Delete Confirm Modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<WasteRecord | null>(null);

  // Form State
  const [formReason, setFormReason] = useState<WasteReason>("VENCIMIENTO");
  const [formLocation, setFormLocation] = useState("Almacén Central de Merma - Surco");
  const [formMethod, setFormMethod] = useState("Desnaturalización y disposición en relleno sanitario certificado");
  const [formNotary, setFormNotary] = useState("Sin Notario (Pérdida menor a 10 UIT)");
  const [formObs, setFormObs] = useState("");
  const [formItems, setFormItems] = useState<WasteItem[]>([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [selectedQty, setSelectedQty] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [data, prods] = await Promise.all([
        getWasteRecordsAction(),
        getProductsData(),
      ]);
      setRecords(data);
      setCatalogProducts(prods || []);
    } catch {
      toast.error("Error al cargar registros de mermas y desmedros.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewModal = () => {
    setEditingRecord(null);
    setFormReason("VENCIMIENTO");
    setFormLocation("Almacén Central de Merma - Surco");
    setFormMethod("Desnaturalización y disposición en relleno sanitario certificado");
    setFormNotary("Sin Notario (Pérdida menor a 10 UIT)");
    setFormObs("");
    setFormItems([]);
    setSelectedProdId("");
    setSelectedQty(1);
    setSelectedBatch("");
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (rec: WasteRecord) => {
    setEditingRecord(rec);
    setFormReason(rec.motivo);
    setFormLocation(rec.lugarDestruccion);
    setFormMethod(rec.metodoDestruccion);
    setFormNotary(rec.notarioColegiado || "");
    setFormObs(rec.observaciones);
    setFormItems([...rec.items]);
    setSelectedProdId("");
    setSelectedQty(1);
    setSelectedBatch("");
    setIsFormModalOpen(true);
  };

  const handleAddItemToForm = () => {
    if (!selectedProdId) return;
    const prod = catalogProducts.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const existing = formItems.find((i) => i.productoId === prod.id);
    if (existing) {
      existing.cantidad += selectedQty;
      existing.costoTotal = +(existing.cantidad * existing.costoUnit).toFixed(2);
      setFormItems([...formItems]);
    } else {
      const newItem: WasteItem = {
        productoId: prod.id,
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad: selectedQty,
        unidad: prod.tipoVenta || "und",
        costoUnit: prod.precioCosto || 3.5,
        costoTotal: +(selectedQty * (prod.precioCosto || 3.5)).toFixed(2),
        lote: selectedBatch || `L-${new Date().getFullYear()}-0${Math.floor(Math.random() * 80 + 10)}`,
        fechaVencimiento: new Date().toLocaleDateString("es-PE"),
      };
      setFormItems([newItem, ...formItems]);
    }
    setSelectedProdId("");
    setSelectedQty(1);
    setSelectedBatch("");
  };

  const handleRemoveItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0) {
      toast.error("Agregue al menos un producto al acta.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord) {
        // Update existing record
        const res = await updateWasteRecordAction({
          id: editingRecord.id,
          motivo: formReason,
          sucursal: editingRecord.sucursal,
          responsable: editingRecord.responsable,
          notarioColegiado: formNotary,
          metodoDestruccion: formMethod,
          lugarDestruccion: formLocation,
          observaciones: formObs || "Baja formal de existencias no aptas para venta.",
          items: formItems,
        });

        if (res.success && res.record) {
          toast.success(`Acta ${res.record.codigoActa} actualizada correctamente.`);
          setIsFormModalOpen(false);
          loadData();
        } else {
          toast.error(res.error || "Error al actualizar el acta.");
        }
      } else {
        // Create new record
        const res = await createWasteRecordAction({
          motivo: formReason,
          sucursal: "Sucursal Central (Surco)",
          responsable: "Carlos Alarcón (Supervisor de Turno)",
          notarioColegiado: formNotary,
          metodoDestruccion: formMethod,
          lugarDestruccion: formLocation,
          observaciones: formObs || "Baja formal de existencias no aptas para venta.",
          items: formItems,
        });

        if (res.success && res.record) {
          toast.success(`Acta ${res.record.codigoActa} generada con éxito.`);
          setIsFormModalOpen(false);
          loadData();
        } else {
          toast.error(res.error || "Error al registrar acta de merma.");
        }
      }
    } catch {
      toast.error("Error al procesar el acta de merma.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (rec: WasteRecord) => {
    try {
      const res = await approveWasteRecordAction(rec.id);
      if (res.success) {
        toast.success(`Acta ${rec.codigoActa} actualizada a estado: ${res.nuevoEstado}`, {
          description: "Salida asentada en Kardex Valorado bajo concepto MERMA / DESMEDRO.",
        });
        loadData();
      }
    } catch {
      toast.error("Error al aprobar acta.");
    }
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      const res = await deleteWasteRecordAction(recordToDelete.id);
      if (res.success) {
        toast.success(`Acta ${recordToDelete.codigoActa} anulada y eliminada.`);
        setIsDeleteOpen(false);
        setRecordToDelete(null);
        loadData();
      } else {
        toast.error(res.error || "Error al eliminar el acta.");
      }
    } catch {
      toast.error("Error de servidor al eliminar el acta.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Módulo de Mermas & Desmedros...</div>
      </div>
    );
  }

  const filtered = records.filter((r) => {
    const matchesSearch =
      r.codigoActa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.observaciones.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.items.some((i) => i.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterReason !== "all" && r.motivo !== filterReason) return false;
    if (filterStatus !== "all" && r.estado !== filterStatus) return false;
    return true;
  });

  const totalPerdida = records.reduce((acc, r) => acc + r.costoTotalPerdida, 0);
  const totalBorradores = records.filter((r) => r.estado === "BORRADOR").length;
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/50 flex items-center gap-1">
              <Scale className="size-3" /> Sustento Tributario SUNAT (Art. 37 LIR)
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Scale className="size-6 text-amber-400" /> Control de Mermas, Desmedros & Actas de Destrucción
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registro, corrección, baja de inventario y formulación de actas oficiales deducibles del Impuesto a la Renta
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
        >
          <Plus className="size-4 text-slate-950" /> Formular Nueva Acta de Merma
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PÉRDIDA VALORIZADA
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {formatCurrency(totalPerdida)}
            </div>
            <span className="text-[11px] text-slate-500">Costo de mercadería dada de baja</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <TrendingDown className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ACTAS FORMULADAS
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {records.length} Actas
            </div>
            <span className="text-[11px] text-slate-500">Sustento notarial / tributario</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <FileText className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PENDIENTES KARDEX
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {totalBorradores} Actas
            </div>
            <span className="text-[11px] text-slate-500">Requieren aprobación de supervisor</span>
          </div>
          <div className="size-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Clock className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              DEDUCCIÓN RENTA
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              100% Legal
            </div>
            <span className="text-[11px] text-slate-500">Conforme al Art. 37 Inc. f LIR</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por N° Acta o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">Todos los Motivos</option>
            <option value="VENCIMIENTO">Vencimiento</option>
            <option value="ROTURA_TRANSPORTE">Rotura / Transporte</option>
            <option value="MERMA_PERECIBLE">Merma Perecibles</option>
            <option value="DEFECTO_FABRICA">Defecto de Fábrica</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">Todos los Estados</option>
            <option value="BORRADOR">Borrador</option>
            <option value="APROBADO_KARDEX">Aprobado en Kardex</option>
            <option value="DESTRUIDO_CON_ACTA">Destruido con Acta</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">N° Acta SUNAT</th>
                <th className="py-3.5 px-4">Fecha & Hora</th>
                <th className="py-3.5 px-4">Causa / Motivo</th>
                <th className="py-3.5 px-4">Ítems / Detalle</th>
                <th className="py-3.5 px-4 text-right">Pérdida (Costo S/)</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                    No se encontraron actas de merma con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Scale className="size-3.5 text-amber-400" />
                        {r.codigoActa}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{r.fecha}</div>
                      <span className="text-[10px] text-slate-500">{r.hora}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold">
                        {r.motivo.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-bold">{r.items.length} productos dados de baja</div>
                      <span className="text-[10px] text-slate-500 truncate block max-w-64">
                        {r.items.map((i) => i.nombre).join(", ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-400 text-sm">
                      {formatCurrency(r.costoTotalPerdida)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.estado === "BORRADOR" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 text-[10px] font-bold">
                          Borrador
                        </span>
                      ) : r.estado === "APROBADO_KARDEX" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[10px] font-bold">
                          Aprobado Kardex
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                          Destruido con Acta
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.estado !== "DESTRUIDO_CON_ACTA" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(r)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md shadow-amber-600/20 transition-all cursor-pointer"
                            title="Aprobar y asentar en Kardex"
                          >
                            <CheckCircle2 className="size-3" /> Aprobar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecord(r);
                            setIsActDialogOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ver / Imprimir Acta SUNAT"
                        >
                          <Printer className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(r)}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Acta (Corregir cantidades o ítems)"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordToDelete(r);
                            setIsDeleteOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Anular y Eliminar Acta"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Destruction Act Dialog */}
      <WasteDestructionActDialog
        isOpen={isActDialogOpen}
        onClose={() => setIsActDialogOpen(false)}
        record={selectedRecord}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Anular y Eliminar Acta de Merma?"
        description="Esta acción eliminará el registro del acta y anulará el impacto de baja de mercadería."
        itemName={recordToDelete ? `${recordToDelete.codigoActa} — Pérdida: ${formatCurrency(recordToDelete.costoTotalPerdida)}` : undefined}
      />

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Scale className="size-5 text-amber-400" />
                {editingRecord ? `Editar Acta ${editingRecord.codigoActa}` : "Formular Nueva Acta de Merma"}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Causa / Motivo de la Baja:</label>
                  <select
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  >
                    <option value="VENCIMIENTO">Vencimiento / Caducidad</option>
                    <option value="ROTURA_TRANSPORTE">Rotura / Caída en Transporte</option>
                    <option value="MERMA_PERECIBLE">Merma Natural Perecible (Frutas/Carnes)</option>
                    <option value="DEFECTO_FABRICA">Defecto de Fábrica / Empaque Dañado</option>
                    <option value="CONTAMINACION">Contaminación Cruzada</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Intervención Notarial (SUNAT):</label>
                  <input
                    type="text"
                    value={formNotary}
                    onChange={(e) => setFormNotary(e.target.value)}
                    placeholder="Ej: Notaría Salazar o Sin Notario"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Lugar de Destrucción:</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Método de Disposición:</label>
                  <input
                    type="text"
                    value={formMethod}
                    onChange={(e) => setFormMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Add Product Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-white block uppercase tracking-wider">
                  Agregar Productos a Dar de Baja:
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className="flex-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="">-- Seleccionar Producto del Inventario --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Costo: S/ {p.precioCosto?.toFixed(2) || "3.50"})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Agregar
                  </button>
                </div>

                {/* Items List */}
                {formItems.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                      >
                        <div>
                          <div className="text-white font-bold">{item.nombre}</div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.cantidad} {item.unidad} × Costo S/ {item.costoUnit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-rose-400">
                            {formatCurrency(item.costoTotal)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Observaciones Técnicas:</label>
                <textarea
                  rows={2}
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  placeholder="Detalles sobre el estado físico de la mercadería o informe de calidad..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {/* Total & Submit */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span className="text-slate-400 block text-xs">Pérdida Total Valorizada:</span>
                  <strong className="text-rose-400 font-mono text-base">
                    {formatCurrency(formItems.reduce((acc, i) => acc + i.costoTotal, 0))}
                  </strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="size-4" />
                    {isSubmitting ? "Guardando..." : editingRecord ? "Guardar Correcciones" : "Emitir Acta de Merma"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
