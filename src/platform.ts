/* ============================================================
   FS CareOps — platform layer
   Phase 5  RACI permission matrix + module registry
   Phase 6  Company Setup allow-list (server-side style guards)
   Phase 11 Licensing axes / pricing records (rates blank)
   Phase 3  Media attachment model + storage adapters
   ============================================================ */
import type { Role } from "./data";

/* ---------------- Phase 5 · module registry ---------------- */
export type Level = "R" | "A" | "C" | "I";
export type Matrix = Partial<Record<string, Level>>;
export type Action = "view" | "comment" | "edit" | "approve";

export interface ModuleDef { id: string; label: string; icon: string; page: string; hrGated?: boolean }

/** The RACI matrix is generated from THIS registry — future modules
    appear automatically (Phase 10 consistency rule). */
export const MODULES: ModuleDef[] = [
  { id: "sched",    label: "Scheduling & Booking",      icon: "calendar", page: "schedule" },
  { id: "clients",  label: "Client Management",         icon: "heart",    page: "clients" },
  { id: "care",     label: "Care Teams & Assignment",   icon: "users",    page: "staff" },
  { id: "rates",    label: "Packages & Rate Card",      icon: "tag",      page: "services" },
  { id: "billing",  label: "Billing & Claims",          icon: "invoice",  page: "billing" },
  { id: "portal",   label: "Client Portal & Widget",    icon: "globe",    page: "portal" },
  { id: "reports",  label: "Analytics & BI",            icon: "chart",    page: "reports" },
  { id: "docs",     label: "Compliance & Documents",    icon: "shield",   page: "documents" },
  { id: "integ",    label: "Integration Gateway",       icon: "plug",     page: "integrations" },
  { id: "hr",       label: "HR & Payroll (add-on)",     icon: "clock",    page: "hr", hrGated: true },
  { id: "usersMgmt",label: "User Management",           icon: "users",    page: "users" },
  { id: "setup",    label: "Company Setup",             icon: "cpu",      page: "setup" },
];

export const PAGE_MODULE: Record<string, string | null> = {
  dashboard: null, schedule: "sched", staff: "care", clients: "clients", services: "rates",
  portal: "portal", billing: "billing", reports: "reports", documents: "docs",
  integrations: "integ", hr: "hr", users: "usersMgmt", setup: "setup", system: "setup", pricing: null,
};

export const LEVEL_META: Record<Level, { name: string; desc: string; chip: string; dot: string }> = {
  R: { name: "Responsible", desc: "Can create / edit records in this module", chip: "bg-pulse-100 text-pulse-800 border-pulse-300", dot: "#1d5fc4" },
  A: { name: "Accountable", desc: "Approves / finalizes / posts — maker-checker authority", chip: "bg-vita-100 text-vita-600 border-vita-400", dot: "#c7821c" },
  C: { name: "Consulted",   desc: "View + comment / attach notes, no edit rights", chip: "bg-info-100 text-info-700 border-info-500", dot: "#3f83e0" },
  I: { name: "Informed",    desc: "View-only — read-only dashboards & notifications", chip: "bg-pine-100 text-pine-600 border-pine-300", dot: "#838b96" },
};
export const LEVELS: Level[] = ["R", "A", "C", "I"];

export interface UserRec {
  id: string; name: string; email: string; title: string; role: Role;
  active: boolean; isRoot?: boolean; photo: string | null;
  matrix: Matrix | null; /* null ⇒ Root — sits outside the matrix entirely (Phase 5) */
}

export const seedUsers = (): UserRec[] => [
  { id: "u-root", name: "Fritz Suarez", email: "root@fssoftwares.com", title: "Program Creator & Owner", role: "super", active: true, isRoot: true, photo: null, matrix: null },
  { id: "u-admin", name: "Amelia Ortiz", email: "amelia@brightcare.co", title: "Company Administrator", role: "admin", active: true, photo: null,
    matrix: { sched: "A", clients: "A", care: "A", rates: "A", billing: "A", portal: "A", reports: "A", docs: "A", integ: "A", hr: "A", usersMgmt: "A", setup: "R" } },
  { id: "u-front", name: "Jules Tan", email: "jules@brightcare.co", title: "Front Desk Lead", role: "frontdesk", active: true, photo: null,
    matrix: { sched: "R", clients: "R", care: "C", rates: "C", portal: "R", docs: "C" } },
  { id: "u-care", name: "Mira Solis", email: "mira@brightcare.co", title: "Care Coordinator", role: "caregiver", active: true, photo: null,
    matrix: { sched: "C", clients: "C", care: "R", docs: "C", hr: "R" } },
  { id: "u-bill", name: "Owen Blake", email: "owen@brightcare.co", title: "Billing Officer", role: "billing", active: true, photo: null,
    matrix: { sched: "I", clients: "C", rates: "R", billing: "R", reports: "C", docs: "C" } },
  { id: "u-mgr", name: "Celeste Ayon", email: "celeste@brightcare.co", title: "Branch Manager", role: "manager", active: true, photo: null,
    matrix: { sched: "A", clients: "A", care: "A", rates: "A", billing: "A", portal: "C", reports: "A", docs: "A", integ: "C", usersMgmt: "C", hr: "A" } },
];

