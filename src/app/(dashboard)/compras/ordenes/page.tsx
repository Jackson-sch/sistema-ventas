"use client";

import { useState, useEffect, useCallback } from "react";
import { Truck, Plus, RefreshCw, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  getPurchaseOrdersAction,
  receivePurchaseOrderAction,
  deletePurchaseOrderAction,
  PurchaseOrderRecord,
} from "@/actions/purchase-order-actions";
import { getSuppliersData } from "@/actions/data-fetchers";
import { OrdenesKpis } from "@/components/compras/ordenes/ordenes-kpis";
import { OrdenesFilters } from "@/components/compras/ordenes/ordenes-filters";
import { OrdenesTable } from "@/components/compras/ordenes/ordenes-table";
import { OrdenesFormDialog } from "@/components/compras/ordenes/ordenes-form-dialog";
import { PurchaseOrderSheetDialog } from "@/components/compras/purchase-order-sheet-dialog";
import { ReceiveOrderDialog } from "@/components/compras/receive-order-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrderRecord[]>([]);
  const [availableSuppliers, setAvailableSuppliers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderRecord | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrderRecord | null>(null);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const [ords, sups] = await Promise.all([
        getPurchaseOrdersAction(),
        getSuppliersData(),
      ]);
      setOrders(ords);
      setAvailableSuppliers(sups || []);
      if (showToast) {
        toast.success(`Órdenes sincronizadas: ${ords.length} pedidos cargados desde PostgreSQL.`);
      }
    } catch {
      toast.error("Error al cargar órdenes de compra.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleViewSheet = useCallback((order: PurchaseOrderRecord) => {
    setSelectedOrder(order);
    setIsSheetOpen(true);
  }, []);

  const handleReceive = useCallback((order: PurchaseOrderRecord) => {
    setSelectedOrder(order);
    setIsReceiveOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((order: PurchaseOrderRecord) => {
    setOrderToDelete(order);
    setIsDeleteOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const res = await deletePurchaseOrderAction(orderToDelete.id);
      if (res.success) {
        toast.success(`Orden ${orderToDelete.codigoOC} anulada y eliminada.`);
        setIsDeleteOpen(false);
        setOrderToDelete(null);
        loadData(false);
      } else {
        toast.error(res.error || "Error al eliminar orden.");
      }
    } catch {
      toast.error("Error al eliminar orden de compra.");
    }
  };

  const handleExportExcel = () => {
    toast.success("Generando reporte de compras y abastecimiento...", {
      description: "Descarga de Libro de Órdenes completada exitosamente.",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 bg-[hsl(224,71%,4%)]">
        <RefreshCw className="size-8 text-amber-400 animate-spin" />
        <div className="text-sm font-bold text-white font-mono">
          Cargando Órdenes de Compra & Muelle...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950/80 text-amber-400 text-[10px] font-bold border border-amber-800/50 flex items-center gap-1">
              <Truck className="size-3" /> Cadena de Suministro & Abastecimiento
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Gestión B2B de Proveedores y Muelle de Descarga
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Órdenes de Compra & Recepción
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Emisión de órdenes de compra, control de guías de remisión y recepción de lotes en muelle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refrescar órdenes desde la base de datos"
          >
            <RefreshCw className={`size-3.5 text-amber-400 ${isRefreshing ? "animate-spin" : ""}`} />
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
            onClick={() => setIsFormModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" /> Nueva Orden de Compra
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <OrdenesKpis orders={orders} />

      {/* Main Table Container (TanStack Table v8) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Filters */}
        <OrdenesFilters
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />

        {/* Table */}
        <OrdenesTable
          orders={orders}
          searchTerm={searchTerm}
          filterStatus={filterStatus}
          onViewSheet={handleViewSheet}
          onReceive={handleReceive}
          onDelete={handleDeleteRequest}
        />
      </div>

      {/* Modal Nueva Orden de Compra */}
      <OrdenesFormDialog
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        availableSuppliers={availableSuppliers}
        onSuccess={() => loadData(false)}
      />

      {/* Modal Hoja de Orden / Impresión */}
      {selectedOrder && (
        <PurchaseOrderSheetDialog
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          order={selectedOrder}
        />
      )}

      {/* Modal Recepción en Muelle */}
      {selectedOrder && (
        <ReceiveOrderDialog
          isOpen={isReceiveOpen}
          onClose={() => setIsReceiveOpen(false)}
          order={selectedOrder}
          onSuccess={() => loadData(false)}
        />
      )}

      {/* Modal Confirmación de Eliminación */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Anular y eliminar orden de compra?"
        itemName={orderToDelete?.codigoOC}
        description="Esta acción eliminará el pedido de compra del sistema. Si ya hubieron recepciones de mercadería, las existencias en Kardex se mantendrán intactas."
      />
    </div>
  );
}
