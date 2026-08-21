import { useMemo, useState } from "react";
import { fmtMoney, uid, dayOffset } from "../data";
import { computePayroll, DEPARTMENTS } from "../hr";
import type { Candidate, Employee, LeaveReq } from "../hr";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Modal, SectionHead, Bars, Field, inputCls, STATUS_TONE } from "../components/ui";
import { EntityAvatar, MediaUpload } from "../components/MediaUpload";
import { DataGrid } from "../components/DataGrid";
import type { Col } from "../components/DataGrid";

/* ============================================================
   Phase 9 — HR module (optional add-on, license-gated).
   Payroll posts ONLY through the Journal Entry API.
   ============================================================ */

type Tab = "employees" | "time" | "payroll" | "recruit" | "reviews";

export function HRPage() {
  const { hr, hrEnabled } = useApp();
  const [tab, setTab] = useState<Tab>("employees");

  if (!hrEnabled) {
    return (
      <Card className="circuit-bg mx-auto max-w-xl p-10 text-center anim-pop">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine-900 text-pulse-300"><Icon name="lock" size={26} /></span>
        <h2 className="mt-4 font-display text-xl font-extrabold text-pine-900">HR add-on is not active</h2>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-pine-500">
          HR is a license-gated module. Root can activate it from the <b>Pricing Console → Entitlements</b> panel
          (DEP-HR pack or Corporate Pro/Enterprise with the add-on). Module rows appear in the RACI matrix only while active.
        </p>
      </Card>
    );
  }
  if (hr.archivedAt) {
    return (
      <Card className="mx-auto max-w-xl p-10 text-center anim-pop">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-vita-100 text-vita-600"><Icon name="shield" size={26} /></span>
        <h2 className="mt-4 font-display text-xl font-extrabold text-pine-900">HR data archived on {hr.archivedAt}</h2>
        <p className="mt-2 text-[12.5px] text-pine-500">Archived — never deleted. Reactivate the add-on to restore full access for compliance audits.</p>
      </Card>
    );
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "employees", label: "Employees", icon: "users" },
    { id: "time", label: "Time & Leave", icon: "clock" },
    { id: "payroll", label: "Payroll", icon: "invoice" },
    { id: "recruit", label: "Recruitment", icon: "sparkle" },
    { id: "reviews", label: "Reviews", icon: "check" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="HR module · Phase 9 add-on" title="People Operations" icon="users"
          right={<Chip tone="violet" pulse>license add-on active</Chip>} />
        <div className="flex flex-wrap gap-1.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all ${tab === t.id ? "border-pine-900 bg-pine-900 text-pine-50 shadow-lift" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>
              <Icon name={t.icon} size={12} /> {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "employees" && <Employees />}
      {tab === "time" && <TimeLeave />}
      {tab === "payroll" && <Payroll />}
      {tab === "recruit" && <Recruit />}
      {tab === "reviews" && <Reviews />}
    </div>
  );
}

