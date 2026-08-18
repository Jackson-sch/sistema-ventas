"use client";

import { useState, useEffect } from "react";
import {
  DollarSign,
  Receipt,
  Calendar,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  Printer,
  Search,
  ArrowUpRight,
  Download,
  Filter,
  CheckCircle2,
  RotateCcw,
  FileCode2,
  Building2,
  Clock,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ThermalTicketDialog, TicketData } from "@/components/ventas/thermal-ticket-dialog";
import { CreditNoteDialog } from "@/components/ventas/credit-note-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getSalesHistoryData } from "@/actions/data-fetchers";

interface SaleRecord {
  id: string;
  comprobante: string;
  tipo: "Boleta" | "Factura" | "Nota de Crédito";
  cliente: string;
  docNumero: string;
  medioPago: "efectivo" | "tarjeta" | "yape" | "plin";
  caja: string;
  cajero: string;
  total: number;
  fecha: string;
  hora: string;
  estadoSunat: "aceptado" | "enviado" | "anulado";
  hashSunat: string;
  items: {
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad: string;
  }[];
}

const INITIAL_SALES: SaleRecord[] = [
  {
    id: "1",
    comprobante: "B001-00042918",
    tipo: "Boleta",
    cliente: "Clientes Varios",
    docNumero: "00000000",
    medioPago: "efectivo",
    caja: "Caja 01 - Principal",
    cajero: "Carlos Alarcón",
    total: 24.00,
    fecha: "15/08/2026",
    hora: "11:42:15",
    estadoSunat: "aceptado",
    hashSunat: "q7E4u9Yx1P3a8B2=",
    items: [
      { cantidad: 2, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 9.00, unidad: "und" },
      { cantidad: 1, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 9.80, unidad: "und" },
      { cantidad: 1, descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 5.20, unidad: "und" },
    ],
  },
  {
    id: "2",
    comprobante: "B001-00042917",
    tipo: "Boleta",
    cliente: "Juan Pérez García",
    docNumero: "45892144",
    medioPago: "yape",
    caja: "Caja 01 - Principal",
    cajero: "Carlos Alarcón",
    total: 45.80,
    fecha: "15/08/2026",
    hora: "11:35:02",
    estadoSunat: "aceptado",
    hashSunat: "m2K8v4Lz0N9b3C1=",
    items: [
      { cantidad: 4, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 18.00, unidad: "und" },
      { cantidad: 2, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 19.60, unidad: "und" },
      { cantidad: 1.5, descripcion: "Manzana Delicia Nacional", precioUnit: 4.80, total: 7.20, unidad: "kg" },
      { cantidad: 1, descripcion: "Bolsa Ecológica Biodegradable", precioUnit: 1.00, total: 1.00, unidad: "und" },
    ],
  },
  {
    id: "3",
    comprobante: "F001-00001204",
    tipo: "Factura",
    cliente: "Inversiones Retail SAC",
    docNumero: "20601234567",
    medioPago: "tarjeta",
    caja: "Caja 02 - Rápida",
    cajero: "María Gómez",
    total: 312.50,
    fecha: "15/08/2026",
    hora: "11:15:40",
    estadoSunat: "aceptado",
    hashSunat: "t5P1r9Wq3Z7d4F8=",
    items: [
      { cantidad: 20, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 90.00, unidad: "und" },
      { cantidad: 15, descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 78.00, unidad: "und" },
      { cantidad: 10, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 98.00, unidad: "und" },
      { cantidad: 5, descripcion: "Detergente Bolívar 1kg", precioUnit: 8.50, total: 42.50, unidad: "und" },
      { cantidad: 4, descripcion: "Bolsa Reutilizable Grande", precioUnit: 1.00, total: 4.00, unidad: "und" },
    ],
  },
  {
    id: "4",
    comprobante: "B001-00042916",
    tipo: "Boleta",
    cliente: "Clientes Varios",
    docNumero: "00000000",
    medioPago: "efectivo",
    caja: "Caja 01 - Principal",
    cajero: "Carlos Alarcón",
    total: 12.50,
    fecha: "15/08/2026",
    hora: "10:58:19",
    estadoSunat: "aceptado",
    hashSunat: "k9N3x7Js1M5e6G2=",
    items: [
      { cantidad: 1, descripcion: "Detergente Bolívar 1kg", precioUnit: 8.50, total: 8.50, unidad: "und" },
      { cantidad: 1, descripcion: "Jabón de Tocador Camay", precioUnit: 4.00, total: 4.00, unidad: "und" },
    ],
  },
  {
    id: "5",
    comprobante: "B001-00042915",
    tipo: "Boleta",
    cliente: "Ana Torres Silva",
    docNumero: "72109845",
    medioPago: "plin",
    caja: "Caja 02 - Rápida",
    cajero: "María Gómez",
    total: 64.90,
    fecha: "15/08/2026",
    hora: "10:42:01",
    estadoSunat: "enviado",
    hashSunat: "w4T8q2Yr6X0h7J3=",
    items: [
      { cantidad: 6, descripcion: "Yogurt Gloria Fresa 1L", precioUnit: 7.20, total: 43.20, unidad: "und" },
      { cantidad: 3, descripcion: "Galletas Soda San Jorge", precioUnit: 1.50, total: 4.50, unidad: "und" },
      { cantidad: 2, descripcion: "Cereal Ángel Flakes 500g", precioUnit: 8.60, total: 17.20, unidad: "und" },
    ],
  },
  {
    id: "6",
    comprobante: "B001-00042914",
    tipo: "Boleta",
    cliente: "Clientes Varios",
    docNumero: "00000000",
    medioPago: "tarjeta",
    caja: "Caja 03 - Autoservicio",
    cajero: "Terminal Auto 01",
    total: 112.30,
    fecha: "15/08/2026",
    hora: "10:30:11",
    estadoSunat: "aceptado",
    hashSunat: "b8V2c4Zn9M1k5L7=",
    items: [
      { cantidad: 10, descripcion: "Leche Gloria Entera 400g", precioUnit: 4.50, total: 45.00, unidad: "und" },
      { cantidad: 5, descripcion: "Aceite Primor Premium 1L", precioUnit: 9.80, total: 49.00, unidad: "und" },
      { cantidad: 3, descripcion: "Arroz Costeño Extra 1kg", precioUnit: 5.20, total: 15.60, unidad: "und" },
      { cantidad: 2.7, descripcion: "Plátano Seda (kg)", precioUnit: 1.00, total: 2.70, unidad: "kg" },
    ],
  },
];

