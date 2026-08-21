"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import { Archive } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { KardexRecord, kardexColumns } from "./kardex-columns";

interface KardexTableProps {
  data: KardexRecord[];
  globalFilter: string;
  selectedProduct: string;
  selectedOperation: string;
}

export function KardexTable({
  data,
  globalFilter,
  selectedProduct,
  selectedOperation,
}: KardexTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "fecha", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Filter based on selectedProduct and selectedOperation before passing to tanstack or via custom filter
  const filteredData = data.filter((record) => {
    const matchesProduct = selectedProduct === "all" || record.productoId === selectedProduct;
    const matchesOp =
      selectedOperation === "all" ||
      (selectedOperation === "compra" && record.tipoOperacion === "02_COMPRA") ||
      (selectedOperation === "venta" && record.tipoOperacion === "01_VENTA") ||
      (selectedOperation === "transferencia" && record.tipoOperacion === "11_TRANSFERENCIA") ||
      (selectedOperation === "merma" && (record.tipoOperacion === "13_MERMA" || record.tipoOperacion === "99_AJUSTE"));
    const matchesSearch =
      !globalFilter ||
      record.productoNombre.toLowerCase().includes(globalFilter.toLowerCase()) ||
      record.sku.toLowerCase().includes(globalFilter.toLowerCase()) ||
      record.docSerieNumero.toLowerCase().includes(globalFilter.toLowerCase());
    return matchesProduct && matchesOp && matchesSearch;
  });

  const table = useReactTable({
    data: filteredData,
    columns: kardexColumns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
                  className="py-2.5 px-3 border-r border-slate-800/80 last:border-r-0"
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
              <td colSpan={kardexColumns.length + 8} className="py-12 text-center text-slate-500 font-sans">
                <Archive className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-400">
                  No se encontraron movimientos de Kardex
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Prueba cambiando los filtros o registra un nuevo movimiento manual.
                </p>
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-900/40 transition-colors">
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-0 border-r border-slate-800/60 last:border-r-0 align-middle"
                  >
                    <div className="px-3 py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Table Pagination Controller */}
      <TablePagination
        currentPage={table.getState().pagination.pageIndex + 1}
        totalItems={filteredData.length}
        pageSize={table.getState().pagination.pageSize}
        onPageChange={(page) => table.setPageIndex(page - 1)}
        onPageSizeChange={(size) => table.setPageSize(size)}
      />
    </div>
  );
}
