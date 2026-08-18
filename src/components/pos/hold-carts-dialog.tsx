"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Clock,
  ShoppingCart,
  Play,
  Trash2,
  X,
  User,
  AlertCircle,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

export interface HeldCart {
  id: string;
  alias: string;
  items: any[];
  docType: "boleta" | "factura";
  customerDoc: string;
  customerName: string;
  customerPoints: number;
  timestamp: string;
  total: number;
}

interface HoldCartsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  heldCarts: HeldCart[];
  onResumeCart: (cart: HeldCart) => void;
  onDeleteHeldCart: (cartId: string) => void;
  onHoldCurrentCart: (alias: string) => void;
  canHoldCurrent: boolean;
}

export function HoldCartsDialog({
  isOpen,
  onClose,
  heldCarts,
  onResumeCart,
  onDeleteHeldCart,
  onHoldCurrentCart,
  canHoldCurrent,
}: HoldCartsDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [aliasInput, setAliasInput] = useState("");
  const [isHoldingCurrent, setIsHoldingCurrent] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleHoldSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alias = aliasInput.trim() || `Espera #${heldCarts.length + 1}`;
    onHoldCurrentCart(alias);
    setAliasInput("");
    setIsHoldingCurrent(false);
    toast.success(`Carrito puesto en espera como "${alias}"`);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Carritos en Espera (Parking de Ventas)
              </h3>
              <p className="text-xs text-slate-400">
                {heldCarts.length} {heldCarts.length === 1 ? "venta pausada" : "ventas pausadas"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Hold current cart action box */}
        {canHoldCurrent && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingCart className="size-3.5 text-blue-400" /> Poner Carrito Actual en Espera
              </span>
              {!isHoldingCurrent && (
                <button
                  type="button"
                  onClick={() => setIsHoldingCurrent(true)}
                  className="px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Plus className="size-3.5" /> Pausar Venta
                </button>
              )}
            </div>

            {isHoldingCurrent && (
              <form onSubmit={handleHoldSubmit} className="space-y-3 pt-1">
                <input
                  type="text"
                  value={aliasInput}
                  onChange={(e) => setAliasInput(e.target.value)}
                  placeholder={`Ej: Cliente en espera #${heldCarts.length + 1} / Fue a buscar arroz`}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHoldingCurrent(false)}
                    className="px-3 py-1.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30"
                  >
                    Confirmar Espera
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* List of held carts */}
        <div className="space-y-3">
          {heldCarts.length === 0 ? (
            <div className="py-10 text-center space-y-2 border border-dashed border-slate-800 rounded-2xl">
              <Clock className="size-8 text-slate-600 mx-auto" />
              <div className="text-xs font-bold text-slate-400">No hay carritos pausados en espera</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Si un cliente olvida un artículo, puedes pausar su cuenta para atender al siguiente sin perder los productos escaneados.
              </p>
            </div>
          ) : (
            heldCarts.map((cart) => (
              <div
                key={cart.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-sm truncate">{cart.alias}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-950 text-amber-400 border border-amber-800/50">
                      {cart.timestamp}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span>{cart.items.length} productos</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-slate-300">
                      <User className="size-3 text-slate-500" /> {cart.customerName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono">
                    <span className="text-base font-black text-emerald-400 block">
                      {formatCurrency(cart.total)}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase">{cart.docType}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onResumeCart(cart);
                      onClose();
                      toast.success(`Carrito "${cart.alias}" restaurado en caja`);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                    title="Restaurar y cobrar esta cuenta"
                  >
                    <Play className="size-3.5 fill-current" /> Reanudar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteHeldCart(cart.id);
                      toast.info(`Venta pausada "${cart.alias}" descartada`);
                    }}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Descartar carrito pausado"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
