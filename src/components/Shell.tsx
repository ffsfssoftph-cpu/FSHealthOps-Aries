import { useEffect, useRef, useState } from "react";
import { ALL_ROLES, NAV_GROUPS, ROLE_META } from "../data";
import type { PageKey, Role } from "../data";
import { useApp } from "../state";
import { Icon } from "./ui";
import { Emblem, Lockup, CoBrandLine, CompanyMark } from "./Logo";
import { Dashboard } from "../pages/Dashboard";
import { Schedule } from "../pages/Schedule";
import { Staff } from "../pages/Staff";
import { Clients } from "../pages/Clients";
import { Services } from "../pages/Services";
import { Portal } from "../pages/Portal";
import { Billing } from "../pages/Billing";
import { Reports } from "../pages/Reports";
import { Documents } from "../pages/Documents";
import { Integrations } from "../pages/Integrations";
import { SystemPage } from "../pages/System";
import { UsersPage } from "../pages/Users";
import { CompanySetup } from "../pages/CompanySetup";
import { HRPage } from "../pages/HR";
import { PricingConsole } from "../pages/Pricing";
import { CommandPalette } from "./CommandPalette";
import { SupportWidget } from "./Support";

const TITLES: Record<PageKey, string> = {
  dashboard: "Ops Console", schedule: "Scheduling Engine", staff: "Care Teams & Roster", clients: "Client Management",
  services: "Packages & Rate Card", portal: "Client Self-Service Portal", billing: "Billing & Claims", reports: "Analytics & BI",
  documents: "Compliance & Documents", integrations: "Integration Gateway", system: "System & License",
  users: "Users & Roles", setup: "Company Setup", hr: "HR & Payroll", pricing: "Pricing Console",
};

function PageSkeleton() {
  return (
    <div className="space-y-4 anim-fade-in" aria-busy>
      <div className="flex items-center justify-between">
        <div className="space-y-2"><div className="skel h-3 w-40" /><div className="skel h-6 w-64" /></div>
        <div className="skel h-8 w-32" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => <div key={i} className="skel h-24" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="skel h-64" /><div className="skel h-64" />
      </div>
      <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-pine-400">
        <span className="h-1.5 w-1.5 rounded-full bg-pulse-500 dot-live" /> hydrating module…
      </p>
    </div>
  );
}

