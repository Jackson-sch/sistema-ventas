"use client";

import { useState, useEffect } from "react";
import {
  Store,
  Building2,
  Plus,
  Search,
  Cpu,
  Printer,
  Receipt,
  MapPin,
  Phone,
  User,
  CheckCircle2,
  Edit2,
  Trash2,
  Lock,
  Layers,
  Sparkles,
  Server,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { BranchFormDialog, BranchData } from "@/components/sucursales/branch-form-dialog";
import { RegisterFormDialog, RegisterData } from "@/components/sucursales/register-form-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { getBranchesAndRegistersData } from "@/actions/data-fetchers";

export default function SucursalesPage() {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [registers, setRegisters] = useState<RegisterData[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Branch Dialog state
  const [isBranchFormOpen, setIsBranchFormOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<BranchData | null>(null);

  // Register Dialog state
  const [isRegisterFormOpen, setIsRegisterFormOpen] = useState(false);
  const [editingRegister, setEditingRegister] = useState<RegisterData | null>(null);

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "branch" | "register"; id: string; name: string } | null>(null);

  const loadBranches = async (showToast = false) => {
    try {
      if (showToast) setIsRefreshing(true);
      const data = await getBranchesAndRegistersData();
      if (data && data.length > 0) {
        const mappedBranches: BranchData[] = data.map((b) => ({
          id: b.id,
          codigoSunat: b.codigoSunat,
          nombre: b.nombre,
          direccion: b.direccion,
          ciudad: "Lima",
          telefono: b.telefono,
          encargado: "Marcos Ramos",
          cajasCount: b.cajasCount,
          estado: b.activo ? "Activa" : "En Mantenimiento",
        }));
        setBranches(mappedBranches);
        if (mappedBranches[0]) setSelectedBranchId(mappedBranches[0].id);

        const mappedRegisters: RegisterData[] = data.flatMap((b) =>
          b.cajas.map((c) => ({
            id: c.id,
            branchId: b.id,
            nombre: c.nombre,
            tipo: c.tipo,
            serieBoleta: c.serieBoleta,
            serieFactura: c.serieFactura,
            serieNotaCredito: c.serieNC,
            impresoraTipo: "Red (Ethernet/WiFi)",
            impresoraIp: c.ipImpresora,
            estado: c.estado === "abierta" ? "En Turno" : "Operativa",
            cajeroActual: c.cajeroActual,
          }))
        );
        setRegisters(mappedRegisters);
        if (showToast) {
          toast.success(`Sucursales actualizadas: ${mappedBranches.length} tiendas y ${mappedRegisters.length} terminales sincronizadas.`);
        }
      }
    } catch (err) {
      console.error("Error loading branches and registers:", err);
      if (showToast) toast.error("Error al actualizar sucursales.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBranches();
  }, []);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId) || branches[0];
  const activeBranchRegisters = registers.filter((r) => r.branchId === selectedBranch?.id);

  const totalCajasActivas = registers.filter((r) => r.estado === "En Turno").length;

  const handleOpenNewBranch = () => {
    setEditingBranch(null);
    setIsBranchFormOpen(true);
  };

  const handleOpenEditBranch = (b: BranchData) => {
    setEditingBranch(b);
    setIsBranchFormOpen(true);
  };

  const handleSaveBranch = (saved: BranchData) => {
    setBranches((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    toast.success(`Sucursal "${saved.nombre}" guardada exitosamente.`);
  };

  const handleOpenNewRegister = () => {
    setEditingRegister(null);
    setIsRegisterFormOpen(true);
  };

  const handleOpenEditRegister = (reg: RegisterData) => {
    setEditingRegister(reg);
    setIsRegisterFormOpen(true);
  };

  const handleSaveRegister = (saved: RegisterData) => {
    setRegisters((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });

    // Update branch count
    setBranches((prev) =>
      prev.map((b) => (b.id === saved.branchId ? { ...b, cajasCount: b.cajasCount + 1 } : b))
    );

    toast.success(`Terminal "${saved.nombre}" configurada exitosamente.`);
  };

  const handleRequestDeleteBranch = (b: BranchData) => {
    setDeleteTarget({ type: "branch", id: b.id, name: b.nombre });
    setIsDeleteOpen(true);
  };

  const handleRequestDeleteRegister = (reg: RegisterData) => {
    setDeleteTarget({ type: "register", id: reg.id, name: reg.nombre });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "branch") {
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id));
      setRegisters((prev) => prev.filter((r) => r.branchId !== deleteTarget.id));
      toast.success(`Sucursal "${deleteTarget.name}" eliminada.`);
      if (selectedBranchId === deleteTarget.id) {
        const remaining = branches.filter((b) => b.id !== deleteTarget.id);
        if (remaining.length > 0) setSelectedBranchId(remaining[0].id);
      }
    } else {
      setRegisters((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      setBranches((prev) =>
        prev.map((b) => (b.id === selectedBranchId ? { ...b, cajasCount: Math.max(0, b.cajasCount - 1) } : b))
      );
      toast.success(`Caja "${deleteTarget.name}" eliminada.`);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Store className="size-6 text-blue-400" /> Sucursales & Cajas Físicas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestión multi-tienda, terminales POS, series tributarias SUNAT e impresoras de red
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadBranches(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Sincronizar sucursales y terminales desde la Base de Datos"
          >
            <RefreshCw className={`size-3.5 text-blue-400 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </button>
          <button
            onClick={handleOpenNewRegister}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors"
          >
            <Cpu className="size-3.5 text-blue-400" /> Nueva Caja / Terminal
          </button>
          <button
            onClick={handleOpenNewBranch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-3.5" /> Nueva Sucursal
          </button>
        </div>
      </div>

      {/* KPI Global Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Sucursales</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {branches.length} <span className="text-xs font-sans text-slate-400 font-normal">tiendas</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">100% operativas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Store className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Cajas Registradas</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {registers.length} <span className="text-xs font-sans text-slate-400 font-normal">terminales</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">Físicas y autoservicio</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Cpu className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Cajas en Turno Activo</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {totalCajasActivas} <span className="text-xs font-sans text-emerald-300/80 font-normal">cajeros cobrando</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Sesiones abiertas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Impresoras Térmicas 80mm</div>
            <div className="text-2xl font-mono font-extrabold text-purple-400 mt-1">
              {registers.length} <span className="text-xs font-sans text-slate-400 font-normal">conectadas</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Protocolo ESC/POS</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Printer className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Branches List (Left) + Registers Detail (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Branch Cards Selector (Left 5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Building2 className="size-4 text-blue-400" /> Directorio de Tiendas
            </h2>
            <span className="text-xs text-slate-500 font-mono">{branches.length} activas</span>
          </div>

          <div className="space-y-2.5">
            {branches.map((b) => {
              const isSelected = b.id === selectedBranch?.id;
              return (
                <div
                  key={b.id}
                  onClick={() => setSelectedBranchId(b.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? "bg-blue-950/40 border-blue-500/60 shadow-lg shadow-blue-500/10"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{b.nombre}</span>
                        {b.id === "b1" && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold text-[10px]">
                            Principal
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <MapPin className="size-3 text-slate-500 shrink-0" />
                        <span>{b.direccion} — {b.ciudad}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditBranch(b);
                        }}
                        title="Editar Tienda"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      >
                        <Edit2 className="size-3" />
                      </button>
                      {branches.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRequestDeleteBranch(b);
                          }}
                          title="Eliminar Tienda"
                          className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3 font-mono text-[11px]">
                      <span>SUNAT: <strong className="text-slate-300">{b.codigoSunat}</strong></span>
                      <span>Tel: <strong className="text-slate-300">{b.telefono}</strong></span>
                    </div>
                    <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                      {b.cajasCount} Cajas
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Registers & Cash Desks in Selected Branch (Right 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Cpu className="size-4 text-blue-400" /> Cajas & Terminales de {selectedBranch?.nombre}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Series fiscales asignadas e impresoras de tickets vinculadas
                </p>
              </div>

              <button
                onClick={handleOpenNewRegister}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                <Plus className="size-3.5" /> Agregar Caja
              </button>
            </div>

            {/* Registers Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeBranchRegisters.map((reg) => {
                const isTurno = reg.estado === "En Turno";
                return (
                  <div
                    key={reg.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/90 space-y-3 relative group hover:border-slate-700 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{reg.nombre}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                              isTurno
                                ? "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                                : "bg-slate-800 text-slate-400 border-slate-700"
                            }`}
                          >
                            {reg.estado}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Terminal {reg.tipo}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditRegister(reg)}
                          title="Editar Caja"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        >
                          <Edit2 className="size-3" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteRegister(reg)}
                          title="Eliminar Caja"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>

                    {/* Fiscal Series Pills */}
                    <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Boleta:</span>
                        <strong className="text-blue-400">{reg.serieBoleta}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Factura:</span>
                        <strong className="text-purple-400">{reg.serieFactura}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nota Crédito:</span>
                        <strong className="text-rose-400">{reg.serieNotaCredito}</strong>
                      </div>
                    </div>

                    {/* Hardware and Cashier */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Printer className="size-3 text-slate-500" />
                          <span>{reg.impresoraTipo}</span>
                        </span>
                        {reg.impresoraIp && <span className="font-mono text-slate-500">{reg.impresoraIp}</span>}
                      </div>
                      {reg.cajeroActual && (
                        <div className="flex items-center gap-1 text-slate-300 text-[11px] pt-1 border-t border-slate-800/80">
                          <User className="size-3 text-emerald-400" />
                          <span>Cajero: <strong className="text-white">{reg.cajeroActual}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Branch Form Modal */}
      <BranchFormDialog
        isOpen={isBranchFormOpen}
        onClose={() => setIsBranchFormOpen(false)}
        onSave={handleSaveBranch}
        branchToEdit={editingBranch}
      />

      {/* Register Form Modal */}
      <RegisterFormDialog
        isOpen={isRegisterFormOpen}
        onClose={() => setIsRegisterFormOpen(false)}
        onSave={handleSaveRegister}
        branchId={selectedBranch?.id || "b1"}
        branchName={selectedBranch?.nombre || "Sucursal"}
        registerToEdit={editingRegister}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "branch" ? "¿Eliminar sucursal?" : "¿Eliminar caja física?"}
        itemName={deleteTarget?.name}
        description="Esta acción eliminará el registro del sistema. Los comprobantes y ventas históricas generadas previamente permanecerán inalterados."
      />
    </div>
  );
}
