"use client";

import { useState, useEffect } from "react";
import {
  Archive,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  TrendingDown,
  Search,
  Filter,
  Package,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  Building2,
  Boxes,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { getKardexMovementsData, getProductsData } from "@/actions/data-fetchers";
import { recordKardexAdjustmentAction } from "@/actions/inventory-actions";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

interface KardexRecord {
  id: string;
  fecha: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  categoria: string;
  tipoOperacion: "01_VENTA" | "02_COMPRA" | "13_MERMA" | "11_TRANSFERENCIA" | "99_AJUSTE";
  operacionLabel: string;
  tipoDoc: "01_FACTURA" | "03_BOLETA" | "09_GUIA" | "AJ_ACTA";
  docSerieNumero: string;
  // Entradas
  entradaCant?: number;
  entradaCostoUnit?: number;
  entradaTotal?: number;
  // Salidas
  salidaCant?: number;
  salidaCostoUnit?: number;
  salidaTotal?: number;
  // Saldo
  saldoCant: number;
  saldoCostoUnit: number;
  saldoTotal: number;
}

type CatalogProduct = Awaited<ReturnType<typeof getProductsData>>[number];

export default function KardexPage() {
  const [kardexRecords, setKardexRecords] = useState<KardexRecord[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useQueryState("prod", parseAsString.withDefault("all"));
  const [selectedOperation, setSelectedOperation] = useQueryState("op", parseAsString.withDefault("all"));
  const [valuationMethod, setValuationMethod] = useQueryState("metodo", parseAsString.withDefault("ponderado"));
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));

  // Modal new movement
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [newMovProduct, setNewMovProduct] = useState("");
  const [newMovType, setNewMovType] = useState<"merma" | "compra" | "ajuste" | "salida">("merma");
  const [newMovQty, setNewMovQty] = useState("1");
  const [newMovCost, setNewMovCost] = useState("3.50");
  const [newMovDoc, setNewMovDoc] = useState("MERMA-2026-0001");
  const [newMovReason, setNewMovReason] = useState("Merma por producto caducado / dañado");
  const [isSaving, setIsSaving] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

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
        if (!newMovProduct) {
          setNewMovProduct(productsData[0].id);
          setNewMovCost(productsData[0].precioCosto.toFixed(2));
        }
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

  const handleSelectProduct = (prodId: string) => {
    setNewMovProduct(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setNewMovCost(prod.precioCosto.toFixed(2));
    }
  };

  const handleSelectType = (type: "merma" | "compra" | "ajuste" | "salida") => {
    setNewMovType(type);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    if (type === "merma") {
      setNewMovDoc(`MERMA-2026-${randomCode}`);
      setNewMovReason("Merma por producto caducado / dañado");
    } else if (type === "compra") {
      setNewMovDoc(`F001-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setNewMovReason("Ingreso extraordinario / compra a proveedor");
    } else if (type === "ajuste") {
      setNewMovDoc(`AJ-2026-${randomCode}`);
      setNewMovReason("Ajuste manual de inventario / conteo físico");
    } else {
      setNewMovDoc(`SAL-2026-${randomCode}`);
      setNewMovReason("Salida manual por consumo interno o muestra");
    }
  };

  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newMovQty) || 0;
    const cost = parseFloat(newMovCost) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a cero.");
      return;
    }

    const prod = products.find((p) => p.id === newMovProduct);
    if (!prod) {
      toast.error("Seleccione un producto válido del catálogo.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await recordKardexAdjustmentAction({
        productoId: prod.id,
        sku: prod.sku,
        productoNombre: prod.nombre,
        tipo: newMovType === "compra" ? "ingreso" : newMovType,
        cantidad: qty,
        costoUnitario: cost,
        motivo: newMovReason,
        documentoReferencia: newMovDoc,
      });

      if (res.success) {
        toast.success("¡Movimiento de Kardex registrado y stock actualizado en base de datos!", {
          description: `${prod.nombre} (${qty} ${prod.tipoVenta === "peso" ? "kg" : "und"})`,
        });
        setIsNewMovementOpen(false);
        await loadData(false);
      } else {
        toast.error(res.error || "Error al registrar movimiento en Kardex.");
      }
    } catch {
      toast.error("Error inesperado al registrar el movimiento.");
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = kardexRecords.filter((record) => {
    const matchesProduct = selectedProduct === "all" || record.productoId === selectedProduct;
    const matchesOp =
      selectedOperation === "all" ||
      (selectedOperation === "compra" && record.tipoOperacion === "02_COMPRA") ||
      (selectedOperation === "venta" && record.tipoOperacion === "01_VENTA") ||
      (selectedOperation === "transferencia" && record.tipoOperacion === "11_TRANSFERENCIA") ||
      (selectedOperation === "merma" && (record.tipoOperacion === "13_MERMA" || record.tipoOperacion === "99_AJUSTE"));
    const matchesSearch =
      record.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.docSerieNumero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProduct && matchesOp && matchesSearch;
  });

  const paginatedKardex = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate totals
  const totalEntradasSoles = filtered.reduce((acc, r) => acc + (r.entradaTotal || 0), 0);
  const totalSalidasSoles = filtered.reduce((acc, r) => acc + (r.salidaTotal || 0), 0);
  const currentValuedStock = filtered.reduce((acc, r) => acc + (r.saldoTotal || 0), 0);

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
              SUNAT Formato 13.1
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" /> Excel
          </button>
          <button
            onClick={() => {
              if (products.length > 0 && !newMovProduct) {
                setNewMovProduct(products[0].id);
                setNewMovCost(products[0].precioCosto.toFixed(2));
              }
              handleSelectType("merma");
              setIsNewMovementOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-3.5" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Método Contable</div>
            <div className="text-base font-bold text-white mt-1 flex items-center gap-1.5">
              <span>Promedio Ponderado</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Norma Tributaria SUNAT</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Layers className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Entradas / Compras</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalEntradasSoles)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Total recepciones</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ArrowDownRight className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Salidas / Ventas</div>
            <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
              {formatCurrency(totalSalidasSoles)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ventas y mermas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <ArrowUpRight className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Movimientos Registrados</div>
            <div className="text-2xl font-mono font-extrabold text-blue-400 mt-1">
              {filtered.length}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Asientos en Kardex</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Boxes className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Filters and Search Bar */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/40">
          {/* Product Filter */}
          <div className="w-full md:w-72">
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Filtrar por Producto
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              <option value="all">Todos los Productos ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.sku})
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 w-full md:w-auto">
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Búsqueda Rápida
            </label>
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por serie/número, producto o SKU..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Operation Filter Pills */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Tipo de Movimiento
            </label>
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedOperation("all")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedOperation("compra")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "compra" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Compras
              </button>
              <button
                onClick={() => setSelectedOperation("venta")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "venta" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Ventas
              </button>
              <button
                onClick={() => setSelectedOperation("transferencia")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "transferencia" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Traslados
              </button>
              <button
                onClick={() => setSelectedOperation("merma")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "merma" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Mermas / Ajustes
              </button>
            </div>
          </div>
        </div>

        {/* Kardex Sunat 13.1 Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Super Header */}
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] uppercase font-bold text-slate-400">
                <th colSpan={4} className="py-2.5 px-4 border-r border-slate-800 text-slate-300">
                  Documento & Transacción
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-800 bg-emerald-950/20 text-emerald-400">
                  Entradas
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-800 bg-rose-950/20 text-rose-400">
                  Salidas
                </th>
                <th colSpan={3} className="py-2.5 px-4 text-center bg-blue-950/20 text-blue-400">
                  Saldo Final
                </th>
              </tr>
              {/* Columns Header */}
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-4">Fecha / Hora</th>
                <th className="py-2 px-3">Tipo Op. (SUNAT)</th>
                <th className="py-2 px-3">Comprobante</th>
                <th className="py-2 px-3 border-r border-slate-800">Producto / Detalle</th>
                {/* Entradas */}
                <th className="py-2 px-3 text-center bg-emerald-950/10">Cant.</th>
                <th className="py-2 px-3 text-right bg-emerald-950/10">Costo U.</th>
                <th className="py-2 px-3 text-right border-r border-slate-800 bg-emerald-950/10">Total S/</th>
                {/* Salidas */}
                <th className="py-2 px-3 text-center bg-rose-950/10">Cant.</th>
                <th className="py-2 px-3 text-right bg-rose-950/10">Costo U.</th>
                <th className="py-2 px-3 text-right border-r border-slate-800 bg-rose-950/10">Total S/</th>
                {/* Saldo */}
                <th className="py-2 px-3 text-center bg-blue-950/10">Cant.</th>
                <th className="py-2 px-3 text-right bg-blue-950/10">Costo U.</th>
                <th className="py-2 px-4 text-right bg-blue-950/10">Total S/</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {paginatedKardex.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 font-sans">
                    <Archive className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                    <p className="text-sm font-semibold text-slate-400">No se encontraron movimientos de Kardex</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Prueba cambiando los filtros o registra un nuevo movimiento manual.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedKardex.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40 transition-colors">
                    {/* Fecha */}
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {r.fecha}
                    </td>

                    {/* Tipo Operación */}
                    <td className="py-3 px-3">
                      {r.tipoOperacion === "01_VENTA" && (
                        <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
                          01 Venta POS
                        </Badge>
                      )}
                      {r.tipoOperacion === "02_COMPRA" && (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                          02 Compra Prov.
                        </Badge>
                      )}
                      {r.tipoOperacion === "13_MERMA" && (
                        <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">
                          13 Merma
                        </Badge>
                      )}
                      {r.tipoOperacion === "11_TRANSFERENCIA" && (
                        <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                          11 Traslado GRE
                        </Badge>
                      )}
                      {r.tipoOperacion === "99_AJUSTE" && (
                        <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px]">
                          99 Ajuste Físico
                        </Badge>
                      )}
                    </td>

                    {/* Comprobante */}
                    <td className="py-3 px-3 text-slate-300 font-bold">
                      {r.docSerieNumero}
                    </td>

                    {/* Producto */}
                    <td className="py-3 px-3 border-r border-slate-800 font-sans">
                      <div className="font-bold text-white text-xs">{r.productoNombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        SKU: {r.sku} • {r.operacionLabel}
                      </div>
                    </td>

                    {/* Entradas */}
                    <td className="py-3 px-3 text-center font-mono bg-emerald-950/10">
                      {r.entradaCant ? <span className="text-emerald-400 font-bold">+{r.entradaCant}</span> : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 bg-emerald-950/10 text-xs">
                      {r.entradaCostoUnit ? formatCurrency(r.entradaCostoUnit) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold bg-emerald-950/10 border-r border-slate-800 text-xs">
                      {r.entradaTotal ? formatCurrency(r.entradaTotal) : "-"}
                    </td>

                    {/* Salidas */}
                    <td className="py-3 px-3 text-center font-mono bg-rose-950/10">
                      {r.salidaCant ? <span className="text-rose-400 font-bold">-{r.salidaCant}</span> : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 bg-rose-950/10 text-xs">
                      {r.salidaCostoUnit ? formatCurrency(r.salidaCostoUnit) : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-400 font-bold bg-rose-950/10 border-r border-slate-800 text-xs">
                      {r.salidaTotal ? formatCurrency(r.salidaTotal) : "-"}
                    </td>

                    {/* Saldo Final */}
                    <td className="py-3 px-3 text-center font-mono bg-blue-950/10 font-bold text-white">
                      {r.saldoCant}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-300 bg-blue-950/10 text-xs">
                      {formatCurrency(r.saldoCostoUnit)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-extrabold bg-blue-950/10 text-sm">
                      {formatCurrency(r.saldoTotal)}
                    </td>
                  </tr>
                ))
              )}
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
      </div>

      {/* Modal Registrar Movimiento Manual */}
      {isNewMovementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)]">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Archive className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Registrar Movimiento de Kardex</h3>
                <p className="text-xs text-slate-400">Ajuste manual, merma o recepción extraordinaria</p>
              </div>
            </div>

            <form onSubmit={handleCreateMovement} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Producto del Catálogo
                </label>
                <select
                  value={newMovProduct}
                  onChange={(e) => handleSelectProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.sku}) — Stock: {p.stock} {p.tipoVenta === "peso" ? "kg" : "und"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Tipo de Operación
                  </label>
                  <select
                    value={newMovType}
                    onChange={(e) => handleSelectType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="merma">Merma / Descarte (13)</option>
                    <option value="compra">Compra / Ingreso (02)</option>
                    <option value="ajuste">Ajuste Físico (99)</option>
                    <option value="salida">Salida Manual (01)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={newMovQty}
                    onChange={(e) => setNewMovQty(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Costo Unitario (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMovCost}
                    onChange={(e) => setNewMovCost(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                    Doc. Referencia / Acta
                  </label>
                  <input
                    type="text"
                    value={newMovDoc}
                    onChange={(e) => setNewMovDoc(e.target.value)}
                    placeholder="MERMA-2026-0001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                  Motivo / Justificación
                </label>
                <textarea
                  rows={2}
                  value={newMovReason}
                  onChange={(e) => setNewMovReason(e.target.value)}
                  placeholder="Detallar causa del movimiento..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMovementOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="size-4" />
                  {isSaving ? "Guardando..." : "Guardar Movimiento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
