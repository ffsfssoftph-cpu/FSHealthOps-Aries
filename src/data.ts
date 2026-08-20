/* ============================================================
   FS CareOps — data layer, types & domain seeds
   © FS Softwares in collaboration with TophComm Systems
   ============================================================ */

import type { Attachment } from "./platform";

export type Role = "super" | "admin" | "frontdesk" | "caregiver" | "billing" | "manager";
export type PageKey =
  | "dashboard" | "schedule" | "staff" | "clients" | "services"
  | "portal" | "billing" | "reports" | "documents" | "integrations" | "system"
  | "users" | "setup" | "hr" | "pricing";

export interface ClientRec {
  id: string; name: string; dob: string; plan: string; hmo: string | null;
  copayPct: number; address: string; zone: string; status: "active" | "onboarding" | "paused";
  risk: "low" | "medium" | "high"; phone: string; physician: string;
  lastVisit: string; nextVisit: string; team: string; svc: string;
}
export interface Provider {
  id: string; name: string; title: string; creds: string; color: string;
  team: string; capacity: number; status: "on-duty" | "off-duty" | "on-leave";
  certs: { name: string; exp: string }[]; visitsWeek: number;
}
export interface Visit {
  id: string; clientId: string; providerId: string; date: string; start: string; end: string;
  kind: "home-visit" | "clinic" | "telehealth"; status: "scheduled" | "en-route" | "in-progress" | "completed" | "missed";
  svc: string;
}
export interface ServiceItem {
  id: string; code: string; name: string; category: string; rate: number;
  unit: string; hmoCovered: boolean; active: boolean;
}
export interface ServicePackage { id: string; name: string; items: string[]; price: number; tag?: string }
export interface InvoiceItem { desc: string; qty: number; rate: number }
export interface Invoice {
  id: string; number: string; clientId: string; date: string; due: string;
  items: InvoiceItem[]; hmo: string | null; coveragePct: number;
  status: "draft" | "pending-approval" | "sent" | "paid" | "overdue" | "claim";
}
export interface DocRec {
  id: string; name: string; kind: string; holder: string; updated: string;
  expiry: string; status: "valid" | "expiring" | "expired" | "missing";
}
export interface ChecklistItem { id: string; label: string; required: boolean }
export interface IntegrationRec {
  id: string; name: string; volume: string; desc: string; on: boolean;
  lastSync: string; mode: string;
}
export interface SyncLine { ts: string; system: string; event: string; level: "ok" | "info" | "warn" }
export interface Inquiry { id: string; name: string; contact: string; service: string; when: string; status: "new" | "contacted" | "booked"; note: string }
export interface Notif { id: string; icon: string; text: string; meta: string; read: boolean; tone: "ok" | "warn" | "err" | "info" }

export interface BookingRules {
  leadTimeHrs: number; cancelWindowHrs: number; visitDurationMin: number;
  overbookAllowed: boolean; weekendVisits: boolean; hmoPreauth: boolean; doubleConfirm: boolean;
}
export interface SetupConfig {
  company: string; owner: string; accountManager: string; department: string;
  systemLogo: string | null; companyLogo: string | null;
  pattern: "A" | "B"; deploy: string; remoteAccess: boolean; edition: string;
  bookingRules: BookingRules; checklist: ChecklistItem[]; provisionedAt: string;
}
export interface DB {
  clients: ClientRec[]; providers: Provider[]; visits: Visit[]; services: ServiceItem[];
  packages: ServicePackage[]; invoices: Invoice[]; docs: DocRec[]; checklist: ChecklistItem[];
  integrations: IntegrationRec[]; sync: SyncLine[]; inquiries: Inquiry[]; notifs: Notif[];
  attachments: Attachment[];
}

/* ---------------- helpers ---------------- */
export const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const dayOffset = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return toISO(d); };
export const fmtMoney = (n: number) =>
  "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDate = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
