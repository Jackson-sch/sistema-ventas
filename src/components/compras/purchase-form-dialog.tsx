"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  PackagePlus,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Building2,
  FileText,
  DollarSign,
  Layers,
  Search,
  Barcode,
  Loader2,
  X,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";
import { registerDirectPurchaseAction } from "@/actions/purchase-order-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface PurchaseItem {
  productoId: string;
  nombre: string;
  sku: string;
  cantidad: number;
  costoUnitario: number;
  total: number;
  lote?: string;
  vencimiento?: string;
}

export interface PurchaseRecord {
  id: string;
  numeroFactura: string;
  proveedorId: string;
  proveedorNombre: string;
  proveedorRuc: string;
  fechaEmision: string;
  fechaRecepcion: string;
  items: PurchaseItem[];
  subtotal: number;
  igv: number;
  total: number;
  condicionPago: string;
  estado: "Recibido" | "En Tránsito" | "Pendiente";
}

interface SupplierOption {
  id: string;
  razonSocial: string;
  ruc: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
}

interface PurchaseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableSuppliers?: SupplierOption[];
  onSuccess: () => void;
}

export function PurchaseFormDialog({
  isOpen,
  onClose,
  availableSuppliers = [],
  onSuccess,
}: PurchaseFormDialogProps) {
  // Deduplicate suppliers by RUC
  const uniqueSuppliers = useMemo(() => {
    const seen = new Set<string>();
    return availableSuppliers.filter((s) => {
      const key = (s.ruc || s.id || s.razonSocial).trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [availableSuppliers]);

  // Form State
  const [numeroFactura, setNumeroFactura] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierRuc, setSupplierRuc] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [condicionPago, setCondicionPago] = useState("Crédito 30 días");
  const [fechaEmision, setFechaEmision] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedProd, setSelectedProd] = useState<ProductSearchResult | null>(null);
  const [inputQty, setInputQty] = useState("10");
  const [inputCost, setInputCost] = useState("10.00");
  const [inputLote, setInputLote] = useState("");
  const [inputVenc, setInputVenc] = useState("");

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced product search
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const results = await searchProductsAction(searchQuery, 10);
        setSearchResults(results);
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setNumeroFactura(`F001-00${randomNum}`);

      const today = new Date().toISOString().split("T")[0];
      setFechaEmision(today);

      if (uniqueSuppliers.length > 0) {
        const first = uniqueSuppliers[0];
        setSelectedSupplierId(first.id);
        setSupplierName(first.razonSocial);
        setSupplierRuc(first.ruc);
      } else {
        setSelectedSupplierId("");
        setSupplierName("");
        setSupplierRuc("");
      }

      setCondicionPago("Crédito 30 días");
      setItems([]);
      setSelectedProd(null);
      setInputQty("10");
      setInputCost("10.00");
      setInputLote(`L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);

      const targetVenc = new Date();
      targetVenc.setFullYear(targetVenc.getFullYear() + 2);
      setInputVenc(targetVenc.toISOString().split("T")[0]);

      setSearchQuery("");
      setIsDropdownOpen(false);

      startSearchTransition(async () => {
        const initial = await searchProductsAction("", 8);
        setSearchResults(initial);
      });
    }
  }, [isOpen, uniqueSuppliers]);

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    const sup = uniqueSuppliers.find((s) => s.id === id);
    if (sup) {
      setSupplierName(sup.razonSocial);
      setSupplierRuc(sup.ruc);
    }
  };

  const handleSelectProduct = (prod: ProductSearchResult) => {
    setSelectedProd(prod);
    setInputCost(prod.precioCosto.toFixed(2));
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleAddItem = () => {
    if (!selectedProd) {
      toast.error("Busque y seleccione un producto del catálogo.");
      return;
    }

    const qty = parseFloat(inputQty) || 0;
    const cost = parseFloat(inputCost) || 0;
    if (qty <= 0 || cost <= 0) {
      toast.error("La cantidad y costo unitario deben ser mayores a cero.");
      return;
    }

    const total = +(qty * cost).toFixed(2);
    const loteNumber = inputLote.trim() || `L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
    const vencDate = inputVenc || "2027-12-31";

    const existingIndex = items.findIndex((i) => i.productoId === selectedProd.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIndex) return it;
          const newQty = it.cantidad + qty;
          return {
            ...it,
            cantidad: newQty,
            costoUnitario: cost,
            total: +(newQty * cost).toFixed(2),
            lote: loteNumber,
            vencimiento: vencDate,
          };
        })
      );
    } else {
      setItems((prev) => [
        ...prev,
        {
          productoId: selectedProd.id,
          sku: selectedProd.sku,
          nombre: selectedProd.nombre,
          cantidad: qty,
          costoUnitario: cost,
          total,
          lote: loteNumber,
          vencimiento: vencDate,
        },
      ]);
    }

    setSelectedProd(null);
    setInputQty("10");
    setInputLote(`L-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`);
    toast.success(`"${selectedProd.nombre}" agregado al documento.`);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const subtotal = +items.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const igv = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numeroFactura.trim()) {
      toast.error("Ingrese el N° de Factura o Guía de Remisión.");
      return;
    }
    if (!supplierName || !supplierRuc) {
      toast.error("Seleccione o ingrese los datos del proveedor.");
      return;
    }
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerDirectPurchaseAction({
        numeroFactura: numeroFactura.trim(),
        proveedorId: selectedSupplierId || "prov-custom",
        proveedorRuc: supplierRuc,
        proveedorRazonSocial: supplierName,
        condicionPago,
        fechaEmision,
        items: items.map((i) => ({
          productoId: i.productoId,
          sku: i.sku,
          nombre: i.nombre,
          cantidad: i.cantidad,
          costoUnitario: i.costoUnitario,
          lote: i.lote,
          fechaVencimiento: i.vencimiento,
        })),
      });

      if (res.success) {
        toast.success("¡Compra registrada e ingresada al almacén con éxito!", {
          description: `Kardex y existencias actualizadas en tiempo real.`,
        });
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Error al registrar la compra en la base de datos.");
      }
    } catch {
      toast.error("Error inesperado de conexión al registrar la compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <PackagePlus className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Registrar Compra & Recepción de Mercadería
                <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">
                  Ingreso Kardex
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Ingreso directo al almacén con actualización automática de existencias y costos en Kardex
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header Inputs: Factura, Proveedor, Condición */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* N° Factura */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                N° Factura / Guía de Remisión *
              </label>
              <div className="relative">
                <FileText className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="F001-0001234"
                  className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Proveedor Selector (Shadcn Select) */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Proveedor Mayorista *
              </label>
              <Select value={selectedSupplierId} onValueChange={handleSupplierSelect}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500">
                  <SelectValue placeholder="Seleccione un proveedor..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-56">
                  {uniqueSuppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span className="font-bold">{s.razonSocial}</span>
                        <span className="text-slate-400 font-mono text-[10px]">({s.ruc})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Condición de Pago */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Condición de Pago
              </label>
              <Select value={condicionPago} onValueChange={setCondicionPago}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem value="Contado" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                    Contado / Efectivo
                  </SelectItem>
                  <SelectItem value="Crédito 15 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                    Crédito 15 días
                  </SelectItem>
                  <SelectItem value="Crédito 30 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                    Crédito 30 días
                  </SelectItem>
                  <SelectItem value="Crédito 60 días" className="text-xs cursor-pointer focus:bg-emerald-600/20 focus:text-emerald-300">
                    Crédito 60 días
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Picker Card */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
              <span>Añadir Producto al Documento</span>
              <span className="text-[10px] text-slate-500 font-mono">
                {items.length} productos agregados
              </span>
            </div>

            {/* Search Bar & Inputs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div ref={searchContainerRef} className="relative flex-1">
                {selectedProd ? (
                  <div className="flex items-center justify-between h-9 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs">
                    <span className="font-bold text-white truncate">
                      {selectedProd.nombre} ({selectedProd.sku})
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProd(null)}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Buscar producto por nombre o código..."
                      className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    {isSearching ? (
                      <Loader2 className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-spin" />
                    ) : (
                      <Barcode className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    )}
                  </div>
                )}

                {/* Dropdown search results */}
                {isDropdownOpen && !selectedProd && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 font-sans">
                        {isSearching ? "Buscando..." : "No se encontraron productos"}
                      </div>
                    ) : (
                      searchResults.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSelectProduct(prod)}
                          className="w-full px-3 py-2 text-left hover:bg-emerald-600/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{prod.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} • Stock actual: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                            </div>
                          </div>
                          <div className="font-mono text-emerald-400 text-xs shrink-0">
                            Costo: {formatCurrency(prod.precioCosto)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Qty */}
              <div className="w-20">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  placeholder="Cant."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Cost */}
              <div className="w-24">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputCost}
                  onChange={(e) => setInputCost(e.target.value)}
                  placeholder="Costo U."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Lote */}
              <div className="w-28">
                <input
                  type="text"
                  value={inputLote}
                  onChange={(e) => setInputLote(e.target.value)}
                  placeholder="N° Lote"
                  className="w-full h-9 px-2 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Plus className="size-3.5" /> Agregar
              </button>
            </div>

            {/* Added Items Table */}
            {items.length > 0 && (
              <div className="rounded-xl border border-slate-800 overflow-hidden mt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3 text-center">Cant.</th>
                      <th className="py-2.5 px-3 text-right">Costo Unit.</th>
                      <th className="py-2.5 px-3 text-center">Lote / Venc.</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {items.map((item) => (
                      <tr key={item.productoId} className="hover:bg-slate-900/30">
                        <td className="py-2.5 px-3 text-white font-sans font-medium">
                          {item.nombre} <span className="text-slate-500 text-[10px]">({item.sku})</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-emerald-400 font-bold">
                          {item.cantidad}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatCurrency(item.costoUnitario)}
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-400 text-[10px]">
                          {item.lote} ({item.vencimiento})
                        </td>
                        <td className="py-2.5 px-3 text-right text-white font-bold">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.productoId)}
                            className="p-1 hover:bg-rose-600/20 text-rose-400 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totals Summary */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-4 text-slate-400">
              <span>Op. Gravada: <strong className="text-slate-200">{formatCurrency(subtotal)}</strong></span>
              <span>I.G.V. (18%): <strong className="text-slate-200">{formatCurrency(igv)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase text-[10px] font-bold">TOTAL FACTURA:</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Ingresando a Kardex..." : "Ingresar Mercadería al Almacén"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