export interface RoleTemplate { id: string; name: string; desc: string; matrix: Matrix }
export const seedTemplates = (): RoleTemplate[] => [
  { id: "t-ap", name: "AP / Billing Clerk", desc: "Rates R · Billing R · rest consulted", matrix: { rates: "R", billing: "R", clients: "C", reports: "I", docs: "C" } },
  { id: "t-ctrl", name: "Controller", desc: "Billing & reports accountable, full view", matrix: { sched: "I", clients: "C", rates: "A", billing: "A", reports: "A", docs: "A", integ: "C" } },
  { id: "t-sched", name: "Scheduler", desc: "Scheduling R, portal R, clients R", matrix: { sched: "R", portal: "R", clients: "R", care: "C" } },
  { id: "t-hrgen", name: "HR Generalist", desc: "HR responsible, documents consulted", matrix: { hr: "R", docs: "C", reports: "I" } },
];

export interface AuditEntry { id: string; ts: string; actor: string; target: string; module: string; from: string; to: string }
export const seedAudit = (): AuditEntry[] => [
  { id: "a1", ts: "Aug 12 · 09:14", actor: "Fritz Suarez", target: "Owen Blake", module: "Billing & Claims", from: "C", to: "R" },
  { id: "a2", ts: "Aug 11 · 16:40", actor: "Amelia Ortiz", target: "Jules Tan", module: "Care Teams & Assignment", from: "—", to: "C" },
  { id: "a3", ts: "Aug 11 · 16:38", actor: "Amelia Ortiz", target: "Celeste Ayon", module: "User Management", from: "—", to: "C" },
];

/** Enforcement helper — every guard in the app routes through this
    (simulated API-layer check, Phase 5). Root bypasses by design. */
export function canMod(user: UserRec | null, module: string | null, action: Action, hrOn: boolean): boolean {
  if (!user || !user.active) return false;
  if (user.isRoot || user.matrix === null) return true;
  if (!module) return true;
  const def = MODULES.find(m => m.id === module);
  if (def?.hrGated && !hrOn) return false;
  const lvl = user.matrix[module];
  if (!lvl) return false;
  if (action === "view") return true;
  if (action === "comment") return lvl === "R" || lvl === "A" || lvl === "C";
  if (action === "edit") return lvl === "R";
  if (action === "approve") return lvl === "A";
  return false;
}

/* ---------------- Phase 6 · Company Setup boundary ---------------- */
export interface SetupSection { id: string; label: string; icon: string; blurb: string }
export const SETUP_SECTIONS: SetupSection[] = [
  { id: "users",    label: "Create Users & Roles", icon: "users",    blurb: "Invite users, assign the RACI matrix, deactivate / reactivate." },
  { id: "updates",  label: "Updates",              icon: "download", blurb: "Apply patches — manual packages on LAN, release notes on cloud." },
  { id: "backup",   label: "Backup & Restore",     icon: "shield",   blurb: "Manual backups & history on LAN; managed status on cloud." },
  { id: "hardware", label: "Hardware & Networks",  icon: "server",   blurb: "LAN server, connected devices, printers, diagnostics." },
  { id: "profile",  label: "Company Profile",      icon: "cpu",      blurb: "Legal name, tax ID, fiscal year, currency, branding." },
];
export const SETUP_LOCKED = [
  { id: "license", label: "License Management / Upgrade", note: "Root-only — encoded license axes are re-issued by FS Softwares." },
  { id: "diag",    label: "Deep System Diagnostics",      note: "Root-only — includes impersonation tooling (logged per Phase 0)." },
  { id: "schema",  label: "Schema-Level Configuration",   note: "Root-only — tenant schema & storage engine settings." },
  { id: "period",  label: "Period-Lock Override",         note: "Standard re-open-with-approval flow only. Hard override is Root-only." },
  { id: "grant",   label: "Grant Root-Level Access",      note: "Cannot be delegated. Root sits outside the RACI matrix." },
];
/** Hard allow-list — not a UI hide. The page and every section action
    re-check this guard, so direct calls can't widen the boundary. */
export function setupAllowed(role: Role, section: string): boolean {
  if (role === "super") return true;
  if (role !== "admin") return false;
  return SETUP_SECTIONS.some(s => s.id === section);
}

