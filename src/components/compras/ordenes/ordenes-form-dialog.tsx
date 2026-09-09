"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import {
  createPurchaseOrderAction,
  PaymentCondition,
} from "@/actions/purchase-order-actions";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";
import { Badge } from "@/components/ui/badge";

import { OrdeneSupplierForm } from "@/components/compras/ordenes/dialog/ordene-supplier-form";
import { OrdeneProductPicker } from "@/components/compras/ordenes/dialog/ordene-product-picker";
import { OrdeneFooter } from "@/components/compras/ordenes/dialog/ordene-footer";

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

interface OrderItem {
  productoId: string;
  sku: string;
  nombre: string;
  cantidadPedida: number;
  costoUnitario: number;
  total: number;
}

export function OrdenesFormDialog({
  isOpen,
  onClose,
  availableSuppliers,
  onSuccess,
}: OrdenesFormDialogProps) {
  // Deduplicate suppliers strictly by RUC
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
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierRuc, setSupplierRuc] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [paymentCondition, setPaymentCondition] = useState<PaymentCondition>("CREDITO_30D");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [observaciones, setObservaciones] = useState("Entrega regular en muelle de recepción de almacén.");
  const [items, setItems] = useState<OrderItem[]>([]);

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
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
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
      if (uniqueSuppliers.length > 0) {
        const s = uniqueSuppliers[0];
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
      setObservaciones("Entrega regular en muelle de recepción de almacén.");
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
  }, [isOpen, uniqueSuppliers]);

  const handleSupplierSelect = (id: string) => {
    setSelectedSupplierId(id);
    const sup = uniqueSuppliers.find((s) => s.id === id);
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
          return { ...it, cantidadPedida: newQty, costoUnitario: cost, total: +(newQty * cost).toFixed(2) };
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
  const currencySymbol = currency === "USD" ? "$ " : "S/ ";

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
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)] max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShoppingCart className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Nueva Orden de Compra a Proveedor
                <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] font-mono">
                  B2B
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Emisión de pedido formal, abastecimiento y recepción en muelle de almacén
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
          <OrdeneSupplierForm
            uniqueSuppliers={uniqueSuppliers}
            selectedSupplierId={selectedSupplierId}
            onSupplierSelect={handleSupplierSelect}
            supplierRuc={supplierRuc}
            onSupplierRucChange={setSupplierRuc}
            supplierName={supplierName}
            onSupplierNameChange={setSupplierName}
            supplierContact={supplierContact}
            onSupplierContactChange={setSupplierContact}
            supplierPhone={supplierPhone}
            onSupplierPhoneChange={setSupplierPhone}
            supplierEmail={supplierEmail}
            onSupplierEmailChange={setSupplierEmail}
            paymentCondition={paymentCondition}
            onPaymentConditionChange={setPaymentCondition}
            currency={currency}
            onCurrencyChange={setCurrency}
            deliveryDate={deliveryDate}
            onDeliveryDateChange={setDeliveryDate}
          />

          <OrdeneProductPicker
            items={items}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            isDropdownOpen={isDropdownOpen}
            onDropdownOpenChange={setIsDropdownOpen}
            selectedProd={selectedProd}
            onSelectProduct={handleSelectProduct}
            onClearSelectedProd={() => setSelectedProd(null)}
            inputQty={inputQty}
            onInputQtyChange={setInputQty}
            inputCost={inputCost}
            onInputCostChange={setInputCost}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
            searchContainerRef={searchContainerRef}
          />

          <OrdeneFooter
            subtotal={subtotal}
            igv={igv}
            total={total}
            currencySymbol={currencySymbol}
            observaciones={observaciones}
            onObservacionesChange={setObservaciones}
            isSubmitting={isSubmitting}
            itemsCount={items.length}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}
