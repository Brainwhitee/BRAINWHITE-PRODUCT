"use client";

import * as React from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Button } from "./button";
import { Skeleton } from "./skeleton";

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  searchKey?: string;
  searchPlaceholder?: string;
  isLoading?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  searchPlaceholder = "Search...",
  isLoading = false,
  pageSize = 10,
  emptyMessage = "No records found.",
  className,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Filter
  const filteredData = React.useMemo(() => {
    if (!searchKey || !searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter((item) => {
      const val = item[searchKey];
      if (val === undefined || val === null) return false;
      return String(val).toLowerCase().includes(term);
    });
  }, [data, searchKey, searchTerm]);

  // Sort
  const sortedData = React.useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return sortOrder === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else setSortKey(null);
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {searchKey && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
            <Input
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="pl-9 h-9 text-xs"
            />
          </div>
          <span className="text-xs text-[var(--muted-foreground)] font-mono">
            {sortedData.length} total entries
          </span>
        </div>
      )}

      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-x-auto shadow-xs">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--muted-foreground)] text-xs font-semibold tracking-wider uppercase font-mono">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn("px-4 py-3 select-none", col.className)}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors cursor-pointer"
                    >
                      <span>{col.header}</span>
                      {sortKey === col.key ? (
                        sortOrder === "asc" ? (
                          <ArrowUp className="h-3.5 w-3.5 text-[var(--brand-orange)]" />
                        ) : (
                          <ArrowDown className="h-3.5 w-3.5 text-[var(--brand-orange)]" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                      )}
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-[var(--surface-hover)] transition-colors group"
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("px-4 py-3 text-[var(--foreground)]", col.className)}
                    >
                      {col.render ? col.render(row) : row[col.key] ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-[var(--muted-foreground)]">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="h-8 px-2.5 text-xs"
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="h-8 px-2.5 text-xs"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
