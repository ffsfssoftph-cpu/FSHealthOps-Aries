/* ============================================================
   FS CareOps — Phase 9 · HR module (optional, license-gated)
   Deactivation archives — never deletes (compliance-safe).
   ============================================================ */
import { dayOffset } from "./data";

export const DEPARTMENTS = ["Nursing", "Therapy", "Wellness", "Administration"] as const;

export interface Employee {
  id: string; name: string; position: string; dept: string; costCenter: string;
  status: "active" | "on-leave" | "terminated"; hiredOn: string;
  payType: "salary" | "hourly"; baseRate: number; hoursStd: number;
  photo: string | null; history: { date: string; event: string }[];
}
export interface LeaveReq {
  id: string; employeeId: string; type: "vacation" | "sick" | "emergency";
  from: string; to: string; days: number; status: "pending" | "approved" | "rejected";
  approver?: string;
}
export interface ClockEvent { id: string; employeeId: string; date: string; clockIn: string; clockOut: string | null }
export interface PayLine { employeeId: string; gross: number; tax: number; deductions: number; net: number }
export interface PayRun {
  id: string; period: string; status: "draft" | "posted"; runAt: string;
  lines: PayLine[]; journalId?: string;
}
export interface Candidate { id: string; name: string; position: string; stage: "applied" | "interview" | "offer" | "hired"; note: string; photo: string | null }
export interface ReviewCycle { id: string; name: string; status: "open" | "signed"; goals: { label: string; progress: number }[]; signOff?: string }
export interface TaxRule { label: string; pct: number }

export interface HRData {
  employees: Employee[]; leaves: LeaveReq[]; clocks: ClockEvent[];
  payRuns: PayRun[]; candidates: Candidate[]; reviews: ReviewCycle[];
  taxRules: TaxRule[]; holidayRegion: string;
  recruitmentOn: boolean; archivedAt: string | null;
}