export const fmtShort = (iso: string) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
export const uid = () => Math.random().toString(36).slice(2, 9);
export function weekDays() {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const mon = new Date(now); mon.setDate(now.getDate() - dow);
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return labels.map((label, i) => {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    return { iso: toISO(d), label, isToday: toISO(d) === toISO(now), dayNum: d.getDate() };
  });
}
const r4 = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 4 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};
export const genLicense = (edition: string, seats: number) =>
  `FSCO-${r4()}-${r4()}-${r4()}-${edition.slice(0, 2).toUpperCase()}${String(seats).padStart(2, "0")}`;
export const machineFingerprint = () =>
  "MC-" + Array.from({ length: 3 }, () => r4()).join("-").toLowerCase();

/* ---------------- RBAC ---------------- */
export const ROLE_META: Record<Role, { label: string; short: string; desc: string; color: string }> = {
  super:     { label: "Super User", short: "SU", desc: "Full platform authority — licensing, deployment, all modules", color: "#12171e" },
  admin:     { label: "Administrator", short: "AD", desc: "Organization-wide administration and configuration", color: "#46505c" },
  frontdesk: { label: "Front Desk / Scheduler", short: "FD", desc: "Intake, booking engine, client self-service portal", color: "#2576eb" },
  caregiver: { label: "Caregiver / Care Coordinator", short: "CC", desc: "Care-team roster, visit assignment, delivery workflow", color: "#12a5a0" },
  billing:   { label: "Billing Officer", short: "BO", desc: "Invoicing, HMO co-pay handling, claims submission", color: "#c7821c" },
  manager:   { label: "Clinic / Branch Manager", short: "BM", desc: "Branch performance, reporting, resource management", color: "#3f83e0" },
};
export const ALL_ROLES = Object.keys(ROLE_META) as Role[];
export const ACCESS: Record<PageKey, Role[]> = {
  dashboard:    ALL_ROLES,
  schedule:     ALL_ROLES,
  staff:        ["super", "admin", "caregiver", "manager", "frontdesk"],
  clients:      ALL_ROLES,
  services:     ["super", "admin", "manager", "billing", "frontdesk"],
  portal:       ["super", "admin", "frontdesk", "manager"],
  billing:      ["super", "admin", "billing", "manager"],
  reports:      ["super", "admin", "manager", "billing"],
  documents:    ALL_ROLES,
  integrations: ["super", "admin", "manager"],
  system:       ["super", "admin"],
  users:        ["super", "admin"],
  setup:        ["super", "admin"],
  hr:           ["super", "admin", "caregiver", "manager"],
  pricing:      ["super"],
};
export const NAV_GROUPS: { group: string; items: { key: PageKey; label: string; icon: string; gate?: "hr" | "root" }[] }[] = [
  { group: "Operations", items: [
    { key: "dashboard", label: "Ops Console", icon: "pulse" },
    { key: "schedule", label: "Scheduling", icon: "calendar" },
    { key: "staff", label: "Care Teams", icon: "users" },
    { key: "hr", label: "HR & Payroll", icon: "clock", gate: "hr" },
  ]},
  { group: "Growth", items: [
    { key: "clients", label: "Clients", icon: "heart" },
    { key: "services", label: "Packages & Rates", icon: "tag" },
    { key: "portal", label: "Client Portal", icon: "globe" },
  ]},
  { group: "Revenue", items: [
    { key: "billing", label: "Billing & Claims", icon: "invoice" },
    { key: "reports", label: "Analytics", icon: "chart" },
  ]},
  { group: "Governance", items: [
    { key: "documents", label: "Compliance", icon: "shield" },
    { key: "integrations", label: "Integrations", icon: "plug" },
    { key: "users", label: "Users & Roles", icon: "users" },
    { key: "setup", label: "Company Setup", icon: "cpu" },
    { key: "system", label: "System & License", icon: "server" },
    { key: "pricing", label: "Pricing Console", icon: "tag", gate: "root" },
  ]},
];

