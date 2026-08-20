import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DB, PageKey, Role, SetupConfig } from "./data";
import { AppCtx, defaultDb } from "./state";
import type { BackupRec, SessionUser, Theme } from "./state";
import {
  canMod as guard, genEntitlementKey, PAGE_MODULE, seedAudit, seedPricing,
  seedTemplates, seedUsers, MODULES,
} from "./platform";
import type { Action, AuditEntry, Level, Matrix, PackageRec, RoleTemplate, UserRec } from "./platform";
import { seedHR } from "./hr";
import type { HRData } from "./hr";
import { uid } from "./data";
import { Access } from "./screens/Access";
import { SetupWizard } from "./pages/SetupWizard";
import { Shell } from "./components/Shell";
import { ToastHost } from "./components/ui";
import type { ToastMsg } from "./components/ui";

const LS = {
  license: "fsco_license", setup: "fsco_setup", user: "fsco_user", role: "fsco_role",
  theme: "fsco_theme", hr: "fsco_hr_on",
};

function load<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

const ROLE_TEMPLATE_MATRIX: Record<Role, Matrix> = {
  super: {},
  admin: { sched: "A", clients: "A", care: "A", rates: "A", billing: "A", portal: "A", reports: "A", docs: "A", integ: "A", hr: "A", usersMgmt: "A", setup: "R" },
  frontdesk: { sched: "R", clients: "R", care: "C", rates: "C", portal: "R", docs: "C" },
  caregiver: { sched: "C", clients: "C", care: "R", docs: "C", hr: "R" },
  billing: { sched: "I", clients: "C", rates: "R", billing: "R", reports: "C", docs: "C" },
  manager: { sched: "A", clients: "A", care: "A", rates: "A", billing: "A", portal: "C", reports: "A", docs: "A", integ: "C", usersMgmt: "C", hr: "A" },
};

