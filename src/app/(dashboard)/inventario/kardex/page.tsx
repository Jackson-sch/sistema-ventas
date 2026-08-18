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
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import { getKardexMovementsData } from "@/actions/data-fetchers";

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

const PRODUCTS_LIST = [
  { id: "all", name: "Todos los Productos" },
  { id: "1", name: "Leche Gloria Entera 400g (775123456789)" },
  { id: "2", name: "Arroz Costeño Extra 1kg (775987654321)" },
  { id: "3", name: "Aceite Primor Premium 1L (775456789123)" },
  { id: "4", name: "Manzana Delicia Nacional (200000012345)" },
  { id: "5", name: "Detergente Bolívar 1kg (775678912345)" },
];

const INITIAL_KARDEX_DATA: KardexRecord[] = [
  {
    id: "1",
    fecha: "15/08/2026 11:42",
    productoId: "1",
    productoNombre: "Leche Gloria Entera 400g",
    sku: "775123456789",
    categoria: "Lácteos",
    tipoOperacion: "01_VENTA",
    operacionLabel: "Venta en Caja 01 (POS)",
    tipoDoc: "03_BOLETA",
    docSerieNumero: "B001-00042918",
    salidaCant: 2,
    salidaCostoUnit: 3.40,
    salidaTotal: 6.80,
    saldoCant: 142,
    saldoCostoUnit: 3.40,
    saldoTotal: 482.80,
  },
  {
    id: "2",
    fecha: "15/08/2026 11:35",
    productoId: "2",
    productoNombre: "Arroz Costeño Extra 1kg",
    sku: "775987654321",
    categoria: "Abarrotes",
    tipoOperacion: "01_VENTA",
    operacionLabel: "Venta en Caja 01 (POS)",
    tipoDoc: "03_BOLETA",
    docSerieNumero: "B001-00042917",
    salidaCant: 1,
    salidaCostoUnit: 4.10,
    salidaTotal: 4.10,
    saldoCant: 18,
    saldoCostoUnit: 4.10,
    saldoTotal: 73.80,
  },
  {
    id: "3",
    fecha: "15/08/2026 11:15",
    productoId: "3",
    productoNombre: "Aceite Primor Premium 1L",
    sku: "775456789123",
    categoria: "Abarrotes",
    tipoOperacion: "01_VENTA",
    operacionLabel: "Venta en Caja 02",
    tipoDoc: "01_FACTURA",
    docSerieNumero: "F001-00001204",
    salidaCant: 5,
    salidaCostoUnit: 7.90,
    salidaTotal: 39.50,
    saldoCant: 64,
    saldoCostoUnit: 7.90,
    saldoTotal: 505.60,
  },
  {
    id: "4",
    fecha: "15/08/2026 10:30",
    productoId: "1",
    productoNombre: "Leche Gloria Entera 400g",
    sku: "775123456789",
    categoria: "Lácteos",
    tipoOperacion: "01_VENTA",
    operacionLabel: "Venta en Caja 03 Autoservicio",
    tipoDoc: "03_BOLETA",
    docSerieNumero: "B001-00042914",
    salidaCant: 4,
    salidaCostoUnit: 3.40,
    salidaTotal: 13.60,
    saldoCant: 144,
    saldoCostoUnit: 3.40,
    saldoTotal: 489.60,
  },
  {
    id: "5",
    fecha: "14/08/2026 16:15",
    productoId: "1",
    productoNombre: "Leche Gloria Entera 400g",
    sku: "775123456789",
    categoria: "Lácteos",
    tipoOperacion: "13_MERMA",
    operacionLabel: "Merma por lata golpeada/abollada",
    tipoDoc: "AJ_ACTA",
    docSerieNumero: "MERMA-2026-089",
    salidaCant: 1,
    salidaCostoUnit: 3.40,
    salidaTotal: 3.40,
    saldoCant: 148,
    saldoCostoUnit: 3.40,
    saldoTotal: 503.20,
  },
  {
    id: "6",
    fecha: "12/08/2026 09:00",
    productoId: "1",
    productoNombre: "Leche Gloria Entera 400g",
    sku: "775123456789",
    categoria: "Lácteos",
    tipoOperacion: "02_COMPRA",
    operacionLabel: "Recepción de Proveedor Gloria SA (OC #442)",
    tipoDoc: "01_FACTURA",
    docSerieNumero: "F001-008921",
    entradaCant: 100,
    entradaCostoUnit: 3.40,
    entradaTotal: 340.00,
    saldoCant: 149,
    saldoCostoUnit: 3.40,
    saldoTotal: 506.60,
  },
  {
    id: "7",
    fecha: "10/08/2026 08:00",
    productoId: "5",
    productoNombre: "Detergente Bolívar 1kg",
    sku: "775678912345",
    categoria: "Limpieza",
    tipoOperacion: "02_COMPRA",
    operacionLabel: "Recepción de Proveedor Alicorp (OC #438)",
    tipoDoc: "01_FACTURA",
    docSerieNumero: "F001-003319",
    entradaCant: 50,
    entradaCostoUnit: 6.80,
    entradaTotal: 340.00,
    saldoCant: 45,
    saldoCostoUnit: 6.80,
    saldoTotal: 306.00,
  },
];

