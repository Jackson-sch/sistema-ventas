"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  Building2,
  Plus,
  Search,
  Receipt,
  FileText,
  CheckCircle2,
  Clock,
  DollarSign,
  PackageCheck,
  Edit2,
  Trash2,
  Eye,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  AlertCircle,
  Package,
  ArrowDownRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { SupplierFormDialog, SupplierData } from "@/components/compras/supplier-form-dialog";
import { PurchaseFormDialog, PurchaseRecord } from "@/components/compras/purchase-form-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getSuppliersData, getPurchasesData } from "@/actions/data-fetchers";
import { RefreshCw } from "lucide-react";

export default function ComprasPage() {
  const [activeTab, setActiveTab] = useState<"recepciones" | "proveedores">("recepciones");
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination states
  const [purchasePage, setPurchasePage] = useState(1);
  const [purchasePageSize, setPurchasePageSize] = useState(10);
  const [supplierPage, setSupplierPage] = useState(1);
  const [supplierPageSize, setSupplierPageSize] = useState(10);

  // Dialogs
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<SupplierData | null>(null);

  // Delete Dialog
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const [suppData, purchData] = await Promise.all([
        getSuppliersData(),
        getPurchasesData(),
      ]);
      if (suppData) setSuppliers(suppData as SupplierData[]);
      if (purchData) setPurchases(purchData);
      if (showToast) {
        toast.success(`Compras y proveedores actualizados: ${suppData?.length || 0} proveedores y ${purchData?.length || 0} recepciones.`);
      }
    } catch (err) {
      console.error("Error fetching purchases and suppliers:", err);
      if (showToast) toast.error("Error al actualizar compras.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCompradoMes = purchases.reduce((acc, p) => acc + p.total, 0);
  const totalFacturas = purchases.length;

  const filteredPurchases = purchases.filter((p) =>
    p.numeroFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proveedorNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.proveedorRuc.includes(searchTerm)
  );

  const paginatedPurchases = filteredPurchases.slice(
    (purchasePage - 1) * purchasePageSize,
    purchasePage * purchasePageSize
  );

  const filteredSuppliers = suppliers.filter((s) =>
    s.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.ruc.includes(searchTerm) ||
    s.contactoNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSuppliers = filteredSuppliers.slice(
    (supplierPage - 1) * supplierPageSize,
    supplierPage * supplierPageSize
  );

  const handleSaveSupplier = (saved: SupplierData) => {
    setSuppliers((prev) => {
      const idx = prev.findIndex((s) => s.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    toast.success(`Proveedor "${saved.razonSocial}" guardado exitosamente.`);
  };

  const handleOpenEditSupplier = (s: SupplierData) => {
    setEditingSupplier(s);
    setIsSupplierOpen(true);
  };

  const handleRequestDeleteSupplier = (s: SupplierData) => {
    setDeleteTarget({ id: s.id, nombre: s.razonSocial });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setSuppliers((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    toast.success(`Proveedor "${deleteTarget.nombre}" eliminado.`);
    setDeleteTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="size-6 text-blue-400" /> Compras & Proveedores Mayoristas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Recepción de mercadería, control de facturas de compra y costeo ponderado en Kardex
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Sincronizar compras y proveedores desde la Base de Datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            onClick={() => {
              setEditingSupplier(null);
              setIsSupplierOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <Building2 className="size-3.5 text-blue-400" /> Nuevo Proveedor
          </button>
          <button
            onClick={() => setIsPurchaseOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <PackageCheck className="size-3.5" /> Ingresar Mercadería / Factura
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Compras del Mes</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {formatCurrency(totalCompradoMes)}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Ingresado al almacén</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Facturas Registradas</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {totalFacturas} <span className="text-xs font-sans text-slate-400 font-normal">documentos</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">100% cotejadas en almacén</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Receipt className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Proveedores Activos</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {suppliers.length} <span className="text-xs font-sans text-emerald-300/80 font-normal">distribuidores</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Líneas de crédito vigentes</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Building2 className="size-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("recepciones")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "recepciones"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <PackageCheck className="size-4" /> Facturas & Recepción de Stock ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("proveedores")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "proveedores"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Building2 className="size-4" /> Directorio de Proveedores ({suppliers.length})
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por RUC, proveedor o N° factura..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Tab 1: Recepciones de Mercadería */}
      {activeTab === "recepciones" && (
        <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in duration-150">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Factura / Guía</th>
                <th className="py-3.5 px-4">Proveedor Mayorista</th>
                <th className="py-3.5 px-4 text-center">Fecha Recepción</th>
                <th className="py-3.5 px-4 text-center">Condición de Pago</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Total Facturado</th>
                <th className="py-3.5 px-4 text-center">Ítems</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {paginatedPurchases.map((pur) => (
                <tr key={pur.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-white text-sm">{pur.numeroFactura}</div>
                    <div className="text-[10px] text-emerald-400 font-sans">Factura de Compra Electrónica</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-200">{pur.proveedorNombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono">RUC: {pur.proveedorRuc}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                    {pur.fechaRecepcion}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[10px] font-semibold border border-slate-700/50 text-slate-300">
                      {pur.condicionPago}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="size-3" /> {pur.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                    {formatCurrency(pur.total)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {pur.items.length > 0 ? `${pur.items.length} productos` : "General"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tab 1 Pagination */}
          <TablePagination
            currentPage={purchasePage}
            totalItems={filteredPurchases.length}
            pageSize={purchasePageSize}
            onPageChange={setPurchasePage}
            onPageSizeChange={setPurchasePageSize}
          />
        </div>
      )}

      {/* Tab 2: Directorio de Proveedores */}
      {activeTab === "proveedores" && (
        <div className="glass-panel rounded-2xl overflow-hidden animate-in fade-in duration-150">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">RUC & Razón Social</th>
                <th className="py-3.5 px-4">Contacto Comercial</th>
                <th className="py-3.5 px-4">Dirección Fiscal</th>
                <th className="py-3.5 px-4 text-center">Condición de Pago</th>
                <th className="py-3.5 px-4 text-right">Compras Acumuladas</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {paginatedSuppliers.map((supp) => (
                <tr key={supp.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-sm">{supp.razonSocial}</div>
                    <div className="text-[11px] text-blue-400 font-mono mt-0.5">RUC {supp.ruc}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="font-semibold text-slate-200">{supp.contactoNombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{supp.telefono} • {supp.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-[220px] truncate">
                    {supp.direccion}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-blue-950/60 text-blue-300 text-[10px] font-semibold border border-blue-800/40">
                      {supp.condicionPago}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                    {formatCurrency(supp.totalComprado || 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditSupplier(supp)}
                        title="Editar Proveedor"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleRequestDeleteSupplier(supp)}
                        title="Eliminar Proveedor"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Tab 2 Pagination */}
          <TablePagination
            currentPage={supplierPage}
            totalItems={filteredSuppliers.length}
            pageSize={supplierPageSize}
            onPageChange={setSupplierPage}
            onPageSizeChange={setSupplierPageSize}
          />
        </div>
      )}

      {/* Supplier Modal */}
      <SupplierFormDialog
        isOpen={isSupplierOpen}
        onClose={() => setIsSupplierOpen(false)}
        onSave={handleSaveSupplier}
        supplierToEdit={editingSupplier}
      />

      {/* Purchase Reception Modal */}
      <PurchaseFormDialog
        isOpen={isPurchaseOpen}
        onClose={() => setIsPurchaseOpen(false)}
        availableSuppliers={suppliers}
        onSuccess={() => loadData(false)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar proveedor mayorista?"
        itemName={deleteTarget?.nombre}
        description="Esta acción eliminará el proveedor del directorio. Las órdenes de compra y registros del Kardex continuarán guardados en la base de datos."
      />
    </div>
  );
}
