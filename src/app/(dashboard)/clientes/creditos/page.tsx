"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Printer,
  Edit2,
  Lock,
  Unlock,
  RefreshCw,
  Building2,
  User,
  Phone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import { TablePagination } from "@/components/ui/table-pagination";
import { CreditStatementDialog } from "@/components/clientes/credit-statement-dialog";
import {
  getCreditAccountsAction,
  registerCreditPaymentAction,
  updateCreditAccountLimitAction,
  CustomerCreditAccount,
} from "@/actions/customer-credit-actions";

export default function CreditosClientesPage() {
  const [accounts, setAccounts] = useState<CustomerCreditAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // nuqs URL search params persistence
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterStatus, setFilterStatus] = useQueryState<"all" | "al_dia" | "por_vencer" | "moroso" | "bloqueado">(
    "estado",
    parseAsString.withDefault("all") as any
  );
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Modals
  const [selectedAccount, setSelectedAccount] = useState<CustomerCreditAccount | null>(null);
  const [isStatementOpen, setIsStatementOpen] = useState(false);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Edit Limit Modal
  const [isEditLimitModalOpen, setIsEditLimitModalOpen] = useState(false);
  const [editLimit, setEditLimit] = useState("");
  const [editDays, setEditDays] = useState(30);
  const [editStatus, setEditStatus] = useState<"al_dia" | "por_vencer" | "moroso" | "bloqueado">("al_dia");
  const [isSubmittingLimit, setIsSubmittingLimit] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getCreditAccountsAction();
      setAccounts(data);
    } catch {
      toast.error("Error al cargar cuentas de crédito.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenPayment = (acc: CustomerCreditAccount) => {
    setSelectedAccount(acc);
    setPaymentAmount(acc.saldoDeudor > 0 ? String(acc.saldoDeudor) : "");
    setPaymentMethod("Efectivo");
    setPaymentNotes("");
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditLimit = (acc: CustomerCreditAccount) => {
    setSelectedAccount(acc);
    setEditLimit(String(acc.limiteCredito));
    setEditDays(acc.diasPlazo);
    setEditStatus(acc.estado);
    setIsEditLimitModalOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const monto = parseFloat(paymentAmount);
    if (!monto || monto <= 0) {
      toast.error("Ingrese un monto de abono válido.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await registerCreditPaymentAction({
        cuentaId: selectedAccount.id,
        montoAbono: monto,
        medioPago: paymentMethod,
        notas: paymentNotes,
      });

      if (res.success) {
        toast.success(`Abono registrado con éxito. Recibo N° ${res.recibo}`, {
          description: `Nuevo saldo deudor: ${formatCurrency(res.nuevoSaldo || 0)}`,
        });
        setIsPaymentModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Error al procesar el abono.");
      }
    } catch {
      toast.error("Error de servidor al registrar abono.");
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleEditLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) return;
    const limit = parseFloat(editLimit);
    if (isNaN(limit) || limit < 0) {
      toast.error("Ingrese un límite de crédito válido.");
      return;
    }

    setIsSubmittingLimit(true);
    try {
      const res = await updateCreditAccountLimitAction({
        cuentaId: selectedAccount.id,
        nuevoLimite: limit,
        diasPlazo: editDays,
        estado: editStatus,
      });

      if (res.success) {
        toast.success("Línea de crédito actualizada.");
        setIsEditLimitModalOpen(false);
        loadData();
      } else {
        toast.error(res.error || "Error al actualizar la línea de crédito.");
      }
    } catch {
      toast.error("Error al actualizar la cuenta.");
    } finally {
      setIsSubmittingLimit(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="size-8 text-blue-400 animate-spin" />
        <div className="text-sm font-bold text-white">Cargando Cuentas por Cobrar & Créditos...</div>
      </div>
    );
  }

  const filtered = accounts.filter((a) => {
    const matchesSearch =
      a.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.clienteDoc.includes(searchTerm);

    if (!matchesSearch) return false;
    if (filterStatus !== "all" && a.estado !== filterStatus) return false;
    return true;
  });

  const totalCarteraPorCobrar = accounts.reduce((acc, a) => acc + a.saldoDeudor, 0);
  const totalLimiteOtorgado = accounts.reduce((acc, a) => acc + a.limiteCredito, 0);
  const totalMorosos = accounts.filter((a) => a.estado === "moroso").length;

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950/80 text-blue-400 text-[10px] font-bold border border-blue-800/50 flex items-center gap-1">
              <CreditCard className="size-3" /> Cuentas por Cobrar & Fiado
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="size-6 text-blue-400" /> Líneas de Crédito & Cuentas Corrientes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de cartera deudora, cobranza en caja, límites autorizados y estados de cuenta
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              CARTERA POR COBRAR
            </span>
            <div className="text-2xl font-black text-rose-400 font-mono mt-1">
              {formatCurrency(totalCarteraPorCobrar)}
            </div>
            <span className="text-[11px] text-slate-500">Saldo deudor acumulado</span>
          </div>
          <div className="size-11 rounded-2xl bg-rose-950/60 border border-rose-800/50 flex items-center justify-center text-rose-400">
            <DollarSign className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              LÍNEA TOTAL AUTORIZADA
            </span>
            <div className="text-2xl font-black text-blue-400 font-mono mt-1">
              {formatCurrency(totalLimiteOtorgado)}
            </div>
            <span className="text-[11px] text-slate-500">{accounts.length} clientes con crédito</span>
          </div>
          <div className="size-11 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <CreditCard className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              DISPONIBLE EN TIENDAS
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
              {formatCurrency(totalLimiteOtorgado - totalCarteraPorCobrar)}
            </div>
            <span className="text-[11px] text-slate-500">Capacidad de compra activa</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              CUENTAS MOROSAS
            </span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">
              {totalMorosos} Clientes
            </div>
            <span className="text-[11px] text-slate-500">Plazos vencidos en cobranza</span>
          </div>
          <div className="size-11 rounded-2xl bg-amber-950/60 border border-amber-800/50 flex items-center justify-center text-amber-400">
            <AlertTriangle className="size-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, RUC o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Todos ({accounts.length})
          </button>
          <button
            onClick={() => setFilterStatus("al_dia")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "al_dia"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Al Día
          </button>
          <button
            onClick={() => setFilterStatus("por_vencer")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "por_vencer"
                ? "bg-amber-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Por Vencer
          </button>
          <button
            onClick={() => setFilterStatus("moroso")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              filterStatus === "moroso"
                ? "bg-rose-600 text-white"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            Morosos
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-400 uppercase tracking-wider font-bold text-[11px] bg-slate-950/60">
                <th className="py-3.5 px-4">Cliente / Razón Social</th>
                <th className="py-3.5 px-4 text-right">Límite Autorizado</th>
                <th className="py-3.5 px-4 text-right">Saldo Deudor</th>
                <th className="py-3.5 px-4 text-right">Crédito Disp.</th>
                <th className="py-3.5 px-4">Plazo & Vence</th>
                <th className="py-3.5 px-4 text-center">Estado</th>
                <th className="py-3.5 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500 font-medium">
                    No se encontraron cuentas de crédito con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                paginated.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="text-white font-bold">{a.clienteNombre}</div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {a.clienteTipoDoc}: {a.clienteDoc} • {a.telefono}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      {formatCurrency(a.limiteCredito)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-rose-400">
                      {formatCurrency(a.saldoDeudor)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-400">
                      {formatCurrency(a.creditoDisponible)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      <div>{a.diasPlazo} días</div>
                      <span className="text-[10px] text-slate-500">
                        {a.fechaVencimientoProxima || "Sin deuda activa"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {a.estado === "al_dia" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold">
                          Al Día
                        </span>
                      ) : a.estado === "por_vencer" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800/60 text-[10px] font-bold">
                          Por Vencer
                        </span>
                      ) : a.estado === "moroso" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60 text-[10px] font-bold">
                          Moroso
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                          Bloqueado
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {a.saldoDeudor > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(a)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            title="Registrar Abono o Pago"
                          >
                            <DollarSign className="size-3" /> Abonar
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAccount(a);
                            setIsStatementOpen(true);
                          }}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ver Estado de Cuenta e Historial"
                        >
                          <FileText className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEditLimit(a)}
                          className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Ajustar Límite de Crédito"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TablePagination
          totalItems={filtered.length}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Statement Modal */}
      <CreditStatementDialog
        isOpen={isStatementOpen}
        onClose={() => setIsStatementOpen(false)}
        account={selectedAccount}
      />

      {/* Payment / Abono Modal */}
      {isPaymentModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <DollarSign className="size-5 text-emerald-400" /> Registrar Abono / Pago de Deuda
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CLIENTE:</span>
                <div className="font-bold text-white text-sm">{selectedAccount.clienteNombre}</div>
                <div className="text-slate-400 font-mono">
                  Deuda Pendiente: <strong className="text-rose-400">{formatCurrency(selectedAccount.saldoDeudor)}</strong>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Monto a Abonar (S/):</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedAccount.saldoDeudor}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Medio de Pago:</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                >
                  <option value="Efectivo (Caja)">Efectivo (Caja POS)</option>
                  <option value="Transferencia BCP">Transferencia BCP</option>
                  <option value="Transferencia BBVA">Transferencia BBVA</option>
                  <option value="Yape / Plin">Yape / Plin</option>
                  <option value="Tarjeta Débito/Crédito">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Notas u Observaciones:</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ej: Pago parcial factura F001-1249"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  {isSubmittingPayment ? "Procesando..." : "Confirmar Abono"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Limit Modal */}
      {isEditLimitModalOpen && selectedAccount && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit2 className="size-5 text-blue-400" /> Ajustar Línea de Crédito
              </h3>
              <button onClick={() => setIsEditLimitModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditLimitSubmit} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">CLIENTE:</span>
                <div className="font-bold text-white text-sm">{selectedAccount.clienteNombre}</div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Límite de Crédito (S/):</label>
                <input
                  type="number"
                  step="100"
                  value={editLimit}
                  onChange={(e) => setEditLimit(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-base font-bold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Días de Plazo de Pago:</label>
                <select
                  value={editDays}
                  onChange={(e) => setEditDays(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                >
                  <option value={7}>7 días calendario</option>
                  <option value={15}>15 días calendario</option>
                  <option value={30}>30 días calendario (Estándar)</option>
                  <option value={45}>45 días calendario</option>
                  <option value={60}>60 días calendario</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Estado de la Cuenta:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                >
                  <option value="al_dia">Al Día</option>
                  <option value="por_vencer">Por Vencer</option>
                  <option value="moroso">Moroso (Alerta)</option>
                  <option value="bloqueado">Bloqueado (No permite ventas al crédito)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditLimitModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLimit}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="size-4" />
                  {isSubmittingLimit ? "Guardando..." : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
