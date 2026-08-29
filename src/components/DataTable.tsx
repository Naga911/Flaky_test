import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState, LoadingRows } from "./AppShell";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  width?: string;
  sortValue?: (row: T) => string | number;
  cell: (row: T) => ReactNode;
}

export interface FilterDef {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

export function DataTable<T>({
  rows,
  columns,
  getKey,
  searchKeys,
  searchPlaceholder = "Search…",
  filters,
  filterMatch,
  initialSort,
  loading,
  emptyMessage = "No results.",
  error,
  onRowClick,
  pageSize,
}: {
  rows: T[];
  columns: Array<Column<T>>;
  getKey: (row: T) => string;
  searchKeys: (row: T) => string[];
  searchPlaceholder?: string;
  filters?: FilterDef[];
  filterMatch?: (row: T, filterKey: string, value: string) => boolean;
  initialSort?: { key: string; dir: "asc" | "desc" };
  loading?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRowClick?: (row: T) => void;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(initialSort ?? null);

  const visible = useMemo(() => {
    let out = rows;
    const q = query.trim().toLowerCase();
    if (q) out = out.filter((r) => searchKeys(r).some((s) => s.toLowerCase().includes(q)));
    if (filterMatch) {
      for (const [k, v] of Object.entries(active)) {
        if (v && v !== "all") out = out.filter((r) => filterMatch(r, k, v));
      }
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out = [...out].sort((a, b) => {
          const av = col.sortValue!(a);
          const bv = col.sortValue!(b);
          const cmp = typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return pageSize ? out.slice(0, pageSize) : out;
  }, [rows, query, active, sort, columns, filterMatch, searchKeys, pageSize]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="h-8 w-full min-w-40 flex-1 rounded-md border border-input bg-background px-2.5 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-ring md:max-w-64"
        />
        {filters?.map((f) => (
          <select
            key={f.key}
            value={active[f.key] ?? "all"}
            onChange={(e) => setActive((s) => ({ ...s, [f.key]: e.target.value }))}
            className="h-8 rounded-md border border-input bg-background px-2 font-mono text-xs text-foreground outline-none focus:border-ring"
            aria-label={f.label}
          >
            <option value="all">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ))}
        <span className="ml-auto font-mono text-[10px] text-muted-foreground">
          {visible.length} / {rows.length}
        </span>
      </div>

      {error ? (
        <div className="px-4 py-10 text-center font-mono text-xs text-defect">{error}</div>
      ) : loading ? (
        <LoadingRows />
      ) : visible.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                {columns.map((c) => {
                  const sortable = Boolean(c.sortValue);
                  const isSorted = sort?.key === c.key;
                  return (
                    <th
                      key={c.key}
                      style={{ width: c.width }}
                      className={cn(
                        "label-xs px-4 py-2 font-medium",
                        c.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() =>
                            setSort({
                              key: c.key,
                              dir: isSorted && sort!.dir === "desc" ? "asc" : "desc",
                            })
                          }
                          className={cn(
                            "inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground",
                            isSorted && "text-flaky",
                          )}
                        >
                          {c.header}
                          <span aria-hidden>{isSorted ? (sort!.dir === "desc" ? "↓" : "↑") : "↕"}</span>
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={getKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-border/60 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-surface-raised",
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={cn(
                        "px-4 py-2.5 text-sm",
                        c.align === "right" ? "text-right" : "text-left",
                      )}
                    >
                      {c.cell(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
