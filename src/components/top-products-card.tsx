import { Trophy, TrendingUp, PackageCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  totalRevenue: number;
  stockLeft: number;
  progressPercent: number;
}

const FALLBACK_TOP_PRODUCTS: TopProduct[] = [
  { id: "1", name: "Leche Gloria Entera 400g", category: "Lácteos", unitsSold: 342, totalRevenue: 1539.00, stockLeft: 142, progressPercent: 88 },
  { id: "2", name: "Arroz Costeño Extra 1kg", category: "Abarrotes", unitsSold: 215, totalRevenue: 1118.00, stockLeft: 18, progressPercent: 72 },
  { id: "3", name: "Aceite Primor Premium 1L", category: "Abarrotes", unitsSold: 184, totalRevenue: 1803.20, stockLeft: 64, progressPercent: 64 },
  { id: "4", name: "Manzana Delicia Nacional (kg)", category: "Frutas", unitsSold: 128, totalRevenue: 614.40, stockLeft: 8.5, progressPercent: 52 },
  { id: "5", name: "Detergente Bolívar 1kg", category: "Limpieza", unitsSold: 98, totalRevenue: 833.00, stockLeft: 45, progressPercent: 41 },
];

export function TopProductsCard({ data }: { data?: TopProduct[] }) {
  const TOP_PRODUCTS = data && data.length > 0 ? data : FALLBACK_TOP_PRODUCTS;
  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Trophy className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Top 5 Productos Más Vendidos</h3>
              <p className="text-[11px] text-slate-400">Ranking por volumen del turno actual</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-blue-400 hover:underline cursor-pointer">
            Ver Todos
          </span>
        </div>

        <div className="space-y-3.5">
          {TOP_PRODUCTS.map((prod, idx) => (
            <div key={prod.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-4 font-mono font-bold text-slate-500 text-[11px]">#{idx + 1}</span>
                  <span className="font-semibold text-slate-200 truncate">{prod.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium shrink-0">
                    {prod.category}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-white">{prod.unitsSold} und</span>
                  <span className="text-slate-400 text-[11px] ml-2">({formatCurrency(prod.totalRevenue)})</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400"
                  style={{ width: `${prod.progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <PackageCheck className="size-3 text-slate-400" /> Stock restante: <strong className={prod.stockLeft < 20 ? "text-amber-400 font-mono" : "text-slate-300 font-mono"}>{prod.stockLeft}</strong>
                </span>
                <span className="text-slate-400">{prod.progressPercent}% de rotación esperada</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