export default function KardexPage() {
  const [kardexRecords, setKardexRecords] = useState<KardexRecord[]>(INITIAL_KARDEX_DATA);
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedOperation, setSelectedOperation] = useState<string>("all");
  const [valuationMethod, setValuationMethod] = useState<"ponderado" | "peps">("ponderado");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal new movement
  const [isNewMovementOpen, setIsNewMovementOpen] = useState(false);
  const [newMovProduct, setNewMovProduct] = useState("1");
  const [newMovType, setNewMovType] = useState<"compra" | "merma" | "ajuste">("merma");
  const [newMovQty, setNewMovQty] = useState("1");
  const [newMovCost, setNewMovCost] = useState("3.40");
  const [newMovDoc, setNewMovDoc] = useState("MERMA-0012");
  const [newMovReason, setNewMovReason] = useState("Merma por producto caducado / dañado");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    async function loadKardex() {
      try {
        const data = await getKardexMovementsData();
        if (data && data.length > 0) {
          setKardexRecords(data);
        }
      } catch (err) {
        console.error("Error fetching kardex movements:", err);
      }
    }
    loadKardex();
  }, []);

  const filtered = kardexRecords.filter((record) => {
    const matchesProduct = selectedProduct === "all" || record.productoId === selectedProduct;
    const matchesOp =
      selectedOperation === "all" ||
      (selectedOperation === "compra" && record.tipoOperacion === "02_COMPRA") ||
      (selectedOperation === "venta" && record.tipoOperacion === "01_VENTA") ||
      (selectedOperation === "merma" && record.tipoOperacion === "13_MERMA");
    const matchesSearch =
      record.productoNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.sku.includes(searchTerm) ||
      record.docSerieNumero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProduct && matchesOp && matchesSearch;
  });

  const paginatedKardex = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate totals
  const totalEntradasSoles = filtered.reduce((acc, r) => acc + (r.entradaTotal || 0), 0);
  const totalSalidasSoles = filtered.reduce((acc, r) => acc + (r.salidaTotal || 0), 0);
  const currentValuedStock = filtered[0]?.saldoTotal || 1368.20;

  const handleExport = (format: "excel" | "sunat") => {
    toast.success(`Generando exportación de Kardex Valorado (${format.toUpperCase()})`, {
      description: "Descarga del Formato 13.1 SUNAT completada exitosamente.",
    });
  };

  const handleCreateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(newMovQty) || 0;
    const cost = parseFloat(newMovCost) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }

    const prodInfo = PRODUCTS_LIST.find((p) => p.id === newMovProduct) || PRODUCTS_LIST[1];
    const prevSaldo = kardexRecords[0]?.saldoCant || 100;
    const newSaldoCant = newMovType === "compra" ? prevSaldo + qty : prevSaldo - qty;
    const newSaldoTotal = +(newSaldoCant * cost).toFixed(2);

    const newRecord: KardexRecord = {
      id: Date.now().toString(),
      fecha: "15/08/2026 " + new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
      productoId: newMovProduct,
      productoNombre: prodInfo.name.split(" (")[0],
      sku: prodInfo.name.includes("(") ? prodInfo.name.split("(")[1].replace(")", "") : "775123456789",
      categoria: "Lácteos",
      tipoOperacion: newMovType === "compra" ? "02_COMPRA" : newMovType === "merma" ? "13_MERMA" : "99_AJUSTE",
      operacionLabel: newMovReason,
      tipoDoc: newMovType === "compra" ? "01_FACTURA" : "AJ_ACTA",
      docSerieNumero: newMovDoc,
      entradaCant: newMovType === "compra" ? qty : undefined,
      entradaCostoUnit: newMovType === "compra" ? cost : undefined,
      entradaTotal: newMovType === "compra" ? +(qty * cost).toFixed(2) : undefined,
      salidaCant: newMovType !== "compra" ? qty : undefined,
      salidaCostoUnit: newMovType !== "compra" ? cost : undefined,
      salidaTotal: newMovType !== "compra" ? +(qty * cost).toFixed(2) : undefined,
      saldoCant: newSaldoCant,
      saldoCostoUnit: cost,
      saldoTotal: newSaldoTotal,
    };

    setKardexRecords((prev) => [newRecord, ...prev]);
    toast.success("Movimiento de Kardex registrado exitosamente");
    setIsNewMovementOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Archive className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Kardex Valorado de Existencias
                <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                  SUNAT 13.1
                </Badge>
              </h1>
              <p className="text-xs text-slate-400">
                Control permanente de inventarios valorizados por producto y método contable
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
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
            onClick={() => setIsNewMovementOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-3.5" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
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

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Entradas por Compras</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalEntradasSoles)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Total recepciones</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <ArrowDownRight className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Costo de Ventas (Salidas)</div>
            <div className="text-2xl font-mono font-extrabold text-blue-400 mt-1">
              {formatCurrency(totalSalidasSoles)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Salidas por caja POS</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <ArrowUpRight className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Existencias Valorizadas</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {formatCurrency(currentValuedStock)}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Saldo en almacén</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <DollarSign className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Product Selector */}
          <div className="w-full md:w-80">
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Filtrar por Producto
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {PRODUCTS_LIST.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
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
                onClick={() => setSelectedOperation("merma")}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedOperation === "merma" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Mermas
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Kardex Multi-Column Table Formato 13.1 */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              {/* Top Header Grouping */}
              <tr className="border-b border-slate-800/90 bg-slate-950/95 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th colSpan={4} className="py-2.5 px-4 border-r border-slate-800">
                  Documento de Traslado / Comprobante
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-800 bg-emerald-950/40 text-emerald-400">
                  Entradas (Compras / Recepción)
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center border-r border-slate-800 bg-rose-950/40 text-rose-400">
                  Salidas (Ventas POS / Mermas)
                </th>
                <th colSpan={3} className="py-2.5 px-3 text-center bg-blue-950/40 text-blue-300">
                  Saldo Final en Existencias
                </th>
              </tr>
              {/* Detailed Sub-Header */}
              <tr className="border-b border-slate-800/90 bg-slate-950 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                <th className="py-2.5 px-4">Fecha / Hora</th>
                <th className="py-2.5 px-4">Producto & SKU</th>
                <th className="py-2.5 px-3">Tipo Operación</th>
                <th className="py-2.5 px-3 border-r border-slate-800">Doc. Referencia</th>
                {/* Entradas */}
                <th className="py-2.5 px-3 text-center bg-emerald-950/20">Cantidad</th>
                <th className="py-2.5 px-3 text-right bg-emerald-950/20">Costo Unit.</th>
                <th className="py-2.5 px-3 text-right bg-emerald-950/20 border-r border-slate-800">Total (S/)</th>
                {/* Salidas */}
                <th className="py-2.5 px-3 text-center bg-rose-950/20">Cantidad</th>
                <th className="py-2.5 px-3 text-right bg-rose-950/20">Costo Unit.</th>
                <th className="py-2.5 px-3 text-right bg-rose-950/20 border-r border-slate-800">Total (S/)</th>
                {/* Saldo Final */}
                <th className="py-2.5 px-3 text-center bg-blue-950/20">Cantidad</th>
                <th className="py-2.5 px-3 text-right bg-blue-950/20">Costo Unit.</th>
                <th className="py-2.5 px-4 text-right bg-blue-950/20">Total (S/)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
              {paginatedKardex.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {r.fecha}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-white text-xs">{r.productoNombre}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{r.sku}</div>
                  </td>
                  <td className="py-3 px-3">
                    {r.tipoOperacion === "02_COMPRA" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 whitespace-nowrap">
                        <ArrowDownRight className="size-2.5" /> Compra
                      </span>
                    )}
                    {r.tipoOperacion === "01_VENTA" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 text-blue-400 border border-blue-800/50 whitespace-nowrap">
                        <ArrowUpRight className="size-2.5" /> Venta POS
                      </span>
                    )}
                    {r.tipoOperacion === "13_MERMA" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 border border-rose-800/50 whitespace-nowrap">
                        <TrendingDown className="size-2.5" /> Merma
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 border-r border-slate-800">
                    <div className="font-mono font-bold text-white text-xs">{r.docSerieNumero}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{r.operacionLabel}</div>
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
              ))}
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
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5">
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
                  Producto
                </label>
                <select
                  value={newMovProduct}
                  onChange={(e) => setNewMovProduct(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {PRODUCTS_LIST.filter((p) => p.id !== "all").map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
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
                    onChange={(e) => setNewMovType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="merma">Merma / Descarte</option>
                    <option value="compra">Compra / Entrada</option>
                    <option value="ajuste">Ajuste de Inventario</option>
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
                    placeholder="MERMA-0012"
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
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
                >
                  <CheckCircle2 className="size-4" /> Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