/* ---------------- seeds ---------------- */
export const seedClients = (): ClientRec[] => [
  { id: "c1", name: "Eleanor Vance", dob: "1941-03-14", plan: "SeniorCare Plus", hmo: "SeniorCare HMO", copayPct: 10, address: "14 Rosewood Ln, Maple Heights", zone: "North", status: "active", risk: "medium", phone: "(555) 014-2231", physician: "Dr. A. Okafor", lastVisit: dayOffset(-1), nextVisit: dayOffset(0), team: "Team Alpha", svc: "Skilled Nursing Visit" },
  { id: "c2", name: "Marcus Webb", dob: "1958-11-02", plan: "BlueCare Standard", hmo: "BlueCare HMO", copayPct: 30, address: "220 Harbor Ave, Unit 7B", zone: "East", status: "active", risk: "low", phone: "(555) 093-8812", physician: "Dr. L. Ferris", lastVisit: dayOffset(-3), nextVisit: dayOffset(1), team: "Team Bravo", svc: "Physical Therapy Session" },
  { id: "c3", name: "Priya Raman", dob: "1985-06-21", plan: "Private Pay", hmo: null, copayPct: 100, address: "9 Calloway Ct", zone: "Central", status: "active", risk: "low", phone: "(555) 072-4419", physician: "Dr. S. Beck", lastVisit: dayOffset(-6), nextVisit: dayOffset(2), team: "Team Alpha", svc: "Wellness Assessment" },
  { id: "c4", name: "Harold Jensen", dob: "1937-01-30", plan: "MediPlus Gold", hmo: "MediPlus HMO", copayPct: 20, address: "41 Birchmont Dr", zone: "North", status: "active", risk: "high", phone: "(555) 048-7702", physician: "Dr. A. Okafor", lastVisit: dayOffset(0), nextVisit: dayOffset(0), team: "Team Alpha", svc: "Post-Op Wound Care" },
  { id: "c5", name: "Dulce Mariano", dob: "1969-09-12", plan: "BlueCare Standard", hmo: "BlueCare HMO", copayPct: 30, address: "77 Sunset Blvd, Apt 3", zone: "West", status: "onboarding", risk: "low", phone: "(555) 061-3348", physician: "Dr. R. Hsu", lastVisit: "—", nextVisit: dayOffset(3), team: "Team Bravo", svc: "Home Health Intake" },
  { id: "c6", name: "George Talbot", dob: "1949-04-05", plan: "SeniorCare Plus", hmo: "SeniorCare HMO", copayPct: 10, address: "5 Quail Ridge Rd", zone: "South", status: "active", risk: "medium", phone: "(555) 029-9917", physician: "Dr. L. Ferris", lastVisit: dayOffset(-2), nextVisit: dayOffset(1), team: "Team Bravo", svc: "Medication Management" },
  { id: "c7", name: "Amara Diallo", dob: "1992-12-19", plan: "Private Pay", hmo: null, copayPct: 100, address: "118 Grove St", zone: "Central", status: "active", risk: "low", phone: "(555) 084-1126", physician: "Dr. S. Beck", lastVisit: dayOffset(-4), nextVisit: dayOffset(4), team: "Team Alpha", svc: "Wellness Assessment" },
  { id: "c8", name: "Stanley Kowalski", dob: "1944-07-27", plan: "MediPlus Gold", hmo: "MediPlus HMO", copayPct: 20, address: "302 Foundry Way", zone: "East", status: "paused", risk: "high", phone: "(555) 037-6590", physician: "Dr. R. Hsu", lastVisit: dayOffset(-9), nextVisit: "—", team: "Team Bravo", svc: "Skilled Nursing Visit" },
  { id: "c9", name: "Beverly Chen", dob: "1953-02-08", plan: "BlueCare Standard", hmo: "BlueCare HMO", copayPct: 30, address: "66 Larkspur Ave", zone: "West", status: "active", risk: "low", phone: "(555) 056-2083", physician: "Dr. A. Okafor", lastVisit: dayOffset(-1), nextVisit: dayOffset(2), team: "Team Alpha", svc: "Physical Therapy Session" },
];