export function Shell() {
  const app = useApp();
  const { nav, setNav, canPage, cfg, role, setRole, user, db, setDb, toast, logout, theme, setTheme, hrEnabled, sessionUser } = app;
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [palette, setPalette] = useState(false);
  const [booting, setBooting] = useState(false);
  const [syncAge, setSyncAge] = useState(8);
  const bootRef = useRef<number | null>(null);

  /* Phase 4 — ⌘K / Ctrl+K anywhere */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(p => !p); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* real-time-feeling refresh indicator */
  useEffect(() => {
    const t = setInterval(() => setSyncAge(s => (s >= 59 ? 0 : s + 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const go = (p: PageKey) => {
    if (p === nav) return;
    setBooting(true);
    if (bootRef.current) window.clearTimeout(bootRef.current);
    bootRef.current = window.setTimeout(() => { setNav(p); setBooting(false); }, 420);
  };

  const unread = db.notifs.filter(n => !n.read).length;
  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(it => {
      if (it.gate === "hr" && !hrEnabled) return false;
      if (it.gate === "root" && !sessionUser?.isRoot) return false;
      return canPage(it.key);
    }),
  })).filter(g => g.items.length > 0);

  const switchRole = (r: Role) => {
    setRole(r);
    setRoleMenu(false);
    const persona = { frontdesk: "Jules Tan", caregiver: "Mira Solis", billing: "Owen Blake", manager: "Celeste Ayon", admin: "Amelia Ortiz", super: "Fritz Suarez" }[r];
    toast(`Session assumed: ${persona} — matrix re-checked on every request`, "info");
    /* land on a page the new persona's matrix always allows */
    const landing: PageKey = r === "billing" ? "billing" : r === "caregiver" ? "staff" : "dashboard";
    go(landing);
  };

  const page = () => {
    switch (nav) {
      case "dashboard": return <Dashboard />;
      case "schedule": return <Schedule />;
      case "staff": return <Staff />;
      case "clients": return <Clients />;
      case "services": return <Services />;
      case "portal": return <Portal />;
      case "billing": return <Billing />;
      case "reports": return <Reports />;
      case "documents": return <Documents />;
      case "integrations": return <Integrations />;
      case "system": return <SystemPage />;
      case "users": return <UsersPage />;
      case "setup": return <CompanySetup />;
      case "hr": return <HRPage />;
      case "pricing": return <PricingConsole />;
    }
  };

  return (
    <div className="bg-clinical noise-layer min-h-screen">
      {/* ---------- sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[232px] flex-col border-r border-pine-800 bg-pine-950">
        <div className="border-b border-pine-800 px-4 py-3.5">
          <Lockup variant="tiny" light />
          {cfg && (
            <p className="mt-2 flex items-center gap-1.5 rounded bg-pine-900 px-2 py-1.5">
              <CompanyMark src={cfg.companyLogo} name={cfg.company} size={16} />
              <span className="truncate text-[10.5px] font-bold text-pine-300">{cfg.company}</span>
            </p>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          {visibleGroups.map(g => (
            <div key={g.group} className="mb-3.5">
              <p className="px-2 pb-1 font-mono text-[8.5px] font-bold uppercase tracking-[0.22em] text-pine-500">{g.group}</p>
              {g.items.map(it => {
                const active = nav === it.key;
                return (
                  <button key={it.key} onClick={() => go(it.key)}
                    className={`group mb-0.5 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-bold transition-all duration-150
                      ${active ? "bg-pulse-600 text-white shadow-lift" : "text-pine-300 hover:bg-pine-900 hover:text-pine-100 hover:translate-x-0.5"}`}>
                    <Icon name={it.icon} size={15} className={active ? "text-white" : "text-pine-500 group-hover:text-pulse-300"} />
                    {it.label}
                    {it.key === "pricing" && <span className="ml-auto rounded bg-vita-500/20 px-1 font-mono text-[8px] font-bold text-vita-400">ROOT</span>}
                    {it.key === "hr" && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-pulse-400 dot-live" />}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-pine-800 px-4 py-3">
          <CoBrandLine light size="text-[7.5px]" />
          <p className="mt-1 font-mono text-[8.5px] text-pine-600">v1.0.0 · {cfg?.remoteAccess ? "Remote-Access Edition" : cfg?.pattern === "A" ? "Pattern A build" : "Pattern B build"}</p>
        </div>
      </aside>

      {/* ---------- topbar ---------- */}
      <header className="fixed left-[232px] right-0 top-0 z-30 flex h-[54px] items-center gap-3 border-b border-pine-200 bg-card/90 px-5 backdrop-blur">
        <h1 className="font-display text-[16px] font-extrabold tracking-tight text-pine-900">{TITLES[nav]}</h1>
        <button onClick={() => { setSyncAge(0); toast("Workspace refreshed — live data reconciled", "info"); }}
          className="hidden items-center gap-1.5 rounded-full border border-pine-200 bg-paper px-2.5 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-pine-500 transition-all hover:border-pulse-400 hover:text-pulse-700 sm:flex"
          title="Click to force refresh">
          <span className="h-1.5 w-1.5 rounded-full bg-pulse-500 dot-live" /> live · {syncAge}s
        </button>
        <button onClick={() => setPalette(true)}
          className="ml-auto hidden items-center gap-2 rounded-md border border-pine-200 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-pine-400 transition-all hover:border-pine-400 hover:text-pine-600 md:flex">
          <Icon name="search" size={13} /> Quick nav / actions <span className="kbd">⌘</span><span className="kbd">K</span>
        </button>
        <button onClick={() => { setTheme(theme === "dark" ? "light" : "dark"); toast(`${theme === "dark" ? "Light" : "Dark"} mode — saved to your profile`, "info"); }}
          className="grid h-8 w-8 place-items-center rounded-md border border-pine-200 bg-white text-pine-500 transition-all hover:border-pine-400 hover:text-pine-800 active:scale-90"
          title="Toggle dark / light (OS preference respected by default)">
          <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
        </button>
        <button onClick={() => setNotifOpen(o => !o)} className="relative grid h-8 w-8 place-items-center rounded-md border border-pine-200 bg-white text-pine-500 transition-all hover:border-pine-400 hover:text-pine-800 active:scale-90">
          <Icon name="bell" size={15} />
          {unread > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger-500 px-0.5 font-mono text-[8.5px] font-bold text-white">{unread}</span>}
        </button>
        <div className="relative">
          <button onClick={() => setRoleMenu(m => !m)}
            className="flex items-center gap-2 rounded-md border border-pine-200 bg-white py-1 pl-1 pr-2.5 transition-all hover:border-pine-400">
            <span className="grid h-7 w-7 place-items-center rounded font-display text-[11px] font-extrabold text-white" style={{ background: ROLE_META[role].color }}>
              {ROLE_META[role].short}
            </span>
            <span className="text-left leading-tight">
              <span className="block max-w-[110px] truncate text-[11.5px] font-extrabold text-pine-900">{user?.name}</span>
              <span className="block text-[8.5px] font-bold uppercase tracking-wider text-pine-400">{sessionUser?.isRoot ? "ROOT · full authority" : ROLE_META[role].label}</span>
            </span>
            <Icon name="chevD" size={12} className="text-pine-400" />
          </button>
          {roleMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-lg border border-pine-200 bg-card p-1.5 shadow-pop anim-pop">
                <p className="px-2.5 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-400">Assume session (demo RBAC)</p>
                {ALL_ROLES.map(r => (
                  <button key={r} onClick={() => switchRole(r)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${r === role ? "bg-pulse-50" : "hover:bg-paper"}`}>
                    <span className="grid h-6 w-6 place-items-center rounded font-mono text-[9px] font-extrabold text-white" style={{ background: ROLE_META[r].color }}>{ROLE_META[r].short}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-extrabold text-pine-900">{ROLE_META[r].label}</span>
                      <span className="block truncate text-[9.5px] text-pine-400">{ROLE_META[r].desc}</span>
                    </span>
                    {r === role && <Icon name="check" size={13} className="text-pulse-600" sw={2.4} />}
                  </button>
                ))}
                <div className="mt-1 border-t border-pine-200 pt-1">
                  <button onClick={logout} className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-bold text-danger-600 transition-colors hover:bg-danger-100">
                    <Icon name="logout" size={14} /> Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* ---------- content ---------- */}
      <main className="ml-[232px] px-6 pb-16 pt-[74px]">
        {booting ? <PageSkeleton /> : <div key={nav} className="anim-fade-up">{page()}</div>}
      </main>

      {/* ---------- notifications drawer ---------- */}
      {notifOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-pine-950/30 anim-fade-in" onClick={() => setNotifOpen(false)} />
          <div className="fixed right-0 top-0 z-50 h-full w-[340px] border-l border-pine-200 bg-card shadow-pop anim-slide-right">
            <div className="flex items-center justify-between border-b border-pine-200 px-4 py-3">
              <h2 className="font-display text-[15px] font-extrabold text-pine-900">Notifications</h2>
              <div className="flex gap-2">
                <button onClick={() => setDb(d => ({ ...d, notifs: d.notifs.map(n => ({ ...n, read: true })) }))}
                  className="font-mono text-[10px] font-bold uppercase tracking-wider text-pulse-700 hover:underline">mark all read</button>
                <button onClick={() => setNotifOpen(false)} className="text-pine-400 hover:text-pine-700"><Icon name="x" size={16} /></button>
              </div>
            </div>
            <div className="divide-y divide-pine-100 overflow-y-auto" style={{ maxHeight: "calc(100vh - 52px)" }}>
              {db.notifs.map(n => (
                <div key={n.id} className={`flex gap-3 px-4 py-3 transition-colors ${n.read ? "opacity-60" : ""}`}>
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded ${n.tone === "err" ? "bg-danger-100 text-danger-600" : n.tone === "warn" ? "bg-vita-100 text-vita-600" : n.tone === "ok" ? "bg-pulse-100 text-pulse-700" : "bg-info-100 text-info-600"}`}>
                    <Icon name={n.icon} size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold leading-snug text-pine-900">{n.text}</p>
                    <p className="mt-0.5 font-mono text-[9.5px] uppercase tracking-wider text-pine-400">{n.meta}</p>
                  </div>
                  {!n.read && <span className="ml-auto mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-pulse-500 dot-live" />}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <SupportWidget />
      <span className="hidden"><Emblem size={1} /></span>
    </div>
  );
}
