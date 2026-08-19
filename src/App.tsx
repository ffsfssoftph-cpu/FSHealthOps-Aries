import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ACCESS } from "./data";
import type { DB, PageKey, Role, SetupConfig } from "./data";
import { AppCtx, defaultDb } from "./state";
import type { SessionUser } from "./state";
import { Access } from "./screens/Access";
import { SetupWizard } from "./pages/SetupWizard";
import { Shell } from "./components/Shell";
import { ToastHost } from "./components/ui";
import type { ToastMsg } from "./components/ui";

const LS = { license: "fsco_license", setup: "fsco_setup", user: "fsco_user", role: "fsco_role" };

function load<T>(key: string): T | null {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
}
function save(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
}

export default function App() {
  const [license, setLicense] = useState<string | null>(() => load<string>(LS.license));
  const [cfg, setCfg] = useState<SetupConfig | null>(() => load<SetupConfig>(LS.setup));
  const [user, setUser] = useState<SessionUser | null>(() => load<SessionUser>(LS.user));
  const [role, setRoleState] = useState<Role>(() => load<Role>(LS.role) ?? "super");
  const [db, setDb] = useState<DB>(defaultDb);
  const [nav, setNav] = useState<PageKey>("dashboard");
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const idRef = useRef(1);

  useEffect(() => save(LS.license, license), [license]);
  useEffect(() => save(LS.setup, cfg), [cfg]);
  useEffect(() => save(LS.user, user), [user]);
  useEffect(() => save(LS.role, role), [role]);

  const toast = useCallback((msg: string, kind: "ok" | "warn" | "err" | "info" = "ok") => {
    const id = idRef.current++;
    setToasts(t => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const store = useMemo(() => ({
    cfg, license, user, db, setDb, nav,
    setNav: (p: PageKey) => setNav(p),
    role,
    setRole: (r: Role) => setRoleState(r),
    can: (p: PageKey) => ACCESS[p].includes(role),
    toast,
    logout: () => { setUser(null); setNav("dashboard"); },
    resetDemo: () => {
      Object.values(LS).forEach(k => localStorage.removeItem(k));
      window.location.reload();
    },
  }), [cfg, license, user, db, nav, role, toast]);

  /* ---- stage routing ---- */
  let screen: React.ReactNode;
  if (!license || !cfg || !user) {
    if (!license) {
      screen = <Access hasLicense={false} onLicensed={k => { setLicense(k); toast("License activated — machine fingerprint bound", "ok"); }} onAuthed={() => {}} />;
    } else if (!cfg) {
      screen = <SetupWizard onComplete={c => { setCfg(c); toast(`Workspace provisioned for ${c.company}`, "ok"); }} />;
    } else {
      screen = <Access hasLicense onLicensed={setLicense} onAuthed={u => { setUser(u); setRoleState(u.role); toast(`Welcome, ${u.name} — 2FA verified`, "ok"); }} />;
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
