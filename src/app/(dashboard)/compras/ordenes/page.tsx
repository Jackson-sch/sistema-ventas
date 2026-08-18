"use client";

import { useState, useEffect } from "react";
import {
  Truck,
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
  Package,
  ArrowRight,
  Sparkles,
  Trash2,
  Edit2,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { TablePagination } from "@/components/ui/table-pagination";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { PurchaseOrderSheetDialog } from "@/components/compras/purchase-order-sheet-dialog";
import { ReceiveOrderDialog } from "@/components/compras/receive-order-dialog";
import {
  getPurchaseOrdersAction,
  createPurchaseOrderAction,
  updatePurchaseOrderAction,
  deletePurchaseOrderAction,
  PurchaseOrderRecord,
  PaymentCondition,
} from "@/actions/purchase-order-actions";
import { getProductsData, getSuppliersData } from "@/actions/data-fetchers";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // nuqs URL search params persistence
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterStatus, setFilterStatus] = useQueryState<string>("estado", parseAsString.withDefault("all"));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Modals
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrderRecord | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrderRecord | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierRuc, setSupplierRuc] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>("CREDITO_30D");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [formObs, setFormObs] = useState("");
  const [formItems, setFormItems] = useState<any[]>([]);
  const [selectedProdId, setSelectedProdId] = useState("");
  const [selectedQty, setSelectedQty] = useState(10);
  const [selectedCost, setSelectedCost] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ords, prods, sups] = await Promise.all([
        getPurchaseOrdersAction(),
        getProductsData(),
        getSuppliersData(),
      ]);
      setOrders(ords);
      setCatalogProducts(prods || []);
      setAvailableSuppliers(sups || []);
    } catch {
      toast.error("Error al cargar órdenes de compra.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNewModal = () => {
    setEditingOrder(null);
    setSelectedSupplierId("");
    setSupplierRuc("");
    setSupplierName("");
    setSupplierContact("");
    setSupplierPhone("");
    setSupplierEmail("");
    setPaymentCondition("CREDITO_30D");
    setCurrency("PEN");
    setFormObs("Entrega regular en muelle de recepción.");
    setFormItems([]);
    setSelectedProdId("");
    setSelectedQty(10);
    setSelectedCost(10);

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 4);
    setDeliveryDate(targetDate.toLocaleDateString("es-PE"));

    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (order: PurchaseOrderRecord) => {
    setEditingOrder(order);
    setSelectedSupplierId(order.proveedorId);
    setSupplierRuc(order.proveedorRuc);
    setSupplierName(order.proveedorRazonSocial);
    setSupplierContact(order.proveedorContacto);
    setSupplierPhone(order.proveedorTelefono);
    setSupplierEmail(order.proveedorEmail);
    setPaymentCondition(order.condicionPago);
    setDeliveryDate(order.fechaEntregaEstimada);
    setCurrency(order.moneda);
    setFormObs(order.observaciones);
    setFormItems(
      order.items.map((i) => ({
        productoId: i.productoId,
        sku: i.sku,
        nombre: i.nombre,
        cantidadPedida: i.cantidadPedida,
        costoUnitario: i.costoUnitario,
        total: i.total,
        loteSugerido: i.loteSugerido,
        fechaVencimiento: i.fechaVencimiento,
      }))
    );
    setSelectedProdId("");
    setIsFormModalOpen(true);
  };

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    const sup = availableSuppliers.find((s) => s.id === id);
    if (sup) {
      setSupplierRuc(sup.ruc);
      setSupplierName(sup.razonSocial);
      setSupplierContact(sup.contacto);
      setSupplierPhone(sup.telefono || "");
      setSupplierEmail(sup.email || "");
    }
  };

  const handleAddItem = () => {
    if (!selectedProdId) return;
    const prod = catalogProducts.find((p) => p.id === selectedProdId);
    if (!prod) return;

    const existing = formItems.find((i) => i.productoId === prod.id);
    if (existing) {
      existing.cantidadPedida += selectedQty;
      existing.total = +(existing.cantidadPedida * existing.costoUnitario).toFixed(2);
      setFormItems([...formItems]);
    } else {
      const newItem = {
        productoId: prod.id,
        sku: prod.sku,
        nombre: prod.nombre,
        cantidadPedida: selectedQty,
        costoUnitario: selectedCost || prod.precioCosto || 10,
        total: +(selectedQty * (selectedCost || prod.precioCosto || 10)).toFixed(2),
        loteSugerido: `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 800 + 100)}`,
        fechaVencimiento: "31/12/2027",
      };
      setFormItems([newItem, ...formItems]);
    }
    setSelectedProdId("");
    setSelectedQty(10);
  };

  const handleRemoveItem = (idx: number) => {
    setFormItems(formItems.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierRuc) {
      toast.error("Ingrese o seleccione los datos del proveedor.");
      return;
    }
    if (formItems.length === 0) {
      toast.error("Agregue al menos un producto a la orden de compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOrder) {
        const res = await updatePurchaseOrderAction({
          id: editingOrder.id,
          proveedorId: selectedSupplierId || "prov-custom",
          proveedorRuc: supplierRuc,
          proveedorRazonSocial: supplierName,
          proveedorContacto: supplierContact || "Departamento Comercial",
          proveedorTelefono: supplierPhone || "999999999",
          proveedorEmail: supplierEmail || "ventas@proveedor.pe",
          condicionPago: paymentCondition,
          moneda: currency,
          fechaEntregaEstimada: deliveryDate,
          observaciones: formObs,
          items: formItems,
        });

        if (res.success && res.order) {
          toast.success(`Orden ${res.order.codigoOC} actualizada exitosamente.`);
          setIsFormModalOpen(false);
          loadData();
        } else {
          toast.error(res.error || "Error al actualizar orden de compra.");
        }
      } else {
        const res = await createPurchaseOrderAction({
          proveedorId: selectedSupplierId || "prov-custom",
          proveedorRuc: supplierRuc,
          proveedorRazonSocial: supplierName,
          proveedorContacto: supplierContact || "Departamento Comercial",
          proveedorTelefono: supplierPhone || "999999999",
          proveedorEmail: supplierEmail || "ventas@proveedor.pe",
          condicionPago: paymentCondition,
          moneda: currency,
          fechaEntregaEstimada: deliveryDate,
          observaciones: formObs,
          items: formItems,
        });

        if (res.success && res.order) {
          toast.success(`Orden de Compra ${res.order.codigoOC} generada con éxito.`);
          setIsFormModalOpen(false);
          loadData();
        } else {
          toast.error(res.error || "Error al crear orden de compra.");
        }
      }
    } catch {
      toast.error("Error al procesar la orden de compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const res = await deletePurchaseOrderAction(orderToDelete.id);
      if (res.success) {
        toast.success(`Orden ${orderToDelete.codigoOC} anulada y eliminada.`);
        setIsDeleteOpen(false);
        setOrderToDelete(null);
        loadData();
      } else {
        toast.error(res.error || "Error al eliminar orden.");
      }
    } catch {
      toast.error("Error al eliminar orden de compra.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-amber-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Órdenes de Compra & Muelle...</div>
      </div>
    );
  }

  const filtered = orders.filter((o) => {
    const matchesSearch =
      o.codigoOC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.proveedorRazonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.proveedorRuc.includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterStatus !== "all" && o.estado !== filterStatus) return false;
    return true;
  });

  const totalTransito = orders
    .filter((o) => o.estado === "ENVIADA_PROVEEDOR" || o.estado === "RECEPCION_PARCIAL")
    .reduce((acc, o) => acc + o.total, 0);

  const pendientesRecepcion = orders.filter(
    (o) => o.estado === "ENVIADA_PROVEEDOR" || o.estado === "RECEPCION_PARCIAL"
  ).length;

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/50 flex items-center gap-1">
              <Truck className="size-3" /> Cadena de Suministro & Abastecimiento
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="size-6 text-amber-400" /> Órdenes de Compra & Recepción en Muelle
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de pedidos a proveedores, emisión de OC oficial, cotejo de guías/facturas e ingreso masivo a Stock
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
        >
          <Plus className="size-4 text-slate-950" /> Generar Nueva Orden de Compra
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              TOTAL ÓRDENES
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {orders.length} Órdenes
            </div>
            <span className="text-[11px] text-slate-500">Historial de adquisiciones</span>
          </div>
          <div className="size-11 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              MONTO EN TRÁNSITO
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {formatCurrency(totalTransito)}
            </div>
            <span className="text-[11px] text-slate-500">Pedidos pendientes de llegada</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Truck className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              POR RECEPCIONAR
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {pendientesRecepcion} Pedidos
            </div>
            <span className="text-[11px] text-slate-500">Pendientes en muelle de descarga</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Package className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PROVEEDORES ACTIVOS
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {availableSuppliers.length} Marcas
            </div>
            <span className="text-[11px] text-slate-500">Red de distribución directa</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Building2 className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por N° OC, proveedor o RUC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            <option value="all">Todos los Estados</option>
            <option value="ENVIADA_PROVEEDOR">Enviada a Proveedor</option>
            <option value="RECEPCION_PARCIAL">Recepción Parcial</option>
            <option value="RECEPCIONADA_TOTAL">Recepcionada Total</option>
            <option value="BORRADOR">Borrador</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">N° Orden</th>
                <th className="py-3.5 px-4">Proveedor / RUC</th>
                <th className="py-3.5 px-4">Emisión & Entrega</th>
                <th className="py-3.5 px-4">Condición Pago</th>
                <th className="py-3.5 px-4 text-center">Progreso Recepción</th>
                <th className="py-3.5 px-4 text-right">Total OC</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500 font-medium">
                    No se encontraron órdenes de compra con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((o) => {
                  const totalPedida = o.items.reduce((acc, i) => acc + i.cantidadPedida, 0);
                  const totalRecibida = o.items.reduce((acc, i) => acc + i.cantidadRecibida, 0);
                  const pct = totalPedida > 0 ? Math.round((totalRecibida / totalPedida) * 100) : 0;

                  return (
                    <tr key={o.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <Truck className="size-3.5 text-amber-400" />
                          {o.codigoOC}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-white font-bold">{o.proveedorRazonSocial}</div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          RUC: {o.proveedorRuc}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div>{o.fechaEmision}</div>
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Req: {o.fechaEntregaEstimada}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold">
                          {o.condicionPago.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-mono text-slate-300">
                            {totalRecibida} / {totalPedida} und. ({pct}%)
                          </span>
                          <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct === 100 ? "bg-emerald-500" : pct > 0 ? "bg-amber-500" : "bg-slate-600"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                        {formatCurrency(o.total)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {o.estado === "RECEPCIONADA_TOTAL" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                            Recepcionada Total
                          </span>
                        ) : o.estado === "RECEPCION_PARCIAL" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[10px] font-bold">
                            Recepción Parcial
                          </span>
                        ) : o.estado === "ENVIADA_PROVEEDOR" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800/60 text-[10px] font-bold">
                            Enviada a Proveedor
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-700 text-[10px] font-bold">
                            Borrador
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {o.estado !== "RECEPCIONADA_TOTAL" && o.estado !== "ANULADA" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrder(o);
                                setIsReceiveOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                              title="Recepcionar mercadería en muelle"
                            >
                              <Package className="size-3" /> Recepcionar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOrder(o);
                              setIsSheetOpen(true);
                            }}
                            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Ver / Imprimir Orden A4"
                          >
                            <Printer className="size-3.5" />
                          </button>
                          {o.estado !== "RECEPCIONADA_TOTAL" && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(o)}
                              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Editar Orden de Compra"
                            >
                              <Edit2 className="size-3.5" />
                            </button>
                          )}
                          {o.estado !== "RECEPCIONADA_TOTAL" && (
                            <button
                              type="button"
                              onClick={() => {
                                setOrderToDelete(o);
                                setIsDeleteOpen(true);
                              }}
                              className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Anular y Eliminar Orden"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
      <PurchaseOrderSheetDialog
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        order={selectedOrder}
        onOpenReceiveModal={(ord) => {
          setSelectedOrder(ord);
          setIsReceiveOpen(true);
        }}
      />

      {/* Receive Modal */}
      <ReceiveOrderDialog
        isOpen={isReceiveOpen}
        onClose={() => setIsReceiveOpen(false)}
        order={selectedOrder}
        onSuccess={loadData}
      />

      {/* Delete Confirm Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Anular y Eliminar Orden de Compra?"
        description="Esta acción eliminará el registro de la orden de compra y cancelará los compromisos de adquisición."
        itemName={orderToDelete ? `${orderToDelete.codigoOC} — Proveedor: ${orderToDelete.proveedorRazonSocial} (${formatCurrency(orderToDelete.total)})` : undefined}
      />

      {/* Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Truck className="size-5 text-amber-400" />
                {editingOrder ? `Editar Orden ${editingOrder.codigoOC}` : "Generar Orden de Compra a Proveedor"}
              </h3>
              <button onClick={() => setIsFormModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Proveedor Registrado:</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="">-- Seleccionar o escribir manual --</option>
                    {availableSuppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.razonSocial} (RUC: {s.ruc})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Condición de Pago:</label>
                  <select
                    value={paymentCondition}
                    onChange={(e) => setPaymentCondition(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="CONTADO">Contado Contra Entrega</option>
                    <option value="CREDITO_15D">Crédito Factura a 15 días</option>
                    <option value="CREDITO_30D">Crédito Factura a 30 días</option>
                    <option value="CREDITO_60D">Crédito Factura a 60 días</option>
                  </select>
                </div>
              </div>

              {/* Manual Supplier Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">RUC Proveedor:</label>
                  <input
                    type="text"
                    value={supplierRuc}
                    onChange={(e) => setSupplierRuc(e.target.value)}
                    placeholder="20100190797"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-slate-400 font-bold">Razón Social:</label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="LECHE GLORIA S.A."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Fecha de Entrega Solicitada:</label>
                  <input
                    type="text"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    placeholder="DD/MM/AAAA"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Contacto / Teléfono Proveedor:</label>
                  <input
                    type="text"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    placeholder="987654321 / pedidos@proveedor.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  />
                </div>
              </div>

              {/* Add Product Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-white block uppercase tracking-wider">
                  Agregar Ítems a la Orden:
                </span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <select
                    value={selectedProdId}
                    onChange={(e) => {
                      setSelectedProdId(e.target.value);
                      const p = catalogProducts.find((x) => x.id === e.target.value);
                      if (p) setSelectedCost(p.precioCosto || 10);
                    }}
                    className="flex-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    <option value="">-- Seleccionar Producto del Inventario --</option>
                    {catalogProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Costo Ref: S/ {p.precioCosto?.toFixed(2) || "10.00"})
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(Number(e.target.value))}
                      placeholder="Cant."
                      className="w-16 px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-center font-mono"
                    />
                    <input
                      type="number"
                      step="0.01"
                      min={0.1}
                      value={selectedCost}
                      onChange={(e) => setSelectedCost(Number(e.target.value))}
                      placeholder="Costo"
                      className="w-20 px-2 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-right font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black flex items-center gap-1 cursor-pointer"
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
                            {item.cantidadPedida} und. × Costo S/ {item.costoUnitario.toFixed(2)} (s/ IGV)
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-amber-400">
                            {formatCurrency(item.total)}
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
                <label className="text-slate-400 font-bold">Observaciones / Instrucciones de Entrega:</label>
                <textarea
                  rows={2}
                  value={formObs}
                  onChange={(e) => setFormObs(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              {/* Total & Submit */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  <span className="text-slate-400 block text-xs">Total Estimado con IGV:</span>
                  <strong className="text-amber-400 font-mono text-base">
                    {formatCurrency(formItems.reduce((acc, i) => acc + i.total, 0) * 1.18)}
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
                    {isSubmitting ? "Guardando..." : editingOrder ? "Guardar Cambios" : "Emitir Orden de Compra"}
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
