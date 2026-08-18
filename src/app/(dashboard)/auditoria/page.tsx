"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  KeyRound,
  AlertTriangle,
  Info,
  AlertOctagon,
  Clock,
  User,
  Building2,
  Cpu,
  Eye,
  CheckCircle2,
  Layers,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AuditDetailDialog, AuditEvent } from "@/components/auditoria/audit-detail-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getAuditLogsData } from "@/actions/data-fetchers";

const INITIAL_AUDIT_LOGS: AuditEvent[] = [
  {
    id: "EVT-90412",
    timestamp: "15/08/2026 11:42:15",
    accion: "Emisión de Boleta Electrónica",
    categoria: "Facturación SUNAT",
    severidad: "informativo",
    usuario: "Carlos Alarcón",
    rolUsuario: "Cajero POS",
    sucursal: "Sucursal Central - Surco",
    terminal: "Caja 01 - Principal",
    ip: "192.168.1.101",
    detalles: "Emisión exitosa del comprobante B001-00042918 por S/ 24.00 a Clientes Varios (Medio de pago: Efectivo).",
    payload: {
      comprobante: "B001-00042918",
      monto: 24.00,
      medioPago: "efectivo",
      itemsCount: 3,
      hashSunat: "q7E4u9Yx1P3a8B2=",
    },
  },
  {
    id: "EVT-90411",
    timestamp: "15/08/2026 11:30:04",
    accion: "Eliminación de Ítem con PIN de Supervisor",
    categoria: "Seguridad",
    severidad: "advertencia",
    usuario: "Carlos Alarcón",
    rolUsuario: "Cajero POS",
    supervisorAutorizo: "Marcos Ramos (PIN 7741)",
    sucursal: "Sucursal Central - Surco",
    terminal: "Caja 01 - Principal",
    ip: "192.168.1.101",
    detalles: "El cajero solicitó eliminar 'Leche Gloria Entera 400g (x2)' del ticket. Operación autorizada mediante PIN de supervisor.",
    payload: {
      producto: "Leche Gloria Entera 400g",
      sku: "775123456789",
      cantidadEliminada: 2,
      montoAfectado: 9.00,
      supervisorId: "u3",
    },
  },
  {
    id: "EVT-90410",
    timestamp: "15/08/2026 10:50:22",
    accion: "Retiro de Efectivo a Bóveda (Egreso)",
    categoria: "Caja & POS",
    severidad: "advertencia",
    usuario: "Carlos Alarcón",
    rolUsuario: "Cajero POS",
    supervisorAutorizo: "Marcos Ramos (PIN 7741)",
    sucursal: "Sucursal Central - Surco",
    terminal: "Caja 01 - Principal",
    ip: "192.168.1.101",
    detalles: "Retiro preventivo de efectivo de gaveta a bóveda principal por límite de seguridad excedido. Monto: S/ 800.00.",
    payload: {
      montoRetirado: 800.00,
      motivo: "Exceso de efectivo en gaveta - Retiro preventivo a bóveda",
      saldoRestanteEnCaja: 650.00,
    },
  },
  {
    id: "EVT-90409",
    timestamp: "15/08/2026 10:15:30",
    accion: "Emisión de Nota de Crédito Electrónica",
    categoria: "Facturación SUNAT",
    severidad: "critico",
    usuario: "Marcos Ramos",
    rolUsuario: "Supervisor de Tienda",
    sucursal: "Sucursal Central - Surco",
    terminal: "Caja 02 - Rápida",
    ip: "192.168.1.102",
    detalles: "Emisión de Nota de Crédito BC01-0000045 por S/ 45.80 anulando comprobante B001-00042917 (Motivo: 01 Anulación de la operación). Reincorporación de 4 ítems al inventario.",
    payload: {
      comprobanteModificado: "B001-00042917",
      notaCredito: "BC01-0000045",
      totalDevuelto: 45.80,
      reingresoStock: true,
    },
  },
  {
    id: "EVT-90408",
    timestamp: "15/08/2026 09:30:10",
    accion: "Ajuste de Kardex por Merma de Perecible",
    categoria: "Inventario",
    severidad: "advertencia",
    usuario: "Esteban Vega",
    rolUsuario: "Encargado de Almacén",
    sucursal: "Sucursal Central - Surco",
    terminal: "Terminal Almacén 01",
    ip: "192.168.1.200",
    detalles: "Registro de merma de 6 und de 'Yogurt Gloria Fresa 1L' por fecha de vencimiento alcanzada. Documento de sustento: ACT-2026-088.",
    payload: {
      sku: "775889900112",
      producto: "Yogurt Gloria Fresa 1L",
      cantidadMerma: 6,
      costoTotalPerdida: 32.40,
      actaReferencia: "ACT-2026-088",
    },
  },
  {
    id: "EVT-90407",
    timestamp: "15/08/2026 08:00:00",
    accion: "Apertura de Turno de Caja #00124",
    categoria: "Caja & POS",
    severidad: "informativo",
    usuario: "Carlos Alarcón",
    rolUsuario: "Cajero POS",
    sucursal: "Sucursal Central - Surco",
    terminal: "Caja 01 - Principal",
    ip: "192.168.1.101",
    detalles: "Apertura formal de turno #00124 con fondo inicial de sencillo de S/ 200.00 en gaveta física.",
    payload: {
      turno: "00124",
      montoInicial: 200.00,
      caja: "Caja 01 - Principal",
    },
  },
];

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditEvent[]>(INITIAL_AUDIT_LOGS);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    async function loadAuditLogs() {
      try {
        const data = await getAuditLogsData();
        if (data && data.length > 0) {
          setLogs(data);
        }
      } catch (err) {
        console.error("Error fetching audit logs:", err);
      }
    }
    loadAuditLogs();
  }, []);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      log.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.usuario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.sucursal.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.detalles.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity =
      filterSeverity === "all" || log.severidad === filterSeverity;
    const matchesCat =
      filterCategory === "all" ||
      (filterCategory === "pos" && log.categoria === "Caja & POS") ||
      (filterCategory === "seguridad" && log.categoria === "Seguridad") ||
      (filterCategory === "inventario" && log.categoria === "Inventario") ||
      (filterCategory === "facturacion" && log.categoria === "Facturación SUNAT");
    return matchesSearch && matchesSeverity && matchesCat;
  });

  const paginatedLogs = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalEventos = logs.length;
  const totalPinEvents = logs.filter((l) => l.supervisorAutorizo).length;
  const totalWarnings = logs.filter((l) => l.severidad === "advertencia" || l.severidad === "critico").length;

  const handleOpenDetail = (event: AuditEvent) => {
    setSelectedEvent(event);
    setIsDetailOpen(true);
  };

  const handleExport = () => {
    toast.success("Descargando registro inmutable de auditoría en formato Excel / CSV");
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="size-6 text-blue-400" /> Auditoría de Acciones & Seguridad
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Trazabilidad inmutable de aperturas de caja, retiros, autorizaciones con PIN y eventos SUNAT
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <Download className="size-3.5 text-blue-400" /> Exportar Logs (CSV)
          </button>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Eventos Registrados Hoy</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {totalEventos} <span className="text-xs font-sans text-slate-400 font-normal">registros</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">Trazabilidad en tiempo real</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Autorizaciones con PIN</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {totalPinEvents} <span className="text-xs font-sans text-amber-300/80 font-normal">validaciones</span>
            </div>
            <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">PIN Supervisor verificado</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <KeyRound className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Alertas / Advertencias</div>
            <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
              {totalWarnings} <span className="text-xs font-sans text-rose-300/80 font-normal">eventos</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Mermas y anulaciones</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
            <AlertTriangle className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Integridad de Logs</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              100% <span className="text-xs font-sans text-emerald-300/80 font-normal">inmutable</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Firma criptográfica</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="size-5" />
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
            placeholder="Buscar por acción, ID de evento, usuario, sucursal o descripción..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>

        {/* Severity Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterSeverity("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterSeverity === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Todas las Severidades
          </button>
          <button
            onClick={() => setFilterSeverity("informativo")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterSeverity === "informativo" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Informativo
          </button>
          <button
            onClick={() => setFilterSeverity("advertencia")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterSeverity === "advertencia" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Advertencia
          </button>
          <button
            onClick={() => setFilterSeverity("critico")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterSeverity === "critico" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Crítico
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Fecha / Hora & ID</th>
              <th className="py-3.5 px-4">Acción Ejecutada</th>
              <th className="py-3.5 px-4">Categoría</th>
              <th className="py-3.5 px-4">Colaborador / Rol</th>
              <th className="py-3.5 px-4">Ubicación & Terminal</th>
              <th className="py-3.5 px-4 text-center">Autorización PIN</th>
              <th className="py-3.5 px-4 text-center">Severidad</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {paginatedLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-mono font-bold text-white text-xs">{log.timestamp}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{log.id}</div>
                </td>
                <td className="py-3.5 px-4 max-w-[240px]">
                  <div className="font-bold text-white text-xs tracking-tight">{log.accion}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{log.detalles}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                    {log.categoria}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="font-semibold text-white text-xs">{log.usuario}</div>
                  <div className="text-[10px] text-blue-400">{log.rolUsuario}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="text-xs text-white truncate max-w-[160px]">{log.sucursal}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{log.terminal}</div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  {log.supervisorAutorizo ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                      <KeyRound className="size-2.5" /> PIN Supervisor
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-600">-</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {log.severidad === "critico" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/60">
                      <AlertOctagon className="size-2.5" /> Crítico
                    </span>
                  )}
                  {log.severidad === "advertencia" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-400 border border-amber-800/60">
                      <AlertTriangle className="size-2.5" /> Advertencia
                    </span>
                  )}
                  {log.severidad === "informativo" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
                      <Info className="size-2.5" /> Info
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <button
                    onClick={() => handleOpenDetail(log)}
                    title="Ver Detalle Completo del Evento"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                  >
                    <Eye className="size-3.5" />
                  </button>
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

      {/* Audit Detail Modal */}
      <AuditDetailDialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        event={selectedEvent}
      />
    </div>
  );
}
