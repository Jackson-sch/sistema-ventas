"use client";

import { useState, useEffect } from "react";
import {
  FlaskConical,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  User,
  FileText,
  CreditCard,
  Banknote,
  QrCode,
  Play,
  RefreshCw,
  CheckCircle2,
  Terminal,
  Lock,
  Unlock,
  ArrowDownUp,
  Database,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { completeSaleTransactionAction } from "@/actions/pos-actions";
import {
  openShiftAction,
  cashMovementAction,
  closeShiftAction,
} from "@/actions/cash-actions";
import { getProductsData, getClientsData, getSalesHistoryData } from "@/actions/data-fetchers";

interface DevProduct {
  id: string;
  sku: string;
  nombre: string;
  categoria: string;
  precioVenta: number;
  tipoVenta: "unidad" | "peso";
}

interface DevClient {
  id: string;
  numDoc: string;
  nombre: string;
  tipoDoc: string;
  puntos: number;
}

const QUICK_AMOUNTS = [20, 50, 100, 200];

export default function DevVentaTestPage() {
  const [products, setProducts] = useState<DevProduct[]>([]);
  const [clients, setClients] = useState<DevClient[]>([]);
  const [cart, setCart] = useState<Map<string, number>>(new Map());
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [docType, setDocType] = useState<"boleta" | "factura">("boleta");
  const [medioPago, setMedioPago] = useState<"efectivo" | "tarjeta" | "yape" | "plin">("efectivo");
  const [montoRecibido, setMontoRecibido] = useState("50");
  const [isLoading, setIsLoading] = useState(true);

  const [saleResult, setSaleResult] = useState<any>(null);
  const [shiftResult, setShiftResult] = useState<any>(null);
  const [movementResult, setMovementResult] = useState<any>(null);
  const [closeResult, setCloseResult] = useState<any>(null);
  const [verifiedSales, setVerifiedSales] = useState<any[] | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getProductsData(), getClientsData()])
      .then(([prod, cli]) => {
        if (cancelled) return;
        setProducts(
          (prod ?? []).map((p) => ({
            id: p.id,
            sku: p.sku,
            nombre: p.nombre,
            categoria: p.categoria,
            precioVenta: p.precioVenta,
            tipoVenta: p.tipoVenta,
          }))
        );
        setClients(
          (cli ?? []).map((c) => ({
            id: c.id,
            numDoc: c.numDoc,
            nombre: c.nombre,
            tipoDoc: c.tipoDoc,
            puntos: c.puntos,
          }))
        );
      })
      .catch((err) => console.error("Error cargando datos dev:", err))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const addProduct = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      next.set(id, (next.get(id) ?? 0) + 1);
      return next;
    });
  };

  const removeProduct = (id: string) => {
    setCart((prev) => {
      const next = new Map(prev);
      const qty = next.get(id) ?? 0;
      if (qty <= 1) next.delete(id);
      else next.set(id, qty - 1);
      return next;
    });
  };

  const cartItems = products
    .filter((p) => cart.has(p.id))
    .map((p) => ({ product: p, qty: cart.get(p.id)! }));

  const subtotal = cartItems.reduce((acc, { product, qty }) => acc + product.precioVenta * qty, 0);
  const igv = subtotal - subtotal / 1.18;
  const total = subtotal;
  const cashNum = parseFloat(montoRecibido) || 0;
  const vuelto = Math.max(0, cashNum - total);

  const runSale = async () => {
    if (cartItems.length === 0) {
      toast.error("Agrega al menos un producto al carrito");
      return;
    }
    setIsExecuting(true);
    setSaleResult(null);
    try {
      const client = clients.find((c) => c.id === selectedClientId);
      const result = await completeSaleTransactionAction({
        docType,
        clienteId: selectedClientId || undefined,
        clienteDoc: client?.numDoc || "00000000",
        clienteNombre: client?.nombre || "Clientes Varios",
        medioPago,
        montoRecibido: cashNum,
        vuelto,
        items: cartItems.map(({ product, qty }) => ({
          id: product.id,
          sku: product.sku,
          nombre: product.nombre,
          precio: product.precioVenta,
          cantidad: qty,
          tipo: "unidad",
        })),
      });
      setSaleResult(result);
      if (result.success) {
        toast.success("Venta creada en BD", { description: result.comprobanteSerieNumero });
      } else {
        toast.error(result.error || "Error al crear venta");
      }
    } catch (err: any) {
      setSaleResult({ success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const runOpenShift = async () => {
    setShiftResult(null);
    try {
      const result = await openShiftAction({
        cajaId: "dev-caja",
        cajeroId: "dev-cajero",
        montoApertura: 200,
        cajeroNombre: "Cajero Dev",
        cajaNombre: "Caja Dev",
      });
      setShiftResult(result);
      if (result.success) toast.success("Turno abierto exitosamente");
    } catch (err: any) {
      setShiftResult({ success: false, error: err.message });
    }
  };

  const runMovement = async () => {
    setMovementResult(null);
    try {
      const result = await cashMovementAction({
        sesionCajaId: "dev-caja",
        tipo: "egreso",
        monto: 50,
        motivo: "Dev test retiro para sencillo",
        usuarioId: "dev-cajero",
      });
      setMovementResult(result);
      if (result.success) toast.success("Movimiento registrado");
    } catch (err: any) {
      setMovementResult({ success: false, error: err.message });
    }
  };

  const runCloseShift = async () => {
    setCloseResult(null);
    try {
      const result = await closeShiftAction({
        sesionCajaId: "dev-caja",
        montoCierreDeclarado: 450,
        montoCierreSistema: 450,
        diferencia: 0,
      });
      setCloseResult(result);
      if (result.success) toast.success("Turno cerrado");
    } catch (err: any) {
      setCloseResult({ success: false, error: err.message });
    }
  };

  const verifyDb = async () => {
    setVerifiedSales(null);
    try {
      const sales = await getSalesHistoryData();
      setVerifiedSales((sales ?? []).slice(0, 5));
      toast.success(`Verificación: ${(sales ?? []).length} ventas en historial`);
    } catch (err: any) {
      toast.error(err.message || "Error al verificar");
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FlaskConical className="size-6 text-violet-400" /> Sandbox de Venta & Caja (Dev)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ejecuta las Server Actions reales contra la base de datos y verifica el resultado. Las
            acciones resuelven el tenant/sucursal/cajero demo automáticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="rounded-lg border-violet-500/30 bg-violet-500/10 text-violet-300 font-semibold">
            <Database className="size-3 mr-1" /> Postgres Conectado
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos / Carrito */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Package className="size-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">Productos Reales del Catálogo</h3>
                <p className="text-[11px] text-slate-400">
                  {isLoading ? "Cargando..." : `${products.length} productos desde la BD`}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="rounded-lg border-slate-800 text-slate-300">
              <ShoppingCart className="size-3 mr-1" /> {cartItems.reduce((a, c) => a + c.qty, 0)} ítems
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {products.slice(0, 30).map((p) => {
              const qty = cart.get(p.id) ?? 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-colors ${
                    qty > 0
                      ? "border-blue-500/50 bg-blue-600/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{p.nombre}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.sku} · {p.categoria} · {formatCurrency(p.precioVenta)}
                    </div>
                  </div>
                  {qty > 0 ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => removeProduct(p.id)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center font-mono font-bold text-white text-sm">{qty}</span>
                      <button
                        onClick={() => addProduct(p.id)}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addProduct(p.id)}
                      className="shrink-0 w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Datos de la venta */}
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Play className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Ejecutar createSaleAction</h3>
              <p className="text-[11px] text-slate-400">Insertar venta completa en una transacción</p>
            </div>
          </div>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cliente</label>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  const c = clients.find((x) => x.id === e.target.value);
                  if (c?.tipoDoc === "RUC") setDocType("factura");
                }}
                className="w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Clientes Varios / Consumidor Final</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.numDoc}) · {c.puntos} pts
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Comprobante</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as "boleta" | "factura")}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="boleta">Boleta</option>
                  <option value="factura">Factura</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medio de Pago</label>
                <select
                  value={medioPago}
                  onChange={(e) => setMedioPago(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="yape">Yape</option>
                  <option value="plin">Plin</option>
                </select>
              </div>
            </div>

            {medioPago === "efectivo" && (
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Monto Recibido</label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={montoRecibido}
                    onChange={(e) => setMontoRecibido(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1.5">
                  {QUICK_AMOUNTS.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setMontoRecibido(amt.toString())}
                      className="flex-1 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300 hover:bg-blue-600 hover:text-white transition-colors"
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal (Op. Gravada)</span>
              <span className="font-mono text-slate-300">{formatCurrency(subtotal / 1.18)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>IGV (18%)</span>
              <span className="font-mono text-slate-300">{formatCurrency(igv)}</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-800">
              <span className="font-bold text-white uppercase tracking-wider">Total</span>
              <span className="font-mono font-black text-white text-2xl">{formatCurrency(total)}</span>
            </div>
            {medioPago === "efectivo" && (
              <div className="flex justify-between text-slate-400">
                <span>Vuelto</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(vuelto)}</span>
              </div>
            )}
          </div>

          <button
            onClick={runSale}
            disabled={isExecuting || cartItems.length === 0}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="size-4" /> {isExecuting ? "Ejecutando..." : "Ejecutar Venta"}
          </button>

          {saleResult && (
            <pre className="text-[10px] font-mono text-slate-300 bg-slate-950/80 border border-slate-800 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(saleResult, null, 2)}
            </pre>
          )}
        </div>
      </div>

      {/* Actions de caja */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800/80">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
            <Terminal className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Otras Server Actions de Caja</h3>
            <p className="text-[11px] text-slate-400">openShift / recordCashMovement / closeShift</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Unlock className="size-3.5 text-emerald-400" /> Abrir Turno
              </span>
            </div>
            <button
              onClick={runOpenShift}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
            >
              openShiftAction
            </button>
            {shiftResult && (
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(shiftResult)}
              </pre>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ArrowDownUp className="size-3.5 text-amber-400" /> Movimiento de Caja (Ingreso S/ 50)
              </span>
            </div>
            <button
              onClick={runMovement}
              className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              recordCashMovementAction
            </button>
            {movementResult && (
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(movementResult)}
              </pre>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lock className="size-3.5 text-rose-400" /> Cerrar Turno
              </span>
            </div>
            <button
              onClick={runCloseShift}
              className="w-full py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
            >
              closeShiftAction
            </button>
            {closeResult && (
              <pre className="text-[10px] font-mono text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-2 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(closeResult)}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* Verificación */}
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <FileText className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Verificación en BD</h3>
              <p className="text-[11px] text-slate-400">Últimas ventas persistidas vía getSalesHistoryData</p>
            </div>
          </div>
          <button
            onClick={verifyDb}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
          >
            <RefreshCw className="size-3.5" /> Verificar en BD
          </button>
        </div>

        {verifiedSales && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="pb-2 pl-2">Comprobante</th>
                  <th className="pb-2">Tipo</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2">Medio</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 pr-2">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {verifiedSales.map((v: any) => (
                  <tr key={v.id} className="hover:bg-slate-800/30">
                    <td className="py-2 pl-2 font-mono text-slate-200">{v.comprobante}</td>
                    <td className="py-2">{v.tipo}</td>
                    <td className="py-2 text-slate-300">{v.cliente}</td>
                    <td className="py-2 text-right font-mono text-emerald-400">{formatCurrency(v.total)}</td>
                    <td className="py-2">{v.medioPago}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                        {v.estadoSunat}
                      </span>
                    </td>
                    <td className="py-2 pr-2 text-slate-400">
                      {v.fecha} {v.hora}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}