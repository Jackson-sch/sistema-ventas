import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

export interface KardexRecord {
  id: string;
  fecha: string;
  productoId: string;
  productoNombre: string;
  sku: string;
  categoria: string;
  tipoOperacion: "01_VENTA" | "02_COMPRA" | "13_MERMA" | "11_TRANSFERENCIA" | "99_AJUSTE";
  operacionLabel: string;
  tipoDoc: "01_FACTURA" | "03_BOLETA" | "09_GUIA" | "AJ_ACTA";
  docSerieNumero: string;
  // Entradas
  entradaCant?: number;
  entradaCostoUnit?: number;
  entradaTotal?: number;
  // Salidas
  salidaCant?: number;
  salidaCostoUnit?: number;
  salidaTotal?: number;
  // Saldo
  saldoCant: number;
  saldoCostoUnit: number;
  saldoTotal: number;
}

export const kardexColumns: ColumnDef<KardexRecord>[] = [
  {
    id: "documento_grupo",
    header: () => (
      <div className="py-1 text-slate-300 font-bold uppercase text-[11px] tracking-wider text-left">
        Documento & Transacción
      </div>
    ),
    columns: [
      {
        accessorKey: "fecha",
        header: ({ column }) => (
          <button
            type="button"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[10px]"
          >
            Fecha / Hora
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="size-3 text-blue-400" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="size-3 text-blue-400" />
            ) : (
              <ArrowUpDown className="size-3 opacity-40" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-slate-400 whitespace-nowrap text-[11px] font-mono">
            {row.original.fecha}
          </span>
        ),
      },
      {
        accessorKey: "tipoOperacion",
        header: "Tipo Op. (SUNAT)",
        cell: ({ row }) => {
          const op = row.original.tipoOperacion;
          if (op === "01_VENTA") {
            return (
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
                01 Venta POS
              </Badge>
            );
          }
          if (op === "02_COMPRA") {
            return (
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                02 Compra Prov.
              </Badge>
            );
          }
          if (op === "13_MERMA") {
            return (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">
                13 Merma
              </Badge>
            );
          }
          if (op === "11_TRANSFERENCIA") {
            return (
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                11 Traslado GRE
              </Badge>
            );
          }
          return (
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px]">
              99 Ajuste Físico
            </Badge>
          );
        },
      },
      {
        accessorKey: "docSerieNumero",
        header: "Comprobante",
        cell: ({ row }) => (
          <span className="text-slate-300 font-mono font-bold text-xs">
            {row.original.docSerieNumero}
          </span>
        ),
      },
      {
        id: "producto_detalle",
        accessorKey: "productoNombre",
        header: "Producto / Detalle",
        cell: ({ row }) => (
          <div className="font-sans min-w-[180px]">
            <div className="font-bold text-white text-xs leading-tight">
              {row.original.productoNombre}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              SKU: {row.original.sku} • {row.original.operacionLabel}
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "entradas_grupo",
    header: () => (
      <div className="py-1 text-center font-bold uppercase text-[11px] tracking-wider text-emerald-400 bg-emerald-950/20 rounded-md">
        Entradas
      </div>
    ),
    columns: [
      {
        accessorKey: "entradaCant",
        header: () => <div className="text-center bg-emerald-950/10 py-1">Cant.</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono bg-emerald-950/10 py-2">
            {row.original.entradaCant ? (
              <span className="text-emerald-400 font-bold">+{row.original.entradaCant}</span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "entradaCostoUnit",
        header: () => <div className="text-right bg-emerald-950/10 py-1">Costo U.</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-slate-300 bg-emerald-950/10 py-2 text-xs">
            {row.original.entradaCostoUnit ? formatCurrency(row.original.entradaCostoUnit) : "-"}
          </div>
        ),
      },
      {
        accessorKey: "entradaTotal",
        header: () => <div className="text-right bg-emerald-950/10 py-1">Total S/</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-emerald-400 font-bold bg-emerald-950/10 py-2 text-xs border-r border-slate-800">
            {row.original.entradaTotal ? formatCurrency(row.original.entradaTotal) : "-"}
          </div>
        ),
      },
    ],
  },
  {
    id: "salidas_grupo",
    header: () => (
      <div className="py-1 text-center font-bold uppercase text-[11px] tracking-wider text-rose-400 bg-rose-950/20 rounded-md">
        Salidas
      </div>
    ),
    columns: [
      {
        accessorKey: "salidaCant",
        header: () => <div className="text-center bg-rose-950/10 py-1">Cant.</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono bg-rose-950/10 py-2">
            {row.original.salidaCant ? (
              <span className="text-rose-400 font-bold">-{row.original.salidaCant}</span>
            ) : (
              <span className="text-slate-600">-</span>
            )}
          </div>
        ),
      },
      {
        accessorKey: "salidaCostoUnit",
        header: () => <div className="text-right bg-rose-950/10 py-1">Costo U.</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-slate-300 bg-rose-950/10 py-2 text-xs">
            {row.original.salidaCostoUnit ? formatCurrency(row.original.salidaCostoUnit) : "-"}
          </div>
        ),
      },
      {
        accessorKey: "salidaTotal",
        header: () => <div className="text-right bg-rose-950/10 py-1">Total S/</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-rose-400 font-bold bg-rose-950/10 py-2 text-xs border-r border-slate-800">
            {row.original.salidaTotal ? formatCurrency(row.original.salidaTotal) : "-"}
          </div>
        ),
      },
    ],
  },
  {
    id: "saldo_grupo",
    header: () => (
      <div className="py-1 text-center font-bold uppercase text-[11px] tracking-wider text-blue-400 bg-blue-950/20 rounded-md">
        Saldo Final
      </div>
    ),
    columns: [
      {
        accessorKey: "saldoCant",
        header: () => <div className="text-center bg-blue-950/10 py-1">Cant.</div>,
        cell: ({ row }) => (
          <div className="text-center font-mono bg-blue-950/10 py-2 font-bold text-white">
            {row.original.saldoCant}
          </div>
        ),
      },
      {
        accessorKey: "saldoCostoUnit",
        header: () => <div className="text-right bg-blue-950/10 py-1">Costo U.</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-slate-300 bg-blue-950/10 py-2 text-xs">
            {formatCurrency(row.original.saldoCostoUnit)}
          </div>
        ),
      },
      {
        accessorKey: "saldoTotal",
        header: () => <div className="text-right bg-blue-950/10 py-1">Total S/</div>,
        cell: ({ row }) => (
          <div className="text-right font-mono text-emerald-400 font-extrabold bg-blue-950/10 py-2 text-sm">
            {formatCurrency(row.original.saldoTotal)}
          </div>
        ),
      },
    ],
  },
];
