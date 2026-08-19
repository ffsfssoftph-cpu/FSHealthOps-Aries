import { useState } from "react";
import { ACCESS, ALL_ROLES, NAV_GROUPS, ROLE_META } from "../data";
import type { Role } from "../data";
import { useApp } from "../state";
import { CompanyMark, Lockup, useClock } from "./Logo";
import { Btn, Chip, Drawer, Icon } from "./ui";
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

const PAGES: Record<string, () => React.ReactElement> = {
  dashboard: Dashboard, schedule: Schedule, staff: Staff, clients: Clients, services: Services,
  portal: Portal, billing: Billing, reports: Reports, documents: Documents, integrations: Integrations, system: SystemPage,
};

export function Shell() {
  const { nav, setNav, role, setRole, can, user, db, setDb, cfg, logout, toast } = useApp();
  const [notifOpen, setNotifOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const now = useClock(1000);
  const unread = db.notifs.filter(n => !n.read).length;

  const Page = PAGES[nav] ?? Dashboard;
  const meta = ROLE_META[role];

  const markAllRead = () => {
    setDb(d => ({ ...d, notifs: d.notifs.map(n => ({ ...n, read: true })) }));
    toast("All notifications marked read", "info");
  };

  const switchRole = (r: Role) => {
    setRole(r);
    toast(`Now acting as ${ROLE_META[r].label} — nav re-scoped by RBAC`, "info");
    // if current page is not permitted for the new role, jump to dashboard
    if (!ACCESS[nav].includes(r)) setNav("dashboard");
  };

  return (
    <div className="flex min-h-screen bg-clinical noise-layer">
      {/* ============ sidebar ============ */}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-pine-950 text-pine-100 shadow-pop transition-all duration-300 ${collapsed ? "w-[64px]" : "w-[228px]"}`}>
        {/* header lockup — Logo Standard §2 */}
        <div className="flex h-[58px] items-center gap-2 border-b border-pine-800 px-3.5">
          <CompanyMark src={cfg?.companyLogo} name={cfg?.company ?? ""} size={26} />
          {!collapsed && (
            <span className="min-w-0 flex-1">
              <span className="block truncate font-display text-[13px] font-extrabold leading-tight text-pine-50">{cfg?.company}</span>
              <span className="block font-mono text-[8px] uppercase tracking-[0.16em] text-pine-500">FS CareOps workspace</span>
            </span>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-pine-400 transition-colors hover:bg-pine-800 hover:text-pine-100">
            <Icon name={collapsed ? "chevR" : "chevR"} size={14} className={collapsed ? "" : "rotate-180"} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3">
          {NAV_GROUPS.map(g => {
            const items = g.items.filter(i => can(i.key));
            if (items.length === 0) return null;
            return (
              <div key={g.group} className="mb-3">
                {!collapsed && <p className="mb-1 px-4 font-mono text-[8.5px] font-bold uppercase tracking-[0.2em] text-pine-600">{g.group}</p>}
                {items.map(it => {
                  const active = nav === it.key;
                  return (
                    <button key={it.key} onClick={() => setNav(it.key)} title={it.label}
                      className={`group relative mx-2 mb-0.5 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[12.5px] font-bold transition-all duration-200 ${active ? "bg-pulse-600 text-white shadow-lift" : "text-pine-300 hover:bg-pine-800 hover:text-pine-50"} ${collapsed ? "justify-center" : ""}`}>
                      {active && <span className="absolute -left-2 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-pulse-400" />}
                      <Icon name={it.icon} size={16} className={active ? "" : "text-pine-500 group-hover:text-pulse-300"} />
                      {!collapsed && it.label}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-pine-800 p-3">
          {!collapsed && (
            <div className="mb-2 rounded-md bg-pine-900 px-2.5 py-2">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-pine-500">Edition</p>
              <p className="text-[11px] font-bold text-pine-200">{cfg?.edition} · v1.0.0</p>
              {cfg?.remoteAccess && <p className="mt-0.5 flex items-center gap-1 text-[9.5px] font-bold text-pulse-400"><span className="h-1.5 w-1.5 rounded-full bg-pulse-400 dot-live" />RA tunnel active</p>}
            </div>
          )}
          <button onClick={logout} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-bold text-pine-400 transition-colors hover:bg-pine-800 hover:text-danger-500 ${collapsed ? "justify-center" : ""}`}>
            <Icon name="logout" size={15} />{!collapsed && "Sign out"}
          </button>
        </div>
      </aside>

      {/* ============ main ============ */}
      <div className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${collapsed ? "ml-[64px]" : "ml-[228px]"}`}>
        {/* app header — Logo Standard §2 */}
        <header className="sticky top-0 z-30 flex h-[58px] items-center gap-3 border-b border-pine-200 bg-white/90 px-5 backdrop-blur">
          <Lockup variant="tiny" />
          <span className="hidden h-5 w-px bg-pine-200 sm:block" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.16em] text-pine-400 sm:block">
            {NAV_GROUPS.flatMap(g => g.items).find(i => i.key === nav)?.label}
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            {cfg?.remoteAccess && <Chip tone="green" pulse>RA</Chip>}
            <span className="hidden font-mono text-[11px] text-pine-500 tnum lg:block">
              {now.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {now.toLocaleTimeString("en-GB")}
            </span>

            {/* role switcher */}
            <div className="relative">
              <select
                value={role}
                onChange={e => switchRole(e.target.value as Role)}
                className="cursor-pointer appearance-none rounded-md border border-pine-200 bg-paper py-1.5 pl-8 pr-7 text-[11.5px] font-bold text-pine-800 outline-none transition-all hover:border-pine-400 focus:border-pulse-500"
                title="Demo RBAC — switch acting role"
              >
                {ALL_ROLES.map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
              </select>
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-[9px] font-bold" style={{ color: meta.color }}>{meta.short}</span>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-pine-400"><Icon name="chevD" size={12} /></span>
            </div>

            <span className="hidden items-center gap-2 rounded-md border border-pine-200 bg-paper py-1 pl-1.5 pr-2.5 sm:flex">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold text-white" style={{ background: meta.color }}>{user?.initials}</span>
              <span className="text-[11.5px] font-bold text-pine-800">{user?.name}</span>
            </span>

            <button onClick={() => setNotifOpen(true)} className="relative rounded-md border border-pine-200 bg-white p-2 text-pine-600 transition-all hover:border-pulse-400 hover:text-pulse-700">
              <Icon name="bell" size={16} />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-danger-500 font-mono text-[8.5px] font-bold text-white">{unread}</span>}
            </button>
          </div>
        </header>

        <main className="flex-1 px-5 py-5">
          <div key={nav} className="anim-fade-in"><Page /></div>
        </main>

        {/* printed-output footer credit — Logo Standard §5 (on-screen echo) */}
        <footer className="border-t border-pine-200 bg-white/70 px-5 py-2.5 text-center">
          <p className="font-mono text-[9px] tracking-wide text-pine-400">
            FS CareOps v1.0.0 — © {new Date().getFullYear()} FS Softwares in collaboration with TophComm Systems · {cfg?.company} workspace · Program Creator & Owner: Fritz Suarez, CPM®, CLMP®, CLSSMBB®, CLSCM®, CISSP®, PMP®
          </p>
        </footer>
      </div>

      {/* notification drawer */}
      <Drawer open={notifOpen} onClose={() => setNotifOpen(false)} title={
        <span className="flex items-center gap-2">Notifications {unread > 0 && <Chip tone="red">{unread} new</Chip>}</span>
      }>
        <div className="mb-3 flex justify-end">
          <Btn size="sm" kind="outline" onClick={markAllRead}><Icon name="check" size={13} /> Mark all read</Btn>
        </div>
        <div className="space-y-2">
          {db.notifs.map(n => (
            <button key={n.id} onClick={() => setDb(d => ({ ...d, notifs: d.notifs.map(x => x.id === n.id ? { ...x, read: true } : x) }))}
              className={`flex w-full items-start gap-2.5 rounded-md border p-3 text-left transition-all duration-200 hover:-translate-y-px hover:shadow-lift ${n.read ? "border-pine-100 bg-white opacity-70" : "border-pine-200 bg-white shadow-lift"}`}>
              <span className={`mt-0.5 ${n.tone === "err" ? "text-danger-500" : n.tone === "warn" ? "text-vita-500" : n.tone === "ok" ? "text-pulse-600" : "text-info-500"}`}><Icon name={n.icon} size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-bold leading-snug text-pine-900">{n.text}</span>
                <span className="mt-0.5 block text-[10.5px] text-pine-500">{n.meta}</span>
              </span>
              {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pulse-500 dot-live" />}
            </button>
          ))}
        </div>
      </Drawer>
    </div>
  );
}