export default function VentasPage() {
  const [sales, setSales] = useState<SaleRecord[]>(INITIAL_SALES);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDoc, setFilterDoc] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Thermal Ticket modal state
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  // Credit note modal state
  const [targetCreditNote, setTargetCreditNote] = useState<SaleRecord | null>(null);
  const [isCreditNoteOpen, setIsCreditNoteOpen] = useState(false);

  useEffect(() => {
    async function loadSales() {
      try {
        const data = await getSalesHistoryData();
        if (data && data.length > 0) {
          setSales(data);
        }
      } catch (err) {
        console.error("Error fetching sales history:", err);
      }
    }
    loadSales();
  }, []);

  const totalVentas = sales
    .filter((s) => s.tipo !== "Nota de Crédito")
    .reduce((acc, s) => acc + s.total, 0);

  const totalEfectivo = sales
    .filter((s) => s.medioPago === "efectivo" && s.tipo !== "Nota de Crédito")
    .reduce((acc, s) => acc + s.total, 0);

  const totalDigital = totalVentas - totalEfectivo;
  
  const totalComprobantes = sales.filter((s) => s.tipo !== "Nota de Crédito").length;
  const totalNC = sales.filter((s) => s.tipo === "Nota de Crédito").length;

  const filtered = sales.filter((s) => {
    const matchesSearch =
      s.comprobante.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.docNumero.includes(searchTerm) ||
      s.cajero.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDoc =
      filterDoc === "all" ||
      (filterDoc === "boletas" && s.tipo === "Boleta") ||
      (filterDoc === "facturas" && s.tipo === "Factura") ||
      (filterDoc === "notas_credito" && s.tipo === "Nota de Crédito");
    return matchesSearch && matchesDoc;
  });

  const paginatedSales = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenTicket = (sale: SaleRecord) => {
    const ticketData: TicketData = {
      comprobante: sale.comprobante,
      tipo: sale.tipo,
      fecha: sale.fecha,
      hora: sale.hora,
      caja: sale.caja,
      cajero: sale.cajero,
      cliente: {
        nombre: sale.cliente,
        documentoTipo: sale.tipo === "Factura" ? "RUC" : sale.docNumero === "00000000" ? "VARIOS" : "DNI",
        documentoNumero: sale.docNumero,
      },
      items: sale.items,
      medioPago: sale.medioPago,
      montoRecibido: sale.medioPago === "efectivo" ? sale.total + 10 : undefined,
      vuelto: sale.medioPago === "efectivo" ? 10 : undefined,
      total: sale.total,
      hashSunat: sale.hashSunat,
    };
    setSelectedTicket(ticketData);
    setIsTicketOpen(true);
  };

  const handleOpenCreditNote = (sale: SaleRecord) => {
    setTargetCreditNote(sale);
    setIsCreditNoteOpen(true);
  };

  const handleSuccessCreditNote = (ticketData: TicketData) => {
    if (targetCreditNote) {
      // Mark original sale as anulado
      setSales((prev) =>
        prev.map((s) => (s.id === targetCreditNote.id ? { ...s, estadoSunat: "anulado" } : s))
      );

      // Add new Credit Note record
      const newNC: SaleRecord = {
        id: Date.now().toString(),
        comprobante: ticketData.comprobante,
        tipo: "Nota de Crédito",
        cliente: ticketData.cliente?.nombre || targetCreditNote.cliente,
        docNumero: ticketData.cliente?.documentoNumero || targetCreditNote.docNumero,
        medioPago: "efectivo",
        caja: ticketData.caja,
        cajero: ticketData.cajero,
        total: -ticketData.total,
        fecha: ticketData.fecha,
        hora: ticketData.hora,
        estadoSunat: "aceptado",
        hashSunat: ticketData.hashSunat,
        items: ticketData.items,
      };

      setSales((prev) => [newNC, ...prev]);
      setSelectedTicket(ticketData);
      setIsTicketOpen(true);
    }
  };

  const handleDownloadXml = (comprobante: string) => {
    toast.success(`Descargando XML y CDR oficial de SUNAT para: ${comprobante}`);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="size-6 text-blue-400" /> Facturación Electrónica & Ventas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Comprobantes oficiales SUNAT, impresión térmica ESC/POS 80mm y Notas de Crédito
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors">
            <Download className="size-3.5 text-blue-400" /> Reporte de Ventas (Excel)
          </button>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Vendido Hoy</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {formatCurrency(totalVentas)}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">+14.8% vs. meta diaria</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">En Efectivo (Caja)</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalEfectivo)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Gaveta física</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <Banknote className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Digital (Tarjetas/Yape)</div>
            <div className="text-2xl font-mono font-extrabold text-purple-400 mt-1">
              {formatCurrency(totalDigital)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Bancarizado</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <CreditCard className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Comprobantes Emitidos</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {sales.length} <span className="text-xs font-sans text-slate-400 font-normal">documentos</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">SUNAT Aceptado 100%</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Receipt className="size-5" />
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
            placeholder="Buscar por comprobante (B001-...), DNI/RUC o cliente..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterDoc("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterDoc === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterDoc("boleta")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterDoc === "boleta" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Boletas
          </button>
          <button
            onClick={() => setFilterDoc("factura")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterDoc === "factura" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Facturas
          </button>
          <button
            onClick={() => setFilterDoc("nc")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterDoc === "nc" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Notas de Crédito
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Comprobante SUNAT</th>
              <th className="py-3.5 px-4">Cliente / Razón Social</th>
              <th className="py-3.5 px-4 text-center">Medio de Pago</th>
              <th className="py-3.5 px-4 text-center">Caja & Cajero</th>
              <th className="py-3.5 px-4 text-center">Fecha / Hora</th>
              <th className="py-3.5 px-4 text-center">Estado SUNAT</th>
              <th className="py-3.5 px-4 text-right">Total</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {paginatedSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-white text-sm">{sale.comprobante}</div>
                  <div className="text-[10px] text-blue-400 font-sans">{sale.tipo} Electrónica</div>
                </td>
                <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate">
                  <div className="font-semibold text-white truncate">{sale.cliente}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{sale.docNumero}</div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {sale.medioPago === "efectivo" && <Banknote className="size-3 text-emerald-400" />}
                    {sale.medioPago === "tarjeta" && <CreditCard className="size-3 text-blue-400" />}
                    {(sale.medioPago === "yape" || sale.medioPago === "plin") && <QrCode className="size-3 text-purple-400" />}
                    <span className="capitalize">{sale.medioPago}</span>
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center text-slate-300">
                  <div className="font-bold text-white text-[11px]">{sale.caja}</div>
                  <div className="text-[10px] text-slate-500">{sale.cajero}</div>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                  <div>{sale.fecha}</div>
                  <div className="text-slate-500 text-[10px]">{sale.hora}</div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {sale.estadoSunat === "aceptado" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      <CheckCircle2 className="size-3" /> Aceptado
                    </span>
                  )}
                  {sale.estadoSunat === "enviado" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                      <Clock className="size-3" /> Enviado
                    </span>
                  )}
                  {sale.estadoSunat === "anulado" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/60">
                      <RotateCcw className="size-3" /> NC Emitida
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-sm">
                  <span className={sale.total < 0 ? "text-rose-400" : "text-white"}>
                    {formatCurrency(sale.total)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    {/* Ver Ticket Térmico 80mm */}
                    <button
                      onClick={() => handleOpenTicket(sale)}
                      title="Ver e Imprimir Ticket Térmico 80mm"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <Eye className="size-3.5" />
                    </button>

                    {/* Descargar XML / CDR */}
                    <button
                      onClick={() => handleDownloadXml(sale.comprobante)}
                      title="Descargar XML / CDR SUNAT"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-emerald-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <FileCode2 className="size-3.5" />
                    </button>

                    {/* Emitir Nota de Crédito (solo si no es NC ni está anulado) */}
                    {sale.tipo !== "Nota de Crédito" && sale.estadoSunat !== "anulado" && (
                      <button
                        onClick={() => handleOpenCreditNote(sale)}
                        title="Emitir Nota de Crédito / Devolución"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                      >
                        <RotateCcw className="size-3.5" />
                      </button>
                    )}
                  </div>
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

      {/* Thermal Ticket Modal */}
      <ThermalTicketDialog
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        ticket={selectedTicket}
      />

      {/* Credit Note Modal */}
      <CreditNoteDialog
        isOpen={isCreditNoteOpen}
        onClose={() => setIsCreditNoteOpen(false)}
        targetSale={targetCreditNote}
        onSuccess={handleSuccessCreditNote}
      />
    </div>
  );
}