/* ---------------- Phase 11 · pricing records (rates blank) ---------------- */
export interface PackageRec {
  package_id: string; name: string; axis_type: "department" | "seat" | "corporate";
  grants: string; billing_cycle: string; support_tier: "standard" | "priority" | "enterprise";
  price_amount: number | null; currency: string | null; is_published: boolean;
}
export const seedPricing = (): PackageRec[] => [
  { package_id: "DEP-CORE",   name: "Finance & Operations Pack", axis_type: "department", grants: "Scheduling · Clients · Billing · Compliance (core catalog)", billing_cycle: "annual", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "DEP-HR",     name: "HR Pack",                   axis_type: "department", grants: "Phase 9 HR module only", billing_cycle: "annual", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "DEP-FULL",   name: "Full Operations Pack",      axis_type: "department", grants: "Core catalog + HR pack", billing_cycle: "annual", support_tier: "priority", price_amount: null, currency: null, is_published: false },
  { package_id: "SEAT-FD",    name: "Front Desk / Scheduler seat",  axis_type: "seat", grants: "RACI template · Scheduler", billing_cycle: "monthly", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "SEAT-CC",    name: "Care Coordinator seat",        axis_type: "seat", grants: "RACI template · Care team R", billing_cycle: "monthly", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "SEAT-BO",    name: "Billing Officer seat",         axis_type: "seat", grants: "RACI template · AP Clerk", billing_cycle: "monthly", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "SEAT-CTRL",  name: "Controller / Manager seat",    axis_type: "seat", grants: "RACI template · Controller (A on Billing)", billing_cycle: "monthly", support_tier: "priority", price_amount: null, currency: null, is_published: false },
  { package_id: "CORP-START", name: "Corporate — Starter",       axis_type: "corporate", grants: "Core catalog · 5 seats · 1 company · no HR", billing_cycle: "annual", support_tier: "standard", price_amount: null, currency: null, is_published: false },
  { package_id: "CORP-PRO",   name: "Corporate — Pro",           axis_type: "corporate", grants: "Core + advanced · 25 seats · 3 companies · HR add-on toggle", billing_cycle: "annual", support_tier: "priority", price_amount: null, currency: null, is_published: false },
  { package_id: "CORP-ENT",   name: "Corporate — Enterprise",    axis_type: "corporate", grants: "Everything + HR · white-label · API access · unlimited seats · custom SLA", billing_cycle: "annual", support_tier: "enterprise", price_amount: null, currency: null, is_published: false },
];
export const SLA_META: Record<PackageRec["support_tier"], string> = {
  standard: "Standard — 48 business hrs",
  priority: "Priority — 8 business hrs",
  enterprise: "24/7 — 1 hr critical",
};

const r4 = () => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; return Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join(""); };
/** License keys encode axis / package / seats / companies so activation
    unlocks exactly what was purchased — incl. mid-life upgrades. */
export function genEntitlementKey(tier: string, seats: number, companies: number, hr: boolean): string {
  return `FSCO-${r4()}-${r4()}-${tier.slice(0, 2).toUpperCase()}${String(seats).padStart(2, "0")}-C${companies}${hr ? "-HR01" : "-HR00"}`;
}

/* ---------------- Phase 3 · media attachments ---------------- */
export interface Attachment {
  id: string; entity_type: string; entity_id: string;
  file_url: string | null; mime_type: string; size: number;
  uploaded_by_user_id: string; uploaded_at: string;
  thumb: string | null; converting?: boolean;
}
export const MEDIA_CONTEXTS = ["profile", "employee", "customer", "vendor", "inventory", "asset", "receipt", "brand", "candidate"] as const;
export const MAX_MB_DEFAULT = 5;
export const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Same interface for cloud (SaaS) and local-disk (LAN) builds — the
    domain layer never knows which one it is talking to. */
export interface MediaStore { mode: "cloud" | "local"; label: string; put(key: string, dataUrl: string): string }
export function mediaStoreFor(deploy: string | undefined): MediaStore {
  const cloud = deploy === "saas" || deploy === "private-cloud" || !deploy;
  if (cloud) {
    return {
      mode: "cloud", label: "bucket: fs-careops-media (S3-compatible)",
      put: (key, dataUrl) => {
        try {
          const raw = localStorage.getItem("fsco_media");
          const map: Record<string, string> = raw ? JSON.parse(raw) : {};
          map[key] = dataUrl;
          localStorage.setItem("fsco_media", JSON.stringify(map));
        } catch { /* quota — keep in-memory url */ }
        return dataUrl;
      },
    };
  }
  const mem = new Map<string, string>();
  return { mode: "local", label: "\\\\FS-LAN-SRV\\data\\media\\ (local disk)", put: (k, d) => { mem.set(k, d); return d; } };
}

/* ---------------- Phase 4 · documented design tokens ---------------- */
export const DESIGN_TOKENS = [
  { token: "--color-pine-950", use: "sidebar / dark panels" },
  { token: "--color-pulse-600", use: "single sharp accent — primary actions & alerts only" },
  { token: "--color-vita-500", use: "warnings / accountable (A) authority" },
  { token: "--font-display: Archivo", use: "display type — headings, KPIs" },
  { token: "--font-mono: IBM Plex Mono", use: "ledger numbers, IDs, license keys" },
  { token: ".dark variables", use: "dark mode — OS-preference default, per-user toggle" },
];
export const COMPONENT_LIB = [
  "Button (ghost/outline/primary/danger + state animation)", "Field / Input / Toggle",
  "DataGrid — sticky header, inline filter, column show/hide", "Modal / Drawer",
  "MediaUpload — universal Phase 3 widget (crop/rotate, thumbnails)", "RACI Matrix editor",
  "Skeleton loaders", "Toast host", "KPI CountUp + Spark", "Command palette (⌘K)",
];
