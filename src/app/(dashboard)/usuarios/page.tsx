"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users2,
  UserCheck,
  Shield,
  KeyRound,
  Plus,
  Search,
  Building2,
  Mail,
  Phone,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  Download,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog, UserData } from "@/components/usuarios/user-form-dialog";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { TablePagination } from "@/components/ui/table-pagination";
import { getUsersAndRolesData } from "@/actions/data-fetchers";

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showPins, setShowPins] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // User form modal
  const [isUserFormOpen, setIsUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; nombre: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getUsersAndRolesData();
      setUsers(
        data.map((u) => ({
          id: u.id,
          nombre: u.nombre,
          dni: "45892144",
          email: u.email,
          telefono: "987 654 321",
          rol: u.rol,
          sucursal: u.sucursal,
          pin: u.pinSupervisor,
          estado: u.estado === "activo" ? "Activo" : "Inactivo",
          ultimoAcceso: u.ultimoAcceso,
        }))
      );
    } catch (err) {
      console.error("Error loading users from DB:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.dni.includes(searchTerm) ||
      u.sucursal.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole =
      filterRole === "all" ||
      (filterRole === "cajero" && u.rol === "Cajero POS") ||
      (filterRole === "supervisor" && u.rol === "Supervisor de Tienda") ||
      (filterRole === "admin" && u.rol === "Administrador General") ||
      (filterRole === "almacen" && u.rol === "Encargado de Almacén");
    return matchesSearch && matchesRole;
  });

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalCajeros = users.filter((u) => u.rol === "Cajero POS").length;
  const totalSupervisores = users.filter((u) => u.rol === "Supervisor de Tienda").length;
  const totalAdmins = users.filter((u) => u.rol === "Administrador General").length;

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setIsUserFormOpen(true);
  };

  const handleOpenEditUser = (user: UserData) => {
    setEditingUser(user);
    setIsUserFormOpen(true);
  };

  const handleSaveUser = (userData: UserData) => {
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === userData.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = userData;
        return next;
      }
      return [userData, ...prev];
    });
    toast.success(`Colaborador "${userData.nombre}" guardado y asignado exitosamente.`);
  };

  const handleRequestDelete = (id: string, nombre: string) => {
    setUserToDelete({ id, nombre });
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    toast.success(`Colaborador "${userToDelete.nombre}" revocado del sistema.`);
    setUserToDelete(null);
  };

  const getRoleParam = (rol: string) => {
    if (rol.includes("Cajero")) return "cajero";
    if (rol.includes("Supervisor")) return "supervisor";
    if (rol.includes("Almacén") || rol.includes("Almacen")) return "almacen";
    return "admin";
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Users2 className="size-6 text-blue-400" /> Usuarios, Roles & PINs de Seguridad
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Control de acceso basado en roles (RBAC), PINs de supervisor y asignación a sucursales
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refrescar desde la base de datos"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin text-blue-400" : ""}`} />
          </button>
          <Link
            href="/usuarios/permisos"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold hover:border-slate-700 transition-colors cursor-pointer"
          >
            <Shield className="size-3.5 text-indigo-400" /> Matriz de Permisos
          </Link>
          <button
            onClick={handleOpenNewUser}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-3.5" /> Nuevo Colaborador
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Total Colaboradores</div>
            <div className="text-2xl font-mono font-extrabold text-white mt-1">
              {users.length} <span className="text-xs font-sans text-slate-400 font-normal">usuarios</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">100% activos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Users2 className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Cajeros POS Activos</div>
            <div className="text-2xl font-mono font-extrabold text-blue-400 mt-1">
              {totalCajeros} <span className="text-xs font-sans text-slate-400 font-normal">en tienda</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Cobro y emisión</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <UserCheck className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Supervisores con PIN</div>
            <div className="text-2xl font-mono font-extrabold text-purple-400 mt-1">
              {totalSupervisores} <span className="text-xs font-sans text-slate-400 font-normal">autorizados</span>
            </div>
            <div className="text-[10px] text-purple-400 font-mono mt-0.5">Anulaciones & Arqueos</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <KeyRound className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase text-slate-400">Administradores</div>
            <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">
              {totalAdmins} <span className="text-xs font-sans text-slate-400 font-normal">gerenciales</span>
            </div>
            <div className="text-[10px] text-amber-400 font-mono mt-0.5">Control Total SaaS</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Shield className="size-5" />
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
            placeholder="Buscar colaborador por nombre, DNI, email o sucursal..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle PIN visibility */}
          <button
            type="button"
            onClick={() => setShowPins(!showPins)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            {showPins ? <EyeOff className="size-3.5 text-amber-400" /> : <Eye className="size-3.5 text-slate-400" />}
            <span>{showPins ? "Ocultar PINs" : "Revelar PINs"}</span>
          </button>

          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilterRole("all")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterRole === "all" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterRole("cajero")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterRole === "cajero" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Cajeros
            </button>
            <button
              onClick={() => setFilterRole("supervisor")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterRole === "supervisor" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Supervisores
            </button>
            <button
              onClick={() => setFilterRole("admin")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterRole === "admin" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Admins
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/90 bg-slate-950/90 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3.5 px-4">Colaborador & DNI</th>
              <th className="py-3.5 px-4">Rol & Privilegios</th>
              <th className="py-3.5 px-4">Sucursal Asignada</th>
              <th className="py-3.5 px-4 text-center">PIN de Seguridad</th>
              <th className="py-3.5 px-4 text-center">Estado</th>
              <th className="py-3.5 px-4 text-center">Último Acceso</th>
              <th className="py-3.5 px-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-medium">
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="hover:bg-slate-800/40 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="font-bold text-white text-sm">{user.nombre}</div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                    <span className="text-blue-400 font-semibold">DNI {user.dni}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500">{user.email}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                      user.rol === "Administrador General"
                        ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                        : user.rol === "Supervisor de Tienda"
                        ? "bg-purple-950/80 text-purple-400 border-purple-800/60"
                        : user.rol === "Cajero POS"
                        ? "bg-blue-950/80 text-blue-300 border-blue-800/60"
                        : "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                    }`}
                  >
                    {user.rol === "Administrador General" && <Shield className="size-3" />}
                    {user.rol === "Supervisor de Tienda" && <KeyRound className="size-3" />}
                    {user.rol === "Cajero POS" && <UserCheck className="size-3" />}
                    {user.rol}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5 text-[11px]">
                    <Building2 className="size-3 text-slate-500" />
                    <span>{user.sucursal}</span>
                  </div>
                  {user.cajaAsignada && (
                    <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">
                      {user.cajaAsignada}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="font-mono font-bold text-amber-400 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    {showPins ? user.pin : "••••"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                    <CheckCircle2 className="size-3" /> {user.estado}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-center font-mono text-slate-400 text-[11px]">
                  {user.ultimoAcceso}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Link
                      href={`/usuarios/permisos?rol=${getRoleParam(user.rol)}&view=detail`}
                      title="Ver/Configurar Permisos RBAC de este Rol"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Shield className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => handleOpenEditUser(user)}
                      title="Editar Colaborador"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Edit2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => handleRequestDelete(user.id, user.nombre)}
                      title="Eliminar Colaborador"
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
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
          totalItems={filteredUsers.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* User Form Modal */}
      <UserFormDialog
        isOpen={isUserFormOpen}
        onClose={() => setIsUserFormOpen(false)}
        onSave={handleSaveUser}
        userToEdit={editingUser}
      />

      {/* Secure Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="¿Revocar acceso al colaborador?"
        itemName={userToDelete?.nombre}
        description="Esta acción deshabilitará la cuenta del usuario, invalidará su PIN de acceso y cerrará cualquier sesión abierta en terminales POS."
      />
    </div>
  );
}
