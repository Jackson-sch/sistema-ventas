"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Truck,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  MapPin,
  Building2,
  User,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Package,
  Weight,
  Boxes,
  AlertCircle,
  FileText,
  Save,
  HelpCircle,
  QrCode,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getBranchesAndRegistersData, getProductsData } from "@/actions/data-fetchers";
import { createStockTransferAction, TransferItemInput } from "@/actions/transfer-actions";
import { GreTicketDialog } from "@/components/inventario/gre-ticket-dialog";
import { TransferRecord } from "@/actions/transfer-actions";

type CatalogProductItem = Awaited<ReturnType<typeof getProductsData>>[number];

interface TransferCartItem {
  productoId: string;
  sku: string;
  nombre: string;
  categoria: string;
  stockDisponible: number;
  cantidad: number;
  unidadMedida: string;
  pesoUnitarioKgm: number;
}

export default function NuevaTransferenciaPage() {
  const router = useRouter();

  // Branch data
  const [branches, setBranches] = useState<any[]>([]);
  const [sucursalOrigenId, setSucursalOrigenId] = useState("");
  const [sucursalDestinoId, setSucursalDestinoId] = useState("");

  // Product Catalog from DB
  const [catalog, setCatalog] = useState<CatalogProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Cart Items
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [cartItems, setCartItems] = useState<TransferCartItem[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Transfer & Transport metadata
  const [motivoTraslado, setMotivoTraslado] = useState<"04" | "01" | "02" | "13">("04");
  const [modalidadTransporte, setModalidadTransporte] = useState<"02" | "01">("02"); // 02: Privado, 01: Público
  const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split("T")[0]);

  // Conductor / Vehículo Privado
  const [choferNombre, setChoferNombre] = useState("Jorge Huamán Díaz");
  const [choferDoc, setChoferDoc] = useState("45891234");
  const [choferLicencia, setChoferLicencia] = useState("Q45891234");
  const [vehiculoPlaca, setVehiculoPlaca] = useState("ABC-123");
  const [vehiculoMarca, setVehiculoMarca] = useState("Camión Isuzu");

  // Transportista Público
  const [transportistaRuc, setTransportistaRuc] = useState("20556677889");
  const [transportistaRazonSocial, setTransportistaRazonSocial] = useState("TRANSPORTE LOGÍSTICO PERÚ S.A.C.");

  // Emission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdTransfer, setCreatedTransfer] = useState<TransferRecord | null>(null);
  const [isGreTicketOpen, setIsGreTicketOpen] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const [branchesData, prodsData] = await Promise.all([
          getBranchesAndRegistersData(),
          getProductsData(),
        ]);

        if (branchesData && branchesData.length > 0) {
          setBranches(branchesData);
          setSucursalOrigenId(branchesData[0].id);
          if (branchesData.length > 1) {
            setSucursalDestinoId(branchesData[1].id);
          } else {
            setSucursalDestinoId(branchesData[0].id);
          }
        }

        if (prodsData && prodsData.length > 0) {
          setCatalog(prodsData);
        }
      } catch (err) {
        console.error("Error al inicializar formulario de transferencia:", err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  const sucursalOrigen = branches.find((b) => b.id === sucursalOrigenId);
  const sucursalDestino = branches.find((b) => b.id === sucursalDestinoId);

  // Search matches
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return catalog
      .filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [searchQuery, catalog]);

  const handleAddItem = (prod: CatalogProductItem) => {
    const existingIndex = cartItems.findIndex((it) => it.productoId === prod.id);
    if (existingIndex >= 0) {
      setCartItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? { ...it, cantidad: it.cantidad + 1 }
            : it
        )
      );
    } else {
      const estimatedWeight = prod.tipoVenta === "peso" ? 1.0 : 0.5;
      setCartItems((prev) => [
        ...prev,
        {
          productoId: prod.id,
          sku: prod.sku,
          nombre: prod.nombre,
          categoria: prod.categoria,
          stockDisponible: prod.stock,
          cantidad: 1,
          unidadMedida: prod.tipoVenta === "peso" ? "kg" : "und",
          pesoUnitarioKgm: estimatedWeight,
        },
      ]);
    }
    setSearchQuery("");
    setIsDropdownOpen(false);
    toast.success(`"${prod.nombre}" agregado al despacho.`);
    searchInputRef.current?.focus();
  };

  const handleUpdateQuantity = (productoId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => {
          if (it.productoId === productoId) {
            const nextQty = Math.max(1, it.cantidad + delta);
            return { ...it, cantidad: nextQty };
          }
          return it;
        })
        .filter((it) => it.cantidad > 0)
    );
  };

  const handleSetQuantity = (productoId: string, qty: number) => {
    const val = isNaN(qty) ? 1 : Math.max(1, qty);
    setCartItems((prev) =>
      prev.map((it) => (it.productoId === productoId ? { ...it, cantidad: val } : it))
    );
  };

  const handleUpdateWeight = (productoId: string, weight: number) => {
    const val = isNaN(weight) ? 0.1 : Math.max(0.01, weight);
    setCartItems((prev) =>
      prev.map((it) => (it.productoId === productoId ? { ...it, pesoUnitarioKgm: val } : it))
    );
  };

  const handleRemoveItem = (productoId: string) => {
    setCartItems((prev) => prev.filter((it) => it.productoId !== productoId));
  };

  // Calculations
  const totalBultos = cartItems.length;
  const totalItemsCount = cartItems.reduce((acc, it) => acc + it.cantidad, 0);
  const pesoBrutoTotalKgm = cartItems.reduce(
    (acc, it) => acc + it.pesoUnitarioKgm * it.cantidad,
    0
  );

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sucursalOrigenId || !sucursalDestinoId) {
      toast.error("Seleccione la sucursal de origen y de destino.");
      return;
    }

    if (sucursalOrigenId === sucursalDestinoId) {
      toast.error("La sucursal de origen y destino no pueden ser la misma sede.");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Debe agregar al menos un producto a la lista de despacho.");
      return;
    }

    setIsSubmitting(true);
    try {
      const itemsPayload: TransferItemInput[] = cartItems.map((it) => ({
        productoId: it.productoId,
        sku: it.sku,
        nombre: it.nombre,
        cantidad: it.cantidad,
        unidadMedida: it.unidadMedida,
        pesoKgm: it.pesoUnitarioKgm,
      }));

      const res = await createStockTransferAction({
        sucursalOrigenId,
        sucursalOrigenNombre: sucursalOrigen?.nombre || "Almacén Central",
        direccionOrigen: sucursalOrigen?.direccion,
        ubigeoOrigen: sucursalOrigen?.ubigeo || "150140",
        sucursalDestinoId,
        sucursalDestinoNombre: sucursalDestino?.nombre || "Sucursal Destino",
        direccionDestino: sucursalDestino?.direccion || "Av. Larco 850, Miraflores, Lima",
        ubigeoDestino: sucursalDestino?.ubigeo || "150122",
        modalidadTransporte,
        motivoTraslado,
        conductor:
          modalidadTransporte === "02"
            ? {
                tipoDoc: "1",
                numDoc: choferDoc,
                nombres: choferNombre.split(" ")[0] || "Jorge",
                apellidos: choferNombre.split(" ").slice(1).join(" ") || "Huamán",
                licenciaConducir: choferLicencia,
              }
            : undefined,
        vehiculo:
          modalidadTransporte === "02"
            ? {
                placa: vehiculoPlaca.trim().toUpperCase(),
                marca: vehiculoMarca,
              }
            : undefined,
        transportista:
          modalidadTransporte === "01"
            ? {
                ruc: transportistaRuc,
                razonSocial: transportistaRazonSocial,
              }
            : undefined,
        items: itemsPayload,
      });

      if (res.success && res.transfer) {
        toast.success(`¡Guía de Remisión ${res.transfer.codigoGuia} emitida con éxito!`, {
          description: "Inventario rebajado en origen y registrada en Kardex.",
        });
        setCreatedTransfer(res.transfer);
        setIsGreTicketOpen(true);
      } else {
        toast.error(res.error || "Error al emitir Guía de Remisión.");
      }
    } catch {
      toast.error("Error inesperado al emitir la Guía de Remisión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/inventario/transferencias"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <Truck className="size-6 text-blue-400" /> Nueva Guía de Remisión & Traslado
              </h1>
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                SUNAT GRE • Tipo 09
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Traslado de mercadería entre sucursales, control de bultos y generación de UBL 2.1 con QR de ruta.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/inventario/transferencias"
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSubmitTransfer}
            disabled={isSubmitting || cartItems.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            <Truck className="size-4" />
            {isSubmitting ? "Emitiendo GRE..." : "Emitir Guía & Despachar"}
          </button>
        </div>
      </div>

      {/* Main Grid Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Route & Transport Setup (1 Col) */}
        <div className="space-y-6">
          {/* Sede Origen & Destino */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <MapPin className="size-4 text-rose-400" /> Puntos de Traslado
            </h3>

            {/* Sede Origen */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Punto de Partida (Origen)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Stock activo</span>
              </label>
              <select
                value={sucursalOrigenId}
                onChange={(e) => setSucursalOrigenId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {branches.map((b) => (
                  <option key={`orig-${b.id}`} value={b.id}>
                    {b.nombre} — {b.direccion}
                  </option>
                ))}
              </select>
            </div>

            {/* Sede Destino */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Punto de Llegada (Destino)
              </label>
              <select
                value={sucursalDestinoId}
                onChange={(e) => setSucursalDestinoId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {branches.map((b) => (
                  <option key={`dest-${b.id}`} value={b.id} disabled={b.id === sucursalOrigenId}>
                    {b.nombre} {b.id === sucursalOrigenId ? "(Misma sede - no permitido)" : `— ${b.direccion}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Motivo & Fecha */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Motivo Traslado
                </label>
                <select
                  value={motivoTraslado}
                  onChange={(e) => setMotivoTraslado(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] font-medium"
                >
                  <option value="04">04 - Entre establecimientos</option>
                  <option value="01">01 - Venta</option>
                  <option value="02">02 - Compra</option>
                  <option value="13">13 - Otros</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fecha Salida
                </label>
                <input
                  type="date"
                  value={fechaSalida}
                  onChange={(e) => setFechaSalida(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-[11px] font-mono"
                />
              </div>
            </div>
          </div>

          {/* Datos de Transporte & Conductor */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Truck className="size-4 text-blue-400" /> Modalidad de Transporte
              </h3>
              <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalidadTransporte("02")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    modalidadTransporte === "02"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Privado
                </button>
                <button
                  type="button"
                  onClick={() => setModalidadTransporte("01")}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    modalidadTransporte === "01"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Público
                </button>
              </div>
            </div>

            {modalidadTransporte === "02" ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nombre Conductor</label>
                  <input
                    type="text"
                    value={choferNombre}
                    onChange={(e) => setChoferNombre(e.target.value)}
                    placeholder="Jorge Huamán Díaz"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">DNI / Carnet</label>
                    <input
                      type="text"
                      value={choferDoc}
                      onChange={(e) => setChoferDoc(e.target.value)}
                      placeholder="45891234"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Licencia (MTC)</label>
                    <input
                      type="text"
                      value={choferLicencia}
                      onChange={(e) => setChoferLicencia(e.target.value.toUpperCase())}
                      placeholder="Q45891234"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Placa Vehículo</label>
                    <input
                      type="text"
                      value={vehiculoPlaca}
                      onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                      placeholder="ABC-123"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Modelo / Marca</label>
                    <input
                      type="text"
                      value={vehiculoMarca}
                      onChange={(e) => setVehiculoMarca(e.target.value)}
                      placeholder="Camión Isuzu"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">RUC de la Empresa Transportista</label>
                  <input
                    type="text"
                    value={transportistaRuc}
                    onChange={(e) => setTransportistaRuc(e.target.value)}
                    placeholder="20556677889"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Razón Social del Transportista</label>
                  <input
                    type="text"
                    value={transportistaRazonSocial}
                    onChange={(e) => setTransportistaRazonSocial(e.target.value)}
                    placeholder="TRANSPORTE LOGÍSTICO PERÚ S.A.C."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Summary KPI Card */}
          <div className="glass-panel rounded-3xl p-5 border border-blue-500/30 bg-blue-950/20 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> Control de Carga SUNAT
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Total de Bultos</span>
                <span className="text-2xl font-mono font-extrabold text-white">{totalBultos}</span>
                <span className="text-[10px] text-slate-500 block">({totalItemsCount} unidades)</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[11px] block">Peso Bruto Total</span>
                <span className="text-2xl font-mono font-extrabold text-emerald-400">
                  {pesoBrutoTotalKgm.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-400/80 block">KGM Oficial</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search & Item Table (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search Box */}
          <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-3 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Package className="size-4 text-emerald-400" /> Catálogo de Productos para Despacho
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {catalog.length} productos disponibles
              </span>
            </div>

            <div className="relative">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                placeholder="Escanear código de barras (EAN-13) o buscar por nombre (ej: Leche Gloria, Arroz, Primor)..."
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
              />

              {/* Floating Dropdown Results */}
              {isDropdownOpen && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-slate-800">
                  {searchResults.map((prod) => (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddItem(prod)}
                      className="w-full p-3 text-left hover:bg-blue-600/20 transition-colors flex items-center justify-between group"
                    >
                      <div>
                        <div className="font-bold text-white text-xs group-hover:text-blue-300">
                          {prod.nombre}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                          <span>SKU: {prod.sku}</span>
                          <span>•</span>
                          <span>{prod.categoria}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-400 block">
                          Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                        </span>
                        <span className="text-[10px] text-blue-400 font-semibold group-hover:underline">
                          + Agregar a Guía
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Table of Items to Dispatch */}
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Boxes className="size-4 text-blue-400" /> Mercadería en Esta Guía de Remisión ({cartItems.length})
                </h4>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition-colors"
                >
                  Vaciar lista
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-4">Producto & SKU</th>
                    <th className="py-3 px-3 text-center">Stock Origen</th>
                    <th className="py-3 px-3 text-center w-32">Cant. Trasladar</th>
                    <th className="py-3 px-3 text-center w-28">Peso Unit. (kg)</th>
                    <th className="py-3 px-3 text-right">Peso Total</th>
                    <th className="py-3 px-3 text-center w-12">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-500">
                        <Boxes className="size-10 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                        <p className="text-sm font-semibold text-slate-400">No hay productos agregados</p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Usa la barra superior para buscar o escanear productos del almacén.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item) => (
                      <tr key={item.productoId} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white text-xs">{item.nombre}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {item.sku} • {item.categoria}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center font-mono text-slate-300 text-xs">
                          {item.stockDisponible} {item.unidadMedida}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center rounded-xl bg-slate-950 border border-slate-800 p-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productoId, -1)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold transition-colors"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => handleSetQuantity(item.productoId, parseInt(e.target.value, 10))}
                              className="w-12 text-center bg-transparent font-mono font-bold text-white text-xs focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item.productoId, 1)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={item.pesoUnitarioKgm}
                            onChange={(e) => handleUpdateWeight(item.productoId, parseFloat(e.target.value))}
                            className="w-20 px-2 py-1 text-center rounded-lg bg-slate-950 border border-slate-800 font-mono font-bold text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-400 text-xs">
                          {(item.pesoUnitarioKgm * item.cantidad).toFixed(2)} kg
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productoId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Eliminar de la guía"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket Viewer Dialog with Real SUNAT QR */}
      {createdTransfer && (
        <GreTicketDialog
          isOpen={isGreTicketOpen}
          onClose={() => {
            setIsGreTicketOpen(false);
            router.push("/inventario/transferencias");
          }}
          transfer={createdTransfer}
        />
      )}
    </div>
  );
}
