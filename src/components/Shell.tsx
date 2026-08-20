import { useEffect, useMemo, useState } from "react";
import type { PageKey, Role } from "../data";
import { ALL_ROLES, NAV_GROUPS, ROLE_META } from "../data";
import { useApp } from "../state";
import { Drawer, Icon } from "./ui";
import { CoBrandLine, Lockup, useClock } from "./Logo";
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

function NavBtn({ k, label, icon }: { k: PageKey; label: string; icon: string }) {
  const { nav, setNav, canPage } = useApp();
  const ok = canPage(k);
  const active = nav === k;
  return (
    <button
      onClick={() => ok && setNav(k)}
      title={ok ? label : `${label} — no access for your role`}
      className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-left text-[12.5px] font-bold transition-all duration-200
        ${active ? "bg-pulse-600 text-white shadow-lift"
          : ok ? "text-pine-600 hover:translate-x-0.5 hover:bg-pulse-50 hover:text-pulse-700"
          : "cursor-not-allowed text-pine-300"}`}
    >
      <Icon name={icon} size={15} className={active ? "" : ok ? "text-pine-400 transition-colors group-hover:text-pulse-600" : ""} />
      <span className="truncate">{label}</span>
      {!ok && <Icon name="lock" size={11} className="ml-auto shrink-0" />}
    </button>
  );
}

function CollapsedIcon({ k, icon, label }: { k: PageKey; icon: string; label: string }) {
  const { nav, setNav, canPage } = useApp();
  const ok = canPage(k);
  return (
    <button onClick={() => ok && setNav(k)} title={ok ? label : `${label} — no access`}
      className={`grid w-full place-items-center rounded-md py-2 transition-all ${nav === k ? "bg-pulse-600 text-white shadow-lift" : ok ? "text-pine-500 hover:bg-pulse-50 hover:text-pulse-700" : "cursor-not-allowed text-pine-300"}`}>
      <Icon name={icon} size={16} />
    </button>
  );
}

export function Shell() {
  const {
    nav, setNav, db, setDb, canPage, logout, resetDemo, theme, setTheme,
    role, setRole, sessionUser, hrEnabled, toast,
  } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleMenu, setRoleMenu] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [booting, setBooting] = useState(true);
  const clock = useClock();

  /* skeleton page transition — communicates the loading state */
  useEffect(() => {
    setBooting(true);
    const t = setTimeout(() => setBooting(false), 300);
    return () => clearTimeout(t);
  }, [nav]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette(true); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const unread = db.notifs.filter(n => !n.read).length;
  const groups = useMemo(() => NAV_GROUPS
    .map(g => ({
      ...g,
      items: g.items.filter(i => {
        if (i.gate === "hr" && !hrEnabled) return false;
        if (i.gate === "root" && !sessionUser?.isRoot) return false;
        return true;
      }),
    }))
    .filter(g => g.items.length > 0), [hrEnabled, sessionUser]);

  const markAll = () => {
    setDb(d => ({ ...d, notifs: d.notifs.map(n => ({ ...n, read: true })) }));
    toast("All notifications marked read", "ok");
  };

  const switchRole = (r: Role) => {
    setRole(r);
    setRoleMenu(false);
    const persona = { frontdesk: "Jules Tan", caregiver: "Mira Solis", billing: "Owen Blake", manager: "Celeste Ayon", admin: "Amelia Ortiz", super: "Fritz Suarez" }[r];
    toast(`Session assumed: ${persona} — matrix re-checked on every request`, "info");
    setNav(r === "billing" ? "billing" : r === "caregiver" ? "staff" : "dashboard");
  };

  const page =
    nav === "dashboard" ? <Dashboard /> :
    nav === "schedule" ? <Schedule /> :
    nav === "staff" ? <Staff /> :
    nav === "clients" ? <Clients /> :
    nav === "services" ? <Services /> :
    nav === "portal" ? <Portal /> :
    nav === "billing" ? <Billing /> :
    nav === "reports" ? <Reports /> :
    nav === "documents" ? <Documents /> :
    nav === "integrations" ? <Integrations /> :
    nav === "users" ? <UsersPage /> :
    nav === "setup" ? <CompanySetup /> :
    nav === "hr" ? <HRPage /> :
    nav === "pricing" ? <PricingConsole /> :
    <SystemPage />;

  const quickActions = [
    { label: "New booking", icon: "calendar", page: "schedule" as PageKey, hint: "Schedule a home visit or clinic slot" },
    { label: "New invoice", icon: "invoice", page: "billing" as PageKey, hint: "Draft with HMO co-pay engine" },
    { label: "New client", icon: "heart", page: "clients" as PageKey, hint: "Start the intake checklist" },
  ].filter(q => canPage(q.page));

  return (
    <div className="bg-clinical noise-layer min-h-screen">
      {/* floating top bar */}
      <header className="frost-backdrop sticky top-0 z-40 border-b border-pine-200/70 bg-paper/75">
        <div className="flex h-[54px] items-center gap-3 px-4">
          <button onClick={() => setCollapsed(c => !c)} title={collapsed ? "Expand navigation" : "Collapse navigation"}
            className="grid h-8 w-8 place-items-center rounded-md text-pine-500 transition-all hover:bg-white hover:text-pulse-600 hover:shadow-lift active:scale-90">
            <Icon name="cpu" size={15} />
          </button>
          <Lockup />
          <span className="hidden items-center gap-1.5 rounded-full border border-pine-200 bg-white px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-pine-500 lg:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-[#34c06f] dot-live" />
            {db.integrations.filter(i => i.on).length} gateways · sync 30s
          </span>

          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={() => setPalette(true)}
              className="hidden h-8 items-center gap-2 rounded-md border border-pine-200 bg-white px-2.5 text-[11px] font-bold text-pine-500 transition-all hover:border-pulse-400 hover:text-pulse-700 sm:inline-flex">
              <Icon name="search" size={13} /> Quick actions <span className="kbd">⌘K</span>
            </button>
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              className="grid h-8 w-8 place-items-center rounded-md text-pine-500 transition-all hover:bg-white hover:text-pulse-600 hover:shadow-lift active:scale-90">
              <Icon name={theme === "dark" ? "sun" : "moon"} size={15} />
            </button>
            <button onClick={() => setNotifOpen(true)} className="relative grid h-8 w-8 place-items-center rounded-md text-pine-500 transition-all hover:bg-white hover:text-pulse-600 hover:shadow-lift active:scale-90">
              <Icon name="bell" size={15} />
              {unread > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-pulse-600 px-0.5 font-mono text-[8.5px] font-bold text-white tnum">{unread}</span>}
            </button>

            <div className="relative">
              <button onClick={() => setRoleMenu(m => !m)}
                className="flex items-center gap-2 rounded-md border border-pine-200 bg-white py-1 pl-1 pr-2 transition-all hover:border-pulse-400 hover:shadow-lift">
                <span className="grid h-6 w-6 place-items-center rounded font-display text-[10px] font-black text-white" style={{ background: ROLE_META[role].color }}>
                  {ROLE_META[role].short}
                </span>
                <span className="hidden text-left leading-none md:block">
                  <span className="block text-[11px] font-extrabold text-pine-800">{sessionUser?.name.split(" ")[0]}</span>
                  <span className="block text-[8.5px] font-bold uppercase tracking-wider text-pine-400">{ROLE_META[role].label}</span>
                </span>
                <Icon name="chevD" size={12} className="text-pine-400" />
              </button>
              {roleMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setRoleMenu(false)} />
                  <div className="absolute right-0 top-full z-40 mt-1.5 w-72 rounded-lg border border-pine-200 bg-white p-1.5 shadow-pop anim-pop">
                    <p className="px-2.5 pb-1 pt-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-pine-400">Assume role — demo RBAC</p>
                    {ALL_ROLES.map(r => (
                      <button key={r} onClick={() => switchRole(r)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors ${r === role ? "bg-pulse-50" : "hover:bg-paper"}`}>
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded font-display text-[10px] font-black text-white" style={{ background: ROLE_META[r].color }}>{ROLE_META[r].short}</span>
                        <span className="min-w-0">
                          <span className="block text-[12px] font-extrabold text-pine-800">{ROLE_META[r].label}</span>
                          <span className="block truncate text-[10px] text-pine-500">{ROLE_META[r].desc}</span>
                        </span>
                        {r === role && <Icon name="check" size={13} className="ml-auto shrink-0 text-pulse-600" />}
                      </button>
                    ))}
                    <div className="mt-1 flex gap-1.5 border-t border-pine-100 p-1.5">
                      <button onClick={() => { setRoleMenu(false); logout(); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-pine-200 py-1.5 text-[11px] font-bold text-pine-600 transition-colors hover:border-danger-500 hover:text-danger-600">
                        <Icon name="logout" size={12} /> Sign out
                      </button>
                      <button onClick={resetDemo} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-pine-200 py-1.5 text-[11px] font-bold text-pine-600 transition-colors hover:border-vita-500 hover:text-vita-600">
                        <Icon name="refresh" size={12} /> Reset demo
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* light sidebar — icon-driven, collapsible, RACI-gated */}
        <aside className={`sticky top-[54px] z-30 hidden h-[calc(100vh-54px)] shrink-0 flex-col overflow-y-auto border-r border-pine-200/70 bg-card/70 py-3 transition-all duration-300 md:flex ${collapsed ? "w-[60px] px-2" : "w-[220px] px-2.5"}`}>
          {!collapsed && <p className="px-2.5 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-400">Modules · matrix-gated</p>}
          {groups.map(g => (
            <div key={g.group} className="mt-2.5">
              {!collapsed && <p className="px-2.5 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-pine-400/80">{g.group}</p>}
              <div className="space-y-0.5">
                {g.items.map(i => collapsed
                  ? <CollapsedIcon key={i.key} k={i.key} icon={i.icon} label={i.label} />
                  : <NavBtn key={i.key} k={i.key} label={i.label} icon={i.icon} />)}
              </div>
            </div>
          ))}
          {!collapsed && sessionUser?.isRoot && (
            <button onClick={() => setNav("pricing")}
              className={`mt-3 flex items-center gap-2 rounded-md border border-dashed px-2.5 py-2 text-[11px] font-bold transition-all ${nav === "pricing" ? "border-pulse-500 bg-pulse-50 text-pulse-700" : "border-pine-300 text-pine-500 hover:border-pulse-400 hover:text-pulse-700"}`}>
              <Icon name="tag" size={13} /> Pricing Console <span className="ml-auto rounded bg-pine-900 px-1 py-0.5 font-mono text-[8px] font-bold uppercase text-pulse-300">root</span>
            </button>
          )}
          {!collapsed && (
            <div className="mt-auto px-2.5 pt-4">
              <div className="rounded-md border border-pine-200 bg-white p-2.5 shadow-lift">
                <CoBrandLine size="text-[8px]" />
                <p className="mt-1 font-mono text-[8.5px] text-pine-400 tnum">v1.0.0 · {clock.toLocaleTimeString("en-GB")}</p>
              </div>
            </div>
          )}
        </aside>

        {/* main */}
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6">
          {booting ? (
            <div className="space-y-4">
              <div className="skel h-8 w-64" />
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[0, 1, 2, 3].map(i => <div key={i} className="skel h-[110px]" />)}
              </div>
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="skel h-[380px] lg:col-span-2" />
                <div className="skel h-[380px] lg:col-span-3" />
              </div>
            </div>
          ) : (
            <div key={nav} className="anim-fade-up">{page}</div>
          )}
        </main>
      </div>

      {/* circular quick-action button */}
      <div className="no-print fixed bottom-5 left-5 z-[70] flex flex-col items-start gap-2">
        {fabOpen && quickActions.map((q, i) => (
          <button key={q.label} onClick={() => { setNav(q.page); setFabOpen(false); }}
            className="anim-pop group flex items-center gap-2.5 rounded-full border border-pine-200 bg-white py-1.5 pl-1.5 pr-3.5 shadow-pop transition-all hover:-translate-y-0.5"
            style={{ animationDelay: `${i * 50}ms` }}>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-pulse-600 text-white"><Icon name={q.icon} size={13} /></span>
            <span className="text-left leading-tight">
              <span className="block text-[12px] font-extrabold text-pine-800">{q.label}</span>
              <span className="block text-[9.5px] text-pine-400">{q.hint}</span>
            </span>
          </button>
        ))}
        <button onClick={() => setFabOpen(o => !o)}
          className={`grid place-items-center rounded-full shadow-pop transition-all duration-300 active:scale-90 ${fabOpen ? "rotate-45 bg-pine-900 text-white" : "bg-pulse-600 text-white hover:-translate-y-1 hover:bg-pulse-500"}`}
          style={{ width: 52, height: 52 }}
          title="Quick create">
          <Icon name="plus" size={22} sw={2.4} />
        </button>
      </div>

      {/* notifications drawer */}
      <Drawer open={notifOpen} onClose={() => setNotifOpen(false)} title={
        <span className="flex items-center gap-2">Notifications {unread > 0 && <span className="rounded-full bg-pulse-600 px-1.5 py-0.5 font-mono text-[9px] font-bold text-white tnum">{unread} new</span>}</span>
      }>
        <button onClick={markAll} className="mb-3 w-full rounded-md border border-pine-200 py-2 text-[11.5px] font-bold text-pine-600 transition-colors hover:border-pulse-400 hover:text-pulse-700">Mark all read</button>
        <div className="space-y-2">
          {db.notifs.map(n => (
            <div key={n.id} className={`flex items-start gap-2.5 rounded-md border p-3 transition-colors ${n.read ? "border-pine-100 opacity-60" : "border-pine-200 bg-white shadow-lift"}`}>
              <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${n.tone === "err" ? "bg-danger-100 text-danger-600" : n.tone === "warn" ? "bg-vita-100 text-vita-600" : n.tone === "ok" ? "bg-[#e7f3eb] text-[#217a45]" : "bg-info-100 text-info-600"}`}>
                <Icon name={n.icon} size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-bold leading-snug text-pine-800">{n.text}</p>
                <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-pine-400">{n.meta}</p>
              </div>
            </div>
          ))}
        </div>
      </Drawer>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
      <SupportWidget />
    </div>
  );
}
