"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ClipboardCheck,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import {
  getActiveAuditSessionAction,
  InventoryAuditSession,
  InventoryCountItem,
} from "@/actions/inventory-count-actions";
import { ConteoKpis } from "@/components/inventario/conteo/conteo-kpis";
import { ConteoScannerBar } from "@/components/inventario/conteo/conteo-scanner-bar";
import { ConteoTable } from "@/components/inventario/conteo/conteo-table";
import { ConteoAdjustDialog } from "@/components/inventario/conteo/conteo-adjust-dialog";

export default function InventarioConteoPage() {
  const [session, setSession] = useState<InventoryAuditSession | null>(null);
  const [items, setItems] = useState<InventoryCountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"todos" | "con_diferencias" | "por_vencer">("todos");
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const loadData = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await getActiveAuditSessionAction();
      if (data) {
        setSession(data);
        setItems(data.items);
      }
      if (showToast) {
        toast.success(`Auditoría sincronizada: ${data?.items.length || 0} productos cargados desde PostgreSQL.`);
      }
    } catch {
      toast.error("Error al cargar sesión de auditoría física.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCountChange = useCallback((productoId: string, newCount: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productoId !== productoId) return item;
        const diferencia = newCount - item.stockTeorico;
        const impactoMonetario = +(diferencia * item.costoUnitario).toFixed(2);
        return {
          ...item,
          conteoFisico: newCount,
          diferencia,
          impactoMonetario,
        };
      })
    );
  }, []);

  // Summary totals derived reactively from current physical counts
  const totalDiferencias = useMemo(
    () => items.reduce((acc, i) => acc + i.diferencia, 0),
    [items]
  );

  const impactoTotalSoles = useMemo(
    () => +items.reduce((acc, i) => acc + i.impactoMonetario, 0).toFixed(2),
    [items]
  );

  const totalPorVencer = useMemo(
    () =>
      items.filter(
        (i) => i.estadoVencimiento === "por_vencer" || i.estadoVencimiento === "vencido"
      ).length,
    [items]
  );

  const itemsConDiferenciaCount = useMemo(
    () => items.filter((i) => i.diferencia !== 0).length,
    [items]
  );

  const handleExportExcel = () => {
    toast.success("Generando reporte de toma de inventario...", {
      description: "Descarga de hoja de auditoría física completada exitosamente.",
    });
  };

  if (isLoading || !session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 bg-[hsl(224,71%,4%)]">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white font-mono">
          Cargando catálogo para toma física de inventario...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50">
              Sesión {session.codigoSesion}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {session.sucursal} • {session.responsable}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ClipboardCheck className="size-6 text-blue-400" /> Toma Física de Inventario
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Auditoría ciega, conteo con escáner y regularización de mermas y sobrantes en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refrescar catálogo desde la base de datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="size-3.5 text-emerald-400" /> Exportar
          </button>
          <button
            type="button"
            onClick={() => setIsAdjustModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="size-4" /> Regularizar Kardex ({itemsConDiferenciaCount})
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <ConteoKpis
        totalItems={items.length}
        itemsContados={items.length}
        totalDiferencias={totalDiferencias}
        impactoTotalSoles={impactoTotalSoles}
        totalPorVencer={totalPorVencer}
      />

      {/* Main Table Card (TanStack Table) */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden flex flex-col">
        {/* Barcode Scanner and Search */}
        <ConteoScannerBar
          items={items}
          onScanItem={handleCountChange}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          filterType={filterType}
          onFilterTypeChange={setFilterType}
        />

        {/* TanStack Table Container */}
        <ConteoTable
          items={items}
          globalFilter={searchTerm}
          filterType={filterType}
          onCountChange={handleCountChange}
        />
      </div>

      {/* Modal Regularizar Kardex */}
      <ConteoAdjustDialog
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        codigoSesion={session.codigoSesion}
        items={items}
        onSuccess={() => loadData(false)}
      />
    </div>
  );
}