/* ---------------- Employees ---------------- */
function Employees() {
  const { hr, setHr, canMod, toast } = useApp();
  const [adding, setAdding] = useState(false);
  const [d, setD] = useState({ name: "", position: "", dept: DEPARTMENTS[0] as string, payType: "hourly", baseRate: "20" });
  const canEdit = canMod("hr", "edit");

  const cols: Col<Employee>[] = [
    { key: "name", label: "Employee", sortVal: e => e.name, render: e => (
      <span className="flex items-center gap-2.5">
        <EntityAvatar entityType="employee" entityId={e.id} size={32} name={e.name} />
        <span><span className="block font-extrabold text-pine-900">{e.name}</span>
          <span className="block text-[10.5px] text-pine-400">{e.position} · hired {e.hiredOn}</span></span>
      </span>) },
    { key: "dept", label: "Department", sortVal: e => e.dept, render: e => <Chip tone="gray">{e.dept}</Chip> },
    { key: "costCenter", label: "Cost center", mono: true, sortVal: e => e.costCenter },
    { key: "pay", label: "Pay", align: "right", mono: true, sortVal: e => e.baseRate, render: e => `${fmtMoney(e.baseRate)}${e.payType === "hourly" ? "/hr" : " /mo"}` },
    { key: "status", label: "Status", sortVal: e => e.status, render: e => <Chip tone={e.status === "active" ? "green" : e.status === "on-leave" ? "amber" : "gray"}>{e.status}</Chip> },
    { key: "photo", label: "Photo (optional)", render: e => canEdit
      ? <MediaUpload entityType="employee" entityId={e.id} size={32} crop />
      : <EntityAvatar entityType="employee" entityId={e.id} size={28} name={e.name} /> },
  ];

  const addEmployee = () => {
    if (!d.name.trim() || !d.position.trim()) { toast("Name and position are required — the photo stays optional.", "warn"); return; }
    const e: Employee = {
      id: uid(), name: d.name.trim(), position: d.position.trim(), dept: d.dept,
      costCenter: `CC-${d.dept.slice(0, 3).toUpperCase()}-0${hr.employees.length + 1}`,
      status: "active", hiredOn: dayOffset(0), payType: d.payType as "hourly" | "salary",
      baseRate: +d.baseRate || 0, hoursStd: 40, photo: null,
      history: [{ date: dayOffset(0), event: "Hired — master record created" }],
    };
    setHr(h => ({ ...h, employees: [...h.employees, e] }));
    toast(`${e.name} added to ${e.dept} — cost center ${e.costCenter} linked to dimensional reporting`, "ok");
    setAdding(false); setD({ name: "", position: "", dept: DEPARTMENTS[0], payType: "hourly", baseRate: "20" });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Headcount", String(hr.employees.filter(e => e.status === "active").length), "active employees"],
          ["Departments", String(new Set(hr.employees.map(e => e.dept)).size), "cost-center linked"],
          ["On leave", String(hr.employees.filter(e => e.status === "on-leave").length), "approved absences"],
          ["Open roles", String(hr.candidates.filter(c => c.stage !== "hired").length), "in pipeline"],
        ].map(([k, v, s], i) => (
          <Card key={k} className="anim-fade-up transition-all hover:-translate-y-0.5 hover:shadow-pop" pad={false}>
            <div className="p-3.5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-pine-400">{k}</p>
              <p className="mt-0.5 font-mono text-[22px] font-semibold leading-none text-pine-900 tnum">{v}</p>
              <p className="mt-1 text-[10.5px] text-pine-500">{s}</p>
            </div>
          </Card>
        ))}
      </div>
      <DataGrid cols={cols} rows={hr.employees} rowKey={e => e.id} pageSize={6}
        toolbar={canEdit ? <Btn size="sm" onClick={() => setAdding(true)}><Icon name="plus" size={13} /> Add employee</Btn> : undefined} />

      <Modal open={adding} onClose={() => setAdding(false)} title="New employee master record"
        footer={<><Btn kind="ghost" onClick={() => setAdding(false)}>Cancel</Btn><Btn onClick={addEmployee}><Icon name="check" size={14} /> Create record</Btn></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name *"><input className={inputCls} value={d.name} onChange={e => setD(x => ({ ...x, name: e.target.value }))} /></Field>
          <Field label="Position *"><input className={inputCls} value={d.position} onChange={e => setD(x => ({ ...x, position: e.target.value }))} /></Field>
          <Field label="Department">
            <select className={inputCls} value={d.dept} onChange={e => setD(x => ({ ...x, dept: e.target.value }))}>
              {DEPARTMENTS.map(x => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Pay type">
            <select className={inputCls} value={d.payType} onChange={e => setD(x => ({ ...x, payType: e.target.value }))}>
              <option value="hourly">Hourly</option><option value="salary">Salary (monthly)</option>
            </select>
          </Field>
          <Field label={d.payType === "hourly" ? "Hourly rate ($)" : "Monthly salary ($)"}>
            <input className={`${inputCls} font-mono`} value={d.baseRate} onChange={e => setD(x => ({ ...x, baseRate: e.target.value }))} />
          </Field>
        </div>
        <p className="mt-3 rounded-md bg-paper px-3 py-2 text-[11px] text-pine-500">
          <b>Photo is optional</b> — attach any time from the roster. Org chart & cost centers update automatically.
        </p>
      </Modal>
    </div>
  );
}

/* ---------------- Time & Leave (maker-checker) ---------------- */
function TimeLeave() {
  const { hr, setHr, canMod, toast, user } = useApp();
  const canApprove = canMod("hr", "approve");
  const canEdit = canMod("hr", "edit");
  const empName = (id: string) => hr.employees.find(e => e.id === id)?.name ?? "—";
  const [reqFor, setReqFor] = useState(hr.employees[0]?.id ?? "");

  const clock = (e: Employee) => {
    const now = new Date().toTimeString().slice(0, 5);
    const open = hr.clocks.find(c => c.employeeId === e.id && c.date === dayOffset(0) && !c.clockOut);
    if (open) {
      setHr(h => ({ ...h, clocks: h.clocks.map(c => c.id === open.id ? { ...c, clockOut: now } : c) }));
      toast(`${e.name} clocked out at ${now} — hours flow to the payroll engine`, "ok");
    } else {
      setHr(h => ({ ...h, clocks: [...h.clocks, { id: uid(), employeeId: e.id, date: dayOffset(0), clockIn: now, clockOut: null }] }));
      toast(`${e.name} clocked in at ${now} (web · LAN kiosk also available)`, "ok");
    }
  };

  const decide = (l: LeaveReq, ok: boolean) => {
    setHr(h => ({ ...h, leaves: h.leaves.map(x => x.id === l.id ? { ...x, status: ok ? "approved" : "rejected", approver: user?.name } : x) }));
    toast(`Leave ${ok ? "approved" : "rejected"} — maker-checker complete (${user?.name}, Accountable)`, ok ? "ok" : "warn");
  };

  const requestLeave = () => {
    const l: LeaveReq = { id: uid(), employeeId: reqFor, type: "vacation", from: dayOffset(5), to: dayOffset(7), days: 3, status: "pending" };
    setHr(h => ({ ...h, leaves: [l, ...h.leaves] }));
    toast("Leave request submitted — requires an Accountable (A) approver on HR", "info");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionHead title="Today — clock register" icon="clock" right={<span className="font-mono text-[10px] text-pine-400">{dayOffset(0)}</span>} />
        <div className="divide-y divide-pine-100">
          {hr.employees.filter(e => e.status === "active").map(e => {
            const ev = hr.clocks.find(c => c.employeeId === e.id && c.date === dayOffset(0));
            return (
              <div key={e.id} className="flex items-center gap-3 py-2">
                <EntityAvatar entityType="employee" entityId={e.id} size={30} name={e.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-bold text-pine-800">{e.name}</span>
                  <span className="font-mono text-[10px] text-pine-400 tnum">
                    {ev ? `in ${ev.clockIn}${ev.clockOut ? ` · out ${ev.clockOut}` : " · on shift"}` : "not clocked in"}
                  </span>
                </span>
                {canEdit && (
                  <Btn size="sm" kind={ev && !ev.clockOut ? "dark" : "outline"} onClick={() => clock(e)}>
                    {ev && !ev.clockOut ? "Clock out" : ev ? "Done" : "Clock in"}
                  </Btn>
                )}
              </div>
            );
          })}
        </div>
        {canEdit && (
          <div className="mt-3 flex items-center gap-2 rounded-md border border-pine-200 bg-paper/70 p-2">
            <select className={inputCls} value={reqFor} onChange={e => setReqFor(e.target.value)}>
              {hr.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <Btn size="sm" onClick={requestLeave}><Icon name="plus" size={13} /> Request leave (3d)</Btn>
          </div>
        )}
      </Card>

      <Card pad={false}>
        <div className="border-b border-pine-200 bg-paper/80 px-4 py-2.5">
          <span className="font-display text-[14px] font-extrabold text-pine-900">Leave approvals</span>
          <span className="ml-2 font-mono text-[9px] font-bold uppercase tracking-wider text-vita-600">maker-checker</span>
        </div>
        <div className="divide-y divide-pine-100">
          {hr.leaves.map(l => (
            <div key={l.id} className="px-4 py-2.5">
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="font-bold text-pine-900">{empName(l.employeeId)}</span>
                <Chip tone="gray">{l.type}</Chip>
                <span className="font-mono text-[10.5px] text-pine-400 tnum">{l.from} → {l.to} · {l.days}d</span>
                <span className="ml-auto"><Chip tone={STATUS_TONE[l.status]}>{l.status}</Chip></span>
              </div>
              {l.status === "pending" && (
                canApprove ? (
                  <div className="mt-1.5 flex gap-1.5 anim-fade-in">
                    <Btn size="sm" onClick={() => decide(l, true)}><Icon name="check" size={12} /> Approve (A)</Btn>
                    <Btn size="sm" kind="danger" onClick={() => decide(l, false)}><Icon name="x" size={12} /> Reject</Btn>
                  </div>
                ) : <p className="mt-1 font-mono text-[10px] text-pine-400">awaiting an Accountable approver on HR</p>
              )}
              {l.approver && <p className="mt-0.5 font-mono text-[9.5px] text-pine-400">decided by {l.approver}</p>}
            </div>
          ))}
        </div>
        <p className="border-t border-pine-100 bg-paper/60 px-4 py-2 text-[10px] text-pine-500">Holiday calendar: {hr.holidayRegion} · balances accrue per policy engine</p>
      </Card>
    </div>
  );
}

/* ---------------- Payroll ---------------- */
function Payroll() {
  const { hr, setHr, canMod, toast } = useApp();
  const canEdit = canMod("hr", "edit");
  const [slip, setSlip] = useState<{ name: string; line: { gross: number; tax: number; deductions: number; net: number } } | null>(null);
  const preview = useMemo(() => computePayroll(hr.employees, hr.taxRules), [hr.employees, hr.taxRules]);
  const empName = (id: string) => hr.employees.find(e => e.id === id)?.name ?? "—";
  const last = hr.payRuns[0];

  const runPayroll = () => {
    const run = {
      id: uid(), period: "Aug 01 – 15", status: "draft" as const, runAt: "Just now",
      lines: preview,
    };
    setHr(h => ({ ...h, payRuns: [run, ...h.payRuns] }));
    toast("Pay run computed — draft created. Post it to submit through the Journal Entry API.", "ok");
  };
  const postRun = () => {
    const jid = `JE-${String(Math.floor(700 + Math.random() * 200))}`;
    setHr(h => ({ ...h, payRuns: h.payRuns.map((r, i) => i === 0 ? { ...r, status: "posted", journalId: jid } : r) }));
    toast(`Posted via Journal Entry API as ${jid} — payroll never writes GL balances directly`, "ok");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
          <span className="font-display text-[14px] font-extrabold text-pine-900">Pay runs</span>
          <div className="flex gap-1.5">
            {canEdit && <Btn size="sm" kind="outline" onClick={runPayroll}><Icon name="refresh" size={13} /> Compute run</Btn>}
            {canEdit && last?.status === "draft" && <Btn size="sm" onClick={postRun}><Icon name="send" size={13} /> Post to GL</Btn>}
          </div>
        </div>
        <div className="divide-y divide-pine-100">
          {hr.payRuns.map(r => (
            <div key={r.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[13px] font-bold text-pine-900">{r.period}</span>
                <Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip>
                {r.journalId && <span className="rounded bg-pine-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-pine-600">{r.journalId}</span>}
                <span className="ml-auto font-mono text-[10px] text-pine-400">{r.runAt}</span>
              </div>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead><tr className="text-left font-mono text-[9px] uppercase tracking-wider text-pine-400">
                    <th className="py-1 pr-3">Employee</th><th className="py-1 pr-3 text-right">Gross</th><th className="py-1 pr-3 text-right">Tax</th><th className="py-1 pr-3 text-right">Ded.</th><th className="py-1 text-right">Net</th><th className="py-1" />
                  </tr></thead>
                  <tbody>
                    {r.lines.map(l => (
                      <tr key={l.employeeId} className="border-t border-pine-100 transition-colors hover:bg-pulse-50/40">
                        <td className="py-1.5 pr-3 font-bold text-pine-800">{empName(l.employeeId)}</td>
                        <td className="py-1.5 pr-3 text-right font-mono tnum">{fmtMoney(l.gross)}</td>
                        <td className="py-1.5 pr-3 text-right font-mono text-danger-600 tnum">−{fmtMoney(l.tax)}</td>
                        <td className="py-1.5 pr-3 text-right font-mono text-danger-600 tnum">−{fmtMoney(l.deductions)}</td>
                        <td className="py-1.5 text-right font-mono font-bold text-pulse-700 tnum">{fmtMoney(l.net)}</td>
                        <td className="py-1.5 pl-2 text-right">
                          <button onClick={() => setSlip({ name: empName(l.employeeId), line: l })} className="font-mono text-[10px] font-bold text-info-600 underline-offset-2 hover:underline">payslip</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <SectionHead title="Deduction rules" icon="shield" />
          <div className="space-y-1.5">
            {hr.taxRules.map(r => (
              <div key={r.label} className="flex items-center justify-between rounded border border-pine-100 bg-paper/60 px-2.5 py-1.5 text-[11.5px]">
                <span className="font-semibold text-pine-700">{r.label}</span>
                <span className="font-mono font-bold text-pine-900 tnum">{r.pct}%</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-pine-400">Jurisdiction-configurable · statutory contributions tracked per employee</p>
        </Card>
        <Card>
          <SectionHead title="Payroll cost by dept" icon="chart" />
          <Bars data={DEPARTMENTS.map(dp => Math.round(hr.employees.filter(e => e.dept === dp).reduce((a, e) => a + (e.payType === "salary" ? e.baseRate : e.baseRate * e.hoursStd), 0)))}
            labels={[...DEPARTMENTS]} fmt={n => fmtMoney(n)} />
        </Card>
      </div>

      <Modal open={!!slip} onClose={() => setSlip(null)} title={`Payslip — ${slip?.name}`}
        footer={<><Btn kind="ghost" onClick={() => setSlip(null)}>Close</Btn><Btn onClick={() => toast("Payslip exported (PDF, letterhead footer applied)", "ok")}><Icon name="download" size={14} /> Download PDF</Btn></>}>
        {slip && (
          <div className="print-root rounded-md bg-white p-4 ring-1 ring-pine-200">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-pine-400">FS CareOps · payroll</p>
            <h3 className="font-display text-lg font-extrabold text-pine-900">{slip.name}</h3>
            <div className="mt-3 space-y-1 font-mono text-[12px] text-pine-700 tnum">
              <div className="flex justify-between"><span>Gross earnings</span><b>{fmtMoney(slip.line.gross)}</b></div>
              <div className="flex justify-between text-danger-600"><span>Tax withholdings</span><span>−{fmtMoney(slip.line.tax)}</span></div>
              <div className="flex justify-between text-danger-600"><span>Deductions</span><span>−{fmtMoney(slip.line.deductions)}</span></div>
              <div className="flex justify-between border-t-2 border-pine-900 pt-1 text-[14px] text-pulse-700"><b>NET PAY</b><b>{fmtMoney(slip.line.net)}</b></div>
            </div>
            <p className="mt-3 text-center font-mono text-[8px] text-pine-400">FS CareOps v1.0.0 — © FS Softwares in collaboration with TophComm Systems</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ---------------- Recruitment ---------------- */
function Recruit() {
  const { hr, setHr, canMod, toast } = useApp();
  const canEdit = canMod("hr", "edit");
  const stages: Candidate["stage"][] = ["applied", "interview", "offer", "hired"];
  const advance = (c: Candidate) => {
    const next = stages[Math.min(stages.indexOf(c.stage) + 1, stages.length - 1)];
    setHr(h => ({ ...h, candidates: h.candidates.map(x => x.id === c.id ? { ...x, stage: next } : x) }));
    toast(`${c.name} moved to “${next}”`, next === "hired" ? "ok" : "info");
  };
  if (!hr.recruitmentOn) return <Card className="p-8 text-center text-[12.5px] text-pine-500">Recruitment sub-feature is toggled off for a slimmer HR footprint.</Card>;
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {stages.map(s => (
        <div key={s} className="rounded-lg border border-pine-200 bg-paper/60 p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-pine-500">{s}</span>
            <span className="rounded bg-pine-100 px-1.5 font-mono text-[10px] font-bold text-pine-600 tnum">{hr.candidates.filter(c => c.stage === s).length}</span>
          </div>
          <div className="space-y-2">
            {hr.candidates.filter(c => c.stage === s).map(c => (
              <div key={c.id} className="group rounded-md border border-pine-200 bg-card p-2.5 shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
                <div className="flex items-center gap-2">
                  {canEdit ? <MediaUpload entityType="candidate" entityId={c.id} size={30} crop /> : <EntityAvatar entityType="candidate" entityId={c.id} size={30} name={c.name} />}
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-extrabold text-pine-900">{c.name}</p>
                    <p className="truncate text-[10px] text-pine-400">{c.position}</p>
                  </div>
                </div>
                <p className="mt-1.5 text-[10.5px] leading-snug text-pine-500">{c.note}</p>
                {canEdit && s !== "hired" && (
                  <button onClick={() => advance(c)} className="mt-2 w-full rounded border border-pulse-300 bg-pulse-50 py-1 font-mono text-[9.5px] font-bold uppercase tracking-wider text-pulse-700 opacity-0 transition-all hover:bg-pulse-100 group-hover:opacity-100">
                    advance →
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Reviews + ESS ---------------- */
function Reviews() {
  const { hr, setHr, canMod, toast, user } = useApp();
  const canApprove = canMod("hr", "approve");
  const sign = () => {
    setHr(h => ({ ...h, reviews: h.reviews.map(r => ({ ...r, status: "signed" as const, signOff: user?.name })) }));
    toast(`Review cycle signed off by ${user?.name} (Accountable)`, "ok");
  };
  const r = hr.reviews[0];
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <SectionHead title={`Performance — ${r.name}`} icon="check" right={<Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip>} />
        <div className="space-y-3">
          {r.goals.map(g => (
            <div key={g.label}>
              <div className="mb-1 flex justify-between text-[12px]"><span className="font-bold text-pine-800">{g.label}</span><span className="font-mono font-bold text-pulse-700 tnum">{g.progress}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-pine-100">
                <div className="h-full rounded-full bg-gradient-to-r from-pulse-600 to-pulse-400 transition-all duration-700" style={{ width: `${g.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
        {r.status === "open"
          ? canApprove
            ? <Btn className="mt-4" onClick={sign}><Icon name="edit" size={14} /> Manager sign-off (A)</Btn>
            : <p className="mt-4 rounded-md bg-paper px-3 py-2 font-mono text-[10.5px] text-pine-400">sign-off requires Accountable (A) on HR</p>
          : <p className="mt-4 rounded-md border border-pulse-300 bg-pulse-50 px-3 py-2 text-[11.5px] font-bold text-pulse-800 anim-fade-in">Signed by {r.signOff} — archived to the review ledger</p>}
      </Card>
      <Card>
        <SectionHead title="Employee self-service" icon="heart" right={<Chip tone="gray">ESS portal</Chip>} />
        <div className="grid grid-cols-3 gap-2">
          {[["Payslips", "3 available", "invoice"], ["Leave balance", "12.5 days", "clock"], ["My details", "2 pending", "users"]].map(([k, v, ic]) => (
            <button key={k} onClick={() => toast(k === "My details" ? "Sensitive field change submitted — requires admin approval" : `${k} opened in the ESS portal`, "info")}
              className="rounded-md border border-pine-200 bg-paper/60 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-pulse-300 hover:shadow-lift">
              <Icon name={ic} size={16} className="text-pulse-600" />
              <p className="mt-1.5 text-[11.5px] font-extrabold text-pine-800">{k}</p>
              <p className="font-mono text-[9.5px] text-pine-400">{v}</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10.5px] leading-snug text-pine-400">
          ESS changes to sensitive personal fields route to admin approval — same maker-checker pattern as the rest of the platform.
        </p>
      </Card>
    </div>
  );
}