export const seedProviders = (): Provider[] => [
  { id: "p1", name: "Nadia Reyes, RN", title: "Lead Nurse — Home Health", creds: "RN, CNA-Cert", color: "#2576eb", team: "Team Alpha", capacity: 8, status: "on-duty", certs: [{ name: "RN License", exp: dayOffset(320) }, { name: "BLS", exp: dayOffset(24) }, { name: "Wound Care Cert", exp: dayOffset(140) }], visitsWeek: 6 },
  { id: "p2", name: "Tom Okafor, PT", title: "Physical Therapist", creds: "DPT", color: "#5c9cf5", team: "Team Bravo", capacity: 10, status: "on-duty", certs: [{ name: "PT License", exp: dayOffset(280) }, { name: "BLS", exp: dayOffset(200) }], visitsWeek: 8 },
  { id: "p3", name: "Grace Lin, HHA", title: "Home Health Aide", creds: "HHA, CPR", color: "#e8a33d", team: "Team Alpha", capacity: 12, status: "on-duty", certs: [{ name: "HHA Cert", exp: dayOffset(12) }, { name: "CPR / First Aid", exp: dayOffset(96) }], visitsWeek: 11 },
  { id: "p4", name: "Sam Delgado, LVN", title: "Licensed Vocational Nurse", creds: "LVN", color: "#12a5a0", team: "Team Bravo", capacity: 9, status: "off-duty", certs: [{ name: "LVN License", exp: dayOffset(410) }, { name: "IV Therapy", exp: dayOffset(60) }], visitsWeek: 4 },
  { id: "p5", name: "Ivy Tran, Wellness Coach", title: "Wellness & Nutrition Coach", creds: "NBC-HWC", color: "#d96889", team: "Team Alpha", capacity: 10, status: "on-duty", certs: [{ name: "Health Coach Cert", exp: dayOffset(190) }], visitsWeek: 7 },
  { id: "p6", name: "Dr. Renee Ashford", title: "Medical Director (Consult)", creds: "MD", color: "#1d2530", team: "Team Bravo", capacity: 4, status: "on-leave", certs: [{ name: "Medical License", exp: dayOffset(365) }], visitsWeek: 2 },
];

const T = dayOffset(0);
export const seedVisits = (): Visit[] => [
  { id: "v1", clientId: "c1", providerId: "p1", date: T, start: "08:30", end: "09:30", kind: "home-visit", status: "completed", svc: "Skilled Nursing Visit" },
  { id: "v2", clientId: "c4", providerId: "p1", date: T, start: "10:00", end: "11:00", kind: "home-visit", status: "in-progress", svc: "Post-Op Wound Care" },
  { id: "v3", clientId: "c2", providerId: "p2", date: T, start: "09:00", end: "10:00", kind: "clinic", status: "completed", svc: "Physical Therapy Session" },
  { id: "v4", clientId: "c9", providerId: "p3", date: T, start: "13:00", end: "14:00", kind: "home-visit", status: "en-route", svc: "Personal Care Visit" },
  { id: "v5", clientId: "c7", providerId: "p5", date: T, start: "15:30", end: "16:15", kind: "telehealth", status: "scheduled", svc: "Wellness Assessment" },
  { id: "v6", clientId: "c6", providerId: "p4", date: T, start: "16:00", end: "16:45", kind: "home-visit", status: "scheduled", svc: "Medication Management" },
  { id: "v7", clientId: "c3", providerId: "p5", date: dayOffset(-1), start: "11:00", end: "11:45", kind: "clinic", status: "missed", svc: "Wellness Assessment" },
  { id: "v8", clientId: "c2", providerId: "p2", date: dayOffset(1), start: "09:00", end: "10:00", kind: "clinic", status: "scheduled", svc: "Physical Therapy Session" },
  { id: "v9", clientId: "c6", providerId: "p4", date: dayOffset(1), start: "10:30", end: "11:15", kind: "home-visit", status: "scheduled", svc: "Medication Management" },
  { id: "v10", clientId: "c1", providerId: "p1", date: dayOffset(2), start: "08:30", end: "09:30", kind: "home-visit", status: "scheduled", svc: "Skilled Nursing Visit" },
  { id: "v11", clientId: "c5", providerId: "p3", date: dayOffset(3), start: "09:30", end: "11:00", kind: "home-visit", status: "scheduled", svc: "Home Health Intake" },
  { id: "v12", clientId: "c7", providerId: "p5", date: dayOffset(4), start: "14:00", end: "14:45", kind: "telehealth", status: "scheduled", svc: "Wellness Assessment" },
  { id: "v13", clientId: "c9", providerId: "p2", date: dayOffset(2), start: "11:00", end: "12:00", kind: "clinic", status: "scheduled", svc: "Physical Therapy Session" },
  { id: "v14", clientId: "c4", providerId: "p1", date: dayOffset(2), start: "10:00", end: "11:00", kind: "home-visit", status: "scheduled", svc: "Post-Op Wound Care" },
];

