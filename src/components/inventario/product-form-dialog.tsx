"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Barcode,
  Sparkles,
  Percent,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Scale,
  Plus,
  Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface ProductFormData {
  id?: string;
  sku: string;
  nombre: string;
  categoria: string;
  marca: string;
  tipoVenta: "unidad" | "peso";
  taraPeso?: number;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  precioCosto: number;
  precioVenta: number;
  isPerecible: boolean;
  lote?: string;
  vencimiento?: string;
  barcodesExtra?: string[];
}

interface ProductFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductFormData | null;
  onSave: (product: ProductFormData) => void;
}

const CATEGORIES = [
  "Lácteos",
  "Abarrotes",
  "Bebidas y Licores",
  "Frutas y Verduras",
  "Carnes y Aves",
  "Limpieza y Hogar",
  "Cuidado Personal",
  "Panadería y Pastelería",
  "Snacks y Golosinas",
];

export function ProductFormDialog({
  isOpen,
  onClose,
  productToEdit,
  onSave,
}: ProductFormDialogProps) {
  const [sku, setSku] = useState("");
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("Abarrotes");
  const [marca, setMarca] = useState("");
  const [tipoVenta, setTipoVenta] = useState<"unidad" | "peso">("unidad");
  const [taraPeso, setTaraPeso] = useState("0.00");
  const [stockActual, setStockActual] = useState("50");
  const [stockMinimo, setStockMinimo] = useState("15");
  const [stockMaximo, setStockMaximo] = useState("200");
  const [precioCosto, setPrecioCosto] = useState("3.50");
  const [precioVenta, setPrecioVenta] = useState("5.00");
  const [isPerecible, setIsPerecible] = useState(false);
  const [lote, setLote] = useState("L-9842");
  const [vencimiento, setVencimiento] = useState("2026-12-31");
  const [extraBarcode, setExtraBarcode] = useState("");
  const [barcodesList, setBarcodesList] = useState<string[]>([]);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setNombre(productToEdit.nombre);
      setCategoria(productToEdit.categoria);
      setMarca(productToEdit.marca || "");
      setTipoVenta(productToEdit.tipoVenta);
      setTaraPeso(productToEdit.taraPeso?.toString() || "0.00");
      setStockActual(productToEdit.stockActual.toString());
      setStockMinimo(productToEdit.stockMinimo.toString());
      setStockMaximo(productToEdit.stockMaximo.toString());
      setPrecioCosto(productToEdit.precioCosto.toString());
      setPrecioVenta(productToEdit.precioVenta.toString());
      setIsPerecible(productToEdit.isPerecible);
      setLote(productToEdit.lote || "");
      setVencimiento(productToEdit.vencimiento || "");
      setBarcodesList(productToEdit.barcodesExtra || []);
    } else {
      setSku(`775${Math.floor(100000000 + Math.random() * 900000000)}`);
      setNombre("");
      setCategoria("Abarrotes");
      setMarca("");
      setTipoVenta("unidad");
      setTaraPeso("0.00");
      setStockActual("50");
      setStockMinimo("15");
      setStockMaximo("200");
      setPrecioCosto("3.50");
      setPrecioVenta("5.00");
      setIsPerecible(false);
      setLote(`L-${Math.floor(1000 + Math.random() * 9000)}`);
      setVencimiento("2026-12-31");
      setBarcodesList([]);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const costoNum = parseFloat(precioCosto) || 0;
  const ventaNum = parseFloat(precioVenta) || 0;
  const margenGanancia = ventaNum > 0 ? (((ventaNum - costoNum) / ventaNum) * 100).toFixed(1) : "0.0";
  const margenNeto = (ventaNum - costoNum).toFixed(2);

  const handleGenerateSku = () => {
    setSku(`775${Math.floor(100000000 + Math.random() * 900000000)}`);
    toast.success("Código de barras generado");
  };

  const handleAddBarcode = () => {
    if (!extraBarcode.trim()) return;
    if (barcodesList.includes(extraBarcode.trim())) {
      toast.error("El código ya está en la lista");
      return;
    }
    setBarcodesList((prev) => [...prev, extraBarcode.trim()]);
    setExtraBarcode("");
  };

  const handleRemoveBarcode = (code: string) => {
    setBarcodesList((prev) => prev.filter((b) => b !== code));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !sku.trim()) {
      toast.error("El nombre y código SKU son obligatorios");
      return;
    }

    const payload: ProductFormData = {
      id: productToEdit?.id || Date.now().toString(),
      sku: sku.trim(),
      nombre: nombre.trim(),
      categoria,
      marca: marca.trim(),
      tipoVenta,
      taraPeso: parseFloat(taraPeso) || 0,
      stockActual: parseFloat(stockActual) || 0,
      stockMinimo: parseFloat(stockMinimo) || 0,
      stockMaximo: parseFloat(stockMaximo) || 0,
      precioCosto: costoNum,
      precioVenta: ventaNum,
      isPerecible,
      lote: isPerecible ? lote : undefined,
      vencimiento: isPerecible ? vencimiento : undefined,
      barcodesExtra: barcodesList,
    };

    onSave(payload);
    toast.success(productToEdit ? "Producto actualizado con éxito" : "Nuevo producto registrado con éxito");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-3xl glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-6 my-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Package className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {productToEdit ? "Editar Producto del Catálogo" : "Nuevo Producto & Código de Barras"}
              </h3>
              <p className="text-xs text-slate-400">
                Configuración de SKU, costos, precios por sucursal y lotes perecibles
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Layers className="size-3.5" /> Información General & Identificación
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nombre del Producto / Descripción Comercial *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Leche Gloria Entera 400g"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Categoría *</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marca / Fabricante</label>
                <input
                  type="text"
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Ej: Gloria, Alicorp, Nestlé"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Código de Barras Principal (SKU / EAN-13) *
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="775123456789"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateSku}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="size-3.5 text-amber-400" /> Generar
                  </button>
                </div>
              </div>
            </div>

            {/* Sale Type (Unit vs Weight) */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-white block">Tipo de Despacho & Venta</span>
                <span className="text-[11px] text-slate-400">
                  Unidad estándar o venta por peso integrada a balanza electrónica
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTipoVenta("unidad")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    tipoVenta === "unidad"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <Package className="size-3.5" /> Por Unidad (und)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoVenta("peso")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    tipoVenta === "peso"
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
                  }`}
                >
                  <Scale className="size-3.5" /> Balanza / Peso (kg)
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Margins */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Percent className="size-3.5" /> Precios, Costos & Margen de Rentabilidad
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Costo Unitario (S/)</label>
                <div className="relative">
                  <span className="font-mono text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 text-xs">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={precioCosto}
                    onChange={(e) => setPrecioCosto(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Precio de Venta (S/)</label>
                <div className="relative">
                  <span className="font-mono text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 text-xs">S/</span>
                  <input
                    type="number"
                    step="0.01"
                    value={precioVenta}
                    onChange={(e) => setPrecioVenta(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Margen Bruto</span>
                <span className="text-lg font-mono font-extrabold text-blue-400">{margenGanancia}%</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Ganancia por Ítem</span>
                <span className="text-lg font-mono font-extrabold text-emerald-400">S/ {margenNeto}</span>
              </div>
            </div>
          </div>

          {/* Stock Controls & Perecibles */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="size-3.5" /> Stock & Control de Lotes Perecibles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stock Inicial / Actual</label>
                <input
                  type="number"
                  step="any"
                  value={stockActual}
                  onChange={(e) => setStockActual(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stock Mínimo (Alerta)</label>
                <input
                  type="number"
                  step="any"
                  value={stockMinimo}
                  onChange={(e) => setStockMinimo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Stock Máximo</label>
                <input
                  type="number"
                  step="any"
                  value={stockMaximo}
                  onChange={(e) => setStockMaximo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Perecible Checkbox & Fields */}
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPerecible}
                  onChange={(e) => setIsPerecible(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs font-bold text-white">
                  ¿Producto Perecible con Lote y Fecha de Vencimiento?
                </span>
              </label>

              {isPerecible && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Número de Lote</label>
                    <input
                      type="text"
                      value={lote}
                      onChange={(e) => setLote(e.target.value)}
                      placeholder="Ej: L-9842"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={vencimiento}
                      onChange={(e) => setVencimiento(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              <CheckCircle2 className="size-4" /> {productToEdit ? "Guardar Cambios" : "Crear Producto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
