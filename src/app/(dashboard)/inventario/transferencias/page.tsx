"use client";

import { useState, useEffect } from "react";
import {
  Truck,
  ArrowRightLeft,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  FileText,
  Printer,
  ShieldCheck,
  Building2,
  Boxes,
  Weight,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  AlertCircle,
  Eye,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GreTicketDialog } from "@/components/inventario/gre-ticket-dialog";
import {
  receiveStockTransferAction,
  getStockTransfersAction,
  TransferRecord,
} from "@/actions/transfer-actions";
import { useQueryState, parseAsString } from "nuqs";

export default function TransferenciasPage() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await getStockTransfersAction();
      setTransfers(data);
      if (showToast) {
        toast.success(`Transferencias sincronizadas: ${data.length} registros cargados.`);
      }
    } catch (err) {
      console.error(err);
      if (showToast) toast.error("Error al actualizar traslados.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterStatus, setFilterStatus] = useQueryState<"all" | "en_transito" | "completada">(
    "estado",
    parseAsString.withDefault("all") as any
  );

  // Selected Transfer for GRE view
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRecord | null>(null);
  const [isGreTicketOpen, setIsGreTicketOpen] = useState(false);

  const filteredTransfers = transfers.filter((t) => {
    const matchesSearch =
      t.codigoGuia.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.sucursalDestino.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.choferNombre && t.choferNombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (t.vehiculoPlaca && t.vehiculoPlaca.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === "all" || t.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalEnTransito = transfers.filter((t) => t.estado === "en_transito").length;
  const totalCompletadas = transfers.filter((t) => t.estado === "completada").length;
  const totalKgmTrasladados = transfers.reduce((acc, t) => acc + t.pesoBrutoKgm, 0);

  const handleOpenGre = (transfer: TransferRecord) => {
    setSelectedTransfer(transfer);
    setIsGreTicketOpen(true);
  };

  const handleReceiveTransfer = async (transfer: TransferRecord) => {
    try {
      const res = await receiveStockTransferAction(
        transfer.id,
        transfer.codigoGuia,
        transfer.items.map((it) => ({ productoId: it.productoId, cantidad: it.cantidad }))
      );

      if (res.success) {
        setTransfers((prev) =>
          prev.map((t) =>
            t.id === transfer.id
              ? {
                  ...t,
                  estado: "completada",
                  fechaLlegada: `${new Date().toLocaleDateString("es-PE")} ${new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}`,
                }
              : t
          )
        );
        toast.success(`¡Traslado ${transfer.codigoGuia} recepcionado en ${transfer.sucursalDestino}!`, {
          description: "Stock incrementado en destino y Kardex actualizado.",
        });
      } else {
        toast.error(res.error || "No se pudo recepcionar la transferencia.");
      }
    } catch {
      toast.error("Error al recepcionar el traslado.");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
              Logística & Traslado SUNAT UBL 2.1
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Truck className="size-6 text-blue-400" /> Transferencias entre Sucursales & GRE
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de despacho inter-tiendas y emisión de Guías de Remisión Electrónicas (Tipo 09)
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Sincronizar traslados desde la base de datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <Link
            href="/inventario/transferencias/nueva"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" /> Nueva Transferencia / GRE
          </Link>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              EN TRÁNSITO
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{totalEnTransito}</div>
            <span className="text-[11px] text-slate-500">Camiones en ruta hacia tiendas</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Truck className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              RECIBIDAS / CONCLUIDAS
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalCompletadas}</div>
            <span className="text-[11px] text-slate-500">Conformadas en destino</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PESO TRASLADADO
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">{totalKgmTrasladados.toFixed(1)} KGM</div>
            <span className="text-[11px] text-slate-500">Declarado a SUNAT</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Weight className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              SUCURSALES
            </span>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">3 Tiendas</div>
            <span className="text-[11px] text-slate-500">Surco, Miraflores, San Isidro</span>
          </div>
          <div className="size-11 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Building2 className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por N° Guía, destino, chofer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilterStatus("en_transito")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === "en_transito"
                ? "bg-amber-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            En Tránsito
          </button>
          <button
            onClick={() => setFilterStatus("completada")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterStatus === "completada"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Completadas
          </button>
        </div>
      </div>

      {/* Transfers List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3.5 px-4">Guía Remisión</th>
              <th className="py-3.5 px-4">Ruta (Origen ➔ Destino)</th>
              <th className="py-3.5 px-4">Transporte / Chofer</th>
              <th className="py-3.5 px-4 text-center">Bultos / Peso</th>
              <th className="py-3.5 px-4">Fecha Salida</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredTransfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-white">
                  <div className="flex items-center gap-1.5">
                    <FileText className="size-4 text-blue-400" />
                    <span>{t.codigoGuia}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans block">GRE Remitente (09)</span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-white font-bold flex items-center gap-1">
                    <span>{t.sucursalOrigen}</span>
                    <span className="text-slate-500">➔</span>
                    <span className="text-blue-400">{t.sucursalDestino}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    {t.items.length} ítems en despacho
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-300">
                  <div className="font-bold text-white">{t.choferNombre || "Transportista"}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Placa: {t.vehiculoPlaca || "En convenio"}
                  </div>
                </td>
                <td className="py-3 px-4 text-center font-mono">
                  <span className="font-bold text-white">{t.totalBultos} bultos</span>
                  <span className="text-[10px] text-slate-400 block">{t.pesoBrutoKgm.toFixed(2)} KGM</span>
                </td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  <div>{t.fechaSalida}</div>
                  <span className="text-[10px] text-slate-500">{t.horaSalida}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  {t.estado === "en_transito" ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-800/60 text-amber-400 text-[10px] font-bold animate-pulse">
                      <Truck className="size-3" /> En Tránsito
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-bold">
                      <CheckCircle2 className="size-3" /> Completada
                    </span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenGre(t)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ver Guía de Remisión"
                    >
                      <Eye className="size-3.5 text-blue-400" /> GRE
                    </button>
                    {t.estado === "en_transito" && (
                      <button
                        type="button"
                        onClick={() => handleReceiveTransfer(t)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="size-3.5" /> Recepcionar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Electronic Delivery Guide Ticket Modal */}
      <GreTicketDialog
        isOpen={isGreTicketOpen}
        onClose={() => setIsGreTicketOpen(false)}
        transfer={selectedTransfer}
      />
    </div>
  );
}