export const seedServices = (): ServiceItem[] => [
  { id: "s1", code: "SNV-01", name: "Skilled Nursing Visit", category: "Home Health", rate: 145, unit: "per visit", hmoCovered: true, active: true },
  { id: "s2", code: "WNC-02", name: "Post-Op Wound Care", category: "Home Health", rate: 120, unit: "per visit", hmoCovered: true, active: true },
  { id: "s3", code: "PTX-01", name: "Physical Therapy Session", category: "Rehab", rate: 110, unit: "per session", hmoCovered: true, active: true },
  { id: "s4", code: "PCV-03", name: "Personal Care Visit", category: "Home Health", rate: 65, unit: "per hour", hmoCovered: true, active: true },
  { id: "s5", code: "MED-04", name: "Medication Management", category: "Home Health", rate: 85, unit: "per visit", hmoCovered: true, active: true },
  { id: "s6", code: "WLA-05", name: "Wellness Assessment", category: "Wellness", rate: 95, unit: "per session", hmoCovered: false, active: true },
  { id: "s7", code: "INT-06", name: "Home Health Intake", category: "Home Health", rate: 160, unit: "one-time", hmoCovered: true, active: true },
  { id: "s8", code: "RMT-07", name: "Remote Vital Monitoring", category: "Wellness", rate: 40, unit: "per week", hmoCovered: false, active: true },
  { id: "s9", code: "NTC-08", name: "Telehealth Consult", category: "Clinic", rate: 75, unit: "per consult", hmoCovered: true, active: true },
  { id: "s10", code: "TRN-09", name: "Caregiver Training Hour", category: "Wellness", rate: 55, unit: "per hour", hmoCovered: false, active: false },
];

export const seedPackages = (): ServicePackage[] => [
  { id: "pk1", name: "Post-Acute Recovery", items: ["s1", "s2", "s5"], price: 980, tag: "Most referred" },
  { id: "pk2", name: "Senior Home Support", items: ["s4", "s5", "s8"], price: 640 },
  { id: "pk3", name: "Rehab Intensive (4 wks)", items: ["s3", "s3", "s6"], price: 1240 },
  { id: "pk4", name: "Wellness 360", items: ["s6", "s8", "s9"], price: 420, tag: "New" },
];

export const seedInvoices = (): Invoice[] => [
  { id: "i1", number: "INV-2601", clientId: "c1", date: dayOffset(-8), due: dayOffset(6), items: [{ desc: "Skilled Nursing Visit ×3", qty: 3, rate: 145 }, { desc: "Medication Management", qty: 1, rate: 85 }], hmo: "SeniorCare HMO", coveragePct: 90, status: "claim" },
  { id: "i2", number: "INV-2602", clientId: "c2", date: dayOffset(-6), due: dayOffset(8), items: [{ desc: "Physical Therapy Session ×2", qty: 2, rate: 110 }], hmo: "BlueCare HMO", coveragePct: 70, status: "pending-approval" },
  { id: "i3", number: "INV-2603", clientId: "c3", date: dayOffset(-4), due: dayOffset(10), items: [{ desc: "Wellness Assessment", qty: 1, rate: 95 }, { desc: "Remote Vital Monitoring", qty: 2, rate: 40 }], hmo: null, coveragePct: 0, status: "paid" },
  { id: "i4", number: "INV-2604", clientId: "c4", date: dayOffset(-14), due: dayOffset(-2), items: [{ desc: "Post-Op Wound Care ×4", qty: 4, rate: 120 }, { desc: "Skilled Nursing Visit", qty: 1, rate: 145 }], hmo: "MediPlus HMO", coveragePct: 80, status: "overdue" },
  { id: "i5", number: "INV-2605", clientId: "c6", date: dayOffset(-3), due: dayOffset(11), items: [{ desc: "Medication Management ×2", qty: 2, rate: 85 }], hmo: "SeniorCare HMO", coveragePct: 90, status: "paid" },
  { id: "i6", number: "INV-2606", clientId: "c9", date: dayOffset(-2), due: dayOffset(12), items: [{ desc: "Physical Therapy Session", qty: 1, rate: 110 }, { desc: "Personal Care Visit ×2h", qty: 2, rate: 65 }], hmo: "BlueCare HMO", coveragePct: 70, status: "draft" },
];

