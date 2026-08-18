"use client";

import { useState, useEffect, useRef } from "react";
import {
  ClipboardCheck,
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  RefreshCw,
  Sparkles,
  Download,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  ShieldCheck,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  getActiveAuditSessionAction,
  updateCountItemAction,
  applyKardexAdjustmentAction,
  InventoryAuditSession,
  InventoryCountItem,
} from "@/actions/inventory-count-actions";

import { useQueryState, parseAsString } from "nuqs";

export default function InventarioConteoPage() {
  const [session, setSession] = useState<InventoryAuditSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterType, setFilterType] = useQueryState<"todos" | "con_diferencias" | "por_vencer">(
    "filtro",
    parseAsString.withDefault("todos") as any
  );
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [motivoAjuste, setMotivoAjuste] = useState("Regularización por toma de inventario físico");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getActiveAuditSessionAction();
      setSession(data);
    } catch {
      toast.error("Error al cargar sesión de auditoría.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query || !session) return;

    const targetItem = session.items.find(
      (i) => i.sku.toLowerCase() === query || i.nombre.toLowerCase().includes(query)
    );

    if (targetItem) {
      const newCount = targetItem.conteoFisico + 1;
      updateCountItemAction(targetItem.productoId, newCount).then((res) => {
        if (res.success) {
          setSession(res.session);
          toast.success(`Escaneado: ${targetItem.nombre} (Conteo: ${newCount})`, {
            description: `Diferencia con sistema: ${newCount - targetItem.stockTeorico} unds`,
          });
        }
      });
    } else {
      toast.error(`Producto con código "${barcodeInput}" no encontrado en la lista de auditoría.`);
    }

    setBarcodeInput("");
    barcodeInputRef.current?.focus();
  };

  const handleCountChange = async (productoId: string, delta: number) => {
    if (!session) return;
    const item = session.items.find((i) => i.productoId === productoId);
    if (!item) return;

    const newCount = Math.max(0, item.conteoFisico + delta);
    const res = await updateCountItemAction(productoId, newCount);
    if (res.success) {
      setSession(res.session);
    }
  };

  const handleApplyAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await applyKardexAdjustmentAction(motivoAjuste);
      if (res.success) {
        toast.success("¡Ajuste masivo de stock procesado!", {
          description: res.message,
        });
        setIsAdjustModalOpen(false);
        loadData();
      }
    } catch {
      toast.error("Error al aplicar ajuste en Kardex.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Sesión de Inventario Físico...</div>
      </div>
    );
  }

  const filteredItems = session.items.filter((item) => {
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.includes(searchTerm) ||
      (item.lote && item.lote.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "con_diferencias") return item.diferencia !== 0;
    if (filterType === "por_vencer") return item.estadoVencimiento === "por_vencer" || item.estadoVencimiento === "vencido";
    return true;
  });

  const totalPorVencer = session.items.filter(
    (i) => i.estadoVencimiento === "por_vencer" || i.estadoVencimiento === "vencido"
  ).length;

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50 flex items-center gap-1">
              <ClipboardCheck className="size-3" /> Control de Pérdidas & Mermas
            </span>
            <span className="text-xs font-mono text-slate-400">
              Sesión: <strong className="text-white">{session.codigoSesion}</strong>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="size-6 text-blue-400" /> Toma de Inventario Físico & Ajustes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Conteo ciego continuo con escáner, conciliación de existencias teóricas y trazabilidad de lotes FIFO
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => toast.success("Generando reporte de diferencias de inventario en Excel...")}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="size-3.5 text-blue-400" /> Exportar Diferencias (Excel)
          </button>
          <button
            type="button"
            onClick={() => setIsAdjustModalOpen(true)}
            disabled={session.estado === "ajustado"}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <CheckCircle2 className="size-3.5" />
            {session.estado === "ajustado" ? "Inventario Ajustado" : "Aplicar Ajuste a Kardex"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              ÍTEMS AUDITADOS
            </span>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {session.items.length} Productos
            </div>
            <span className="text-[11px] text-slate-500">Muestra seleccionada en góndola</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <ClipboardCheck className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              DESCUADRE DE UNIDADES
            </span>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                session.totalDiferencias < 0
                  ? "text-rose-400"
                  : session.totalDiferencias > 0
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {session.totalDiferencias > 0 ? `+${session.totalDiferencias}` : session.totalDiferencias} unds
            </div>
            <span className="text-[11px] text-slate-500">Diferencia neta vs sistema</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <AlertTriangle className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              IMPACTO ECONÓMICO (MERMA)
            </span>
            <div
              className={`text-2xl font-black font-mono mt-1 ${
                session.impactoTotalSoles < 0 ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              {formatCurrency(session.impactoTotalSoles)}
            </div>
            <span className="text-[11px] text-slate-500">Valorizado al costo promedio</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            {session.impactoTotalSoles < 0 ? <TrendingDown className="size-5" /> : <TrendingUp className="size-5" />}
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              LOTES POR VENCER (FIFO)
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {totalPorVencer} Lotes
            </div>
            <span className="text-[11px] text-slate-500">Expiran en menos de 30 días</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <Calendar className="size-5" />
          </div>
        </div>
      </div>

      {/* Barcode Scanner Input Bar */}
      <div className="glass-panel rounded-2xl p-4 border border-slate-800/80">
        <form onSubmit={handleBarcodeSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Barcode className="size-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Escanee código de barras (EAN-13 / SKU) para sumar al conteo físico..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Plus className="size-3.5" /> Sumar al Conteo
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por producto, SKU o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterType("todos")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === "todos"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todos ({session.items.length})
          </button>
          <button
            onClick={() => setFilterType("con_diferencias")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === "con_diferencias"
                ? "bg-rose-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Con Descuadre
          </button>
          <button
            onClick={() => setFilterType("por_vencer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              filterType === "por_vencer"
                ? "bg-amber-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Lotes FIFO ({totalPorVencer})
          </button>
        </div>
      </div>

      {/* Audit Reconciliation Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">Producto / Código</th>
                <th className="py-3.5 px-4">Lote & Vencimiento (FIFO)</th>
                <th className="py-3.5 px-4 text-center">Stock Sistema</th>
                <th className="py-3.5 px-4 text-center">Conteo Físico</th>
                <th className="py-3.5 px-4 text-center">Diferencia</th>
                <th className="py-3.5 px-4 text-right">Costo Unit.</th>
                <th className="py-3.5 px-4 text-right">Impacto Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {filteredItems.map((item) => (
                <tr key={item.productoId} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="text-white font-bold text-sm tracking-tight">{item.nombre}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-500 text-[11px]">{item.sku}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        {item.categoria}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {item.lote ? (
                      <div className="space-y-0.5">
                        <span className="font-mono font-bold text-white text-xs">{item.lote}</span>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`size-2 rounded-full ${
                              item.estadoVencimiento === "por_vencer"
                                ? "bg-amber-400 animate-pulse"
                                : item.estadoVencimiento === "vencido"
                                ? "bg-rose-500"
                                : "bg-emerald-400"
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">
                            Vence: {item.fechaVencimiento}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 text-xs">Sin Lote</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300 text-sm">
                    {item.stockTeorico}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center justify-center gap-2 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800">
                      <button
                        onClick={() => handleCountChange(item.productoId, -1)}
                        className="size-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-10 text-center font-mono font-black text-white text-sm">
                        {item.conteoFisico}
                      </span>
                      <button
                        onClick={() => handleCountChange(item.productoId, 1)}
                        className="size-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-extrabold text-sm">
                    {item.diferencia === 0 ? (
                      <span className="text-slate-500">0</span>
                    ) : item.diferencia > 0 ? (
                      <span className="text-amber-400">+{item.diferencia} (Sobrante)</span>
                    ) : (
                      <span className="text-rose-400">{item.diferencia} (Faltante)</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {formatCurrency(item.costoUnitario)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    <span
                      className={
                        item.impactoMonetario < 0
                          ? "text-rose-400"
                          : item.impactoMonetario > 0
                          ? "text-amber-400"
                          : "text-slate-400"
                      }
                    >
                      {formatCurrency(item.impactoMonetario)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <CheckCircle2 className="size-5 text-blue-400" /> Confirmar Ajuste Masivo en Kardex
              </h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleApplyAdjustment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Motivo del Ajuste de Inventario:</label>
                <select
                  value={motivoAjuste}
                  onChange={(e) => setMotivoAjuste(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                >
                  <option value="Regularización por toma de inventario físico">Regularización por toma de inventario físico</option>
                  <option value="Merma por productos rotos o dañados">Merma por productos rotos o dañados</option>
                  <option value="Baja por fecha de vencimiento expirada">Baja por fecha de vencimiento expirada</option>
                  <option value="Ajuste por diferencias de conteo en góndolas">Ajuste por diferencias de conteo en góndolas</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-slate-300">
                <div className="flex justify-between">
                  <span>Diferencia Total en Unidades:</span>
                  <strong className="text-rose-400 font-mono">{session.totalDiferencias} unds</strong>
                </div>
                <div className="flex justify-between">
                  <span>Impacto Neto Contable:</span>
                  <strong className="text-rose-400 font-mono">{formatCurrency(session.impactoTotalSoles)}</strong>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                Al confirmar, el sistema generará automáticamente los <strong>asientos de ajuste de entrada y salida en el Kardex Valorado</strong>, actualizando el stock disponible para ventas en el POS.
              </p>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
                >
                  <CheckCircle2 className="size-4" />
                  {isSubmitting ? "Ajustando..." : "Confirmar y Ajustar Kardex"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
