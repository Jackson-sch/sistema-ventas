"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileSpreadsheet,
  Download,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  FileText,
  CheckCircle2,
  Package,
  Layers,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSireSalesData,
  getReportsProfitabilityDataAction,
  SireSaleRecord,
  CategoryProfitabilityRecord,
  ProductTurnoverRecord,
} from "@/actions/reports-actions";

export default function ReportesPage() {
  const [records, setRecords] = useState<SireSaleRecord[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("202608");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterDocType, setFilterDocType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [activeTab, setActiveTab] = useState<"sire" | "rentabilidad">("sire");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [categoriesProfitability, setCategoriesProfitability] = useState<CategoryProfitabilityRecord[]>([]);
  const [topRotationProducts, setTopRotationProducts] = useState<ProductTurnoverRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [dataSire, dataProfit] = await Promise.all([
          getSireSalesData(selectedPeriod),
          getReportsProfitabilityDataAction(),
        ]);
        if (dataSire && dataSire.length > 0) {
          setRecords(dataSire);
        }
        if (dataProfit) {
          setCategoriesProfitability(dataProfit.categories);
          setTopRotationProducts(dataProfit.topProducts);
        }
      } catch (err) {
        console.error("Error loading reports data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedPeriod]);

  // Calculations
  const totalFacturado = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.estadoComprobante === "1" ? r.montoTotal : 0), 0);
  }, [records]);

  const totalBaseGravada = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.estadoComprobante === "1" ? r.baseImponibleGravada : 0), 0);
  }, [records]);

  const totalIgv = useMemo(() => {
    return records.reduce((acc, r) => acc + (r.estadoComprobante === "1" ? r.igv : 0), 0);
  }, [records]);

  const totalComprobantes = records.length;

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchQuery =
        r.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.numero.includes(searchTerm) ||
        r.razonSocialCliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.numDocCliente.includes(searchTerm);
      const matchDoc =
        filterDocType === "all" || r.tipoComprobante === filterDocType;
      return matchQuery && matchDoc;
    });
  }, [records, searchTerm, filterDocType]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Export TXT SIRE 14.1 in official SUNAT format: LE[RUC][AÑO][MES]00140100001111.txt
  const handleExportTxtSire = () => {
    const ruc = "20608945123";
    const filename = `LE${ruc}${selectedPeriod}00140100001111.txt`;

    let lines = "";
    records.forEach((r) => {
      // SUNAT SIRE 14.1 pipe-delimited structure
      const line = [
        r.periodo,
        r.cuo,
        "M00001",
        r.fechaEmision,
        r.fechaVcto,
        r.tipoComprobante,
        r.serie,
        r.numero,
        "",
        r.tipoDocCliente,
        r.numDocCliente,
        r.razonSocialCliente,
        "",
        r.baseImponibleGravada.toFixed(2),
        "0.00",
        r.igv.toFixed(2),
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        "0.00",
        r.montoTotal.toFixed(2),
        r.moneda,
        r.tipoCambio.toFixed(3),
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        r.estadoComprobante,
        "",
      ].join("|");
      lines += line + "|\r\n";
    });

    const blob = new Blob([lines], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Archivo SIRE generado: ${filename}`, {
      description: `Estructura oficial 14.1 con ${records.length} registros lista para validar en SUNAT.`,
    });
  };

  // Export CSV for Excel
  const handleExportCsv = () => {
    let csv = "Periodo,CUO,Fecha Emision,Tipo,Serie,Numero,Tipo Doc,Num Doc,Cliente,Base Gravada,IGV,Total,Estado\r\n";
    records.forEach((r) => {
      csv += `"${r.periodo}","${r.cuo}","${r.fechaEmision}","${r.tipoComprobante}","${r.serie}","${r.numero}","${r.tipoDocCliente}","${r.numDocCliente}","${r.razonSocialCliente}",${r.baseImponibleGravada},${r.igv},${r.montoTotal},"${r.estadoComprobante === "1" ? "Aceptado" : "Anulado"}"\r\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Registro_Ventas_${selectedPeriod}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Archivo Excel/CSV exportado exitosamente.");
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/50">
              Cumplimiento Tributario SUNAT
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">RVIE / Formato 14.1</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <FileSpreadsheet className="size-6 text-emerald-400" /> Reportes Contables & SIRE SUNAT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generación y exportación oficial del Registro de Ventas e Ingresos Electrónico conforme a la R.S. N° 112-2021/SUNAT.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportTxtSire}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Download className="size-4" />
            Descargar TXT SIRE 14.1
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-colors cursor-pointer"
          >
            <FileText className="size-4 text-emerald-400" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Facturado (Periodo)</span>
            <DollarSign className="size-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(totalFacturado)}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Base gravada total del mes
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Base Imponible Gravada</span>
            <TrendingUp className="size-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {formatCurrency(totalBaseGravada)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Ventas afectas sin IGV
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Débito Fiscal IGV (18%)</span>
            <ShieldCheck className="size-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono tracking-tight">
            {formatCurrency(totalIgv)}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Impuesto a pagar a SUNAT
          </div>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Comprobantes Emitidos</span>
            <FileSpreadsheet className="size-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono tracking-tight">
            {totalComprobantes}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            Boletas, Facturas y NC
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("sire")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "sire"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Registro de Ventas SIRE 14.1
        </button>
        <button
          onClick={() => setActiveTab("rentabilidad")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "rentabilidad"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-400 hover:text-white hover:bg-slate-900"
          }`}
        >
          Análisis de Rentabilidad & Margen
        </button>
      </div>

      {activeTab === "sire" ? (
        /* Main SIRE Table Section */
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Buscar por serie, número o cliente..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="w-48">
                <Select
                  value={filterDocType}
                  onValueChange={(val) => {
                    setFilterDocType(val);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/90 border-slate-800 text-xs text-slate-200">
                    <SelectValue placeholder="Tipo Comprobante" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="all" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      Todos los Comprobantes
                    </SelectItem>
                    <SelectItem value="03" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      03 — Boletas de Venta
                    </SelectItem>
                    <SelectItem value="01" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      01 — Facturas
                    </SelectItem>
                    <SelectItem value="07" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      07 — Notas de Crédito
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={selectedPeriod}
                  onValueChange={(val) => setSelectedPeriod(val)}
                >
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/90 border-slate-800 text-xs text-slate-200 font-mono">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50 font-mono">
                    <SelectItem value="202608" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      Periodo: Agosto 2026
                    </SelectItem>
                    <SelectItem value="202607" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      Periodo: Julio 2026
                    </SelectItem>
                    <SelectItem value="202606" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      Periodo: Junio 2026
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Mostrando <strong>{paginated.length}</strong> de <strong>{filtered.length}</strong> comprobantes
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-3">CUO</th>
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Comprobante</th>
                  <th className="py-3 px-3">Doc. Cliente</th>
                  <th className="py-3 px-3">Razón Social / Nombre</th>
                  <th className="py-3 px-3 text-right">Base Gravada</th>
                  <th className="py-3 px-3 text-right">IGV (18%)</th>
                  <th className="py-3 px-3 text-right">Total</th>
                  <th className="py-3 px-3 text-center">Estado SUNAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="size-6 animate-spin mx-auto mb-2 text-blue-400" />
                      Consultando registros de ventas en PostgreSQL...
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500 font-sans">
                      <Package className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                      No se encontraron comprobantes para el periodo y filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginated.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-3 text-slate-400">{r.cuo}</td>
                      <td className="py-3 px-3 text-slate-300">{r.fechaEmision}</td>
                      <td className="py-3 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 font-bold text-[10px] text-blue-400">
                          {r.tipoComprobante === "01" ? "01 FAC" : r.tipoComprobante === "07" ? "07 NC" : "03 BOL"}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">
                        {r.serie}-{r.numero}
                      </td>
                      <td className="py-3 px-3 text-slate-300">
                        {r.tipoDocCliente === "6" ? "RUC: " : "DNI: "}{r.numDocCliente}
                      </td>
                      <td className="py-3 px-3 text-slate-200 font-sans truncate max-w-[200px]">
                        {r.razonSocialCliente}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        {formatCurrency(r.baseImponibleGravada)}
                      </td>
                      <td className="py-3 px-3 text-right text-purple-400 font-bold">
                        {formatCurrency(r.igv)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        {formatCurrency(r.montoTotal)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {r.estadoComprobante === "1" ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/50">
                            Aceptado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-950/80 text-rose-400 text-[10px] font-bold border border-rose-800/50">
                            Anulado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <TablePagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      ) : (
        /* Profitability and ABC Pareto Section */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieIcon className="size-4 text-blue-400" /> Margen Bruto por Categoría de Producto
            </h3>

            <div className="space-y-3">
              {categoriesProfitability.map((cat) => (
                <div key={cat.name} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{cat.name}</span>
                    <span className="font-mono text-emerald-400 font-bold">Margen: {cat.margen}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, cat.margen * 2.5)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Ventas: {formatCurrency(cat.ventas)}</span>
                    <span>Ganancia: {formatCurrency(cat.ganancia)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="size-4 text-emerald-400" /> Top 5 Productos con Mayor Rotación
            </h3>

            <div className="space-y-3">
              {topRotationProducts.map((p) => (
                <div key={p.rank} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs">
                      #{p.rank}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SKU: {p.sku} • {p.und}</div>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 text-xs">
                    {formatCurrency(p.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