export const seedDocs = (): DocRec[] => [
  { id: "d1", name: "HMO Authorization — SeniorCare", kind: "Insurance Auth", holder: "Eleanor Vance", updated: dayOffset(-20), expiry: dayOffset(41), status: "expiring" },
  { id: "d2", name: "Physician Order — Wound Care", kind: "Clinical Order", holder: "Harold Jensen", updated: dayOffset(-5), expiry: dayOffset(85), status: "valid" },
  { id: "d3", name: "HIPAA Consent & NPP Acknowledgement", kind: "Consent", holder: "Marcus Webb", updated: dayOffset(-40), expiry: dayOffset(325), status: "valid" },
  { id: "d4", name: "Home Safety Assessment", kind: "Assessment", holder: "Dulce Mariano", updated: "—", expiry: dayOffset(-1), status: "missing" },
  { id: "d5", name: "Care Plan of Treatment (POT)", kind: "Care Plan", holder: "George Talbot", updated: dayOffset(-12), expiry: dayOffset(18), status: "expiring" },
  { id: "d6", name: "Insurance Card Copy — MediPlus", kind: "Insurance", holder: "Stanley Kowalski", updated: dayOffset(-200), expiry: dayOffset(-15), status: "expired" },
  { id: "d7", name: "Advance Directive", kind: "Legal", holder: "Eleanor Vance", updated: dayOffset(-60), expiry: dayOffset(305), status: "valid" },
  { id: "d8", name: "Infection Control Checklist", kind: "Compliance", holder: "Organization", updated: dayOffset(-9), expiry: dayOffset(81), status: "valid" },
];

export const seedChecklist = (): ChecklistItem[] => [
  { id: "k1", label: "HMO eligibility & authorization on file", required: true },
  { id: "k2", label: "Physician order / plan of treatment signed", required: true },
  { id: "k3", label: "HIPAA consent & NPP acknowledgement", required: true },
  { id: "k4", label: "Home safety assessment completed", required: true },
  { id: "k5", label: "Emergency contact & code status documented", required: true },
  { id: "k6", label: "Caregiver credentials verified (license, BLS)", required: true },
  { id: "k7", label: "Advance directive copy scanned", required: false },
  { id: "k8", label: "Equipment inventory signed by client", required: false },
];

export const seedIntegrations = (): IntegrationRec[] => [
  { id: "g1", name: "FS EHR", volume: "Volume 1", desc: "Clinical charting counterpart — clinical notes stay in FS EHR; CareOps syncs schedules & client demographics.", on: true, lastSync: "4 min ago", mode: "HL7 / FHIR bridge" },
  { id: "g2", name: "FS PracticeSuite", volume: "Volume 1", desc: "Practice management counterpart for clinics — encounter & superbilling data exchange.", on: true, lastSync: "11 min ago", mode: "REST v2 + webhooks" },
  { id: "g3", name: "FS MedCRM", volume: "Volume 3", desc: "Referral & marketing campaign intelligence — campaign leads flow into the booking funnel.", on: true, lastSync: "26 min ago", mode: "REST v2 + webhooks" },
];

