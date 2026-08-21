import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import {
  FileText,
  Printer,
  Truck,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PurchaseOrderRecord, PurchaseOrderStatus } from "@/actions/purchase-order-actions";

interface OrdenesColumnsProps {
  onViewSheet: (order: PurchaseOrderRecord) => void;
  onReceive: (order: PurchaseOrderRecord) => void;
  onDelete: (order: PurchaseOrderRecord) => void;
}

export function getOrdenesColumns({
  onViewSheet,
  onReceive,
  onDelete,
}: OrdenesColumnsProps): ColumnDef<PurchaseOrderRecord>[] {
  return [
    {
      accessorKey: "codigoOC",
      header: ({ column }) => (
        <button
          type="button"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-xs uppercase font-bold"
        >
          N° Orden
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="size-3 text-amber-400" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="size-3 text-amber-400" />
          ) : (
            <ArrowUpDown className="size-3 opacity-40" />
          )}
        </button>
      ),
      cell: ({ row }) => (
        <div className="font-mono">
          <div className="font-bold text-amber-400 text-xs flex items-center gap-1.5">
            <FileText className="size-3.5" />
            {row.original.codigoOC}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Emitido: {row.original.fechaEmision}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "proveedorRazonSocial",
      header: "Proveedor & Contacto",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="font-sans min-w-[200px]">
            <div className="font-bold text-white text-xs truncate max-w-[240px]">
              {order.proveedorRazonSocial}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
              <span>RUC: {order.proveedorRuc}</span>
              {order.proveedorTelefono && (
                <>
                  <span>•</span>
                  <span>{order.proveedorTelefono}</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "fechaEntregaEstimada",
      header: "Fecha Entrega",
      cell: ({ row }) => (
        <div className="font-mono text-xs text-slate-300">
          {row.original.fechaEntregaEstimada}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: () => <div className="text-right">Monto Total</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono font-extrabold text-white text-xs">
          {row.original.moneda === "USD" ? "$ " : "S/ "}
          {row.original.total.toFixed(2)}
        </div>
      ),
    },
    {
      accessorKey: "estado",
      header: () => <div className="text-center">Estado</div>,
      cell: ({ row }) => {
        const st = row.original.estado;
        if (st === "RECEPCIONADA_TOTAL") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                <CheckCircle2 className="size-2.5 mr-1" /> Recibida Completa
              </Badge>
            </div>
          );
        }
        if (st === "RECEPCION_PARCIAL") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                <Clock className="size-2.5 mr-1" /> Recepción Parcial
              </Badge>
            </div>
          );
        }
        if (st === "ENVIADA_PROVEEDOR") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px]">
                Enviada / En Tránsito
              </Badge>
            </div>
          );
        }
        if (st === "ANULADA") {
          return (
            <div className="text-center">
              <Badge variant="outline" className="border-rose-500/30 bg-rose-500/10 text-rose-400 text-[10px]">
                Anulada
              </Badge>
            </div>
          );
        }
        return (
          <div className="text-center">
            <Badge variant="outline" className="border-slate-500/30 bg-slate-500/10 text-slate-300 text-[10px]">
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
        const order = row.original;
        const canReceive = order.estado !== "RECEPCIONADA_TOTAL" && order.estado !== "ANULADA";

        return (
          <div className="flex items-center justify-center gap-1.5">
            <button
              type="button"
              onClick={() => onViewSheet(order)}
              title="Ver / Imprimir Hoja de Orden"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
            </button>
            {canReceive && (
              <button
                type="button"
                onClick={() => onReceive(order)}
                title="Recepcionar en Muelle de Almacén"
                className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <Truck className="size-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(order)}
              title="Anular / Eliminar Orden"
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
