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
import { Scale } from "lucide-react";
import { TablePagination } from "@/components/ui/table-pagination";
import { WasteRecord } from "@/actions/waste-actions";
import { getMermasColumns } from "./mermas-columns";

interface MermasTableProps {
  records: WasteRecord[];
  searchTerm: string;
  filterReason: string;
  filterStatus: string;
  onViewActa: (record: WasteRecord) => void;
  onApprove: (record: WasteRecord) => void;
  onDelete: (record: WasteRecord) => void;
}

export function MermasTable({
  records,
  searchTerm,
  filterReason,
  filterStatus,
  onViewActa,
  onApprove,
  onDelete,
}: MermasTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "codigoActa", desc: true },
  ]);
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);

  const columns = useMemo(
    () => getMermasColumns({ onViewActa, onApprove, onDelete }),
    [onViewActa, onApprove, onDelete]
  );

  const filteredData = useMemo(() => {
    const q = (searchTerm || "").trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch =
        !q ||
        r.codigoActa.toLowerCase().includes(q) ||
        r.responsable.toLowerCase().includes(q) ||
        r.observaciones.toLowerCase().includes(q) ||
        (r.items && r.items.some((i) => i.nombre.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)));

      const matchesReason = filterReason === "all" || r.motivo === filterReason;
      const matchesStatus = filterStatus === "all" || r.estado === filterStatus;

      return matchesSearch && matchesReason && matchesStatus;
    });
  }, [records, searchTerm, filterReason, filterStatus]);

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
                <Scale className="size-8 mx-auto stroke-[1.2] opacity-30 text-slate-400 mb-2" />
                <p className="text-sm font-semibold text-slate-400">
                  No se encontraron actas de merma o desmedro
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Prueba cambiando los filtros o registra una nueva acta de baja tributaria.
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