export const seedSync = (): SyncLine[] => [
  { ts: "09:41:07", system: "FS EHR", event: "Demographics delta — 3 clients updated", level: "ok" },
  { ts: "09:36:52", system: "FS PracticeSuite", event: "Encounter batch #88 posted (clinic branch)", level: "ok" },
  { ts: "09:24:18", system: "FS MedCRM", event: "Campaign “Spring Wellness” → 6 new inquiries", level: "info" },
  { ts: "09:02:44", system: "FS EHR", event: "Clinical note held in EHR (not replicated) — policy OK", level: "info" },
  { ts: "08:47:10", system: "FS MedCRM", event: "Referral attribution mapped → INV-2601", level: "ok" },
];

export const seedInquiries = (): Inquiry[] => [
  { id: "q1", name: "Janet Holloway", contact: "(555) 041-8873", service: "Senior Home Support", when: "Today 08:52", status: "new", note: "Seeking 3×/week personal care for mother, North zone." },
  { id: "q2", name: "Omar Suleiman", contact: "omar.s@postmail.com", service: "Rehab Intensive", when: "Today 07:31", status: "contacted", note: "Post-ACL surgery; BlueCare HMO — verifying auth." },
  { id: "q3", name: "Rita Fontaine", contact: "(555) 026-4419", service: "Wellness 360", when: "Yesterday 16:04", status: "booked", note: "Booked via portal widget → ref PB-5F2K." },
];

export const seedNotifs = (): Notif[] => [
  { id: "n1", icon: "shield", text: "Grace Lin — HHA Cert expires in 12 days", meta: "Compliance · Team Alpha", read: false, tone: "warn" },
  { id: "n2", icon: "invoice", text: "INV-2604 (Harold Jensen) is overdue — MediPlus co-pay", meta: "Billing · $125.00 due", read: false, tone: "err" },
  { id: "n3", icon: "globe", text: "3 new inquiries from FS MedCRM campaigns", meta: "Growth · auto-synced", read: false, tone: "info" },
  { id: "n4", icon: "calendar", text: "Visit v7 missed — Amara Diallo, telehealth", meta: "Ops · yesterday", read: true, tone: "warn" },
  { id: "n5", icon: "plug", text: "FS EHR nightly reconciliation completed (0 conflicts)", meta: "Integrations · 02:00", read: true, tone: "ok" },
];

/* ---------------- constants & catalogs ---------------- */
export const HMO_PLANS = [
  { name: "SeniorCare HMO", coveragePct: 90 },
  { name: "MediPlus HMO", coveragePct: 80 },
  { name: "BlueCare HMO", coveragePct: 70 },
  { name: "Private / Self-Pay", coveragePct: 0 },
];

export const DEPLOY_MODES = [
  { id: "standalone", name: "Standalone Desktop", blurb: "Single workstation, embedded SQLite — ideal for one-branch clinics.", icon: "monitor" },
  { id: "lan", name: "Client–Server (LAN)", blurb: "Local server + front-desk & caregiver terminals across the branch.", icon: "server" },
  { id: "private-cloud", name: "Private Cloud", blurb: "Your own VPC with managed PostgreSQL & offsite encrypted backups.", icon: "cloud" },
  { id: "saas", name: "FS Hosted SaaS", blurb: "Multi-branch, multi-tenant hosting by FS Softwares — fastest to market.", icon: "globe" },
];

export const CHANGELOG = [
  { v: "1.0.0", date: "GA release", tag: "Current", items: ["Business Solution Core Architecture (Part I §1.1–1.10) embedded", "Industry modules: multi-provider scheduling, rate cards, HMO co-pay, care roster, booking widget", "Official System Logo Positioning & Usage Standard enforced on all surfaces", "Ten Embedded Requirements: licensing, 2FA + anti-clone, 4 deployment modes, Remote-Access Edition", "Integration gateway: FS EHR / PracticeSuite (Vol 1) and FS MedCRM (Vol 3)"] },
  { v: "0.9.4-rc", date: "Release candidate", tag: "Superseded", items: ["E2E suite expanded to 214 assertions across packaged builds", "Printed letterhead & footer finalized per Logo Standard §B"] },
  { v: "0.9.0-beta", date: "Closed beta", tag: "Superseded", items: ["Setup wizard + provisioning pipeline", "RBAC matrix validated for 6 roles"] },
];

