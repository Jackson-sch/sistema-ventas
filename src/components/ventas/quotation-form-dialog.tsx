"use client";

import { useState, useEffect, useRef, useTransition, useMemo } from "react";
import {
  FileText,
  Building2,
  User,
  Calendar,
  DollarSign,
  Plus,
  Trash2,
  Search,
  Barcode,
  Package,
  CheckCircle2,
  X,
  Phone,
  Mail,
  Clock,
  Sparkles,
  ShieldCheck,
  Percent,
  Layers,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuotationRecord, QuotationItem } from "@/actions/quotation-actions";
import { searchProductsAction, ProductSearchResult } from "@/actions/inventory-actions";

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
          return {
            ...it,
            cantidad: newQty,
            precioUnit: price,
            total: +(newQty * price).toFixed(2),
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

  const total = useMemo(() => {
    return +items.reduce((acc, i) => acc + (parseFloat(String(i.total)) || 0), 0).toFixed(2);
  }, [items]);

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
          {/* Section 1: Customer Data & Commercial Conditions */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <User className="size-3.5" /> 1. Datos del Cliente & Condiciones Comerciales
              </span>
              <div className="w-64">
                <Select value={selectedClientId} onValueChange={handleClientSelect}>
                  <SelectTrigger className="h-8 rounded-xl bg-slate-900 border-slate-700 text-xs text-white">
                    <SelectValue placeholder="Cargar desde Directorio..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50 max-h-56">
                    <SelectItem value="manual" className="text-xs font-semibold text-amber-400">
                      Entrada Manual / Nuevo Cliente
                    </SelectItem>
                    {availableClients.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                        <div className="flex items-center justify-between gap-3 w-full">
                          <span className="font-bold">{c.nombre}</span>
                          <span className="text-slate-400 font-mono text-[10px]">({c.numDoc})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Tipo Doc */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Tipo Doc *
                </label>
                <Select value={clientTypeDoc} onValueChange={(v: any) => setClientTypeDoc(v)}>
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="DNI" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      DNI (Persona Natural)
                    </SelectItem>
                    <SelectItem value="RUC" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      RUC (Empresa / Persona Jurídica)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* N° Documento */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  N° Documento (DNI/RUC) *
                </label>
                <input
                  type="text"
                  value={clientDoc}
                  onChange={(e) => setClientDoc(e.target.value)}
                  placeholder={clientTypeDoc === "RUC" ? "20601234567" : "45892144"}
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Razón Social / Nombre */}
              <div className="sm:col-span-2">
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Razón Social / Nombre Completo *
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Ej: Inversiones Retail SAC o Juan Pérez García"
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Teléfono WhatsApp */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Phone className="size-3 text-emerald-400" /> WhatsApp / Celular
                </label>
                <input
                  type="text"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="987654321"
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="size-3 text-blue-400" /> Correo Electrónico
                </label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@empresa.pe"
                  className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Validez */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="size-3 text-amber-400" /> Validez Comercial
                </label>
                <Select value={String(validityDays)} onValueChange={(v) => setValidityDays(Number(v))}>
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="3" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      3 días calendario
                    </SelectItem>
                    <SelectItem value="7" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-bold">
                      7 días calendario (Estándar)
                    </SelectItem>
                    <SelectItem value="15" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      15 días calendario
                    </SelectItem>
                    <SelectItem value="30" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                      30 días calendario
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Moneda */}
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <DollarSign className="size-3 text-slate-400" /> Moneda
                </label>
                <Select value={currency} onValueChange={(v: any) => setCurrency(v)}>
                  <SelectTrigger className="w-full h-9 rounded-xl bg-slate-900 border-slate-700 text-xs text-white focus:ring-1 focus:ring-blue-500 font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                    <SelectItem value="PEN" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-mono">
                      PEN (S/)
                    </SelectItem>
                    <SelectItem value="USD" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300 font-mono">
                      USD ($)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section 2: Product Search & Quick Add */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-3 relative z-30">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Barcode className="size-3.5" /> 2. Búsqueda & Adición de Productos
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {items.length} productos en la proforma
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Product Search Bar */}
              <div ref={searchContainerRef} className="relative flex-1">
                {selectedProd ? (
                  <div className="flex items-center justify-between h-9 px-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs">
                    <span className="font-bold text-white truncate flex items-center gap-1.5">
                      <Package className="size-3.5 text-blue-400 shrink-0" />
                      {selectedProd.nombre}
                      <span className="text-slate-400 font-mono text-[10px]">({selectedProd.sku})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedProd(null)}
                      className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="size-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      placeholder="Buscar producto por nombre o código de barras..."
                      className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans"
                    />
                    <Barcode className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  </div>
                )}

                {/* Dropdown search popup */}
                {isDropdownOpen && !selectedProd && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-xl bg-slate-900 border border-slate-700 shadow-2xl z-50 divide-y divide-slate-800">
                    {searchResults.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500">
                        {isSearching ? "Buscando..." : "No se encontraron productos"}
                      </div>
                    ) : (
                      searchResults.map((prod) => (
                        <button
                          key={prod.id}
                          type="button"
                          onClick={() => handleSelectProduct(prod)}
                          className="w-full px-3.5 py-2 text-left hover:bg-blue-600/20 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{prod.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} • Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
                            </div>
                          </div>
                          <div className="font-mono text-emerald-400 text-xs shrink-0 font-bold">
                            {formatCurrency(prod.precioVenta)}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="w-24">
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={inputQty}
                  onChange={(e) => setInputQty(e.target.value)}
                  placeholder="Cant."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Unit Price */}
              <div className="w-28">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputPrice}
                  onChange={(e) => setInputPrice(e.target.value)}
                  placeholder="Precio U."
                  className="w-full h-9 text-center rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Add button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
              >
                <Plus className="size-3.5" /> Agregar
              </button>
            </div>
          </div>

          {/* Section 3: Quotation Items Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden relative z-10">
            <div className="p-3 bg-slate-900/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                <Layers className="size-3.5 text-blue-400" /> Detalle de Productos Cotizados
              </span>
              <span className="text-slate-400 font-mono text-[10px]">
                Precios con I.G.V. incluido
              </span>
            </div>

            <div className="overflow-x-auto max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950/80 text-[10px] uppercase font-bold text-slate-400 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Producto / SKU</th>
                    <th className="py-2.5 px-3 text-center w-24">Cantidad</th>
                    <th className="py-2.5 px-3 text-right w-28">Precio Unit.</th>
                    <th className="py-2.5 px-3 text-right w-28">Subtotal</th>
                    <th className="py-2.5 px-2 text-center w-12">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-500 font-sans">
                        <Package className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-1.5" />
                        <p className="text-xs text-slate-400 font-semibold">
                          No hay productos agregados a la cotización
                        </p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Usa el buscador superior para agregar productos con su precio sugerido.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, idx) => (
                      <tr key={item.productoId} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2 px-3 text-slate-500 text-center font-bold">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-sans font-bold text-white text-xs">
                            {item.nombre}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            SKU: {item.sku}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad}
                            onChange={(e) => handleUpdateItem(idx, "cantidad", parseFloat(e.target.value) || 0)}
                            className="w-16 h-7 text-center rounded-lg bg-slate-900 border border-slate-700 font-bold text-blue-400 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.precioUnit}
                            onChange={(e) => handleUpdateItem(idx, "precioUnit", parseFloat(e.target.value) || 0)}
                            className="w-20 h-7 text-right px-1.5 rounded-lg bg-slate-900 border border-slate-700 font-bold text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-white">
                          {currencySymbol}{item.total.toFixed(2)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
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

          {/* Section 4: Observations & Financial Totals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Términos & Observaciones Comerciales
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Condiciones de pago, tiempo de entrega, cuenta bancaria..."
                className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Op. Gravada (Subtotal):</span>
                <span className="font-bold text-slate-200">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>I.G.V. (18% SUNAT):</span>
                <span className="font-bold text-slate-200">{currencySymbol}{igv.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-300 uppercase font-sans">Total Cotización:</span>
                <span className="text-xl font-black text-emerald-400">
                  {currencySymbol}{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Emitiendo Proforma..." : quotationToEdit ? "Guardar Cambios" : "Emitir Proforma Oficial"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
