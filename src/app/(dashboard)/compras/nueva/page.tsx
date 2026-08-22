"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PackagePlus,
  Truck,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { getSuppliersData } from "@/actions/data-fetchers";
import { registerDirectPurchaseAction } from "@/actions/purchase-order-actions";
import { SupplierData } from "@/components/compras/supplier-form-dialog";
import { PurchaseInvoiceHeader } from "@/components/compras/nueva/purchase-invoice-header";
import { PurchaseProductScanner } from "@/components/compras/nueva/purchase-product-scanner";
import { PurchaseItemsTable, PurchaseItemRow } from "@/components/compras/nueva/purchase-items-table";
import { PurchaseSummarySidebar } from "@/components/compras/nueva/purchase-summary-sidebar";

export default function NuevaCompraPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState(`F001-00${Math.floor(100000 + Math.random() * 900000)}`);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [paymentCondition, setPaymentCondition] = useState("Crédito 30 días");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [observations, setObservations] = useState("Recepción regular en rampa de descarga de almacén.");
  const [items, setItems] = useState<PurchaseItemRow[]>([]);

  useEffect(() => {
    async function loadSuppliers() {
      try {
        const data = await getSuppliersData();
        if (data) {
          setSuppliers(data as SupplierData[]);
          if (data.length > 0) {
            setSelectedSupplierId(data[0].id);
          }
        }
      } catch {
        toast.error("Error al cargar proveedores.");
      } finally {
        setIsLoading(false);
      }
    }
    loadSuppliers();
  }, []);

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  const handleAddProduct = useCallback((item: {
    productoId: string;
    sku: string;
    nombre: string;
    cantidad: number;
    costoUnitario: number;
    lote: string;
    fechaVencimiento: string;
  }) => {
    const total = +(item.cantidad * item.costoUnitario).toFixed(2);
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.productoId === item.productoId);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].cantidad + item.cantidad;
        next[idx] = {
          ...next[idx],
          cantidad: newQty,
          costoUnitario: item.costoUnitario,
          total: +(newQty * item.costoUnitario).toFixed(2),
          lote: item.lote,
          fechaVencimiento: item.fechaVencimiento,
        };
        return next;
      }
      return [...prev, { ...item, total }];
    });
    toast.success(`"${item.nombre}" añadido al comprobante.`);
  }, []);

  const handleUpdateItem = useCallback((idx: number, field: keyof PurchaseItemRow, val: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: val };
      return next;
    });
  }, []);

  const handleRemoveItem = useCallback((productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  }, []);

  const handleClear = useCallback(() => {
    setItems([]);
    toast.info("Documento limpiado.");
  }, []);

  const subtotal = useMemo(() => {
    return +items.reduce((acc, i) => acc + (parseFloat(String(i.total)) || 0), 0).toFixed(2);
  }, [items]);

  const igv = useMemo(() => +(subtotal * 0.18).toFixed(2), [subtotal]);
  const total = useMemo(() => +(subtotal + igv).toFixed(2), [subtotal, igv]);
  const totalUnits = useMemo(() => items.reduce((acc, i) => acc + (parseFloat(String(i.cantidad)) || 0), 0), [items]);

  const handleSubmit = async () => {
    if (!invoiceNumber.trim()) {
      toast.error("Ingrese el número de Factura o Guía de Remisión.");
      return;
    }
    if (!selectedSupplier) {
      toast.error("Seleccione un proveedor mayorista.");
      return;
    }
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto al comprobante.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerDirectPurchaseAction({
        numeroFactura: invoiceNumber.trim(),
        proveedorId: selectedSupplier.id,
        proveedorRuc: selectedSupplier.ruc,
        proveedorRazonSocial: selectedSupplier.razonSocial,
        condicionPago: paymentCondition,
        fechaEmision: issueDate,
        items,
      });

      if (res.success) {
        toast.success("¡Compra registrada e ingresada al almacén con éxito!", {
          description: `Kardex y existencias actualizadas en tiempo real.`,
        });
        router.push("/compras");
      } else {
        toast.error(res.error || "Error al registrar la compra.");
      }
    } catch {
      toast.error("Error inesperado al conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 space-y-4 bg-[hsl(224,71%,4%)]">
        <RefreshCw className="size-8 text-emerald-400 animate-spin" />
        <div className="text-sm font-bold text-white font-mono">
          Cargando Catálogo de Proveedores...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/compras"
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="size-3.5" /> Volver a Compras
            </Link>
            <span className="text-slate-600">•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-800/50 flex items-center gap-1">
              <Truck className="size-3" /> Recepción de Facturas en Muelle
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Nueva Compra & Recepción de Mercadería
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingreso masivo al almacén con actualización automática de existencias, lotes y costos ponderados en Kardex.
          </p>
        </div>
      </div>

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Invoice Header + Product Scanner + Large Items Table */}
        <div className="xl:col-span-2 space-y-5">
          <PurchaseInvoiceHeader
            invoiceNumber={invoiceNumber}
            onInvoiceNumberChange={setInvoiceNumber}
            selectedSupplierId={selectedSupplierId}
            onSupplierChange={setSelectedSupplierId}
            suppliers={suppliers}
            paymentCondition={paymentCondition}
            onPaymentConditionChange={setPaymentCondition}
            issueDate={issueDate}
            onIssueDateChange={setIssueDate}
            currency={currency}
            onCurrencyChange={setCurrency}
          />

          <PurchaseProductScanner onAddProduct={handleAddProduct} />

          <PurchaseItemsTable
            items={items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
            currency={currency}
          />
        </div>

        {/* Right Column (1 Col): Sticky Financial Summary & Submit Sidebar */}
        <div className="xl:col-span-1">
          <PurchaseSummarySidebar
            selectedSupplier={selectedSupplier}
            itemsCount={items.length}
            totalUnits={totalUnits}
            subtotal={subtotal}
            igv={igv}
            total={total}
            currency={currency}
            observations={observations}
            onObservationsChange={setObservations}
            onSubmit={handleSubmit}
            onClear={handleClear}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
