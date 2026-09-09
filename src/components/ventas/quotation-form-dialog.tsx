"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import { FileText, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { QuotationRecord, QuotationItem } from "@/actions/quotation-actions";
import { searchProductsAction, ProductSearchResult } from "@/actions/inventory-actions";

import { QuotationClientForm } from "@/components/ventas/quotation/quotation-client-form";
import { QuotationProductSearch } from "@/components/ventas/quotation/quotation-product-search";
import { QuotationItemsTable } from "@/components/ventas/quotation/quotation-items-table";
import { QuotationFooter } from "@/components/ventas/quotation/quotation-footer";

interface ClientOption {
  id: string;
  nombre: string;
  numDoc: string;
  tipoDoc: "DNI" | "RUC" | "CE";
  telefono?: string;
  email?: string;
}

interface QuotationFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  quotationToEdit?: QuotationRecord | null;
  availableClients: ClientOption[];
  onSave: (data: {
    clienteDoc: string;
    clienteNombre: string;
    clienteTipoDoc: "DNI" | "RUC";
    clienteTelefono?: string;
    clienteEmail?: string;
    moneda: "PEN" | "USD";
    diasValidez: number;
    items: QuotationItem[];
    observaciones?: string;
  }) => Promise<void>;
}

export function QuotationFormDialog({
  isOpen,
  onClose,
  quotationToEdit,
  availableClients = [],
  onSave,
}: QuotationFormDialogProps) {
  // Client Info State
  const [selectedClientId, setSelectedClientId] = useState<string>("manual");
  const [clientDoc, setClientDoc] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientTypeDoc, setClientTypeDoc] = useState<"DNI" | "RUC">("DNI");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Commercial Parameters
  const [validityDays, setValidityDays] = useState<number>(7);
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [observaciones, setObservaciones] = useState(
    "Precios incluyen I.G.V. (18%). Cotización sujeta a disponibilidad de stock al momento de la confirmación."
  );

  // Items State
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedProd, setSelectedProd] = useState<ProductSearchResult | null>(null);
  const [inputQty, setInputQty] = useState("1");
  const [inputPrice, setInputPrice] = useState("0.00");

  // Close product search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
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
        const results = await searchProductsAction(searchQuery, 8);
        setSearchResults(results);
      });
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, isOpen]);

  // Initialize or reset form on open
  useEffect(() => {
    if (isOpen) {
      if (quotationToEdit) {
        setSelectedClientId("manual");
        setClientDoc(quotationToEdit.clienteDoc);
        setClientName(quotationToEdit.clienteNombre);
        setClientTypeDoc(quotationToEdit.clienteTipoDoc);
        setClientPhone(quotationToEdit.clienteTelefono || "");
        setClientEmail(quotationToEdit.clienteEmail || "");
        setCurrency(quotationToEdit.moneda);
        setValidityDays(7);
        setItems([...quotationToEdit.items]);
        setObservaciones(quotationToEdit.observaciones || "");
      } else {
        setSelectedClientId("manual");
        setClientDoc("");
        setClientName("");
        setClientTypeDoc("DNI");
        setClientPhone("");
        setClientEmail("");
        setCurrency("PEN");
        setValidityDays(7);
        setItems([]);
        setObservaciones(
          "Precios incluyen I.G.V. (18%). Cotización sujeta a disponibilidad de stock al momento de la confirmación."
        );
      }
      setSelectedProd(null);
      setInputQty("1");
      setInputPrice("0.00");
      setSearchQuery("");
      setIsDropdownOpen(false);
      startSearchTransition(async () => {
        const initial = await searchProductsAction("", 6);
        setSearchResults(initial);
      });
    }
  }, [isOpen, quotationToEdit]);

  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === "manual") {
      setClientDoc("");
      setClientName("");
      setClientTypeDoc("DNI");
      setClientPhone("");
      setClientEmail("");
      return;
    }
    const client = availableClients.find((c) => c.id === clientId);
    if (client) {
      setClientDoc(client.numDoc);
      setClientName(client.nombre);
      setClientTypeDoc(client.tipoDoc === "RUC" ? "RUC" : "DNI");
      setClientPhone(client.telefono !== "-" ? client.telefono || "" : "");
      setClientEmail(client.email !== "-" ? client.email || "" : "");
    }
  };

  const handleSelectProduct = (prod: ProductSearchResult) => {
    setSelectedProd(prod);
    setInputPrice(prod.precioVenta.toFixed(2));
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleAddItem = () => {
    if (!selectedProd) {
      toast.error("Busque y seleccione un producto del catálogo.");
      return;
    }
    const qty = parseFloat(inputQty) || 0;
    const price = parseFloat(inputPrice) || 0;
    if (qty <= 0 || price <= 0) {
      toast.error("La cantidad y precio unitario deben ser mayores a cero.");
      return;
    }
    const total = +(qty * price).toFixed(2);
    const existingIndex = items.findIndex((i) => i.productoId === selectedProd.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIndex) return it;
          const newQty = it.cantidad + qty;
          return { ...it, cantidad: newQty, precioUnit: price, total: +(newQty * price).toFixed(2) };
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
          precioUnit: price,
          total,
          tipo: selectedProd.tipoVenta === "peso" ? "peso" : "unidad",
        },
      ]);
    }
    setSelectedProd(null);
    setInputQty("1");
    toast.success(`"${selectedProd.nombre}" añadido a la proforma.`);
  };

  const handleUpdateItem = (index: number, field: keyof QuotationItem, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      const current = { ...next[index], [field]: value };
      if (field === "cantidad" || field === "precioUnit") {
        current.total = +(current.cantidad * current.precioUnit).toFixed(2);
      }
      next[index] = current;
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const total = useMemo(() => +items.reduce((acc, i) => acc + (parseFloat(String(i.total)) || 0), 0).toFixed(2), [items]);
  const subtotal = useMemo(() => +(total / 1.18).toFixed(2), [total]);
  const igv = useMemo(() => +(total - subtotal).toFixed(2), [total, subtotal]);
  const currencySymbol = currency === "USD" ? "$ " : "S/ ";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientDoc.trim()) {
      toast.error("Ingrese el nombre/razón social y documento del cliente.");
      return;
    }
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto a la cotización.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        clienteDoc: clientDoc.trim(),
        clienteNombre: clientName.trim(),
        clienteTipoDoc: clientTypeDoc,
        clienteTelefono: clientPhone.trim() || undefined,
        clienteEmail: clientEmail.trim() || undefined,
        moneda: currency,
        diasValidez: validityDays,
        items,
        observaciones: observaciones.trim() || undefined,
      });
      onClose();
    } catch {
      toast.error("Error al guardar la cotización.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)] max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileText className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {quotationToEdit ? `Editar Proforma ${quotationToEdit.codigo}` : "Emitir Nueva Cotización / Proforma"}
                <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] font-mono">
                  Validez Oficial
                </Badge>
              </h3>
              <p className="text-xs text-slate-400">
                Genera presupuestos formales para personas y empresas con cálculo automático de I.G.V.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <QuotationClientForm
            availableClients={availableClients}
            selectedClientId={selectedClientId}
            onClientSelect={handleClientSelect}
            clientTypeDoc={clientTypeDoc}
            onClientTypeDocChange={setClientTypeDoc}
            clientDoc={clientDoc}
            onClientDocChange={setClientDoc}
            clientName={clientName}
            onClientNameChange={setClientName}
            clientPhone={clientPhone}
            onClientPhoneChange={setClientPhone}
            clientEmail={clientEmail}
            onClientEmailChange={setClientEmail}
            validityDays={validityDays}
            onValidityDaysChange={setValidityDays}
            currency={currency}
            onCurrencyChange={setCurrency}
          />

          <QuotationProductSearch
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
            inputPrice={inputPrice}
            onInputPriceChange={setInputPrice}
            onAddItem={handleAddItem}
            itemsCount={items.length}
            searchContainerRef={searchContainerRef}
          />

          <QuotationItemsTable
            items={items}
            currencySymbol={currencySymbol}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          <QuotationFooter
            observaciones={observaciones}
            onObservacionesChange={setObservaciones}
            subtotal={subtotal}
            igv={igv}
            total={total}
            currencySymbol={currencySymbol}
            isSubmitting={isSubmitting}
            itemsCount={items.length}
            isEdit={!!quotationToEdit}
            onClose={onClose}
          />
        </form>
      </div>
    </div>
  );
}
