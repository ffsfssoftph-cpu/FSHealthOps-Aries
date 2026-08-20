import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./ui";

/* ============================================================
   Phase 4 — DataGrid: the high-frequency ledger component.
   Sticky header · inline filtering · column show/hide ·
   sortable · paged (stays legible at thousands of rows) ·
   skeleton loading state instead of spinners.
   ============================================================ */

export interface Col<T> {
  key: string; label: string; mono?: boolean; align?: "left" | "right";
  render?: (row: T) => ReactNode; sortVal?: (row: T) => string | number;
}

export function DataGrid<T>({
  cols, rows, rowKey, pageSize = 8, searchable = true, loading = false,
  emptyHint = "No rows match the current filter.", toolbar,
}: {
  cols: Col<T>[]; rows: T[]; rowKey: (r: T) => string;
  pageSize?: number; searchable?: boolean; loading?: boolean;
  emptyHint?: string; toolbar?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [menu, setMenu] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(0);

  const visibleCols = cols.filter(c => !hidden.has(c.key));

  const filtered = useMemo(() => {
    let out = rows;
    if (query.trim()) {
      const q = query.toLowerCase();
      out = rows.filter(r => cols.some(c => {
        const v = c.sortVal ? c.sortVal(r) : (r as Record<string, unknown>)[c.key];
        return String(v ?? "").toLowerCase().includes(q);
      }));
    }
    if (sortKey) {
      const col = cols.find(c => c.key === sortKey);
      out = [...out].sort((a, b) => {
        const va = col?.sortVal ? col.sortVal(a) : (a as Record<string, unknown>)[sortKey];
        const vb = col?.sortVal ? col.sortVal(b) : (b as Record<string, unknown>)[sortKey];
        return (String(va).localeCompare(String(vb), undefined, { numeric: true })) * dir;
      });
    }
    return out;
  }, [rows, query, sortKey, dir, cols]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRows = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const safePage = Math.min(page, pages - 1);

  return (
    <div className="overflow-hidden rounded-lg border border-pine-200 bg-card shadow-lift">
      {(searchable || toolbar) && (
        <div className="relative z-20 flex flex-wrap items-center gap-2 border-b border-pine-200 bg-paper/70 px-3 py-2">
          {searchable && (
            <label className="flex min-w-0 flex-1 basis-52 items-center gap-2 rounded-md border border-pine-200 bg-white px-2.5 py-1.5 transition-colors focus-within:border-pulse-500">
              <span className="text-pine-400"><Icon name="search" size={13} /></span>
              <input value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} placeholder="Filter rows…"
                className="w-full bg-transparent text-[12px] font-semibold text-pine-800 outline-none placeholder:text-pine-400" />
              {query && <button onClick={() => setQuery("")} className="text-pine-400 hover:text-danger-500"><Icon name="x" size={12} /></button>}
            </label>
          )}
          {toolbar}
          <div className="relative">
            <button onClick={() => setMenu(m => !m)}
              className="inline-flex items-center gap-1.5 rounded-md border border-pine-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-pine-600 transition-all hover:border-pine-400">
              <Icon name="cpu" size={13} /> Columns
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenu(false)} />
                <div className="absolute right-0 top-full z-40 mt-1 w-48 rounded-md border border-pine-200 bg-card p-1.5 shadow-pop anim-pop">
                  {cols.map(c => (
                    <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[11.5px] font-semibold text-pine-700 transition-colors hover:bg-pulse-50">
                      <input type="checkbox" checked={!hidden.has(c.key)} className="accent-[#2576eb]"
                        onChange={() => setHidden(h => { const n = new Set(h); if (n.has(c.key)) n.delete(c.key); else n.add(c.key); return n; })} />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-h-[460px] overflow-auto">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-pine-100 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-pine-500 shadow-[0_1px_0_var(--color-pine-200)]">
              {visibleCols.map(c => (
                <th key={c.key} className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 transition-colors hover:text-pulse-700 ${c.align === "right" ? "text-right" : ""}`}
                  onClick={() => { if (sortKey === c.key) setDir(d => (d === 1 ? -1 : 1)); else { setSortKey(c.key); setDir(1); } }}>
                  <span className="inline-flex items-center gap-1">{c.label}
                    {sortKey === c.key && <span className={`transition-transform ${dir === -1 ? "rotate-90" : "-rotate-90"}`}><Icon name="chevR" size={10} sw={2.6} /></span>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-pine-100">
                {visibleCols.map(c => <td key={c.key} className="px-3 py-3"><div className="skel h-3.5 w-full max-w-[140px]" /></td>)}
              </tr>
            ))}
            {!loading && pageRows.map((r, ri) => (
              <tr key={rowKey(r)} className={`border-b border-pine-200/60 transition-all duration-150 last:border-0 hover:bg-pulse-50/60 hover:shadow-[inset_2px_0_0_var(--color-pulse-500)] ${ri % 2 === 1 ? "bg-paper/55" : ""}`}>
                {visibleCols.map(c => (
                  <td key={c.key} className={`px-3 py-2.5 align-middle ${c.align === "right" ? "text-right" : ""} ${c.mono ? "font-mono text-[11.5px] font-semibold text-pine-700 tnum" : "text-pine-800"}`}>
                    {c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {!loading && pageRows.length === 0 && (
              <tr><td colSpan={visibleCols.length}>
                <div className="circuit-bg flex flex-col items-center gap-2 px-4 py-10 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-pine-100 text-pine-400"><Icon name="search" size={18} /></span>
                  <p className="text-[12px] font-semibold text-pine-500">{emptyHint}</p>
                </div>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-pine-200 bg-paper/70 px-3 py-1.5">
        <span className="font-mono text-[10px] text-pine-400 tnum">
          {filtered.length === 0 ? "0 rows" : `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, filtered.length)} of ${filtered.length} rows`}
        </span>
        <span className="flex items-center gap-1">
          <button disabled={safePage === 0} onClick={() => setPage(p => Math.max(0, p - 1))}
            className="rounded border border-pine-200 bg-white px-1.5 py-0.5 text-pine-500 transition-all enabled:hover:border-pine-400 disabled:opacity-40"><Icon name="chevR" size={12} className="rotate-180" /></button>
          <span className="px-1 font-mono text-[10.5px] font-bold text-pine-600 tnum">{safePage + 1}/{pages}</span>
          <button disabled={safePage >= pages - 1} onClick={() => setPage(p => Math.min(pages - 1, p + 1))}
            className="rounded border border-pine-200 bg-white px-1.5 py-0.5 text-pine-500 transition-all enabled:hover:border-pine-400 disabled:opacity-40"><Icon name="chevR" size={12} /></button>
        </span>
      </div>
    </div>
  );
}
