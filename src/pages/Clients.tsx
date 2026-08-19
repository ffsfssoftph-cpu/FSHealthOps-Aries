import { useState } from "react";
import { dayOffset, fmtMoney, uid } from "../data";
import type { ClientRec } from "../data";
import { useApp } from "../state";
import { Btn, Card, Chip, Drawer, Icon, KV, Modal, Progress, STATUS_TONE, SectionHead, Field, inputCls, Empty } from "../components/ui";

export function Clients() {
  const { db, setDb, toast } = useApp();
  const [q, setQ] = useState("");
  const [zone, setZone] = useState("all");
  const [sel, setSel] = useState<ClientRec | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", dob: "", phone: "", zone: "North", plan: "Private Pay", hmo: "", address: "", physician: "", svc: "Skilled Nursing Visit" });

  const list = db.clients.filter(c =>
    (zone === "all" || c.zone === zone) &&
    (c.name.toLowerCase().includes(q.toLowerCase()) || c.svc.toLowerCase().includes(q.toLowerCase()))
  );

  const add = () => {
    if (!form.name.trim()) { toast("Client name is required.", "warn"); return; }
    const hmoPlan = ["SeniorCare HMO", "MediPlus HMO", "BlueCare HMO"].includes(form.hmo) ? form.hmo : null;
    const copay = hmoPlan === "SeniorCare HMO" ? 10 : hmoPlan === "MediPlus HMO" ? 20 : hmoPlan === "BlueCare HMO" ? 30 : 100;
    const c: ClientRec = {
      id: uid(), name: form.name.trim(), dob: form.dob || "1950-01-01", plan: form.plan, hmo: hmoPlan, copayPct: copay,
      address: form.address || "—", zone: form.zone, status: "onboarding", risk: "low", phone: form.phone || "—",
      physician: form.physician || "Unassigned", lastVisit: "—", nextVisit: "—", team: "Team Alpha", svc: form.svc,
    };
    setDb(d => ({ ...d, clients: [c, ...d.clients] }));
    toast(`${c.name} added — intake checklist started (${db.checklist.filter(k => k.required).length} required docs)`, "ok");
    setAddOpen(false); setForm({ ...form, name: "", phone: "", address: "" });
  };

  const outstanding = (cid: string) =>
    db.invoices.filter(i => i.clientId === cid && ["sent", "overdue", "claim"].includes(i.status))
      .reduce((a, i) => a + i.items.reduce((s, it) => s + it.qty * it.rate, 0) * (1 - i.coveragePct / 100), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Client / customer management · §1.1" title="Client Registry" icon="heart"
          right={<span className="font-mono text-[11px] text-pine-500 tnum">{db.clients.length} records · {db.clients.filter(c => c.status === "active").length} active</span>} />
        <Btn onClick={() => setAddOpen(true)}><Icon name="plus" size={15} /> New client</Btn>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pine-400"><Icon name="search" size={14} /></span>
          <input className={`${inputCls} pl-8`} placeholder="Search name or service…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        {["all", "North", "South", "East", "West", "Central"].map(z => (
          <button key={z} onClick={() => setZone(z)} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all ${zone === z ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>
            {z === "all" ? "All zones" : z}
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-pine-200 bg-paper/80 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-pine-500">
                <th className="px-4 py-2.5">Client</th><th className="px-3 py-2.5">Plan / HMO</th><th className="px-3 py-2.5">Zone</th>
                <th className="px-3 py-2.5">Primary service</th><th className="px-3 py-2.5">Next visit</th><th className="px-3 py-2.5">Balance</th><th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c, i) => (
                <tr key={c.id} onClick={() => setSel(c)}
                  className="cursor-pointer border-b border-pine-100 transition-colors last:border-0 hover:bg-pulse-50/50 anim-fade-up" style={{ animationDelay: `${i * 35}ms` }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-[11px] font-bold text-white ${c.risk === "high" ? "bg-danger-500" : c.risk === "medium" ? "bg-vita-500" : "bg-pine-500"}`}>
                        {c.name.split(" ").map(w => w[0]).join("")}
                      </span>
                      <div>
                        <p className="font-bold text-pine-900">{c.name}</p>
                        <p className="font-mono text-[10px] text-pine-400 tnum">{c.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><p className="font-semibold text-pine-800">{c.plan}</p>{c.hmo && <p className="text-[10.5px] text-pine-500">co-pay {c.copayPct}%</p>}</td>
                  <td className="px-3 py-2.5 text-pine-600">{c.zone}</td>
                  <td className="px-3 py-2.5 text-pine-600">{c.svc}</td>
                  <td className="px-3 py-2.5 font-mono text-[11px] text-pine-600 tnum">{c.nextVisit === "—" ? "—" : c.nextVisit.slice(5)}</td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-pine-900 tnum">{outstanding(c.id) > 0 ? fmtMoney(outstanding(c.id)) : "—"}</td>
                  <td className="px-3 py-2.5"><Chip tone={STATUS_TONE[c.status]}>{c.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <Empty icon="heart" text="No clients match the current filter." />}
        </div>
      </Card>

      {/* detail drawer */}
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel ? sel.name : ""}>
        {sel && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Chip tone={STATUS_TONE[sel.status]}>{sel.status}</Chip>
              <Chip tone={sel.risk === "high" ? "red" : sel.risk === "medium" ? "amber" : "green"}>risk: {sel.risk}</Chip>
              {sel.hmo && <Chip tone="violet">{sel.hmo}</Chip>}
            </div>
            <div className="rounded-md border border-pine-100 bg-paper p-3">
              <KV k="Date of birth" v={sel.dob} /><KV k="Phone" v={sel.phone} /><KV k="Address" v={sel.address} />
              <KV k="Referring physician" v={sel.physician} /><KV k="Care team" v={sel.team} /><KV k="Plan / co-pay" v={`${sel.plan} · ${sel.copayPct}%`} />
              <KV k="Last visit" v={sel.lastVisit} /><KV k="Next visit" v={sel.nextVisit} />
            </div>
            <div>
              <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Intake checklist</p>
              <Progress pct={62} tone="amber" />
              <p className="mt-1 text-[11px] text-pine-500">5 of {db.checklist.length} items complete — 2 required documents outstanding (see Compliance).</p>
            </div>
            <div className="rounded-md border border-info-500/30 bg-info-100/60 px-3 py-2 text-[11.5px] leading-snug text-info-700">
              <b>FS EHR link:</b> clinical chart open in FS EHR (Volume 1). Notes stay clinical-side; demographics sync both ways.
            </div>
            <div className="flex gap-2">
              <Btn size="sm" onClick={() => { setSel(null); toast(`Booking flow started for ${sel.name}`, "info"); }}><Icon name="calendar" size={13} /> Book visit</Btn>
              <Btn size="sm" kind="outline" onClick={() => toast(`Statement emailed to ${sel.name}`, "ok")}><Icon name="send" size={13} /> Send statement</Btn>
            </div>
          </div>
        )}
      </Drawer>

      {/* add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="New client intake" wide
        footer={<><Btn kind="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn onClick={add}><Icon name="check" size={14} /> Create record</Btn></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Rosa Dela Cruz" /></Field>
          <Field label="Date of birth"><input type="date" className={inputCls} value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} /></Field>
          <Field label="Phone"><input className={inputCls} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" /></Field>
          <Field label="Zone"><select className={inputCls} value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}>{["North", "South", "East", "West", "Central"].map(z => <option key={z}>{z}</option>)}</select></Field>
          <Field label="Address"><input className={inputCls} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Street, city" /></Field>
          <Field label="Referring physician"><input className={inputCls} value={form.physician} onChange={e => setForm({ ...form, physician: e.target.value })} placeholder="Dr. …" /></Field>
          <Field label="HMO / payer"><select className={inputCls} value={form.hmo} onChange={e => setForm({ ...form, hmo: e.target.value, plan: e.target.value || "Private Pay" })}>
            <option value="">Private / Self-Pay</option><option>SeniorCare HMO</option><option>MediPlus HMO</option><option>BlueCare HMO</option>
          </select></Field>
          <Field label="Primary service"><select className={inputCls} value={form.svc} onChange={e => setForm({ ...form, svc: e.target.value })}>{db.services.filter(s => s.active).map(s => <option key={s.id}>{s.name}</option>)}</select></Field>
        </div>
        <p className="mt-3 rounded-md bg-pulse-50 px-3 py-2 text-[11.5px] text-pulse-800">
          Intake will auto-create the document checklist ({db.checklist.filter(k => k.required).length} required) and sync demographics to FS EHR on save.
        </p>
      </Modal>
    </div>
  );
}
