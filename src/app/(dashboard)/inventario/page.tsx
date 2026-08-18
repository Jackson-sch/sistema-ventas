"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Layers,
  Calendar,
  Archive,
  BarChart3,
  TrendingDown,
  Edit2,
  Trash2,
  Barcode,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ProductFormDialog, ProductFormData } from "@/components/inventario/product-form-dialog";
import { KardexDialog } from "@/components/inventario/kardex-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getProductsData } from "@/actions/data-fetchers";
import { upsertProductAction, deleteProductAction } from "@/actions/inventory-actions";

interface InventoryProduct {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca?: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo?: number;
  precioVenta: number;
  precioCosto: number;
  unidad: string;
  lote?: string;
  vencimiento?: string;
  isPerecible: boolean;
}

import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

export default function InventarioPage() {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [selectedCategory, setSelectedCategory] = useQueryState("categoria", parseAsString.withDefault("Todas"));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Dialogs state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductFormData | null>(null);
  const [isKardexOpen, setIsKardexOpen] = useState(false);
  const [kardexTarget, setKardexTarget] = useState<InventoryProduct | null>(null);

  // Delete confirmation state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; nombre: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getProductsData();
      setProducts(
        data.map((p) => ({
          id: p.id,
          sku: p.sku,
          nombre: p.nombre,
          categoria: p.categoria,
          marca: p.marca,
          stockActual: p.stock,
          stockMinimo: p.stockMin,
          stockMaximo: 200,
          precioVenta: p.precioVenta,
          precioCosto: p.precioCosto,
          unidad: p.tipoVenta === "peso" ? "kg" : "und",
          lote: p.lote,
          vencimiento: p.vencimiento,
          isPerecible: p.isPerecible,
        }))
      );
    } catch (err) {
      console.error("Error loading products from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const categories = ["Todas", "Lácteos", "Abarrotes", "Frutas & Verduras", "Limpieza"];

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.includes(searchTerm) ||
      p.categoria.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todas" || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const paginatedProducts = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalValorizado = products.reduce((acc, p) => acc + p.stockActual * p.precioCosto, 0);
  const itemsCriticos = products.filter((p) => p.stockActual <= p.stockMinimo).length;

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p: InventoryProduct) => {
    const editData: ProductFormData = {
      id: p.id,
      sku: p.sku,
      nombre: p.nombre,
      categoria: p.categoria,
      marca: p.marca || "",
      tipoVenta: p.unidad === "kg" ? "peso" : "unidad",
      stockActual: p.stockActual,
      stockMinimo: p.stockMinimo,
      stockMaximo: p.stockMaximo || 200,
      precioCosto: p.precioCosto,
      precioVenta: p.precioVenta,
      isPerecible: p.isPerecible,
      lote: p.lote,
      vencimiento: p.vencimiento,
    };
    setEditingProduct(editData);
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (formData: ProductFormData) => {
    const updatedProd: InventoryProduct = {
      id: formData.id || Date.now().toString(),
      sku: formData.sku,
      nombre: formData.nombre,
      categoria: formData.categoria,
      marca: formData.marca,
      stockActual: formData.stockActual,
      stockMinimo: formData.stockMinimo,
      stockMaximo: formData.stockMaximo,
      precioCosto: formData.precioCosto,
      precioVenta: formData.precioVenta,
      unidad: formData.tipoVenta === "peso" ? "kg" : "und",
      isPerecible: formData.isPerecible,
      lote: formData.lote,
      vencimiento: formData.vencimiento,
    };

    // Optimistic UI update
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedProd.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProd;
        return next;
      }
      return [updatedProd, ...prev];
    });

    // Server Action
    await upsertProductAction({
      id: formData.id,
      sku: formData.sku,
      nombre: formData.nombre,
      categoria: formData.categoria,
      marca: formData.marca,
      tipoVenta: formData.tipoVenta,
      stockActual: formData.stockActual,
      stockMinimo: formData.stockMinimo,
      stockMaximo: formData.stockMaximo,
      precioCosto: formData.precioCosto,
      precioVenta: formData.precioVenta,
      isPerecible: formData.isPerecible,
      lote: formData.lote,
      vencimiento: formData.vencimiento,
    });

    toast.success(`Producto "${formData.nombre}" guardado y sincronizado con la base de datos.`);
  };

  const handleOpenKardex = (p: InventoryProduct) => {
    setKardexTarget(p);
    setIsKardexOpen(true);
  };

  const handleRequestDelete = (id: string, nombre: string) => {
    setProductToDelete({ id, nombre });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
    await deleteProductAction(productToDelete.id, productToDelete.nombre);
    toast.success(`Producto "${productToDelete.nombre}" eliminado del catálogo.`);
    setProductToDelete(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="size-6 text-blue-400" /> Control de Inventario & Stock
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión multi-sucursal, lotes perecibles y kardex valorado en tiempo real con PostgreSQL
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refrescar datos desde la base de datos"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={() => products.length > 0 && handleOpenKardex(products[0])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <Archive className="size-3.5 text-blue-400" /> Kardex General
          </button>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-3.5" /> Nuevo Producto
          </button>
        </div>
      </div>

      {/* KPI Cards for Inventory */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Ítems Registrados</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {products.length} <span className="text-xs font-sans text-slate-400 font-normal">productos</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Layers className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Inventario Valorado (Costo)</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalValorizado)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <BarChart3 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Alertas Stock Crítico</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {itemsCriticos} <span className="text-xs font-sans text-amber-300/80 font-normal">en riesgo</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertTriangle className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU, nombre del producto o lote..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                selectedCategory === cat ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Producto & SKU</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4 text-center">Stock Actual</th>
              <th className="py-3 px-4 text-right">P. Costo</th>
              <th className="py-3 px-4 text-right">P. Venta</th>
              <th className="py-3 px-4 text-center">Lote / Caducidad</th>
              <th className="py-3 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {paginatedProducts.map((prod) => {
              const isStockBajo = prod.stockActual <= prod.stockMinimo;
              return (
                <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-sm">{prod.nombre}</div>
                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                      <Barcode className="size-3 text-slate-400" />
                      <span>{prod.sku}</span>
                      {prod.marca && <span className="text-slate-600">• {prod.marca}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800/80 text-[11px] font-semibold border border-slate-700/50">
                      {prod.categoria}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="font-mono font-bold text-sm">
                      <span className={isStockBajo ? "text-amber-400" : "text-white"}>
                        {prod.stockActual} {prod.unidad}
                      </span>
                    </div>
                    {isStockBajo && (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center justify-center gap-1 mt-0.5">
                        <AlertTriangle className="size-2.5" /> Mín: {prod.stockMinimo}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-400">
                    {formatCurrency(prod.precioCosto)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {formatCurrency(prod.precioVenta)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {prod.isPerecible && prod.vencimiento ? (
                      <div className="space-y-0.5">
                        <span className="font-mono text-[11px] text-slate-300 font-semibold">
                          {prod.vencimiento}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono">{prod.lote}</div>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-mono text-[11px]">No perecible</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenKardex(prod)}
                        title="Ver Kardex"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Archive className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        title="Editar Producto"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleRequestDelete(prod.id, prod.nombre)}
                        title="Eliminar Producto"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Table Pagination */}
        <TablePagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Product Form Modal */}
      <ProductFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
      />

      {/* Kardex Dialog */}
      <KardexDialog
        isOpen={isKardexOpen}
        onClose={() => setIsKardexOpen(false)}
        productName={kardexTarget?.nombre || "Producto"}
        sku={kardexTarget?.sku || "SKU-001"}
        categoria={kardexTarget?.categoria || "General"}
      />

      {/* Secure Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar producto del catálogo?"
        itemName={productToDelete?.nombre}
        description="Esta acción eliminará el producto del catálogo y de la terminal POS. Los registros históricos del Kardex permanecerán intactos."
      />
    </div>
  );
}
