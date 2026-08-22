"use client";

import { useState, useEffect, useMemo } from "react";
import {
  FileText,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  ArrowDownLeft,
  PackageCheck,
  Building2,
  Layers,
  Sparkles,
  DollarSign,
  Plus,
  Minus,
  Banknote,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { TicketData } from "./thermal-ticket-dialog";
import {
  emitCreditNoteAction,
  CreditNoteItemInput,
} from "@/actions/credit-note-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SaleItemForReturn {
  id: string;
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnit: number;
  total: number;
  unidad: string;
}

export interface TargetSaleForReturn {
  id: string;
  comprobante: string;
  tipo: "Boleta" | "Factura" | "Nota de Crédito";
  cliente: string;
  docNumero?: string;
  medioPago?: string;
  total: number;
  items: {
    cantidad: number;
    descripcion: string;
    precioUnit: number;
    total: number;
    unidad: string;
  }[];
}

interface CreditNoteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetSale: TargetSaleForReturn | null;
  onSuccess: (ticketData: TicketData) => void;
}

const SUNAT_MOTIVOS = [
  { code: "01", label: "01 - Anulación de la operación (Total)", isTotal: true },
  { code: "06", label: "06 - Devolución total de mercadería", isTotal: true },
  { code: "07", label: "07 - Devolución de parte de la mercadería (Parcial por ítem)", isTotal: false },
  { code: "02", label: "02 - Anulación por error en el RUC/DNI", isTotal: true },
  { code: "04", label: "04 - Descuento global otorgado", isTotal: true },
] as const;

