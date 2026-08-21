import { useEffect, useMemo, useRef, useState } from "react";
import { NAV_GROUPS } from "../data";
import type { PageKey } from "../data";
import { useApp } from "../state";
import { Icon } from "./ui";

/* ============================================================
   Phase 4 — Command palette: ⌘K / Ctrl+K quick navigation and
   quick actions across every module the user can reach.
   ============================================================ */

interface Cmd { id: string; label: string; hint: string; icon: string; run: () => void }

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const app = useApp();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const cmds = useMemo<Cmd[]>(() => {
    const nav: Cmd[] = NAV_GROUPS.flatMap(g => g.items)
      .filter(it => {
        if (it.gate === "hr" && !app.hrEnabled) return false;
        if (it.gate === "root" && !app.sessionUser?.isRoot) return false;
        return app.canPage(it.key as PageKey);
      })
      .map(it => ({
        id: `nav-${it.key}`, label: `Go to ${it.label}`, hint: "Navigate", icon: it.icon,
        run: () => { app.setNav(it.key as PageKey); },
      }));
    const actions: Cmd[] = [
      { id: "theme", label: `Switch to ${app.theme === "dark" ? "light" : "dark"} mode`, hint: "Theme · Phase 4", icon: "sparkle", run: () => app.setTheme(app.theme === "dark" ? "light" : "dark") },
      { id: "sync", label: "Run gateway sync (EHR · PracticeSuite · MedCRM)", hint: "Quick action", icon: "refresh", run: () => app.toast("Gateway sync queued — deltas reconciled, 0 conflicts", "ok") },
      { id: "new-client", label: "Open Clients — start new intake", hint: "Quick action", icon: "heart", run: () => app.setNav("clients") },
      { id: "invoice", label: "Open Billing — draft an invoice", hint: "Quick action", icon: "invoice", run: () => app.setNav("billing") },
      { id: "backup", label: "Create manual backup", hint: "Backup · Phase 6", icon: "shield", run: () => app.toast("Backup job dispatched to the data directory", "ok") },
      { id: "packaging", label: "Distribution console — package Windows installer", hint: "System → Packaging tab", icon: "download", run: () => { app.setNav("system"); app.toast("Opening System & License — select the Packaging & Installer tab", "info"); } },
    ];
    if (app.hrEnabled) actions.push({ id: "clock", label: "HR — open time & leave register", hint: "HR add-on", icon: "clock", run: () => app.setNav("hr") });
    if (app.sessionUser?.isRoot) actions.push({ id: "hr-toggle", label: `${app.hrEnabled ? "Deactivate" : "Activate"} HR add-on (license)`, hint: "Root · Phase 11", icon: "key", run: () => app.toggleHR() });
    return [...nav, ...actions];
  }, [app]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? cmds.filter(c => (c.label + c.hint).toLowerCase().includes(s)) : cmds;
  }, [cmds, q]);

  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => setIdx(0), [q]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setIdx(i => Math.min(i + 1, list.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && list[idx]) { list[idx].run(); onClose(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, list, idx, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center bg-pine-950/50 p-4 pt-[12vh] backdrop-blur-[2px] anim-fade-in" onMouseDown={onClose}>
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-pine-200 bg-card shadow-pop anim-pop" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 border-b border-pine-200 px-4 py-3">
          <Icon name="search" size={16} className="text-pulse-600" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Type a module or action…"
            className="w-full bg-transparent text-[14px] font-semibold text-pine-900 outline-none placeholder:text-pine-400" />
          <span className="kbd">esc</span>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-1.5">
          {list.length === 0 && (
            <div className="circuit-bg px-4 py-8 text-center">
              <p className="text-[12.5px] font-semibold text-pine-500">No commands match “{q}”.</p>
              <p className="mt-1 font-mono text-[10px] text-pine-400">RBAC-filtered — you only see what your matrix allows</p>
            </div>
          )}
          {list.map((c, i) => (
            <button key={c.id} onClick={() => { c.run(); onClose(); }} onMouseEnter={() => setIdx(i)}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${i === idx ? "bg-pine-900 text-pine-50" : "text-pine-700 hover:bg-pulse-50"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded ${i === idx ? "bg-pine-800 text-pulse-300" : "bg-pine-100 text-pine-500"}`}><Icon name={c.icon} size={14} /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-bold">{c.label}</span>
              </span>
              <span className={`font-mono text-[9px] font-bold uppercase tracking-wider ${i === idx ? "text-pine-400" : "text-pine-400"}`}>{c.hint}</span>
              {i === idx && <span className="kbd !border-pine-700 !bg-pine-800 !text-pine-200">↵</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 border-t border-pine-200 bg-paper/70 px-4 py-2 font-mono text-[9.5px] text-pine-400">
          <span className="flex items-center gap-1"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="flex items-center gap-1"><span className="kbd">↵</span> run</span>
          <span className="ml-auto">FS CareOps command deck</span>
        </div>
      </div>
    </div>
  );
}
