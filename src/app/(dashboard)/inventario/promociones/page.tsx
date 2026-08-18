"use client";

import { useState } from "react";
import {
  Tag,
  Plus,
  Search,
  Sparkles,
  Percent,
  Layers,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  Gift,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { promotionEngine, PromotionRule, DEMO_PROMOTIONS } from "@/lib/promotions/promotion-engine";

export default function PromocionesPage() {
  const [promotions, setPromotions] = useState<PromotionRule[]>(promotionEngine.getActivePromotions());
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New promo form state
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<"2x1" | "3x2" | "volumen" | "combo" | "porcentaje">("2x1");
  const [skuPrincipal, setSkuPrincipal] = useState("");
  const [minCantidad, setMinCantidad] = useState("3");
  const [precioPromo, setPrecioPromo] = useState("");
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState("20");
  const [descripcion, setDescripcion] = useState("");

  const handleToggle = (id: string) => {
    promotionEngine.togglePromotion(id);
    setPromotions(promotionEngine.getActivePromotions());
    toast.success("Estado de promoción actualizado en el POS.");
  };

  const handleCreatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !skuPrincipal.trim()) {
      toast.error("Complete el nombre y el código de barras / SKU del producto.");
      return;
    }

    const newRule: PromotionRule = {
      id: `promo-${Date.now()}`,
      nombre: nombre.trim(),
      tipo,
      productoSkuPrincipal: skuPrincipal.trim(),
      minCantidad: tipo === "volumen" ? parseInt(minCantidad, 10) || 3 : undefined,
      precioPromocional: precioPromo ? parseFloat(precioPromo) : undefined,
      descuentoPorcentaje: tipo === "porcentaje" ? parseFloat(descuentoPorcentaje) : undefined,
      activo: true,
      descripcion: descripcion.trim() || nombre.trim(),
    };

    promotionEngine.addPromotion(newRule);
    setPromotions(promotionEngine.getActivePromotions());
    toast.success(`¡Promoción "${nombre}" creada y activada en terminales POS!`);
    setIsCreateOpen(false);

    // Reset form
    setNombre("");
    setSkuPrincipal("");
    setDescripcion("");
  };

  const filtered = promotions.filter((p) => {
    const matchesSearch =
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.productoSkuPrincipal.includes(searchTerm) ||
      p.descripcion.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || p.tipo === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col p-4 lg:p-6 gap-6 overflow-y-auto bg-[hsl(224,71%,4%)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-400 text-[10px] font-bold border border-purple-800/50 flex items-center gap-1">
              <Gift className="size-3" /> Marketing & Retail Engine
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Tag className="size-6 text-purple-400" /> Promociones & Descuentos Automáticos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reglas de 2x1, 3x2, descuentos por volumen, combos y fidelización de clientes en tiempo real
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="size-3.5" /> Crear Nueva Promoción
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              PROMOCIONES ACTIVAS
            </span>
            <div className="text-2xl font-black text-purple-400 font-mono mt-1">{promotions.length}</div>
            <span className="text-[11px] text-slate-500">Evaluándose en vivo en cada venta</span>
          </div>
          <div className="size-11 rounded-2xl bg-purple-950/60 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Tag className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              REGLA DE PUNTOS (LOYALTY)
            </span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">1 pt / S/ 10.00</div>
            <span className="text-[11px] text-slate-500">Canje: 10 pts = S/ 1.00 descuento</span>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              LATENCIA DE EVALUACIÓN POS
            </span>
            <div className="text-2xl font-black text-cyan-400 font-mono mt-1">0 ms</div>
            <span className="text-[11px] text-slate-500">Cálculo local en memoria en cada escaneo</span>
          </div>
          <div className="size-11 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Gift className="size-5" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="glass-panel rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 border border-slate-800/80">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none self-end sm:self-auto font-medium"
        >
          <option value="all">Todos los Tipos de Promoción</option>
          <option value="2x1">2x1 (Llévate 2, paga 1)</option>
          <option value="3x2">3x2 (3ra Unidad Gratis)</option>
          <option value="volumen">Descuento por Volumen</option>
          <option value="combo">Combo Especial</option>
          <option value="porcentaje">Descuento Porcentual (%)</option>
        </select>
      </div>

      {/* Promotions Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((promo) => (
          <div
            key={promo.id}
            className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-between gap-3 relative overflow-hidden group hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    promo.tipo === "2x1"
                      ? "bg-purple-950/80 text-purple-400 border-purple-800/60"
                      : promo.tipo === "3x2"
                      ? "bg-blue-950/80 text-blue-400 border-blue-800/60"
                      : promo.tipo === "volumen"
                      ? "bg-amber-950/80 text-amber-400 border-amber-800/60"
                      : "bg-emerald-950/80 text-emerald-400 border-emerald-800/60"
                  }`}
                >
                  <Sparkles className="size-3" /> {promo.tipo.toUpperCase()}
                </span>
                <h3 className="text-base font-extrabold text-white tracking-tight">{promo.nombre}</h3>
                <p className="text-xs text-slate-400">{promo.descripcion}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggle(promo.id)}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  promo.activo
                    ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
                title={promo.activo ? "Pausar Promoción" : "Activar Promoción"}
              >
                {promo.activo ? <ToggleRight className="size-6" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">SKU:</span>
              <span className="font-bold text-white bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                {promo.productoSkuPrincipal}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Promotion Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[hsl(224,71%,4%)] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Gift className="size-5 text-purple-400" /> Nueva Regla de Promoción
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Nombre de la Promoción:</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. 2x1 en Bebidas Energizantes"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Tipo de Promoción:</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                  >
                    <option value="2x1">2x1 (Llévate 2, paga 1)</option>
                    <option value="3x2">3x2 (3ra unidad GRATIS)</option>
                    <option value="volumen">Descuento por Volumen (a partir de N)</option>
                    <option value="porcentaje">Porcentaje de Descuento (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Código de Barras / SKU:</label>
                  <input
                    type="text"
                    value={skuPrincipal}
                    onChange={(e) => setSkuPrincipal(e.target.value)}
                    placeholder="Ej. 7750106001124"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono"
                    required
                  />
                </div>
              </div>

              {tipo === "volumen" && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="space-y-1">
                    <label className="text-slate-400">Cantidad Mínima:</label>
                    <input
                      type="number"
                      min="2"
                      value={minCantidad}
                      onChange={(e) => setMinCantidad(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-slate-400">Precio Especial (c/u):</label>
                    <input
                      type="number"
                      step="0.10"
                      value={precioPromo}
                      onChange={(e) => setPrecioPromo(e.target.value)}
                      placeholder="Ej. 8.20"
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white"
                    />
                  </div>
                </div>
              )}

              {tipo === "porcentaje" && (
                <div className="space-y-1 p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <label className="text-slate-400">% de Descuento a Aplicar:</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={descuentoPorcentaje}
                    onChange={(e) => setDescuentoPorcentaje(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Descripción de la Oferta:</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Texto visible en ticket y terminal"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="size-4" /> Crear y Activar en POS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
