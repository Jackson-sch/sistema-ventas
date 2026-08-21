import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Plus, Minus, ArrowUpDown, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { InventoryCountItem } from "@/actions/inventory-count-actions";

interface ConteoColumnsProps {
  onCountChange: (productoId: string, newCount: number) => void;
}

export function getConteoColumns({
  onCountChange,
}: ConteoColumnsProps): ColumnDef<InventoryCountItem>[] {
  return [
    {
      accessorKey: "nombre",
      header: ({ column }) => (
        <button
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold"
        >
          Producto & SKU
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="size-3 text-blue-400" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="size-3 text-blue-400" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="font-sans min-w-[200px]">
            <div className="font-bold text-white text-xs">{item.nombre}</div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>SKU: {item.sku}</span>
              <span>•</span>
              <span className="text-slate-500">{item.categoria}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "lote",
      header: "Lote / Caducidad",
      cell: ({ row }) => {
        const item = row.original;
        if (!item.lote && !item.fechaVencimiento) {
          return <span className="text-slate-600 font-mono text-[11px]">No perecible</span>;
        }

        return (
          <div className="space-y-1">
            <div className="font-mono text-xs font-semibold text-slate-300">
              {item.lote || "S/L"}
            </div>
            {item.fechaVencimiento && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-slate-400">{item.fechaVencimiento}</span>
                {item.estadoVencimiento === "por_vencer" && (
                  <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[9px] py-0 px-1.5">
                    Por vencer
                  </Badge>
                )}
                {item.estadoVencimiento === "vencido" && (
                  <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[9px] py-0 px-1.5">
                    Vencido
                  </Badge>
                )}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "stockTeorico",
      header: () => <div className="text-center">Stock Sistema</div>,
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs text-slate-300">
          {row.original.stockTeorico} {row.original.tipoVenta === "peso" ? "kg" : "und"}
        </div>
      ),
    },
    {
      accessorKey: "conteoFisico",
      header: () => <div className="text-center">Conteo Físico</div>,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onCountChange(item.productoId, Math.max(0, item.conteoFisico - 1))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <Minus className="size-3" />
            </button>
            <input
              type="number"
              min="0"
              step="1"
              value={item.conteoFisico}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onCountChange(item.productoId, Math.max(0, val));
              }}
              className="w-16 h-7 text-center rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => onCountChange(item.productoId, item.conteoFisico + 1)}
              className="w-7 h-7 rounded-lg bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
            >
              <Plus className="size-3" />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "diferencia",
      header: () => <div className="text-center">Diferencia</div>,
      cell: ({ row }) => {
        const diff = row.original.diferencia;
        if (diff === 0) {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                <CheckCircle2 className="size-2.5 mr-1" /> Cuadrado (0)
              </Badge>
            </div>
          );
        }

        if (diff > 0) {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                +{diff} Sobrante
              </Badge>
            </div>
          );
        }

        return (
          <div className="text-center">
            <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
              <AlertTriangle className="size-2.5 mr-1" /> {diff} Faltante
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "impactoMonetario",
      header: () => <div className="text-right">Impacto Valorizado</div>,
      cell: ({ row }) => {
        const impacto = row.original.impactoMonetario;
        if (impacto === 0) {
          return <div className="text-right font-mono text-slate-500 text-xs">S/ 0.00</div>;
        }
        if (impacto > 0) {
          return (
            <div className="text-right font-mono font-bold text-emerald-400 text-xs">
              +{formatCurrency(impacto)}
            </div>
          );
        }
        return (
          <div className="text-right font-mono font-bold text-rose-400 text-xs">
            {formatCurrency(impacto)}
          </div>
        );
      },
    },
  ];
}
