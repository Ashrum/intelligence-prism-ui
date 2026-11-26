"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type CellContext,
  type HeaderContext,
  type Row,
  type Table as TanStackTable,
  type TableOptions,
} from "@tanstack/react-table";
import type { ComponentProps, ReactNode } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "./coss/table.js";

export {
  createColumnHelper, flexRender, getCoreRowModel, useReactTable,
  type CellContext, type ColumnDef, type HeaderContext, type Row, type Table as TanStackTable,
} from "@tanstack/react-table";

export function useDataTable<TData>({
  data,
  columns,
  getRowId,
}: Pick<TableOptions<TData>, "data" | "columns" | "getRowId">): TanStackTable<TData> {
  // The core row model can otherwise queue a page reset when the supplied slice changes.
  return useReactTable({ data, columns, getRowId, getCoreRowModel: getCoreRowModel(), autoResetPageIndex: false });
}

type DataAttributes = {
  [name: `data-${string}`]: string | number | boolean | undefined;
};

export type DataTableProps<TData> = {
  table: TanStackTable<TData>;
  colgroup?: ReactNode;
  tableClassName?: string;
  "aria-label"?: string;
  getHeaderClassName?: (context: HeaderContext<TData, unknown>) => string | undefined;
  getCellClassName?: (context: CellContext<TData, unknown>) => string | undefined;
  getCellProps?: (context: CellContext<TData, unknown>) => Omit<ComponentProps<"td">, "children" | "className" | "key"> & DataAttributes;
  getRowProps?: (row: Row<TData>) => Omit<ComponentProps<"tr">, "children" | "key"> & DataAttributes;
};

export function DataTable<TData>({
  table,
  colgroup,
  tableClassName,
  "aria-label": ariaLabel,
  getHeaderClassName,
  getCellClassName,
  getCellProps,
  getRowProps,
}: DataTableProps<TData>) {
  return (
    <Table className={tableClassName} aria-label={ariaLabel}>
      {colgroup}
      <TableHeader>
        {table.getHeaderGroups().map((group) => (
          <TableRow key={group.id}>
            {group.headers.map((header) => {
              const context = header.getContext();
              return (
                <TableHead
                  key={header.id}
                  colSpan={header.colSpan}
                  scope={header.isPlaceholder ? undefined : header.subHeaders.length ? "colgroup" : "col"}
                  className={getHeaderClassName?.(context)}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, context)}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id} {...getRowProps?.(row)}>
            {row.getVisibleCells().map((cell) => {
              const context = cell.getContext();
              return (
                <TableCell key={cell.id} className={getCellClassName?.(context)} {...getCellProps?.(context)}>
                  {flexRender(cell.column.columnDef.cell, context)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
