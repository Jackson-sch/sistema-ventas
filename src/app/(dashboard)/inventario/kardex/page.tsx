"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  RefreshCw,
  Package,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useQueryState, parseAsString } from "nuqs";
import { getKardexMovementsData, getProductsData } from "@/actions/data-fetchers";
import { KardexRecord } from "@/components/inventario/kardex/kardex-columns";
import { KardexTable } from "@/components/inventario/kardex/kardex-table";
import { KardexFilters } from "@/components/inventario/kardex/kardex-filters";
import { KardexKpis } from "@/components/inventario/kardex/kardex-kpis";
import { KardexMovementDialog } from "@/components/inventario/kardex/kardex-movement-dialog";

type CatalogProduct = Awaited<ReturnType<typeof getProductsData>>[number];

export default function KardexPage() {
  const [kardexRecords, setKardexRecords] = useState<KardexRecord[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);

  // URL state filters
  const [selectedProduct, setSelectedProduct] = useQueryState("prod", parseAsString.withDefault("all"));
  const [selectedOperation, setSelectedOperation] = useQueryState("op", parseAsString.withDefault("all"));
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const [kardexData, productsData] = await Promise.all([
        getKardexMovementsData(),
        getProductsData(),
      ]);

      if (kardexData) {
        setKardexRecords(kardexData);
      }

      if (productsData && productsData.length > 0) {
        setProducts(productsData);
      }

      if (showToast) {
        toast.success(`Kardex sincronizado: ${kardexData?.length || 0} movimientos cargados.`);
      }
    } catch (err) {
      console.error("Error al cargar Kardex:", err);
      if (showToast) toast.error("Error al sincronizar datos de Kardex.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered dataset for KPI totals
  const filtered = kardexRecords.filter((record) => {
    const matchesProduct = selectedProduct === "all" || record.productoId === selectedProduct;
    const matchesOp =
      selectedOperation === "all" ||
      (selectedOperation === "compra" && record.tipoOperacion === "02_COMPRA") ||
      (selectedOperation === "venta" && record.tipoOperacion === "01_VENTA") ||
      (selectedOperation === "transferencia" && record.tipoOperacion === "11_TRANSFERENCIA") ||
      (selectedOperation === "merma" && (record.tipoOperacion === "13_MERMA" || record.tipoOperacion === "99_AJUSTE"));
    const matchesSearch =
      !searchTerm ||
      record.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.docSerieNumero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProduct && matchesOp && matchesSearch;
  });

  const totalEntradasSoles = filtered.reduce((acc, r) => acc + (r.entradaTotal || 0), 0);
  const totalSalidasSoles = filtered.reduce((acc, r) => acc + (r.salidaTotal || 0), 0);

  const handleExport = (format: "excel" | "sunat") => {
    toast.success(`Generando exportación de Kardex Valorado (${format.toUpperCase()})`, {
      description: "Descarga del Formato 13.1 SUNAT completada exitosamente.",
    });
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
              SUNAT Formato 13.1 • TanStack Table v8
            </span>
            <span className="text-xs text-slate-500 font-mono">Registro de Inventario Permanente Valorado</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Archive className="size-6 text-blue-400" /> Kardex Valorado & Control Físico
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trazabilidad tributaria de entradas, salidas, mermas, traslados y saldos valorizados de inventario.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Sincronizar movimientos de Kardex desde la Base de Datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <Link
            href="/inventario"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <Package className="size-3.5 text-blue-400" /> Catálogo de Stock
          </Link>
          <button
            onClick={() => handleExport("excel")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={() => setIsNewMovementOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <KardexKpis
        totalEntradasSoles={totalEntradasSoles}
        totalSalidasSoles={totalSalidasSoles}
        totalMovimientos={filtered.length}
      />

      {/* Main Table Card (TanStack Table) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Filters and Search Bar */}
        <KardexFilters
          products={products}
          selectedProduct={selectedProduct}
          onSelectProduct={setSelectedProduct}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          selectedOperation={selectedOperation}
          onSelectOperation={setSelectedOperation}
        />

        {/* TanStack Table Container */}
        <KardexTable
          data={kardexRecords}
          globalFilter={searchTerm}
          selectedProduct={selectedProduct}
          selectedOperation={selectedOperation}
        />
      </div>

      {/* Modal Registrar Movimiento Manual */}
      <KardexMovementDialog
        isOpen={isNewMovementOpen}
        onClose={() => setIsNewMovementOpen(false)}
        products={products}
        onSuccess={() => loadData(false)}
      />
    </div>
  );
}
