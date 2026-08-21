import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Printer,
  ShieldCheck,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Package,
} from "lucide-react";
import { WasteRecord, WasteReason, WasteStatus } from "@/actions/waste-actions";

interface MermasColumnsProps {
  onViewActa: (record: WasteRecord) => void;
  onApprove: (record: WasteRecord) => void;
  onDelete: (record: WasteRecord) => void;
}

export function getMermasColumns({
  onViewActa,
  onApprove,
  onDelete,
}: MermasColumnsProps): ColumnDef<WasteRecord>[] {
  return [
    {
      accessorKey: "codigoActa",
      header: ({ column }) => (
        <button
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold"
        >
          Acta / Código
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
        <div className="font-mono">
          <div className="font-bold text-blue-400 text-xs flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {row.original.codigoActa}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {row.original.fecha} {row.original.hora}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "motivo",
      header: "Motivo SUNAT (Art. 37 LIR)",
      cell: ({ row }) => {
        const m = row.original.motivo;
        if (m === "VENCIMIENTO") {
          return (
            <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
              Vencimiento / Caducado
            </Badge>
          );
        }
        if (m === "ROTURA_TRANSPORTE") {
          return (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">
              Rotura / Transporte
            </Badge>
          );
        }
        if (m === "MERMA_PERECIBLE") {
          return (
            <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400 text-[10px]">
              Merma Perecible
            </Badge>
          );
        }
        if (m === "DEFECTO_FABRICA") {
          return (
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
              Defecto de Fábrica
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-300 text-[10px]">
            Contaminación
          </Badge>
        );
      },
    },
    {
      id: "items_resumen",
      header: "Productos Afectados",
      cell: ({ row }) => {
        const items = row.original.items || [];
        const firstItem = items[0];
        return (
          <div className="font-sans min-w-[200px]">
            {firstItem ? (
              <>
                <div className="font-bold text-white text-xs truncate max-w-[240px]">
                  {firstItem.nombre}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {firstItem.cantidad} {firstItem.unidad} • SKU: {firstItem.sku}
                  {items.length > 1 && (
                    <span className="text-blue-400 ml-1 font-semibold">
                      +{items.length - 1} más
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-slate-500 text-xs">Sin productos</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "costoTotalPerdida",
      header: () => <div className="text-right">Pérdida Valorizada</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono font-extrabold text-rose-400 text-xs">
          {formatCurrency(row.original.costoTotalPerdida)}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: () => <div className="text-center">Estado Legal</div>,
      cell: ({ row }) => {
        const st = row.original.estado;
        if (st === "DESTRUIDO_CON_ACTA") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                <ShieldCheck className="size-2.5 mr-1" /> Destruido c/ Acta
              </Badge>
            </div>
          );
        }
        if (st === "APROBADO_KARDEX") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                Aprobado en Kardex
              </Badge>
            </div>
          );
        }
        return (
          <div className="text-center">
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">
              Borrador
            </Badge>
          </div>
        );
      },
    },
    {
      id: "acciones",
      header: () => <div className="text-center">Acciones</div>,
      cell: ({ row }) => {
        const record = row.original;
        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onViewActa(record)}
              title="Ver / Imprimir Acta SUNAT"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
            </button>
            {record.estado === "BORRADOR" && (
              <button
                type="button"
                onClick={() => onApprove(record)}
                title="Aprobar y dar de baja en Kardex"
                className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <ShieldCheck className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(record)}
              title="Anular Acta de Merma"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        );
      },
    },
  ];
}
