"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  ShoppingCart,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Building2,
  User,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Trash2,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { TablePagination } from "@/components/ui/table-pagination";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { QuotationSheetDialog } from "@/components/ventas/quotation-sheet-dialog";
import {
  getQuotationsAction,
  createQuotationAction,
  updateQuotationAction,
  deleteQuotationAction,
  QuotationRecord,
  QuotationItem,
} from "@/actions/quotation-actions";
import { getProductsData, getClientsData } from "@/actions/data-fetchers";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CotizacionesPage() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<QuotationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // nuqs URL state persistence
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterStatus, setFilterStatus] = useQueryState<"all" | "vigente" | "convertida" | "vencida">(
    "estado",
    parseAsString.withDefault("all") as any
  );
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Modals
  const [selectedQuotation, setSelectedQuotation] = useState<QuotationRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<QuotationRecord | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState<QuotationRecord | null>(null);

  // Form State
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [availableClients, setAvailableClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientDoc, setClientDoc] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientTypeDoc, setClientTypeDoc] = useState<"DNI" | "RUC">("DNI");
  const [clientPhone, setClientPhone] = useState("");
  const [validityDays, setValidityDays] = useState(7);
  const [formItems, setFormItems] = useState<QuotationItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProductQty, setSelectedProductQty] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [quotes, prods, clis] = await Promise.all([
        getQuotationsAction(),
        getProductsData(),
        getClientsData(),
      ]);
      setQuotations(quotes);
      setCatalogProducts(prods || []);
      setAvailableClients(clis || []);
    } catch {
      toast.error("Error al cargar cotizaciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewModal = () => {
    setEditingQuotation(null);
    setSelectedClientId("");
    setClientDoc("");
    setClientName("");
    setClientTypeDoc("DNI");
    setClientPhone("");
    setValidityDays(7);
    setFormItems([]);
    setSelectedProductId("");
    setSelectedProductQty(1);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (q: QuotationRecord) => {
    setEditingQuotation(q);
    setSelectedClientId("");
    setClientDoc(q.clienteDoc);
    setClientName(q.clienteNombre);
    setClientTypeDoc(q.clienteTipoDoc);
    setClientPhone(q.clienteTelefono || "");
    setValidityDays(7);
    setFormItems([...q.items]);
    setSelectedProductId("");
    setSelectedProductQty(1);
    setIsFormModalOpen(true);
  };

  const handleAddItemToForm = () => {
    if (!selectedProductId) return;
    const prod = catalogProducts.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const existing = formItems.find((i) => i.productoId === prod.id);
    if (existing) {
      existing.cantidad += selectedProductQty;
      existing.total = +(existing.cantidad * existing.precioUnit).toFixed(2);
      setFormItems([...formItems]);
    } else {
      const newItem: QuotationItem = {
        productoId: prod.id,
        sku: prod.sku,
        nombre: prod.nombre,
        cantidad: selectedProductQty,
        precioUnit: prod.precioVenta,
        total: +(selectedProductQty * prod.precioVenta).toFixed(2),
        tipo: prod.tipoVenta || "unidad",
      };
      setFormItems([newItem, ...formItems]);
    }
    setSelectedProductId("");
    setSelectedProductQty(1);
  };

  const handleRemoveItemFromForm = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    const cli = availableClients.find((c) => c.id === clientId);
    if (cli) {
      setClientDoc(cli.numDoc);
      setClientName(cli.nombre);
      setClientTypeDoc(cli.tipoDoc === "RUC" ? "RUC" : "DNI");
      setClientPhone(cli.telefono || "");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientDoc) {
      toast.error("Ingrese el nombre y documento del cliente.");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Agregue al menos un producto a la cotización.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingQuotation) {
        const res = await updateQuotationAction({
          id: editingQuotation.id,
          clienteDoc: clientDoc,
          clienteNombre: clientName,
          clienteTipoDoc: clientTypeDoc,
          clienteTelefono: clientPhone,
          diasValidez: validityDays,
          items: formItems,
        });

        if (res.success && res.quotation) {
          toast.success(`Cotización ${res.quotation.codigo} actualizada con éxito.`);
          setIsFormModalOpen(false);
          loadData();
        } else {
          toast.error(res.error || "Error al actualizar cotización.");
        }
      } else {
        const res = await createQuotationAction({
          clienteDoc: clientDoc,
          clienteNombre: clientName,
          clienteTipoDoc: clientTypeDoc,
          clienteTelefono: clientPhone,
          diasValidez: validityDays,
          items: formItems,
        });

        if (res.success) {
          toast.success(`Cotización ${res.quotation.codigo} generada exitosamente.`);
          setIsFormModalOpen(false);
          loadData();
        }
      }
    } catch {
      toast.error("Error al procesar la cotización.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;
    try {
      const res = await deleteQuotationAction(quotationToDelete.id);
      if (res.success) {
        toast.success(`Cotización ${quotationToDelete.codigo} anulada y eliminada.`);
        setIsDeleteOpen(false);
        setQuotationToDelete(null);
        loadData();
      } else {
        toast.error(res.error || "Error al eliminar la cotización.");
      }
    } catch {
      toast.error("Error de servidor al eliminar cotización.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Módulo de Cotizaciones...</div>
      </div>
    );
  }

  const filtered = quotations.filter((q) => {
    const matchesSearch =
      q.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clienteDoc.includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterStatus !== "all" && q.estado !== filterStatus) return false;
    return true;
  });

  const totalVigentes = quotations
    .filter((q) => q.estado === "vigente")
    .reduce((acc, q) => acc + q.total, 0);

  const totalConvertidas = quotations.filter((q) => q.estado === "convertida").length;
  const tasaConversion = quotations.length > 0
    ? Math.round((totalConvertidas / quotations.length) * 100)
    : 0;

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50 flex items-center gap-1">
              <FileText className="size-3" /> Ventas Institucionales & B2B
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FileText className="size-6 text-blue-400" /> Cotizaciones & Proformas Comerciales
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emisión, edición, corrección, envío por WhatsApp y conversión a venta directa en Caja POS
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="size-4" /> Nueva Proforma / Cotización
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              TOTAL EMITIDAS
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {quotations.length} Proformas
            </div>
            <span className="text-[11px] text-slate-500">Historial acumulado</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <FileText className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              EN VIGENCIA ACTIVA
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {formatCurrency(totalVigentes)}
            </div>
            <span className="text-[11px] text-slate-500">Listas para cobrar en caja</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Clock className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              TASA DE CONVERSIÓN
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {tasaConversion}%
            </div>
            <span className="text-[11px] text-slate-500">{totalConvertidas} ventas formalizadas</span>
          </div>
          <div className="size-11 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <TrendingUp className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              CANAL DE CIERRE
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              POS 1-Clic
            </div>
            <span className="text-[11px] text-slate-500">Integración directa con caja</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <ShoppingCart className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por N° COT, cliente o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todas ({quotations.length})
          </button>
          <button
            onClick={() => setFilterStatus("vigente")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "vigente"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Vigentes
          </button>
          <button
            onClick={() => setFilterStatus("convertida")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "convertida"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Convertidas
          </button>
          <button
            onClick={() => setFilterStatus("vencida")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "vencida"
                ? "bg-amber-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Vencidas
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">N° Proforma</th>
                <th className="py-3.5 px-4">Cliente / RUC</th>
                <th className="py-3.5 px-4">Emisión / Vence</th>
                <th className="py-3.5 px-4">Vendedor</th>
                <th className="py-3.5 px-4 text-right">Total Proforma</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                    No se encontraron cotizaciones con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <FileText className="size-3.5 text-blue-400" />
                        {q.codigo}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-white font-bold">{q.clienteNombre}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {q.clienteTipoDoc}: {q.clienteDoc}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{q.fechaEmision}</div>
                      <span className="text-[10px] text-slate-500">Hasta: {q.fechaVencimiento}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{q.vendedor}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400 text-sm">
                      {formatCurrency(q.total)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {q.estado === "vigente" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 text-[10px] font-bold">
                          Vigente
                        </span>
                      ) : q.estado === "convertida" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                          Convertida ({q.ventaComprobante})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[10px] font-bold">
                          Expirada
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {q.estado === "vigente" && (
                          <button
                            type="button"
                            onClick={() => router.push(`/pos?cotizacion=${q.id}`)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                            title="Cobrar proforma directamente en Caja POS"
                          >
                            <ShoppingCart className="size-3" /> Cobrar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedQuotation(q);
                            setIsSheetOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ver / Imprimir Proforma"
                        >
                          <Printer className="size-3.5" />
                        </button>
                        {q.estado !== "convertida" && (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(q)}
                            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Editar Proforma (Corregir productos o cliente)"
                          >
                            <Edit2 className="size-3.5" />
                          </button>
                        )}
                        {q.estado !== "convertida" && (
                          <button
                            type="button"
                            onClick={() => {
                              setQuotationToDelete(q);
                              setIsDeleteOpen(true);
                            }}
                            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Anular y Eliminar Proforma"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
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

      {/* Sheet Modal */}
      <QuotationSheetDialog
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        quotation={selectedQuotation}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Anular y Eliminar Cotización?"
        description="Esta acción eliminará el registro de la proforma seleccionada."
        itemName={quotationToDelete ? `${quotationToDelete.codigo} — Cliente: ${quotationToDelete.clienteNombre} (${formatCurrency(quotationToDelete.total)})` : undefined}
      />

      {/* Create / Edit Quotation Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="size-5 text-blue-400" />
                {editingQuotation ? `Editar Proforma ${editingQuotation.codigo}` : "Crear Nueva Cotización / Proforma"}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Client Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Cliente Frecuente (Opcional):</label>
                  <Select value={selectedClientId} onValueChange={handleClientSelect}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white focus:ring-1 focus:ring-blue-500">
                      <SelectValue placeholder="-- Seleccionar o escribir manual --" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-[10000] max-h-60">
                      {availableClients.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="font-bold">{c.nombre}</span>
                            <span className="text-slate-400 font-mono text-[10px]">({c.numDoc})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Días de Validez / Vigencia:</label>
                  <Select value={String(validityDays)} onValueChange={(v) => setValidityDays(Number(v))}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-[10000]">
                      <SelectItem value="3" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        3 días calendario
                      </SelectItem>
                      <SelectItem value="7" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        7 días calendario (Recomendado)
                      </SelectItem>
                      <SelectItem value="15" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        15 días calendario
                      </SelectItem>
                      <SelectItem value="30" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        30 días calendario
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Manual Client Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Tipo Doc:</label>
                  <Select value={clientTypeDoc} onValueChange={(v: any) => setClientTypeDoc(v)}>
                    <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white focus:ring-1 focus:ring-blue-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-[10000]">
                      <SelectItem value="DNI" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        DNI (Persona)
                      </SelectItem>
                      <SelectItem value="RUC" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        RUC (Empresa)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Número de Doc:</label>
                  <input
                    type="text"
                    value={clientDoc}
                    onChange={(e) => setClientDoc(e.target.value)}
                    placeholder="Ej: 20601234567"
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Razón Social / Nombre:</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: Inversiones Retail SAC"
                    className="w-full h-10 px-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Add Product Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-white block uppercase tracking-wider">
                  Agregar Ítems a la Proforma:
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="flex-1 w-full">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="w-full h-10 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="-- Seleccionar Producto del Catálogo --" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-[10000] max-h-60">
                        {catalogProducts.map((p) => (
                          <SelectItem key={p.id} value={p.id} className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                            <div className="flex items-center justify-between gap-3 w-full">
                              <span className="font-bold">{p.nombre}</span>
                              <span className="text-emerald-400 font-mono text-[11px] font-bold">
                                {formatCurrency(p.precioVenta)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={selectedProductQty}
                    onChange={(e) => setSelectedProductQty(Number(e.target.value))}
                    className="w-20 h-10 px-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToForm}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="size-3.5" /> Agregar
                  </button>
                </div>

                {/* Form Items List */}
                {formItems.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    {formItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/60 border border-slate-800/80"
                      >
                        <div className="space-y-0.5">
                          <div className="text-white font-bold">{item.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {item.cantidad} {item.tipo === "peso" ? "kg" : "und"} × S/ {item.precioUnit.toFixed(2)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-400">
                            {formatCurrency(item.total)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromForm(idx)}
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

              {/* Total & Submit */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className="text-slate-400 block text-xs">Total Estimado:</span>
                  <strong className="text-emerald-400 font-mono text-base">
                    {formatCurrency(formItems.reduce((acc, i) => acc + i.total, 0))}
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
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="size-4" />
                    {isSubmitting ? "Guardando..." : editingQuotation ? "Guardar Cambios" : "Emitir Proforma"}
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