export default function App() {
  const [license, setLicense] = useState<string | null>(() => load<string>(LS.license));
  const [cfg, setCfg] = useState<SetupConfig | null>(() => load<SetupConfig>(LS.setup));
  const [user, setUser] = useState<SessionUser | null>(() => load<SessionUser>(LS.user));
  const [role, setRoleState] = useState<Role>(() => load<Role>(LS.role) ?? "super");
  const [db, setDb] = useState<DB>(defaultDb);
  const [nav, setNav] = useState<PageKey>("dashboard");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(1);

  /* Phase 4 — theme: OS preference default, per-user persisted toggle */
  const [theme, setThemeState] = useState<Theme>(() =>
    load<Theme>(LS.theme) ?? (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    save(LS.theme, theme);
  }, [theme]);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);

  /* Phase 5 — users / RACI / audit / templates */
  const [users, setUsers] = useState<UserRec[]>(seedUsers);
  const [audit, setAudit] = useState<AuditEntry[]>(seedAudit);
  const [templates, setTemplates] = useState<RoleTemplate[]>(seedTemplates);

  /* Phase 9 — HR add-on, inactive by default, archive on deactivate */
  const [hr, setHr] = useState<HRData>(seedHR);
  const [hrEnabled, setHrEnabled] = useState<boolean>(() => load<boolean>(LS.hr) ?? false);
  useEffect(() => save(LS.hr, hrEnabled), [hrEnabled]);

  /* Phase 11 — pricing (rates blank until FS Softwares publishes) */
  const [pricing, setPricing] = useState<PackageRec[]>(seedPricing);

  /* Phase 6 — backups */
  const [backups, setBackups] = useState<BackupRec[]>([
    { id: "b1", ts: "Aug 17 · 02:00", size: "48.2 MB", kind: "scheduled", by: "system" },
    { id: "b2", ts: "Aug 10 · 02:00", size: "47.9 MB", kind: "scheduled", by: "system" },
  ]);

  useEffect(() => save(LS.license, license), [license]);
  useEffect(() => save(LS.setup, cfg), [cfg]);
  useEffect(() => save(LS.user, user), [user]);
  useEffect(() => save(LS.role, role), [role]);

  const toast = useCallback((msg: string, kind: "ok" | "warn" | "err" | "info" = "ok") => {
    const id = idRef.current++;
    setToasts(t => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const sessionUser = useMemo<UserRec | null>(() => {
    const exact = users.find(u => u.role === role && u.active);
    return exact ?? users.find(u => u.role === role) ?? null;
  }, [users, role]);

  const hrOn = hrEnabled && hr.archivedAt === null;
  const canMod = useCallback((module: string | null, action: Action) => guard(sessionUser, module, action, hrOn), [sessionUser, hrOn]);

  const canPage = useCallback((p: PageKey): boolean => {
    if (p === "pricing") return !!sessionUser?.isRoot;           /* Phase 11 — Root-only console */
    if (p === "dashboard") {
      if (!sessionUser?.active) return false;
      if (sessionUser.isRoot || sessionUser.matrix === null) return true;
      return Object.keys(sessionUser.matrix).length > 0;
    }
    const mod = PAGE_MODULE[p];
    if (mod && MODULES.find(m => m.id === mod)?.hrGated && !hrOn) return false;
    return guard(sessionUser, mod, "view", hrOn);
  }, [sessionUser, hrOn]);

  const setMatrixCell = useCallback((userId: string, moduleId: string, level: Level | null) => {
    const target = users.find(u => u.id === userId);
    const modLabel = MODULES.find(m => m.id === moduleId)?.label ?? moduleId;
    const from = target?.matrix?.[moduleId] ?? null;
    if (!target || target.matrix === null) return;               /* Root sits outside the matrix */
    setUsers(us => us.map(u => u.id === userId
      ? { ...u, matrix: { ...u.matrix, [moduleId]: level ?? undefined } }
      : u));
    setAudit(a => [{
      id: uid(), ts: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      actor: sessionUser?.name ?? "system", target: target.name, module: modLabel,
      from: from ?? "—", to: level ?? "—",
    }, ...a]);
    toast(`Matrix audited — ${target.name} · ${modLabel}: ${from ?? "blank"} → ${level ?? "blank"}`, "info");
  }, [users, sessionUser, toast]);

  const saveTemplate = useCallback((name: string, m: Matrix) => {
    setTemplates(t => [...t, { id: uid(), name, desc: "Custom template", matrix: { ...m } }]);
    toast(`Role template “${name}” saved — reusable at user creation`, "ok");
  }, [toast]);

  const toggleHR = useCallback(() => {
    setHrEnabled(on => {
      const next = !on;
      if (!next) {
        setHr(h => ({ ...h, archivedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }));
        toast("HR deactivated — data archived, never deleted (compliance-safe)", "warn");
      } else {
        setHr(h => ({ ...h, archivedAt: null }));
        toast("HR module activated — license add-on unlocked, matrix row restored", "ok");
      }
      return next;
    });
  }, [toast]);

  const entitlementKey = useMemo(
    () => genEntitlementKey("CORP-PRO", 12, 1, hrOn),
    [hrOn],
  );

  const store = useMemo(() => ({
    cfg, setCfg, license, setLicense, user, db, setDb, nav,
    setNav: (p: PageKey) => setNav(p),
    role,
    setRole: (r: Role) => setRoleState(r),
    can: canPage,
    toast,
    logout: () => { setUser(null); setNav("dashboard"); },
    resetDemo: () => {
      Object.values(LS).forEach(k => localStorage.removeItem(k));
      localStorage.removeItem("fsco_media");
      window.location.reload();
    },
    theme, setTheme,
    users, setUsers, sessionUser, canMod, canPage, setMatrixCell, audit, templates, saveTemplate,
    hr, setHr, hrEnabled: hrOn, toggleHR,
    pricing, setPricing, entitlementKey,
    backups, setBackups,
  }), [cfg, license, user, db, nav, role, toast, theme, setTheme, users, sessionUser, canMod, canPage,
    setMatrixCell, audit, templates, saveTemplate, hr, hrOn, toggleHR, pricing, entitlementKey, backups]);

  /* ---- stage routing ---- */
  let screen: React.ReactNode;
  if (!license || !cfg || !user) {
    if (!license) {
      screen = <Access hasLicense={false} onLicensed={k => { setLicense(k); toast("License activated — machine fingerprint bound", "ok"); }} onAuthed={() => {}} />;
    } else if (!cfg) {
      screen = <SetupWizard onComplete={c => { setCfg(c); toast(`Workspace provisioned for ${c.company}`, "ok"); }} />;
    } else {
      screen = <Access hasLicense onLicensed={setLicense} onAuthed={u => {
        setUser(u); setRoleState(u.role);
        setUsers(us => us.some(x => x.role === u.role) ? us
          : [...us, { id: uid(), name: u.name, email: "—", title: "Operator", role: u.role, active: true, photo: null, matrix: ROLE_TEMPLATE_MATRIX[u.role] }]);
        toast(`Welcome, ${u.name} — 2FA verified`, "ok");
      }} />;
    }
  } else {
    screen = <Shell />;
  }
  return (
    <AppCtx.Provider value={store}>
      {screen}
      <ToastHost toasts={toasts} dismiss={id => setToasts(t => t.filter(x => x.id !== id))} />
    </AppCtx.Provider>
  );
}
