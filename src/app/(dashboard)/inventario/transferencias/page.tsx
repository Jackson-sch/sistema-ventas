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
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { GreTicketDialog } from "@/components/inventario/gre-ticket-dialog";
import {
  createStockTransferAction,
  receiveStockTransferAction,
  getStockTransfersAction,
  TransferRecord,
  CreateTransferInput,
} from "@/actions/transfer-actions";
const AVAILABLE_PRODUCTS = [
  { id: "1", sku: "775012345678", nombre: "Leche Gloria Entera 400g", stock: 240, unidad: "und", peso: 0.45 },
  { id: "2", sku: "775098765432", nombre: "Arroz Costeño Extra 1kg", stock: 180, unidad: "und", peso: 1.00 },
  { id: "3", sku: "775011122233", nombre: "Aceite Primor Premium 1L", stock: 110, unidad: "und", peso: 0.92 },
  { id: "4", sku: "200000012345", nombre: "Manzana Delicia Nacional (kg)", stock: 95, unidad: "kg", peso: 1.00 },
  { id: "5", sku: "775055566677", nombre: "Detergente Bolívar 1kg", stock: 150, unidad: "und", peso: 1.00 },
];

import { useQueryState, parseAsString } from "nuqs";

export default function TransferenciasPage() {
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await getStockTransfersAction();
      setTransfers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
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

  // New Transfer Modal State
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [sucursalDestino, setSucursalDestino] = useState("Sucursal Miraflores");
  const [modalidadTransporte, setModalidadTransporte] = useState<"01" | "02">("02");
  const [choferNombre, setChoferNombre] = useState("Jorge Huamán Díaz");
  const [choferDoc, setChoferDoc] = useState("45891234");
  const [choferLicencia, setChoferLicencia] = useState("Q45891234");
  const [vehiculoPlaca, setVehiculoPlaca] = useState("ABC-123");
  const [transferItems, setTransferItems] = useState<{ id: string; cantidad: number }[]>([
    { id: "1", cantidad: 48 },
    { id: "2", cantidad: 25 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedProducts = transferItems
      .map((item) => {
        const prod = AVAILABLE_PRODUCTS.find((p) => p.id === item.id);
        if (!prod || item.cantidad <= 0) return null;
        return {
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          cantidad: item.cantidad,
          unidadMedida: prod.unidad,
          pesoKgm: prod.peso,
        };
      })
      .filter(Boolean) as any[];

    if (selectedProducts.length === 0) {
      toast.error("Debe incluir al menos un producto a transferir.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateTransferInput = {
        sucursalDestinoId: "miraflores-branch-id",
        sucursalDestinoNombre: sucursalDestino,
        direccionDestino:
          sucursalDestino === "Sucursal Miraflores"
            ? "Av. Larco 850, Miraflores, Lima"
            : "Av. Conquistadores 410, San Isidro, Lima",
        ubigeoDestino: sucursalDestino === "Sucursal Miraflores" ? "150122" : "150131",
        modalidadTransporte,
        conductor:
          modalidadTransporte === "02"
            ? {
                tipoDoc: "1",
                numDoc: choferDoc,
                nombres: choferNombre.split(" ")[0] || "Chofer",
                apellidos: choferNombre.split(" ").slice(1).join(" ") || "NovaMarket",
                licenciaConducir: choferLicencia,
              }
            : undefined,
        vehiculo: modalidadTransporte === "02" ? { placa: vehiculoPlaca } : undefined,
        items: selectedProducts,
      };

      const res = await createStockTransferAction(payload);

      if (res.success && res.transfer) {
        setTransfers((prev) => [res.transfer!, ...prev]);
        toast.success(`¡Guía de Remisión ${res.transfer.codigoGuia} emitida con éxito!`, {
          description: `Mercadería despachada hacia ${sucursalDestino}. Kardex origen rebajado.`,
        });
        setIsNewTransferOpen(false);
        setSelectedTransfer(res.transfer);
        setIsGreTicketOpen(true);
      } else {
        toast.error(res.error || "No se pudo procesar la transferencia.");
      }
    } catch {
      toast.error("Error al emitir Guía de Remisión.");
    } finally {
      setIsSubmitting(false);
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

        <button
          onClick={() => setIsNewTransferOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
        >
          <Plus className="size-3.5" /> Nueva Transferencia / Despacho
        </button>
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

      {/* New Transfer Modal */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Truck className="size-5" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
                    Guía de Remisión Remitente (T001)
                  </span>
                  <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                    Nuevo Despacho / Transferencia de Mercadería
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setIsNewTransferOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              {/* Route Config */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Sucursal Origen</label>
                  <div className="font-bold text-white bg-slate-900 border border-slate-800 p-2 rounded-xl">
                    Almacén Central (Surco, Lima)
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase">Sucursal Destino</label>
                  <select
                    value={sucursalDestino}
                    onChange={(e) => setSucursalDestino(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white p-2 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Sucursal Miraflores">Sucursal Miraflores (Av. Larco 850)</option>
                    <option value="Sucursal San Isidro">Sucursal San Isidro (Av. Conquistadores 410)</option>
                  </select>
                </div>
              </div>

              {/* Transport Details */}
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300">Datos de Transporte y Conductor</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setModalidadTransporte("02")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        modalidadTransporte === "02"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      Privado
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalidadTransporte("01")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        modalidadTransporte === "01"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-900 text-slate-400"
                      }`}
                    >
                      Público
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Nombre Chofer:</label>
                    <input
                      type="text"
                      value={choferNombre}
                      onChange={(e) => setChoferNombre(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white px-2 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">DNI / Licencia:</label>
                    <input
                      type="text"
                      value={choferLicencia}
                      onChange={(e) => setChoferLicencia(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white px-2 py-1.5 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Placa Vehículo:</label>
                    <input
                      type="text"
                      value={vehiculoPlaca}
                      onChange={(e) => setVehiculoPlaca(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 text-white px-2 py-1.5 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Items Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">
                  Selección de Mercadería a Trasladar:
                </span>
                <div className="rounded-xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Producto</th>
                        <th className="py-2 px-3 text-center">Stock Actual</th>
                        <th className="py-2 px-3 text-right">Cant. Trasladar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {AVAILABLE_PRODUCTS.map((prod) => {
                        const current = transferItems.find((it) => it.id === prod.id);
                        const qty = current ? current.cantidad : 0;
                        return (
                          <tr key={prod.id} className="hover:bg-slate-900/50">
                            <td className="py-2 px-3 font-sans text-white font-bold">
                              {prod.nombre}
                              <span className="text-[10px] text-slate-500 block font-mono">
                                SKU: {prod.sku} • {prod.peso} kg/u
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-400">
                              {prod.stock} {prod.unidad}
                            </td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                min="0"
                                max={prod.stock}
                                value={qty}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setTransferItems((prev) => {
                                    const filtered = prev.filter((it) => it.id !== prod.id);
                                    if (val > 0) {
                                      return [...filtered, { id: prod.id, cantidad: val }];
                                    }
                                    return filtered;
                                  });
                                }}
                                className="w-20 bg-slate-900 border border-slate-700 text-white text-right px-2 py-1 rounded-lg text-xs font-bold"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTransferOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-bold text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || transferItems.length === 0}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <Truck className="size-4" />
                  {isSubmitting
                    ? "Generando GRE UBL 2.1..."
                    : "Emitir Guía de Remisión & Despachar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Electronic Delivery Guide Ticket Modal */}
      <GreTicketDialog
        isOpen={isGreTicketOpen}
        onClose={() => setIsGreTicketOpen(false)}
        transfer={selectedTransfer}
      />
    </div>
  );
}
