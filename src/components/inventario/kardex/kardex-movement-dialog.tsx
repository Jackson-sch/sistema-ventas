"use client";

import { useState, useEffect } from "react";
import { Archive, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { getProductsData } from "@/actions/data-fetchers";
import { recordKardexAdjustmentAction } from "@/actions/inventory-actions";

type CatalogProduct = Awaited<ReturnType<typeof getProductsData>>[number];

interface KardexMovementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: CatalogProduct[];
  onSuccess: () => void;
}

export function KardexMovementDialog({
  isOpen,
  onClose,
  products,
  onSuccess,
}: KardexMovementDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState("");
  const [tipoOperacion, setTipoOperacion] = useState<"merma" | "compra" | "ajuste" | "salida">("merma");
  const [cantidad, setCantidad] = useState("1");
  const [costoUnitario, setCostoUnitario] = useState("3.50");
  const [docReferencia, setDocReferencia] = useState("MERMA-2026-0001");
  const [motivo, setMotivo] = useState("Merma por producto caducado / dañado");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
      setCostoUnitario(products[0].precioCosto.toFixed(2));
    }
  }, [products, selectedProductId]);

  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setCostoUnitario(prod.precioCosto.toFixed(2));
    }
  };

  const handleTypeChange = (type: "merma" | "compra" | "ajuste" | "salida") => {
    setTipoOperacion(type);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    if (type === "merma") {
      setDocReferencia(`MERMA-2026-${randomCode}`);
      setMotivo("Merma por producto caducado / dañado");
    } else if (type === "compra") {
      setDocReferencia(`F001-${Math.floor(1000000 + Math.random() * 9000000)}`);
      setMotivo("Ingreso extraordinario / compra a proveedor");
    } else if (type === "ajuste") {
      setDocReferencia(`AJ-2026-${randomCode}`);
      setMotivo("Ajuste manual de inventario / conteo físico");
    } else {
      setDocReferencia(`SAL-2026-${randomCode}`);
      setMotivo("Salida manual por consumo interno o muestra");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(cantidad) || 0;
    const cost = parseFloat(costoUnitario) || 0;
    if (qty <= 0) {
      toast.error("La cantidad debe ser mayor a cero.");
      return;
    }

    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) {
      toast.error("Seleccione un producto válido del catálogo.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await recordKardexAdjustmentAction({
        productoId: prod.id,
        sku: prod.sku,
        productoNombre: prod.nombre,
        tipo: tipoOperacion === "compra" ? "ingreso" : tipoOperacion,
        cantidad: qty,
        costoUnitario: cost,
        motivo,
        documentoReferencia: docReferencia,
      });

      if (res.success) {
        toast.success("¡Movimiento de Kardex registrado y stock actualizado en base de datos!", {
          description: `${prod.nombre} (${qty} ${prod.tipoVenta === "peso" ? "kg" : "und"})`,
        });
        onClose();
        onSuccess();
      } else {
        toast.error(res.error || "Error al registrar movimiento en Kardex.");
      }
    } catch {
      toast.error("Error inesperado al registrar el movimiento.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md glass-panel rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-5 bg-[hsl(224,71%,4%)]">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Archive className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Registrar Movimiento de Kardex</h3>
            <p className="text-xs text-slate-400">Ajuste manual, merma o recepción extraordinaria</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Producto del Catálogo
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => handleProductChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.sku}) — Stock: {p.stock} {p.tipoVenta === "peso" ? "kg" : "und"}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Tipo de Operación
              </label>
              <select
                value={tipoOperacion}
                onChange={(e) => handleTypeChange(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="merma">Merma / Descarte (13)</option>
                <option value="compra">Compra / Ingreso (02)</option>
                <option value="ajuste">Ajuste Físico (99)</option>
                <option value="salida">Salida Manual (01)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Costo Unitario (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={costoUnitario}
                onChange={(e) => setCostoUnitario(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
                Doc. Referencia / Acta
              </label>
              <input
                type="text"
                value={docReferencia}
                onChange={(e) => setDocReferencia(e.target.value)}
                placeholder="MERMA-2026-0001"
                className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-400 mb-1">
              Motivo / Justificación
            </label>
            <textarea
              rows={2}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Detallar causa del movimiento..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-slate-600 resize-none"
              required
            />
          </div>

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
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isSaving ? "Guardando..." : "Guardar Movimiento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
