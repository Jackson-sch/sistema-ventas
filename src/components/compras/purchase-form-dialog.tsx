"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { PackagePlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  searchProductsAction,
  ProductSearchResult,
} from "@/actions/inventory-actions";
import { registerDirectPurchaseAction } from "@/actions/purchase-order-actions";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_PAYMENT_CONDITION } from "@/lib/constants";
import { PurchaseSupplierForm } from "./purchase-dialog/purchase-supplier-form";
import { PurchaseProductPicker } from "./purchase-dialog/purchase-product-picker";
import { PurchaseFooter } from "./purchase-dialog/purchase-footer";

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
  const [condicionPago, setCondicionPago] = useState(DEFAULT_PAYMENT_CONDITION);
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

      setCondicionPago(DEFAULT_PAYMENT_CONDITION);
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
          <PurchaseSupplierForm
            uniqueSuppliers={uniqueSuppliers}
            numeroFactura={numeroFactura}
            onNumeroFacturaChange={setNumeroFactura}
            selectedSupplierId={selectedSupplierId}
            onSupplierSelect={handleSupplierSelect}
            condicionPago={condicionPago}
            onCondicionPagoChange={(v) => setCondicionPago(v as typeof condicionPago)}
          />

          {/* Product Picker Card */}
          <PurchaseProductPicker
            items={items}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            isDropdownOpen={isDropdownOpen}
            onDropdownOpenChange={setIsDropdownOpen}
            searchContainerRef={searchContainerRef}
            selectedProd={selectedProd}
            onSelectProduct={handleSelectProduct}
            onClearSelectedProduct={() => setSelectedProd(null)}
            inputQty={inputQty}
            onInputQtyChange={setInputQty}
            inputCost={inputCost}
            onInputCostChange={setInputCost}
            inputLote={inputLote}
            onInputLoteChange={setInputLote}
            onAddItem={handleAddItem}
            onRemoveItem={handleRemoveItem}
          />

          {/* Totals & Actions */}
          <PurchaseFooter
            subtotal={subtotal}
            igv={igv}
            total={total}
            isSubmitting={isSubmitting}
            itemsCount={items.length}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}
