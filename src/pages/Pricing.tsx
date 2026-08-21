import { useState } from "react";
import { fmtMoney } from "../data";
import { SLA_META } from "../platform";
import type { PackageRec } from "../platform";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Modal, SectionHead, Toggle } from "../components/ui";
import { DataGrid } from "../components/DataGrid";
import type { Col } from "../components/DataGrid";

/* ============================================================
   Phase 11 — Pricing Console. ROOT-ONLY, outside the Phase 6
   Company Setup boundary. Rates stay blank ($0.00 / TBD) until
   FS Softwares sets them — editable any time, no redeployment.
   ============================================================ */

export function PricingConsole() {
  const { pricing, setPricing, sessionUser, entitlementKey, license, hrEnabled, toggleHR, toast } = useApp();
  const [editing, setEditing] = useState<PackageRec | null>(null);
  const [rate, setRate] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [confirmHR, setConfirmHR] = useState(false);

  if (!sessionUser?.isRoot) {
    return (
      <Card className="circuit-bg mx-auto max-w-xl p-10 text-center anim-pop">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pine-900 text-vita-400"><Icon name="lock" size={26} /></span>
        <h2 className="mt-4 font-display text-xl font-extrabold text-pine-900">Pricing Console is Root-only</h2>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-pine-500">
          Pricing records and license-axis entitlements sit <b>outside the Company Setup boundary</b> and are managed
          exclusively by FS Softwares (Root). Client administrators cannot view or influence rates.
        </p>
      </Card>
    );
  }

  const saveRate = () => {
    if (!editing) return;
    const amount = rate.trim() === "" ? null : Math.max(0, +rate);
    setPricing(ps => ps.map(p => p.package_id === editing.package_id
      ? { ...p, price_amount: amount, currency: amount === null ? null : currency, is_published: amount === null ? false : p.is_published }
      : p));
    toast(amount === null
      ? `${editing.package_id} rate cleared — back to TBD, unpublished`
      : `${editing.package_id} rate set to ${fmtMoney(amount)} ${currency} — publish when ready`, "ok");
    setEditing(null);
  };

  const publish = (p: PackageRec) => {
    if (p.price_amount === null) { toast("Cannot publish — set a rate first. Blank rates are internal/demo only.", "warn"); return; }
    setPricing(ps => ps.map(x => x.package_id === p.package_id ? { ...x, is_published: !x.is_published } : x));
    toast(`${p.package_id} ${p.is_published ? "unpublished — assignable internally only" : "published — visible as purchasable"}`, p.is_published ? "warn" : "ok");
  };

  const cols: Col<PackageRec>[] = [
    { key: "package_id", label: "Package ID", mono: true, sortVal: p => p.package_id },
    { key: "name", label: "Package", sortVal: p => p.name, render: p => (
      <span><span className="block font-extrabold text-pine-900">{p.name}</span>
        <span className="block max-w-[300px] truncate text-[10.5px] text-pine-400">{p.grants}</span></span>) },
    { key: "axis_type", label: "Axis", sortVal: p => p.axis_type, render: p => (
      <Chip tone={p.axis_type === "corporate" ? "violet" : p.axis_type === "seat" ? "blue" : "green"}>{p.axis_type}</Chip>) },
    { key: "billing_cycle", label: "Cycle", mono: true, sortVal: p => p.billing_cycle },
    { key: "support_tier", label: "Support SLA", sortVal: p => p.support_tier, render: p => (
      <span className="font-mono text-[10px] font-semibold text-pine-500">{SLA_META[p.support_tier]}</span>) },
    { key: "price_amount", label: "Rate", align: "right", sortVal: p => p.price_amount ?? -1, render: p =>
      p.price_amount === null
        ? <span className="rounded bg-vita-100 px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-vita-600">$0.00 · TBD</span>
        : <span className="font-mono text-[12px] font-bold text-pine-900 tnum">{fmtMoney(p.price_amount)} {p.currency}</span> },
    { key: "is_published", label: "Published", render: p => <Toggle on={p.is_published} onChange={() => publish(p)} /> },
    { key: "act", label: "", render: p => (
      <button onClick={() => { setEditing(p); setRate(p.price_amount === null ? "" : String(p.price_amount)); setCurrency(p.currency ?? "USD"); }}
        className="rounded border border-pine-200 px-2 py-1 font-mono text-[10px] font-bold text-pine-600 transition-all hover:border-pulse-500 hover:text-pulse-700 active:scale-95">
        set rate
      </button>) },
  ];

  const axes = [
    { name: "By Department", desc: "License only the modules a department needs — roll out incrementally.", icon: "cpu", ids: "DEP-*" },
    { name: "By Role / Seat", desc: "Per-seat licensing bound to a RACI role template — buy N “AP Clerk” seats, M “Controller” seats.", icon: "users", ids: "SEAT-*" },
    { name: "Corporate Pack", desc: "Starter · Pro · Enterprise — the simplest buyer path with bundled caps & SLAs.", icon: "globe", ids: "CORP-*" },
  ];

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <SectionHead kicker="Phase 11 · Root-only · outside Company Setup boundary" title="Pricing Console" icon="tag"
          right={<Chip tone="dark">ROOT — FS Softwares internal</Chip>} />
        <p className="mt-1 max-w-3xl text-[12px] leading-snug text-pine-500">
          Three purchase axes, one pricing table. <b className="text-pine-700">Rates are stored as editable records</b> — blank
          (<span className="font-mono text-[11px]">$0.00 / TBD</span>) until set, changeable after launch without a code deployment.
          Unpublished packages remain assignable by Root for internal, demo and pilot use.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {axes.map((a, i) => (
          <Card key={a.name} className="anim-fade-up transition-all hover:-translate-y-0.5 hover:shadow-pop" pad={false}>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-pine-900 text-pulse-300"><Icon name={a.icon} size={17} /></span>
                <span className="font-mono text-[10px] font-bold text-pine-400">{a.ids}</span>
              </div>
              <h3 className="mt-2 font-display text-[15px] font-extrabold text-pine-900">{a.name}</h3>
              <p className="mt-1 text-[11.5px] leading-snug text-pine-500">{a.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      <DataGrid cols={cols} rows={pricing} rowKey={p => p.package_id} pageSize={10} searchable />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Current entitlement" icon="key" right={<Chip tone="green" pulse>active</Chip>} />
          <div className="rounded-md bg-pine-950 p-3.5">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-pine-500">Activated license key</p>
            <p className="mt-1 break-all font-mono text-[13px] font-bold text-pulse-300">{license ?? "—"}</p>
            <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-pine-500">Entitlement encoding (axis · seats · companies · HR)</p>
            <p className="mt-1 break-all font-mono text-[13px] font-bold text-pine-200">{entitlementKey}</p>
          </div>
          <p className="mt-2.5 text-[11px] leading-snug text-pine-500">
            Keys encode exactly what was purchased — mid-life upgrades (e.g. adding the HR add-on to a Pro license)
            re-issue the suffix <span className="font-mono font-bold text-pine-700">-HR00 → -HR01</span> with no reinstall.
          </p>
        </Card>

        <Card>
          <SectionHead title="HR add-on entitlement" icon="users"
            right={<Chip tone={hrEnabled ? "green" : "gray"}>{hrEnabled ? "unlocked" : "inactive"}</Chip>} />
          <div className="flex items-center justify-between rounded-md border border-pine-200 bg-paper/60 px-3.5 py-3">
            <div>
              <p className="text-[13px] font-extrabold text-pine-900">Phase 9 — HR & Payroll module</p>
              <p className="text-[10.5px] text-pine-500">DEP-HR pack · Corporate Pro toggle · Enterprise included</p>
            </div>
            <Toggle on={hrEnabled} onChange={() => (hrEnabled ? setConfirmHR(true) : toggleHR())} />
          </div>
          <ul className="mt-3 space-y-1.5 text-[11.5px] text-pine-600">
            <li className="flex gap-2"><Icon name="check" size={12} sw={2.4} className="text-pulse-600" /> Hides from nav & RACI matrix while inactive</li>
            <li className="flex gap-2"><Icon name="check" size={12} sw={2.4} className="text-pulse-600" /> Deactivation <b>archives</b> data — never deletes</li>
            <li className="flex gap-2"><Icon name="check" size={12} sw={2.4} className="text-pulse-600" /> Reports feed the shared BI engine, not a separate stack</li>
          </ul>
        </Card>
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={`Set rate — ${editing?.package_id}`}
        footer={<>
          <span className="mr-auto font-mono text-[10px] text-pine-400">changeable post-launch · no deployment needed</span>
          <Btn kind="ghost" onClick={() => setEditing(null)}>Cancel</Btn>
          <Btn onClick={saveRate}><Icon name="check" size={14} /> Save rate</Btn>
        </>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-pine-500">Rate amount (blank = TBD)</label>
            <input value={rate} onChange={e => setRate(e.target.value)} placeholder="0.00" inputMode="decimal"
              className="w-full rounded-md border border-pine-200 bg-white px-3 py-2 font-mono text-[15px] font-bold text-pine-900 outline-none transition-colors focus:border-pulse-500 tnum" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-pine-500">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)}
              className="w-full rounded-md border border-pine-200 bg-white px-3 py-2 font-mono text-[13px] font-bold text-pine-900 outline-none focus:border-pulse-500">
              {["USD", "EUR", "GBP", "PHP", "CAD"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <p className="mt-3 rounded-md bg-paper px-3 py-2 text-[11px] leading-snug text-pine-500">
          Publishing is a separate switch — a rate can be recorded internally before FS Softwares approves public pricing.
        </p>
      </Modal>

      <Modal open={confirmHR} onClose={() => setConfirmHR(false)} title="Deactivate HR add-on?"
        footer={<>
          <Btn kind="ghost" onClick={() => setConfirmHR(false)}>Keep active</Btn>
          <Btn kind="danger" onClick={() => { toggleHR(); setConfirmHR(false); }}><Icon name="lock" size={14} /> Deactivate & archive</Btn>
        </>}>
        <p className="rounded-md border border-vita-400 bg-vita-100 px-3 py-2.5 text-[12px] font-semibold leading-snug text-vita-600">
          HR data will be <b>archived, not deleted</b> — employees, payroll history and approvals stay intact for
          compliance audits or later reactivation. The module disappears from navigation and the RACI matrix immediately.
        </p>
      </Modal>
    </div>
  );
}