export function CreditNoteDialog({
  isOpen,
  onClose,
  targetSale,
  onSuccess,
}: CreditNoteDialogProps) {
  const [motivoCodigo, setMotivoCodigo] = useState<"01" | "02" | "06" | "07" | "04">("01");
  const [motivoDescripcion, setMotivoDescripcion] = useState("Cliente solicitó anulación de la compra");
  const [reingresarStock, setReingresarStock] = useState(true);
  const [reintegrarEfectivo, setReintegrarEfectivo] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Item quantities to return
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});

  useEffect(() => {
    if (targetSale && isOpen) {
      // Default to returning all quantities
      const initialMap: Record<number, number> = {};
      (targetSale.items || []).forEach((it, idx) => {
        initialMap[idx] = it.cantidad;
      });
      setSelectedItems(initialMap);
      setMotivoCodigo("01");
      setMotivoDescripcion("Cliente solicitó anulación de la compra");
      setReingresarStock(true);
      setReintegrarEfectivo(true);
    }
  }, [targetSale, isOpen]);

  if (!isOpen || !targetSale) return null;

  const isModificandoFactura = targetSale.tipo === "Factura";
  const ncSeriePreview = isModificandoFactura ? "FC01-00000012" : "BC01-00000045";

  const handleToggleItem = (idx: number, maxQty: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[idx] && next[idx] > 0) {
        delete next[idx];
      } else {
        next[idx] = maxQty;
      }
      return next;
    });
  };

  const handleQtyChange = (idx: number, val: number, maxQty: number) => {
    const clamped = Math.max(1, Math.min(maxQty, val));
    setSelectedItems((prev) => ({ ...prev, [idx]: clamped }));
  };

  // Calculate items and totals to refund
  const itemsToReturn: CreditNoteItemInput[] = (targetSale.items || [])
    .map((it, idx) => {
      const qty = selectedItems[idx] || 0;
      if (qty <= 0) return null;
      return {
        id: `item-${idx + 1}`,
        sku: `SKU-${idx + 1}`,
        nombre: it.descripcion,
        precioUnitario: it.precioUnit,
        cantidad: qty,
        tipo: (it.unidad === "kg" ? "peso" : "unidad") as "peso" | "unidad",
      };
    })
    .filter(Boolean) as CreditNoteItemInput[];

  const totalAReembolsar = +(itemsToReturn.reduce(
    (acc, it) => acc + it.precioUnitario * it.cantidad,
    0
  )).toFixed(2);
  const subtotalGravado = +(totalAReembolsar / 1.18).toFixed(2);
  const igv = +(totalAReembolsar - subtotalGravado).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (itemsToReturn.length === 0) {
      toast.error("Debe seleccionar al menos un producto a devolver.");
      return;
    }

    if (!motivoDescripcion.trim()) {
      toast.error("Debe ingresar el sustento o motivo de la Nota de Crédito.");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await emitCreditNoteAction({
        ventaId: targetSale.id,
        comprobanteModificado: targetSale.comprobante,
        tipoDocModificado: isModificandoFactura ? "01" : "03",
        motivoCodigo,
        motivoDescripcion: motivoDescripcion.trim(),
        clienteDoc: targetSale.docNumero || "00000000",
        clienteNombre: targetSale.cliente,
        reingresarStock,
        reintegrarEfectivo,
        itemsDevueltos: itemsToReturn,
      });

      if (res.success && res.ticketData) {
        toast.success(`¡Nota de Crédito ${res.comprobanteSerieNumero} emitida con éxito!`, {
          description: `Monto revertido: ${formatCurrency(totalAReembolsar)}. ${
            reingresarStock ? "Kardex e inventario actualizados." : ""
          }`,
        });
        onSuccess(res.ticketData);
        onClose();
      } else {
        toast.error(res.error || "No se pudo emitir la Nota de Crédito.");
      }
    } catch (err) {
      toast.error("Error inesperado al emitir la Nota de Crédito.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <RotateCcw className="size-5" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-950/80 text-rose-400 text-[10px] font-bold border border-rose-800/50">
                SUNAT UBL 2.1 • Tipo 07
              </span>
              <h3 className="text-base font-extrabold text-white tracking-tight mt-0.5">
                Emitir Nota de Crédito Electrónica
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors text-xs font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Document Info Box */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Comprobante a Modificar</span>
              <div className="font-mono font-bold text-white text-sm">{targetSale.comprobante}</div>
              <span className="text-[10px] text-blue-400 font-medium">({targetSale.tipo})</span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Cliente / Receptor</span>
              <div className="font-bold text-slate-200 truncate">{targetSale.cliente}</div>
              <span className="text-[10px] text-slate-400 font-mono">Doc: {targetSale.docNumero || "00000000"}</span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Serie NC a Emitir</span>
              <div className="font-mono font-black text-rose-400 text-sm">{ncSeriePreview}</div>
              <span className="text-[10px] text-slate-500">Correlativo automático</span>
            </div>
          </div>

          {/* Motivo SUNAT Selector (Catálogo 09) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Tipo de Motivo / Discrepancia SUNAT (Catálogo 09):
            </label>
            <Select
              value={motivoCodigo}
              onValueChange={(val: any) => {
                setMotivoCodigo(val);
                const found = SUNAT_MOTIVOS.find((m) => m.code === val);
                if (found) {
                  setMotivoDescripcion(found.label.split("- ")[1] || "");
                }
              }}
            >
              <SelectTrigger className="w-full h-10 rounded-xl bg-slate-950/90 border-slate-800 text-xs text-white focus:ring-1 focus:ring-rose-500 font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 shadow-2xl rounded-xl z-50">
                {SUNAT_MOTIVOS.map((m) => (
                  <SelectItem
                    key={m.code}
                    value={m.code}
                    className="text-xs cursor-pointer focus:bg-rose-600/20 focus:text-rose-300"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sustento del motivo (obligatorio por SUNAT) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Sustento Detallado del Motivo:
            </label>
            <input
              type="text"
              value={motivoDescripcion}
              onChange={(e) => setMotivoDescripcion(e.target.value)}
              placeholder="Describa la causa de la anulación o devolución..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Itemized Table to Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                Seleccione los Ítems a Devolver / Revertir:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {itemsToReturn.length} de {(targetSale.items || []).length} ítems seleccionados
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/90 text-slate-400 font-semibold border-b border-slate-800 text-[11px] font-mono">
                  <tr>
                    <th className="py-2 px-3 w-8 text-center">✓</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-right">P. Unit</th>
                    <th className="py-2 px-3 text-center">Cant. Devolver</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {(targetSale.items || []).map((item, idx) => {
                    const isChecked = Boolean(selectedItems[idx] && selectedItems[idx] > 0);
                    const currentQty = selectedItems[idx] || 0;
                    const rowTotal = +(item.precioUnit * currentQty).toFixed(2);

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isChecked ? "bg-rose-950/20" : "bg-slate-950/40 text-slate-500"
                        }`}
                      >
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleItem(idx, item.cantidad)}
                            className="rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-bold font-sans text-white">
                          {item.descripcion}
                          <span className="text-[10px] text-slate-400 font-mono block">
                            Comprado: {item.cantidad} {item.unidad}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-300">
                          {formatCurrency(item.precioUnit)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isChecked ? (
                            <div className="inline-flex items-center gap-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-lg">
                              <input
                                type="number"
                                min="1"
                                max={item.cantidad}
                                value={currentQty}
                                onChange={(e) =>
                                  handleQtyChange(idx, parseFloat(e.target.value) || 1, item.cantidad)
                                }
                                className="w-12 bg-transparent text-center font-bold text-white text-xs focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400">{item.unidad}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-400">
                          {isChecked ? formatCurrency(rowTotal) : "S/ 0.00"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Checkboxes (Kardex & Cash) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reingresarStock}
                onChange={(e) => setReingresarStock(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <PackageCheck className="size-3.5 text-emerald-400 shrink-0" />
                <span>Reingresar mercadería al <strong>Inventario & Kardex</strong></span>
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={reintegrarEfectivo}
                onChange={(e) => setReintegrarEfectivo(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <Banknote className="size-3.5 text-emerald-400 shrink-0" />
                <span>Registrar egreso de efectivo en <strong>Gaveta de Caja</strong></span>
              </span>
            </label>
          </div>

          {/* Totals Summary */}
          <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Gravado Revertido:</span>
              <span className="font-mono text-slate-300">{formatCurrency(subtotalGravado)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IGV (18%) Revertido:</span>
              <span className="font-mono text-slate-300">{formatCurrency(igv)}</span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1.5 border-t border-slate-800 text-white">
              <span>TOTAL A REEMBOLSAR (NC):</span>
              <span className="text-base font-mono text-rose-400">
                {formatCurrency(totalAReembolsar)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || itemsToReturn.length === 0}
              className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <CheckCircle2 className="size-4" />
              {isProcessing
                ? "Emitiendo NC en SUNAT..."
                : `Emitir Nota de Crédito ${formatCurrency(totalAReembolsar)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
