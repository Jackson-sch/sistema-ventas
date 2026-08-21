"use client";

import { useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  SortingState,
} from "@tanstack/react-table";
import { ShoppingCart } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { PurchaseOrderRecord } from "@/actions/purchase-order-actions";
import { getOrdenesColumns } from "./ordenes-columns";

interface OrdenesTableProps {
  orders: PurchaseOrderRecord[];
  searchTerm: string;
  filterStatus: string;
  onViewSheet: (order: PurchaseOrderRecord) => void;
  onReceive: (order: PurchaseOrderRecord) => void;
  onDelete: (order: PurchaseOrderRecord) => void;
}

export function OrdenesTable({
  orders,
  searchTerm,
  filterStatus,
  onViewSheet,
  onReceive,
  onDelete,
}: OrdenesTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "codigoOC", desc: true },
  ]);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const columns = useMemo(
    () => getOrdenesColumns({ onViewSheet, onReceive, onDelete }),
    [onViewSheet, onReceive, onDelete]
  );

  const filteredData = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.codigoOC.toLowerCase().includes(q) ||
        o.proveedorRazonSocial.toLowerCase().includes(q) ||
        o.proveedorRuc.includes(q) ||
        (o.items && o.items.some((i) => i.nombre.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)));

      const matchesStatus = filterStatus === "all" || o.estado === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pagination = useMemo(
    () => ({
      pageIndex: safePageIndex,
      pageSize,
    }),
    [safePageIndex, pageSize]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    autoResetPageIndex: false,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr
              key={headerGroup.id}
              className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400"
            >
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  className="py-3 px-4 border-r border-slate-800/80 last:border-r-0"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-slate-500 font-sans">
                <ShoppingCart className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-400">
                  No se encontraron órdenes de compra
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Prueba cambiando los filtros o emite una nueva orden de compra a proveedores.
                </p>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="py-3 px-4 border-r border-slate-800/60 last:border-r-0 align-middle"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination Controller */}
      <TablePagination
        currentPage={safePageIndex + 1}
        totalItems={filteredData.length}
        pageSize={pageSize}
        onPageChange={(page) => setPageIndex(page - 1)}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
