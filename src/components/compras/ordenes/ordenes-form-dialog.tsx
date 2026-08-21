"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Barcode,
  Package,
  CheckCircle2,
  X,
  Loader2,
  Building2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  createPurchaseOrderAction,
  PaymentCondition,
} from "@/actions/purchase-order-actions";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupplierItem {
  id: string;
  razonSocial: string;
  ruc: string;
  contactoNombre?: string;
  contactoTelefono?: string;
  contactoEmail?: string;
}

interface OrdenesFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableSuppliers: SupplierItem[];
  onSuccess: () => void;
}

export function OrdenesFormDialog({
  isOpen,
  onClose,
  availableSuppliers,
  onSuccess,
}: OrdenesFormDialogProps) {
  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierRuc, setSupplierRuc] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>("CREDITO_30D");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [observaciones, setObservaciones] = useState("Entrega regular en muelle de almacén.");
  const [items, setItems] = useState<
    {
      productoId: string;
      sku: string;
      nombre: string;
      cantidadPedida: number;
      costoUnitario: number;
      total: number;
    }[]
  >([]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedProd, setSelectedProd] = useState<ProductSearchResult | null>(null);
  const [inputQty, setInputQty] = useState("10");
  const [inputCost, setInputCost] = useState("10.00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Click outside listener for dropdown
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

  // Live search
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

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      if (availableSuppliers.length > 0) {
        const s = availableSuppliers[0];
        setSelectedSupplierId(s.id);
        setSupplierName(s.razonSocial);
        setSupplierRuc(s.ruc);
        setSupplierContact(s.contactoNombre || "");
        setSupplierPhone(s.contactoTelefono || "");
        setSupplierEmail(s.contactoEmail || "");
      } else {
        setSelectedSupplierId("");
        setSupplierName("");
        setSupplierRuc("");
        setSupplierContact("");
        setSupplierPhone("");
        setSupplierEmail("");
      }

      setPaymentCondition("CREDITO_30D");
      setCurrency("PEN");
      setObservaciones("Entrega regular en muelle de recepción.");
      setItems([]);
      setSelectedProd(null);
      setInputQty("10");
      setInputCost("10.00");
      setSearchQuery("");
      setIsDropdownOpen(false);

      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 4);
      setDeliveryDate(targetDate.toISOString().split("T")[0]);

      startSearchTransition(async () => {
        const initial = await searchProductsAction("", 8);
        setSearchResults(initial);
      });
    }
  }, [isOpen, availableSuppliers]);

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    const sup = availableSuppliers.find((s) => s.id === id);
    if (sup) {
      setSupplierName(sup.razonSocial);
      setSupplierRuc(sup.ruc);
      setSupplierContact(sup.contactoNombre || "");
      setSupplierPhone(sup.contactoTelefono || "");
      setSupplierEmail(sup.contactoEmail || "");
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
      toast.error("Busque y seleccione un producto primero.");
      return;
    }

    const qty = parseFloat(inputQty) || 0;
    const cost = parseFloat(inputCost) || 0;
    if (qty <= 0 || cost <= 0) {
      toast.error("La cantidad y costo deben ser mayores a cero.");
      return;
    }

    const total = +(qty * cost).toFixed(2);

    const existingIndex = items.findIndex((i) => i.productoId === selectedProd.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIndex) return it;
          const newQty = it.cantidadPedida + qty;
          return {
            ...it,
            cantidadPedida: newQty,
            costoUnitario: cost,
            total: +(newQty * cost).toFixed(2),
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
          cantidadPedida: qty,
          costoUnitario: cost,
          total,
        },
      ]);
    }

    setSelectedProd(null);
    setInputQty("10");
    toast.success(`"${selectedProd.nombre}" agregado al pedido.`);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const subtotal = +items.reduce((acc, i) => acc + i.total, 0).toFixed(2);
  const igv = +(subtotal * 0.18).toFixed(2);
  const total = +(subtotal + igv).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || !supplierRuc) {
      toast.error("Ingrese los datos del proveedor.");
      return;
    }
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la orden de compra.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createPurchaseOrderAction({
        proveedorId: selectedSupplierId || "prov-custom",
        proveedorRuc: supplierRuc,
        proveedorRazonSocial: supplierName,
        proveedorContacto: supplierContact || "Departamento Comercial",
        proveedorTelefono: supplierPhone || "999999999",
        proveedorEmail: supplierEmail || "ventas@proveedor.pe",
        condicionPago: paymentCondition,
        moneda: currency,
        fechaEntregaEstimada: deliveryDate,
        observaciones,
        items,
      });

      if (res.success) {
        toast.success("¡Orden de compra generada exitosamente en PostgreSQL!");
        onClose();
        onSuccess();
      } else {
        toast.error(res.error || "Error al crear la orden de compra.");
      }
    } catch {
      toast.error("Error inesperado al emitir la orden de compra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Nueva Orden de Compra a Proveedor
              </h3>
              <p className="text-xs text-slate-400">
                Emisión de pedido formal y abastecimiento de almacén
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
          {/* Supplier Selection */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Building2 className="size-3.5" /> Datos del Proveedor
              </span>
            </div>

            {availableSuppliers.length > 0 && (
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Seleccionar del Directorio de Proveedores
                </label>
                <Select value={selectedSupplierId} onValueChange={handleSupplierSelect}>
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-amber-500">
                    <SelectValue placeholder="Seleccione un proveedor..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                    {availableSuppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                        {s.razonSocial} (RUC: {s.ruc})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  RUC del Proveedor
                </label>
                <input
                  type="text"
                  value={supplierRuc}
                  onChange={(e) => setSupplierRuc(e.target.value)}
                  placeholder="20XXXXXXXXX"
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nombre de la empresa"
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Conditions & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Condición de Pago
              </label>
              <Select value={paymentCondition} onValueChange={(v: any) => setPaymentCondition(v)}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-amber-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem value="CONTADO" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Contado / Anticipado
                  </SelectItem>
                  <SelectItem value="CREDITO_15D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Crédito 15 días
                  </SelectItem>
                  <SelectItem value="CREDITO_30D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Crédito 30 días
                  </SelectItem>
                  <SelectItem value="CREDITO_60D" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Crédito 60 días
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Moneda
              </label>
              <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-white focus:ring-1 focus:ring-amber-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem value="PEN" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Soles (PEN S/)
                  </SelectItem>
                  <SelectItem value="USD" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                    Dólares (USD $)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Fecha Estimada Entrega
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                required
              />
            </div>
          </div>

          {/* Product Picker Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Agregar Productos al Pedido
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div ref={searchContainerRef} className="relative flex-1">
                {selectedProd ? (
                  <div className="flex items-center justify-between h-9 px-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs">
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
                      placeholder="Buscar producto por nombre o SKU..."
                      className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {isSearching ? (
                      <Loader2 className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 animate-spin" />
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
                          className="w-full px-3 py-2 text-left hover:bg-amber-600/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{prod.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} • Stock actual: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                            </div>
                          </div>
                          <div className="font-mono text-amber-400 text-xs shrink-0">
                            Costo: {formatCurrency(prod.precioCosto)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div className="w-24">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  placeholder="Cant."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="w-28">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputCost}
                  onChange={(e) => setInputCost(e.target.value)}
                  placeholder="Costo U."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
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
                      <th className="py-2 px-3">Producto</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">Costo U.</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-2 text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {items.map((item) => (
                      <tr key={item.productoId} className="hover:bg-slate-900/30">
                        <td className="py-2 px-3 text-white font-sans font-medium">
                          {item.nombre} <span className="text-slate-500 text-[10px]">({item.sku})</span>
                        </td>
                        <td className="py-2 px-3 text-center text-amber-400 font-bold">
                          {item.cantidadPedida}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(item.costoUnitario)}
                        </td>
                        <td className="py-2 px-3 text-right text-white font-bold">
                          {formatCurrency(item.total)}
                        </td>
                        <td className="py-2 px-2 text-center">
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

          {/* Totals Summary Card */}
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Subtotal: {formatCurrency(subtotal)} • IGV (18%): {formatCurrency(igv)}
            </span>
            <span className="text-base font-extrabold text-amber-400">
              Total: {formatCurrency(total)}
            </span>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Observaciones e Instrucciones de Entrega
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles sobre horario de recepción, rampa, guías requeridas..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600 resize-none"
            />
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-amber-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Emitiendo en BD..." : "Generar Orden de Compra"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
