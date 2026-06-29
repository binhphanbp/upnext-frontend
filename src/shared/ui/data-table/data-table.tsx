"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";

type DataTableProps<TData, TValue = unknown> = Readonly<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  className?: string;
}>;

export function DataTable<TData, TValue = unknown>({
  columns,
  data,
  emptyMessage = "No results.",
  className,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted text-muted-foreground text-xs font-bold uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-border text-foreground divide-y">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/70">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    className="text-muted-foreground px-4 py-8 text-center"
                    colSpan={columns.length}
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-muted-foreground flex-1 text-sm">
          Hiển thị {table.getRowModel().rows.length} trên tổng số {data.length} kết quả.
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className="hover:text-brand h-8 w-8 rounded-full transition-all hover:scale-110 hover:bg-slate-200 active:scale-95"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Trang trước</span>
            <CaretLeft weight="bold" />
          </Button>

          {Array.from({ length: table.getPageCount() }, (_, i) => (
            <Button
              key={i}
              variant={table.getState().pagination.pageIndex === i ? "primary" : "ghost"}
              size="icon"
              className={cn(
                "h-8 w-8 rounded-full transition-all hover:scale-110 active:scale-95",
                table.getState().pagination.pageIndex !== i &&
                  "hover:bg-slate-200 hover:text-brand",
              )}
              onClick={() => table.setPageIndex(i)}
            >
              {i + 1}
            </Button>
          ))}

          <Button
            variant="ghost"
            size="icon"
            className="hover:text-brand h-8 w-8 rounded-full transition-all hover:scale-110 hover:bg-slate-200 active:scale-95"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Trang tiếp</span>
            <CaretRight weight="bold" />
          </Button>
        </div>
      </div>
    </div>
  );
}
