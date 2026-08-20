import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DB, PageKey, Role, SetupConfig } from "./data";
import {
  seedChecklist, seedClients, seedDocs, seedInquiries, seedIntegrations,
  seedInvoices, seedNotifs, seedPackages, seedProviders, seedServices, seedSync, seedVisits,
} from "./data";
import type { Action, AuditEntry, Level, Matrix, PackageRec, RoleTemplate, UserRec } from "./platform";
import type { HRData } from "./hr";

/* ============================================================
   FS CareOps — global store contract (Phases 3–12 surface here)
   ============================================================ */

export interface SessionUser { name: string; role: Role; initials: string }
export interface BackupRec { id: string; ts: string; size: string; kind: "manual" | "scheduled"; by: string }
export type Theme = "light" | "dark";

export interface Store {
  cfg: SetupConfig | null;
  setCfg: Dispatch<SetStateAction<SetupConfig | null>>;
  license: string | null;
  setLicense: (k: string | null) => void;
  user: SessionUser | null;
  db: DB;
  setDb: Dispatch<SetStateAction<DB>>;
  nav: PageKey;
  setNav: (p: PageKey) => void;
  role: Role;
  setRole: (r: Role) => void;
  /** legacy page gate — matrix-driven now */
  can: (p: PageKey) => boolean;
  toast: (msg: string, kind?: "ok" | "warn" | "err" | "info") => void;
  logout: () => void;
  resetDemo: () => void;

  /* Phase 4 — theme */
  theme: Theme;
  setTheme: (t: Theme) => void;

  /* Phase 5 — users, RACI matrix, templates, audit */
  users: UserRec[];
  setUsers: Dispatch<SetStateAction<UserRec[]>>;
  sessionUser: UserRec | null;
  canMod: (module: string | null, action: Action) => boolean;
  canPage: (p: PageKey) => boolean;
  setMatrixCell: (userId: string, moduleId: string, level: Level | null) => void;
  audit: AuditEntry[];
  templates: RoleTemplate[];
  saveTemplate: (name: string, m: Matrix) => void;

  /* Phase 9 — HR add-on (license-gated, archive-on-deactivate) */
  hr: HRData;
  setHr: Dispatch<SetStateAction<HRData>>;
  hrEnabled: boolean;
  toggleHR: () => void;

  /* Phase 11 — pricing records & entitlement */
  pricing: PackageRec[];
  setPricing: Dispatch<SetStateAction<PackageRec[]>>;
  entitlementKey: string;

  /* Phase 6 — backups */
  backups: BackupRec[];
  setBackups: Dispatch<SetStateAction<BackupRec[]>>;
}

export type { SetupConfig } from "./data";

export const AppCtx = createContext<Store | null>(null);

export function useApp(): Store {
  const s = useContext(AppCtx);
  if (!s) throw new Error("AppCtx missing");
  return s;
}

export function defaultDb(): DB {
  return {
    clients: seedClients(),
    providers: seedProviders(),
    visits: seedVisits(),
    services: seedServices(),
    packages: seedPackages(),
    invoices: seedInvoices(),
    docs: seedDocs(),
    checklist: seedChecklist(),
    integrations: seedIntegrations(),
    sync: seedSync(),
    inquiries: seedInquiries(),
    notifs: seedNotifs(),
    attachments: [],
  };
}
