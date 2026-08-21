"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  Scale,
  Plus,
  Trash2,
  Search,
  Barcode,
  Package,
  CheckCircle2,
  X,
  Loader2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import {
  createWasteRecordAction,
  WasteItem,
  WasteReason,
} from "@/actions/waste-actions";
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

interface MermasFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MermasFormDialog({
  isOpen,
  onClose,
  onSuccess,
}: MermasFormDialogProps) {
  // Form State
  const [motivo, setMotivo] = useState<WasteReason>("VENCIMIENTO");
  const [lugarDestruccion, setLugarDestruccion] = useState(
    "Almacén Central de Merma - Surco"
  );
  const [metodoDestruccion, setMetodoDestruccion] = useState(
    "Desnaturalización y disposición en relleno sanitario certificado"
  );
  const [notarioColegiado, setNotarioColegiado] = useState(
    "Sin Notario (Pérdida menor a 10 UIT conforme Art. 37 LIR)"
  );
  const [observaciones, setObservaciones] = useState("");
  const [items, setItems] = useState<WasteItem[]>([]);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [isSearching, startSearchTransition] = useTransition();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedProd, setSelectedProd] = useState<ProductSearchResult | null>(null);
  const [inputQty, setInputQty] = useState("1");
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
      setMotivo("VENCIMIENTO");
      setLugarDestruccion("Almacén Central de Merma - Surco");
      setMetodoDestruccion("Desnaturalización y disposición en relleno sanitario certificado");
      setNotarioColegiado("Sin Notario (Pérdida menor a 10 UIT conforme Art. 37 LIR)");
      setObservaciones("");
      setItems([]);
      setSelectedProd(null);
      setInputQty("1");
      setSearchQuery("");
      setIsDropdownOpen(false);
      startSearchTransition(async () => {
        const initial = await searchProductsAction("", 8);
        setSearchResults(initial);
      });
    }
  }, [isOpen]);

  const handleSelectProduct = (prod: ProductSearchResult) => {
    setSelectedProd(prod);
    setSearchQuery("");
    setIsDropdownOpen(false);
  };

  const handleAddItem = () => {
    if (!selectedProd) {
      toast.error("Busque y seleccione un producto primero.");
      return;
    }

    const qty = parseFloat(inputQty) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a cero.");
      return;
    }

    const costoUnit = selectedProd.precioCosto || 3.5;
    const costTotal = +(qty * costoUnit).toFixed(2);

    const existingIndex = items.findIndex((i) => i.productoId === selectedProd.id);
    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((it, idx) => {
          if (idx !== existingIndex) return it;
          const newQty = it.cantidad + qty;
          return {
            ...it,
            cantidad: newQty,
            costoTotal: +(newQty * it.costoUnit).toFixed(2),
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
          unidad: selectedProd.tipoVenta === "peso" ? "kg" : "und",
          costoUnit,
          costoTotal: costTotal,
          lote: `L-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          fechaVencimiento: new Date().toLocaleDateString("es-PE"),
        },
      ]);
    }

    setSelectedProd(null);
    setInputQty("1");
    toast.success(`"${selectedProd.nombre}" agregado al acta.`);
  };

  const handleRemoveItem = (productoId: string) => {
    setItems((prev) => prev.filter((i) => i.productoId !== productoId));
  };

  const totalPerdidaSoles = items.reduce((acc, i) => acc + i.costoTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Debe agregar al menos un producto al acta de merma.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createWasteRecordAction({
        motivo,
        metodoDestruccion,
        lugarDestruccion,
        notarioColegiado,
        observaciones: observaciones || `Baja por ${motivo}`,
        items,
      });

      if (res.success) {
        toast.success("¡Acta de merma registrada y stock rebajado en Kardex!", {
          description: `Expediente generado con pérdida total de ${formatCurrency(totalPerdidaSoles)}`,
        });
        onClose();
        onSuccess();
      } else {
        toast.error(res.error || "Error al registrar el acta de merma.");
      }
    } catch {
      toast.error("Error inesperado al guardar el acta de merma.");
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
            <div className="w-10 h-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Scale className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Nueva Acta de Merma y Desmedro
              </h3>
              <p className="text-xs text-slate-400">
                Baja tributaria de inventario conforme al Art. 37 de la Ley de Impuesto a la Renta
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
          {/* General Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Motivo Legal SUNAT
              </label>
              <Select value={motivo} onValueChange={(val: any) => setMotivo(val)}>
                <SelectTrigger className="w-full h-9 rounded-xl bg-slate-950/80 border-slate-800 text-xs text-slate-200 focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                  <SelectItem value="VENCIMIENTO" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Vencimiento / Caducidad de Lote
                  </SelectItem>
                  <SelectItem value="ROTURA_TRANSPORTE" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Rotura / Pérdida en Transporte
                  </SelectItem>
                  <SelectItem value="MERMA_PERECIBLE" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Merma Natural de Perecibles
                  </SelectItem>
                  <SelectItem value="DEFECTO_FABRICA" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Defecto de Fábrica / Empaque
                  </SelectItem>
                  <SelectItem value="CONTAMINACION" className="text-xs cursor-pointer focus:bg-blue-600/20 focus:text-blue-300">
                    Contaminación Cruzada
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Lugar de Destrucción / Disposición
              </label>
              <input
                type="text"
                value={lugarDestruccion}
                onChange={(e) => setLugarDestruccion(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Método de Destrucción
              </label>
              <input
                type="text"
                value={metodoDestruccion}
                onChange={(e) => setMetodoDestruccion(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Presencia Notarial (Art. 37 LIR)
              </label>
              <input
                type="text"
                value={notarioColegiado}
                onChange={(e) => setNotarioColegiado(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Product Search and Add Section */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Agregar Productos al Acta
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div ref={searchContainerRef} className="relative flex-1">
                {selectedProd ? (
                  <div className="flex items-center justify-between h-9 px-3 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs">
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
                      placeholder="Buscar producto por nombre, SKU o código de barras..."
                      className="w-full h-9 pl-9 pr-8 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {isSearching ? (
                      <Loader2 className="size-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 animate-spin" />
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
                          className="w-full px-3 py-2 text-left hover:bg-blue-600/20 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="font-bold text-white truncate">{prod.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {prod.sku} • Stock: {prod.stock} {prod.tipoVenta === "peso" ? "kg" : "und"}
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

              <button
                type="button"
                onClick={handleAddItem}
                className="h-9 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
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
                      <th className="py-2 px-3 text-right">Pérdida Total</th>
                      <th className="py-2 px-2 text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {items.map((item) => (
                      <tr key={item.productoId} className="hover:bg-slate-900/30">
                        <td className="py-2 px-3 text-white font-sans font-medium">
                          {item.nombre} <span className="text-slate-500 text-[10px]">({item.sku})</span>
                        </td>
                        <td className="py-2 px-3 text-center text-rose-400 font-bold">
                          {item.cantidad} {item.unidad}
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">
                          {formatCurrency(item.costoUnit)}
                        </td>
                        <td className="py-2 px-3 text-right text-rose-400 font-bold">
                          {formatCurrency(item.costoTotal)}
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

          {/* Loss Summary Bar */}
          <div className="p-3 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex items-center justify-between text-xs">
            <span className="font-semibold text-rose-300">
              Pérdida Total del Acta ({items.length} productos):
            </span>
            <span className="text-base font-mono font-extrabold text-rose-400">
              {formatCurrency(totalPerdidaSoles)}
            </span>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Observaciones / Justificación Legal
            </label>
            <textarea
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles sobre el estado del lote, inspección sanitaria o causa de la baja..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 resize-none"
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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSubmitting ? "Procesando en Kardex..." : "Registrar y Emitir Acta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
