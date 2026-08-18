"use client";

import { useState } from "react";
import {
  Search,
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  QrCode,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Printer,
  HelpCircle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { ThermalTicketDialog, TicketData } from "@/components/ventas/thermal-ticket-dialog";
import { lookupPublicCpeAction, PublicCpeSearchResult } from "@/actions/public-cpe-actions";

export default function PublicConsultasPage() {
  const [tipoComprobante, setTipoComprobante] = useState("03"); // 03 Boleta, 01 Factura
  const [serie, setSerie] = useState("B001");
  const [numero, setNumero] = useState("00042918");
  const [fechaEmision, setFechaEmision] = useState("2026-08-15");
  const [totalMonto, setTotalMonto] = useState("86.00");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<PublicCpeSearchResult | null>(null);

  // Thermal Ticket modal state
  const [ticketModalData, setTicketModalData] = useState<TicketData | null>(null);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serie || !numero) {
      toast.error("Por favor ingrese la serie y número del comprobante.");
      return;
    }

    setIsSearching(true);
    try {
      const res = await lookupPublicCpeAction({
        tipoComprobante,
        serie,
        numero,
        fechaEmision,
        totalMonto: parseFloat(totalMonto) || 0,
      });

      setSearchResult(res);
      if (res.found) {
        toast.success(`Comprobante ${res.comprobante?.serieNumero} encontrado y verificado.`);
      } else {
        toast.error(res.error || "Comprobante no encontrado.");
      }
    } catch {
      toast.error("Error al consultar el comprobante electrónico.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleQuickDemo = (demoType: "boleta" | "factura") => {
    if (demoType === "boleta") {
      setTipoComprobante("03");
      setSerie("B001");
      setNumero("00042918");
      setFechaEmision("2026-08-15");
      setTotalMonto("86.00");
    } else {
      setTipoComprobante("01");
      setSerie("F001");
      setNumero("00001249");
      setFechaEmision("2026-08-15");
      setTotalMonto("450.00");
    }
  };

  const downloadBlob = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Descargando archivo: ${filename}`);
  };

  const openTicketModal = () => {
    if (!searchResult?.comprobante) return;
    const c = searchResult.comprobante;
    const data: TicketData = {
      comprobante: c.serieNumero,
      tipo: c.tipo,
      fecha: c.fechaEmision,
      hora: c.horaEmision,
      caja: "Caja 01 - Principal",
      cajero: "Cajero de Turno",
      cliente: {
        nombre: c.clienteNombre,
        documentoTipo: c.clienteTipoDoc as any,
        documentoNumero: c.clienteDoc,
      },
      items: c.items.map((i) => ({
        cantidad: i.cantidad,
        descripcion: i.descripcion,
        precioUnit: i.precioUnit,
        total: i.total,
        unidad: i.unidad,
      })),
      medioPago: "efectivo",
      total: c.total,
      hashSunat: c.hashSunat,
    };
    setTicketModalData(data);
    setIsTicketModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[hsl(224,71%,4%)] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="px-6 lg:px-12 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/30">
            N
          </div>
          <div>
            <span className="text-base font-black text-white tracking-tight flex items-center gap-2">
              NovaMarket <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 border border-blue-800">Supermercados</span>
            </span>
            <p className="text-[11px] text-slate-400">Portal Público de Consulta de Comprobantes Electrónicos</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors"
          >
            Acceso Personal POS
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-10 max-w-4xl mx-auto w-full space-y-8">
        {/* Banner Title */}
        <div className="text-center space-y-2 max-w-xl">
          <span className="px-3 py-1 rounded-full bg-blue-950/90 text-blue-400 border border-blue-800 text-xs font-extrabold tracking-wide uppercase">
            SUNAT UBL 2.1 • SEE-DEL
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Consulta de Comprobantes Electrónicos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Consulte la validez fiscal y descargue el <strong>PDF oficial, XML firmado y CDR de SUNAT</strong> de sus compras realizadas en cualquiera de nuestras tiendas.
          </p>
        </div>

        {/* Demo Fast Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px]">Probar con datos de ejemplo:</span>
          <button
            type="button"
            onClick={() => handleQuickDemo("boleta")}
            className="px-3 py-1 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-300 hover:bg-blue-900/60 transition-colors font-mono cursor-pointer"
          >
            Boleta B001-00042918
          </button>
          <button
            type="button"
            onClick={() => handleQuickDemo("factura")}
            className="px-3 py-1 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-300 hover:bg-purple-900/60 transition-colors font-mono cursor-pointer"
          >
            Factura F001-00001249
          </button>
        </div>

        {/* Search Form Card */}
        <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-xs">Tipo de Comprobante:</label>
                <select
                  value={tipoComprobante}
                  onChange={(e) => {
                    setTipoComprobante(e.target.value);
                    if (e.target.value === "01") setSerie("F001");
                    else if (e.target.value === "03") setSerie("B001");
                    else setSerie("FC01");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="03">03 - Boleta de Venta Electrónica</option>
                  <option value="01">01 - Factura Electrónica</option>
                  <option value="07">07 - Nota de Crédito</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-xs">Serie (4 caracteres):</label>
                <input
                  type="text"
                  maxLength={4}
                  value={serie}
                  onChange={(e) => setSerie(e.target.value.toUpperCase())}
                  placeholder="B001 / F001"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs uppercase focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-xs">Número Correlativo:</label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Ej: 00042918"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-xs">Fecha de Emisión:</label>
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold text-xs">Monto Total (S/):</label>
                <input
                  type="number"
                  step="0.01"
                  value={totalMonto}
                  onChange={(e) => setTotalMonto(e.target.value)}
                  placeholder="Ej: 86.00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Search className="size-4" />
              {isSearching ? "Buscando en Servidores SUNAT..." : "Consultar Comprobante Electrónico"}
            </button>
          </form>
        </div>

        {/* Results Card */}
        {searchResult && searchResult.found && searchResult.comprobante && (
          <div className="w-full glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-800/40 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-extrabold border border-emerald-800">
                    ESTADO: ACEPTADO POR SUNAT
                  </span>
                  <h3 className="text-xl font-black text-white font-mono mt-1">
                    {searchResult.comprobante.tipo} {searchResult.comprobante.serieNumero}
                  </h3>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-xs text-slate-400 block">TOTAL PAGADO</span>
                <span className="text-2xl font-black text-emerald-400">
                  {formatCurrency(searchResult.comprobante.total)}
                </span>
              </div>
            </div>

            {/* CDR message */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                RESPUESTA OFICIAL SUNAT (CDR):
              </span>
              <p className="text-slate-200 font-medium">{searchResult.comprobante.cdrMensaje}</p>
              <div className="text-[10px] font-mono text-slate-500 pt-1">
                Firma Digital Hash: {searchResult.comprobante.hashSunat}
              </div>
            </div>

            {/* Client and Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">EMISOR:</span>
                <div className="font-bold text-white">{searchResult.comprobante.razonSocialEmisor}</div>
                <div className="text-slate-400 font-mono">RUC: {searchResult.comprobante.rucEmisor}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">ADQUIRIENTE / CLIENTE:</span>
                <div className="font-bold text-white">{searchResult.comprobante.clienteNombre}</div>
                <div className="text-slate-400 font-mono">
                  {searchResult.comprobante.clienteTipoDoc}: {searchResult.comprobante.clienteDoc}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Detalle de Productos Comprados:
              </span>
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2 px-3">Cant</th>
                      <th className="py-2 px-3">Descripción</th>
                      <th className="py-2 px-3 text-right">P. Unit</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {searchResult.comprobante.items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 font-mono text-slate-300">
                          {i.cantidad} {i.unidad}
                        </td>
                        <td className="py-2 px-3 font-medium text-white">{i.descripcion}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300">
                          {formatCurrency(i.precioUnit)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(i.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={openTicketModal}
                className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-200 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="size-3.5 text-blue-400" /> Ver Ticket Térmico
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    `${searchResult.comprobante?.serieNumero}.xml`,
                    searchResult.xmlContent || "",
                    "application/xml"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" /> Descargar XML Firmado
              </button>

              <button
                type="button"
                onClick={() =>
                  downloadBlob(
                    `R-${searchResult.comprobante?.serieNumero}.xml`,
                    searchResult.cdrContent || "",
                    "application/xml"
                  )
                }
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="size-3.5" /> Descargar CDR SUNAT
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Ticket Modal */}
      <ThermalTicketDialog
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        ticket={ticketModalData}
      />

      {/* Footer */}
      <footer className="px-6 lg:px-12 py-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 font-mono">
        <span>NovaMarket Supermercados S.A.C. • RUC 20608945123</span>
        <span>Sistema Facturador Electrónico Homologado UBL 2.1</span>
      </footer>
    </div>
  );
}