export const E2E_TESTS = [
  { area: "Setup wizard", detail: "Company, owner, account-manager, dual-logo upload, deployment mode, RA toggle", status: "PASS", asserts: 18 },
  { area: "Licensing & activation", detail: "Key validation, seat/edition binding, offline activation file", status: "PASS", asserts: 22 },
  { area: "2FA + anti-clone", detail: "TOTP challenge on every new session; clone device rejected & revoked", status: "PASS", asserts: 14 },
  { area: "RBAC matrix", detail: "6 roles × 11 modules — 66 permission assertions", status: "PASS", asserts: 66 },
  { area: "Logo placement standard", detail: "Login, header, client pairing, letterhead, print footer, mobile splash, favicon, About", status: "PASS", asserts: 8 },
  { area: "Booking workflow", detail: "Portal inquiry → booking → visit assignment → delivery statuses", status: "PASS", asserts: 27 },
  { area: "Billing workflow", detail: "Rate card → invoice → HMO co-pay split → claim submission → reconciliation", status: "PASS", asserts: 31 },
  { area: "Integrations", detail: "FS EHR, PracticeSuite, MedCRM verified against sandboxed counterparts", status: "PASS", asserts: 28 },
];

export const LOGO_SURFACES = [
  { id: "login", name: "Login / Splash", rule: "System lockup — top-left, 24px clear-space; tagline set in mono 10px." },
  { id: "header", name: "App Header", rule: "Emblem 28px + wordmark, left-anchored; never centered or right-flipped." },
  { id: "pairing", name: "Client-Logo Pairing", rule: "Client logo left, system lockup right, divided by 1px rule. Client mark never larger than 0.8× system height." },
  { id: "letterhead", name: "Report / Letterhead", rule: "Pairing row at top; 2px pine rule beneath; margins ≥ 24mm." },
  { id: "printfooter", name: "Printed-Output Footer", rule: "Mono 8px centered credit line on every printed page: © FS Softwares × TophComm Systems." },
  { id: "mobile", name: "Mobile Splash / Header", rule: "Stacked lockup centered on splash; compact emblem-only in app header." },
  { id: "favicon", name: "Favicon / App Icon", rule: "Emblem on pine-950 tile, radius 22%, pulse line retained at 16px." },
  { id: "about", name: "About / License Screen", rule: "Full co-brand lockup with creator credit line; minimum width 240px." },
];

export const TEN_REQUIREMENTS = [
  "Multi-platform build — Windows (.exe), Android (.apk), Web portal from one codebase",
  "License generator — portable, FS Softwares / TophComm internal use only",
  "Remote-Access Edition — parallel build profile, same version number",
  "Company / Owner / Account-Manager sync across every module & printed surface",
  "FS Softwares × TophComm Systems co-brand on all brand surfaces",
  "2FA + anti-clone protection — TOTP per session, machine-fingerprint lock",
  "Updates tab — changelog, build artifacts, integrity hashes",
  "Super User / Administrator tiered authority with 4 operational roles beneath",
  "Logo upload — system & company marks placed per the Logo Positioning Standard",
  "All 4 deployment modes — Standalone, Client–Server LAN, Private Cloud, FS Hosted SaaS",
];

export const PATTERN_ROWS = [
  { aspect: "Backend", a: "Node.js + Express + SQLite", b: "NestJS / .NET + PostgreSQL" },
  { aspect: "Desktop shell", a: "Electron", b: "Tauri" },
  { aspect: "Mobile shell", a: "Capacitor", b: "Flutter" },
  { aspect: "Binary footprint", a: "Larger, batteries-included", b: "Leaner, native runtime" },
  { aspect: "Best fit", a: "Fast iteration, single-dev teams", b: "Enterprise scale, strict typing" },
];