export const seedHR = (): HRData => ({
  archivedAt: null,
  holidayRegion: "US-Federal",
  recruitmentOn: true,
  taxRules: [
    { label: "Federal income tax", pct: 12 },
    { label: "Social Security", pct: 6.2 },
    { label: "Medicare", pct: 1.45 },
    { label: "State contribution", pct: 4 },
  ],
  employees: [
    { id: "e1", name: "Nadia Reyes", position: "Lead Nurse", dept: "Nursing", costCenter: "CC-NUR-01", status: "active", hiredOn: "2021-03-15", payType: "salary", baseRate: 4150, hoursStd: 40, photo: null, history: [{ date: "2021-03-15", event: "Hired — Lead Nurse" }, { date: "2024-01-10", event: "Promotion — Team Alpha lead" }] },
    { id: "e2", name: "Tom Okafor", position: "Physical Therapist", dept: "Therapy", costCenter: "CC-THR-01", status: "active", hiredOn: "2022-07-01", payType: "salary", baseRate: 3900, hoursStd: 40, photo: null, history: [{ date: "2022-07-01", event: "Hired — DPT" }] },
    { id: "e3", name: "Grace Lin", position: "Home Health Aide", dept: "Nursing", costCenter: "CC-NUR-02", status: "active", hiredOn: "2023-02-20", payType: "hourly", baseRate: 19.5, hoursStd: 36, photo: null, history: [{ date: "2023-02-20", event: "Hired — HHA" }] },
    { id: "e4", name: "Ivy Tran", position: "Wellness Coach", dept: "Wellness", costCenter: "CC-WEL-01", status: "active", hiredOn: "2023-09-05", payType: "salary", baseRate: 3200, hoursStd: 40, photo: null, history: [{ date: "2023-09-05", event: "Hired — NBC-HWC" }] },
    { id: "e5", name: "Sam Delgado", position: "LVN", dept: "Nursing", costCenter: "CC-NUR-02", status: "on-leave", hiredOn: "2020-11-30", payType: "hourly", baseRate: 24, hoursStd: 32, photo: null, history: [{ date: "2020-11-30", event: "Hired — LVN" }, { date: dayOffset(-7), event: "Leave of absence begins" }] },
    { id: "e6", name: "Rosa Jimenez", position: "Billing Clerk", dept: "Administration", costCenter: "CC-ADM-01", status: "active", hiredOn: "2024-04-01", payType: "salary", baseRate: 2800, hoursStd: 40, photo: null, history: [{ date: "2024-04-01", event: "Hired — AP / Billing" }] },
  ],
  leaves: [
    { id: "lv1", employeeId: "e3", type: "vacation", from: dayOffset(6), to: dayOffset(9), days: 3, status: "pending" },
    { id: "lv2", employeeId: "e5", type: "emergency", from: dayOffset(-7), to: dayOffset(7), days: 10, status: "approved", approver: "Amelia Ortiz" },
    { id: "lv3", employeeId: "e4", type: "sick", from: dayOffset(-20), to: dayOffset(-19), days: 1, status: "approved", approver: "Celeste Ayon" },
  ],
  clocks: [
    { id: "ck1", employeeId: "e1", date: dayOffset(0), clockIn: "07:58", clockOut: null },
    { id: "ck2", employeeId: "e3", date: dayOffset(0), clockIn: "08:12", clockOut: null },
    { id: "ck3", employeeId: "e6", date: dayOffset(0), clockIn: "08:31", clockOut: null },
    { id: "ck4", employeeId: "e2", date: dayOffset(0), clockIn: "08:02", clockOut: "17:04" },
  ],
  payRuns: [
    { id: "pr1", period: "Jul 16 – 31", status: "posted", runAt: "Aug 01 · 09:12", journalId: "JE-0788",
      lines: [
        { employeeId: "e1", gross: 2075, tax: 492, deductions: 95, net: 1488 },
        { employeeId: "e2", gross: 1950, tax: 462, deductions: 88, net: 1400 },
        { employeeId: "e3", gross: 1404, tax: 333, deductions: 40, net: 1031 },
        { employeeId: "e4", gross: 1600, tax: 379, deductions: 60, net: 1161 },
        { employeeId: "e6", gross: 1400, tax: 332, deductions: 45, net: 1023 },
      ] },
  ],
  candidates: [
    { id: "cd1", name: "Hannah Price", position: "Home Health Aide", stage: "interview", note: "2nd interview scheduled — strong references.", photo: null },
    { id: "cd2", name: "Leo Martins", position: "LVN", stage: "applied", note: "Applied via FS MedCRM careers campaign.", photo: null },
    { id: "cd3", name: "Sofia Beck", position: "Wellness Coach", stage: "offer", note: "Offer sent — awaiting countersign.", photo: null },
    { id: "cd4", name: "Derek Osei", position: "Physical Therapist", stage: "applied", note: "License verification in progress.", photo: null },
  ],
  reviews: [
    { id: "rv1", name: "H1 2026 Cycle", status: "open", goals: [
      { label: "Visit documentation within 24h", progress: 82 },
      { label: "Client satisfaction ≥ 4.6/5", progress: 91 },
      { label: "Certification renewal 100%", progress: 67 },
    ] },
  ],
});

/** Payroll math — never writes GL balances directly; results post
    through the Journal Entry API only (Phase 9 rule). */
export function computePayroll(employees: Employee[], rules: TaxRule[], deductionFlat = 45): PayLine[] {
  return employees.filter(e => e.status !== "terminated").map(e => {
    const gross = e.payType === "salary" ? Math.round(e.baseRate / 2) : Math.round(e.baseRate * e.hoursStd / 2);
    const taxPct = rules.reduce((a, r) => a + r.pct, 0) / 100;
    const tax = Math.round(gross * taxPct);
    const deductions = deductionFlat;
    return { employeeId: e.id, gross, tax, deductions, net: gross - tax - deductions };
  });
}
