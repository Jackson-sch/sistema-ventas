"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Award,
  DollarSign,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  CreditCard,
  Building2,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { ClientFormDialog, ClientData } from "@/components/clientes/client-form-dialog";
import { ClientHistoryDialog } from "@/components/clientes/client-history-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getClientsData } from "@/actions/data-fetchers";
import { upsertClientAction, deleteClientAction } from "@/actions/client-actions";

import { useQueryState, parseAsString, parseAsInteger } from "nuqs";

export default function ClientesPage() {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useQueryState("q", parseAsString.withDefault(""));
  const [filterCategory, setFilterCategory] = useQueryState("categoria", parseAsString.withDefault("all"));
  const [currentPage, setCurrentPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [pageSize, setPageSize] = useQueryState("size", parseAsInteger.withDefault(10));

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientData | null>(null);

  // History modal
  const [selectedClientHistory, setSelectedClientHistory] = useState<ClientData | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Delete confirm modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; nombre: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getClientsData();
      setClients(
        data.map((c) => ({
          id: c.id,
          tipoDoc: c.tipoDoc,
          numDoc: c.numDoc,
          nombre: c.nombre,
          email: c.email,
          telefono: c.telefono,
          direccion: c.direccion,
          categoria: c.categoria,
          puntos: c.puntos,
          totalCompras: c.totalCompras,
          ultimoConsumo: c.ultimaCompra,
        }))
      );
    } catch (err) {
      console.error("Error loading clients from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.numDoc.includes(searchTerm) ||
      (c.telefono && c.telefono.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory =
      filterCategory === "all" ||
      (filterCategory === "vip" && c.categoria === "VIP / Frecuente") ||
      (filterCategory === "mayorista" && c.categoria === "Mayorista") ||
      (filterCategory === "estandar" && c.categoria === "Estándar");
    return matchesSearch && matchesCategory;
  });

  const paginatedClients = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalPuntosActivos = clients.reduce((acc, c) => acc + c.puntos, 0);
  const totalComprasAcumuladas = clients.reduce((acc, c) => acc + c.totalCompras, 0);
  const totalVIPs = clients.filter((c) => c.categoria === "VIP / Frecuente" || c.categoria === "Mayorista").length;

  const handleOpenNew = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (client: ClientData) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  const handleOpenHistory = (client: ClientData) => {
    setSelectedClientHistory(client);
    setIsHistoryOpen(true);
  };

  const handleSaveClient = async (savedClient: ClientData) => {
    setClients((prev) => {
      const idx = prev.findIndex((c) => c.id === savedClient.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedClient;
        return next;
      }
      return [savedClient, ...prev];
    });

    await upsertClientAction({
      id: savedClient.id,
      tipoDoc: savedClient.tipoDoc as "DNI" | "RUC" | "CE",
      numDoc: savedClient.numDoc,
      nombre: savedClient.nombre,
      email: savedClient.email,
      telefono: savedClient.telefono,
      direccion: savedClient.direccion,
      categoria: savedClient.categoria,
      puntos: savedClient.puntos,
    });

    toast.success(`Cliente "${savedClient.nombre}" guardado y sincronizado con PostgreSQL.`);
  };

  const handleRequestDelete = (id: string, nombre: string) => {
    setClientToDelete({ id, nombre });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
    await deleteClientAction(clientToDelete.id, clientToDelete.nombre);
    toast.success(`Cliente "${clientToDelete.nombre}" eliminado del directorio.`);
    setClientToDelete(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users className="size-6 text-blue-400" /> Directorio de Clientes & Puntos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Consulta automática DNI (Reniec) / RUC (SUNAT), fidelización y saldos en base de datos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refrescar datos desde la base de datos"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="size-3.5" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Clientes Registrados</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {clients.length} <span className="text-xs font-sans text-slate-400 font-normal">personas/empresas</span>
            </div>
            <div className="text-[10px] text-blue-400 font-mono mt-0.5">{totalVIPs} clientes VIP / Mayoristas</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Puntos de Fidelización Activos</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {totalPuntosActivos.toLocaleString("es-PE")} <span className="text-xs font-sans text-amber-300/80 font-normal">pts</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Equivale a {formatCurrency(totalPuntosActivos * 0.20)} en canjes</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Award className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Facturación Acumulada Clientes</div>
            <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
              {formatCurrency(totalComprasAcumuladas)}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Ticket promedio: {formatCurrency(totalComprasAcumuladas / (clients.length || 1))}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <DollarSign className="size-5" />
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
            placeholder="Buscar por DNI/RUC, nombre del cliente, teléfono o email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterCategory === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterCategory("vip")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterCategory === "vip" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            VIPs
          </button>
          <button
            onClick={() => setFilterCategory("mayorista")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterCategory === "mayorista" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Mayoristas
          </button>
          <button
            onClick={() => setFilterCategory("estandar")}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterCategory === "estandar" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Estándar
          </button>
        </div>
      </div>

      {/* Clients Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Documento & Cliente</th>
              <th className="py-3.5 px-4">Contacto</th>
              <th className="py-3.5 px-4 text-center">Categoría</th>
              <th className="py-3.5 px-4 text-center">Puntos Acumulados</th>
              <th className="py-3.5 px-4 text-right">Total Comprado</th>
              <th className="py-3.5 px-4 text-center">Última Compra</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {paginatedClients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white text-sm">{client.nombre}</div>
                  <div className="text-[11px] text-blue-400 font-mono mt-0.5 flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-blue-950/80 border border-blue-800/60 font-semibold text-[10px]">
                      {client.tipoDoc}
                    </span>
                    <span>{client.numDoc}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Phone className="size-3 text-slate-500" />
                    <span>{client.telefono || "-"}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <Mail className="size-3 text-slate-600" />
                    <span className="truncate max-w-[180px]">{client.email || "-"}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      client.categoria === "VIP / Frecuente"
                        ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                        : client.categoria === "Mayorista"
                        ? "bg-purple-950/80 text-purple-400 border-purple-800/60"
                        : "bg-slate-800/80 text-slate-300 border-slate-700/50"
                    }`}
                  >
                    {client.categoria === "VIP / Frecuente" && <Sparkles className="size-3" />}
                    {client.categoria === "Mayorista" && <Building2 className="size-3" />}
                    {client.categoria}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="font-mono font-bold text-amber-400 text-sm flex items-center justify-center gap-1">
                    <Award className="size-3.5" />
                    <span>{client.puntos} pts</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Canjeable: {formatCurrency(client.puntos * 0.20)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-sm">
                  {formatCurrency(client.totalCompras)}
                </td>
                <td className="py-3.5 px-4 text-center text-slate-400 font-mono text-[11px]">
                  {client.ultimoConsumo || "-"}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => handleOpenHistory(client)}
                      title="Historial de Compras y Puntos"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <Eye className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(client)}
                      title="Editar Cliente"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleRequestDelete(client.id, client.nombre)}
                      title="Eliminar Cliente"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
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

      {/* Client Form Modal */}
      <ClientFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveClient}
        clientToEdit={editingClient}
      />

      {/* Client History and Points Modal */}
      <ClientHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        client={selectedClientHistory}
        onPointsUpdated={(newPts) => {
          if (selectedClientHistory) {
            setClients((prev) =>
              prev.map((c) =>
                c.id === selectedClientHistory.id ? { ...c, puntos: newPts } : c
              )
            );
            setSelectedClientHistory({ ...selectedClientHistory, puntos: newPts });
          }
        }}
      />

      {/* Secure Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Eliminar cliente del directorio?"
        itemName={clientToDelete?.nombre}
        description="Esta acción eliminará el registro del cliente y sus puntos acumulados. Los comprobantes fiscales emitidos históricamente permanecerán intactos."
      />
    </div>
  );
}
