"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
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
  Send,
} from "lucide-react";
import { PurchaseOrderRecord, PurchaseOrderStatus } from "@/actions/purchase-order-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface OrdenesColumnsProps {
  onViewSheet: (order: PurchaseOrderRecord) => void;
  onReceive: (order: PurchaseOrderRecord) => void;
  onDelete: (order: PurchaseOrderRecord) => void;
  onStatusChange: (order: PurchaseOrderRecord, newStatus: PurchaseOrderStatus) => void;
}

export function getOrdenesColumns({
  onViewSheet,
  onReceive,
  onDelete,
  onStatusChange,
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
          <button
            type="button"
            onClick={() => onViewSheet(row.original)}
            className="font-bold text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1.5 transition-colors cursor-pointer text-left"
          >
            <FileText className="size-3.5" />
            {row.original.codigoOC}
          </button>
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
          <div className="font-sans min-w-[190px]">
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
      header: () => <div className="text-center">Estado (Clic para cambiar)</div>,
      cell: ({ row }) => {
        const order = row.original;
        const st = order.estado;

        // Interactive Status Selector using Shadcn Select
        return (
          <div className="flex items-center justify-center">
            <Select
              value={st}
              onValueChange={(val: PurchaseOrderStatus) => onStatusChange(order, val)}
            >
              <SelectTrigger className="h-7 border-none bg-transparent hover:bg-slate-800/60 rounded-lg p-1 text-xs focus:ring-1 focus:ring-amber-500 cursor-pointer">
                {st === "RECEPCIONADA_TOTAL" && (
                  <Badge variant="outline" className="border-emerald-500/40 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                    <CheckCircle2 className="size-2.5 mr-1" /> Recibida Completa
                  </Badge>
                )}
                {st === "RECEPCION_PARCIAL" && (
                  <Badge variant="outline" className="border-blue-500/40 bg-blue-500/10 text-blue-400 text-[10px] font-bold">
                    <Clock className="size-2.5 mr-1" /> Recepción Parcial
                  </Badge>
                )}
                {st === "ENVIADA_PROVEEDOR" && (
                  <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                    Enviada / En Tránsito
                  </Badge>
                )}
                {st === "BORRADOR" && (
                  <Badge variant="outline" className="border-slate-500/40 bg-slate-500/10 text-slate-300 text-[10px] font-bold">
                    Borrador
                  </Badge>
                )}
                {st === "ANULADA" && (
                  <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                    Anulada
                  </Badge>
                )}
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-200 shadow-2xl rounded-xl z-50">
                <SelectItem value="BORRADOR" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                  Borrador
                </SelectItem>
                <SelectItem value="ENVIADA_PROVEEDOR" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                  Enviada / En Tránsito
                </SelectItem>
                <SelectItem value="ANULADA" className="text-xs cursor-pointer focus:bg-amber-600/20 focus:text-amber-300">
                  Anulada
                </SelectItem>
              </SelectContent>
            </Select>
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
        const isBorrador = order.estado === "BORRADOR";

        return (
          <div className="flex items-center justify-center gap-1.5">
            {/* Quick Send Button if Draft */}
            {isBorrador && (
              <button
                type="button"
                onClick={() => onStatusChange(order, "ENVIADA_PROVEEDOR")}
                title="Aprobar y Enviar al Proveedor"
                className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Send className="size-3.5" />
              </button>
            )}

            {/* View / Print Sheet */}
            <button
              type="button"
              onClick={() => onViewSheet(order)}
              title="Ver / Imprimir Hoja de Orden"
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-600 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
            </button>

            {/* Receive on Warehouse Dock */}
            {canReceive && (
              <button
                type="button"
                onClick={() => onReceive(order)}
                title="Recepcionar Mercadería en Muelle (Ingreso a Kardex)"
                className="p-1.5 rounded-lg bg-emerald-950/40 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-colors cursor-pointer"
              >
                <Truck className="size-3.5" />
              </button>
            )}

            {/* Delete / Cancel */}
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
