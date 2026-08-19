import { createContext, useContext } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { DB, PageKey, Role, SetupConfig } from "./data";
import { ACCESS, seedChecklist, seedClients, seedDocs, seedInquiries, seedIntegrations, seedInvoices, seedNotifs, seedPackages, seedProviders, seedServices, seedSync, seedVisits } from "./data";

export interface SessionUser { name: string; role: Role; initials: string }

export interface Store {
  cfg: SetupConfig | null;
  license: string | null;
  user: SessionUser | null;
  db: DB;
  setDb: Dispatch<SetStateAction<DB>>;
  nav: PageKey;
  setNav: (p: PageKey) => void;
  role: Role;
  setRole: (r: Role) => void;
  can: (p: PageKey) => boolean;
  toast: (msg: string, kind?: "ok" | "warn" | "err" | "info") => void;
  logout: () => void;
  resetDemo: () => void;
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
  };
}
