import { useState } from "react";
import { dayOffset, fmtDate, fmtMoney, HMO_PLANS, uid } from "../data";
import type { Invoice, InvoiceItem } from "../data";
import { useApp } from "../state";
import { CompanyMark, Emblem } from "../components/Logo";
import { Btn, Card, Chip, Icon, KV, Modal, STATUS_TONE, SectionHead, Field, inputCls, Empty } from "../components/ui";

export function calc(inv: Pick<Invoice, "items" | "coveragePct">) {
  const subtotal = inv.items.reduce((a, it) => a + it.qty * it.rate, 0);
  const covered = subtotal * (inv.coveragePct / 100);
  return { subtotal, covered, copay: subtotal - covered };
}

export function Billing() {
  const { db, setDb, toast, cfg } = useApp();
  const [filter, setFilter] = useState("all");
  const [buildOpen, setBuildOpen] = useState(false);
  const [detail, setDetail] = useState<Invoice | null>(null);
  const [clientId, setClientId] = useState("");
  const [planIdx, setPlanIdx] = useState(3);
  const [lines, setLines] = useState<InvoiceItem[]>([{ desc: "", qty: 1, rate: 0 }]);

  const client = (id: string) => db.clients.find(c => c.id === id);
  const list = db.invoices.filter(i => filter === "all" || i.status === filter);
  const totals = {
    open: db.invoices.filter(i => ["sent", "overdue"].includes(i.status)).reduce((a, i) => a + calc(i).copay, 0),
    claims: db.invoices.filter(i => i.status === "claim").reduce((a, i) => a + calc(i).covered, 0),
    paid: db.invoices.filter(i => i.status === "paid").reduce((a, i) => a + calc(i).subtotal, 0),
  };

  const pickService = (idx: number, name: string) => {
    const s = db.services.find(x => x.name === name);
    setLines(lines.map((l, i) => i === idx ? { desc: name, qty: l.qty, rate: s?.rate ?? 0 } : l));
  };

  const create = () => {
    const c = client(clientId);
    if (!c) { toast("Choose a client first.", "warn"); return; }
    const clean = lines.filter(l => l.desc && l.rate > 0);
    if (clean.length === 0) { toast("Add at least one billed service.", "warn"); return; }
    const plan = HMO_PLANS[planIdx];
    const inv: Invoice = {
      id: uid(), number: `INV-${2600 + db.invoices.length + 1}`, clientId, date: dayOffset(0), due: dayOffset(14),
      items: clean, hmo: plan.coveragePct > 0 ? plan.name : null, coveragePct: plan.coveragePct, status: "draft",
    };
    setDb(d => ({ ...d, invoices: [inv, ...d.invoices] }));
    toast(`${inv.number} drafted — client co-pay ${fmtMoney(calc(inv).copay)}`, "ok");
    setBuildOpen(false); setLines([{ desc: "", qty: 1, rate: 0 }]); setClientId("");
  };

  const setStatus = (id: string, status: Invoice["status"], msg: string) => {
    setDb(d => ({ ...d, invoices: d.invoices.map(i => i.id === id ? { ...i, status } : i) }));
    setDetail(dd => dd && dd.id === id ? { ...dd, status } : dd);
    toast(msg, "ok");
  };

  const draftCalc = calc({ items: lines.filter(l => l.desc), coveragePct: HMO_PLANS[planIdx].coveragePct });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Billing / invoicing · §1.5 — HMO co-pay handling" title="Billing & Claims" icon="invoice" />
        <Btn onClick={() => setBuildOpen(true)}><Icon name="plus" size={15} /> New invoice</Btn>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { k: "Client balances open", v: totals.open, tone: "text-vita-600", sub: "co-pay responsibility, sent + overdue" },
          { k: "HMO claims in flight", v: totals.claims, tone: "text-[#6a48b8]", sub: "covered portion submitted to payers" },
          { k: "Collected (paid)", v: totals.paid, tone: "text-pulse-600", sub: "settled invoices this period" },
        ].map((s, i) => (
          <Card key={i} className="anim-fade-up" pad={false}>
            <div className="p-4" style={{ animationDelay: `${i * 70}ms` }}>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-pine-400">{s.k}</p>
              <p className={`mt-1 font-mono text-[24px] font-semibold leading-none tnum ${s.tone}`}>{fmtMoney(s.v)}</p>
              <p className="mt-1.5 text-[11px] text-pine-500">{s.sub}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {["all", "draft", "sent", "claim", "paid", "overdue"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold capitalize transition-all ${filter === f ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>
            {f} {f !== "all" && <span className="font-mono opacity-60 tnum">{db.invoices.filter(i => i.status === f).length}</span>}
          </button>
        ))}
      </div>

      <Card pad={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-pine-200 bg-paper/80 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-pine-500">
                <th className="px-4 py-2.5">Invoice</th><th className="px-3 py-2.5">Client</th><th className="px-3 py-2.5">Issued / due</th>
                <th className="px-3 py-2.5">Billed</th><th className="px-3 py-2.5">HMO covered</th><th className="px-3 py-2.5">Co-pay due</th><th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv, i) => {
                const c = calc(inv);
                return (
                  <tr key={inv.id} onClick={() => setDetail(inv)} className="cursor-pointer border-b border-pine-100 transition-colors last:border-0 hover:bg-pulse-50/50 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="px-4 py-2.5 font-mono text-[12px] font-semibold text-pine-800">{inv.number}</td>
                    <td className="px-3 py-2.5 font-bold text-pine-900">{client(inv.clientId)?.name ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-pine-500 tnum">{fmtDate(inv.date)} → {fmtDate(inv.due)}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-pine-900 tnum">{fmtMoney(c.subtotal)}</td>
                    <td className="px-3 py-2.5 font-mono text-[#6a48b8] tnum">{inv.hmo ? fmtMoney(c.covered) : "—"}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-vita-600 tnum">{fmtMoney(c.copay)}</td>
                    <td className="px-3 py-2.5"><Chip tone={STATUS_TONE[inv.status]}>{inv.status}</Chip></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {list.length === 0 && <Empty icon="invoice" text="No invoices in this state." />}
        </div>
      </Card>

      {/* ---------- builder ---------- */}
      <Modal open={buildOpen} onClose={() => setBuildOpen(false)} title="New invoice — HMO co-pay engine" wide
        footer={<><Btn kind="ghost" onClick={() => setBuildOpen(false)}>Cancel</Btn><Btn onClick={create}><Icon name="invoice" size={14} /> Create draft</Btn></>}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client">
              <select className={inputCls} value={clientId} onChange={e => {
                setClientId(e.target.value);
                const c = client(e.target.value);
                if (c?.hmo) { const idx = HMO_PLANS.findIndex(p => p.name === c.hmo); if (idx >= 0) setPlanIdx(idx); }
              }}>
                <option value="">Select client…</option>
                {db.clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.hmo ? ` · ${c.hmo}` : " · self-pay"}</option>)}
              </select>
            </Field>
            <Field label="Payer / HMO plan">
              <select className={inputCls} value={planIdx} onChange={e => setPlanIdx(+e.target.value)}>
                {HMO_PLANS.map((p, i) => <option key={p.name} value={i}>{p.name} — {p.coveragePct}% covered</option>)}
              </select>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Line items (from rate card)</p>
            <div className="space-y-1.5">
              {lines.map((l, i) => (
                <div key={i} className="flex items-center gap-2">
                  <select className={`${inputCls} flex-1`} value={l.desc} onChange={e => pickService(i, e.target.value)}>
                    <option value="">Select service…</option>
                    {db.services.filter(s => s.active).map(s => <option key={s.id} value={s.name}>{s.name} — {fmtMoney(s.rate)}</option>)}
                  </select>
                  <input type="number" min={1} value={l.qty} onChange={e => setLines(lines.map((x, j) => j === i ? { ...x, qty: +e.target.value } : x))}
                    className="w-16 rounded-md border border-pine-300 px-2 py-2 text-center font-mono text-[12px] tnum" />
                  <span className="w-20 text-right font-mono text-[12px] font-semibold text-pine-800 tnum">{fmtMoney(l.qty * l.rate)}</span>
                  <button onClick={() => setLines(lines.filter((_, j) => j !== i))} disabled={lines.length === 1} className="text-pine-300 transition-colors hover:text-danger-500 disabled:opacity-30"><Icon name="x" size={14} /></button>
                </div>
              ))}
              <button onClick={() => setLines([...lines, { desc: "", qty: 1, rate: 0 }])} className="text-[12px] font-bold text-pulse-600 hover:underline">+ Add line</button>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-pine-200 bg-paper p-3 sm:grid-cols-4">
            <div><p className="font-mono text-[9px] uppercase tracking-wider text-pine-400">Billed</p><p className="font-mono text-[16px] font-semibold text-pine-900 tnum">{fmtMoney(draftCalc.subtotal)}</p></div>
            <div><p className="font-mono text-[9px] uppercase tracking-wider text-pine-400">HMO covers {HMO_PLANS[planIdx].coveragePct}%</p><p className="font-mono text-[16px] font-semibold text-[#6a48b8] tnum">−{fmtMoney(draftCalc.covered)}</p></div>
            <div><p className="font-mono text-[9px] uppercase tracking-wider text-pine-400">Client co-pay</p><p className="font-mono text-[16px] font-semibold text-vita-600 tnum">{fmtMoney(draftCalc.copay)}</p></div>
            <div><p className="font-mono text-[9px] uppercase tracking-wider text-pine-400">Claim to payer</p><p className="font-mono text-[16px] font-semibold text-pulse-600 tnum">{HMO_PLANS[planIdx].coveragePct > 0 ? "auto-queued" : "n/a"}</p></div>
          </div>
          {cfg?.bookingRules.hmoPreauth && <p className="text-[11px] text-pine-500">Pre-authorization on file required before claim submission (booking rule enabled).</p>}
        </div>
      </Modal>

      {/* ---------- detail + letterhead ---------- */}
      <Modal open={!!detail} onClose={() => setDetail(null)} wide title={detail ? `${detail.number} — ${client(detail.clientId)?.name}` : ""}
        footer={detail ? <>
          <Btn kind="outline" onClick={() => window.print()}><Icon name="printer" size={14} /> Print letterhead copy</Btn>
          {detail.status === "draft" && <Btn kind="dark" onClick={() => setStatus(detail.id, "sent", `${detail.number} sent to client & guarantor`)}><Icon name="send" size={14} /> Send</Btn>}
          {detail.status === "sent" && <Btn onClick={() => setStatus(detail.id, "paid", `${detail.number} payment recorded — receipt issued`)}><Icon name="check" size={14} /> Record payment</Btn>}
          {(detail.status === "draft" || detail.status === "sent") && detail.hmo && (
            <Btn kind="amber" onClick={() => setStatus(detail.id, "claim", `${detail.number} claim submitted to ${detail.hmo}`)}><Icon name="shield" size={14} /> Submit HMO claim</Btn>
          )}
        </> : undefined}>
        {detail && (() => {
          const c = calc(detail);
          return (
            <div className="print-root rounded-md border border-pine-200 bg-white p-6">
              {/* letterhead — Logo Standard §4: pairing row + 2px rule */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <CompanyMark src={cfg?.companyLogo} name={cfg?.company ?? "Client Org"} size={42} />
                  <div>
                    <p className="font-display text-[17px] font-extrabold leading-tight text-pine-900">{cfg?.company ?? "Client Organization"}</p>
                    <p className="text-[10.5px] text-pine-500">Billing dept · {cfg?.accountManager} · {cfg?.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {cfg?.systemLogo ? <img src={cfg.systemLogo} alt="system" className="h-8 w-8 rounded object-cover" /> : <Emblem size={32} />}
                  <div className="text-right">
                    <p className="font-display text-[14px] font-extrabold leading-none text-pine-900">FS CareOps</p>
                    <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-pine-500">Clinics · Home Health · Wellness</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 h-[2.5px] w-full bg-pine-900" />

              <div className="mt-4 flex items-start justify-between">
                <div className="text-[12px]">
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-pine-400">Bill to</p>
                  <p className="font-bold text-pine-900">{client(detail.clientId)?.name}</p>
                  <p className="text-pine-500">{client(detail.clientId)?.address}</p>
                  <p className="text-pine-500">Plan: {detail.hmo ?? "Private / Self-Pay"}{detail.hmo ? ` (${detail.coveragePct}% covered)` : ""}</p>
                </div>
                <div className="text-right text-[12px]">
                  <p className="font-mono text-[18px] font-semibold text-pine-900">{detail.number}</p>
                  <p className="text-pine-500">Issued {fmtDate(detail.date)} · Due {fmtDate(detail.due)}</p>
                  <Chip tone={STATUS_TONE[detail.status]}>{detail.status}</Chip>
                </div>
              </div>

              <table className="mt-4 w-full text-[12px]">
                <thead><tr className="border-y border-pine-200 bg-paper font-mono text-[9px] uppercase tracking-wider text-pine-500">
                  <th className="px-2 py-1.5 text-left">Service</th><th className="px-2 py-1.5 text-center">Qty</th><th className="px-2 py-1.5 text-right">Rate</th><th className="px-2 py-1.5 text-right">Amount</th>
                </tr></thead>
                <tbody>
                  {detail.items.map((it, i) => (
                    <tr key={i} className="border-b border-pine-100">
                      <td className="px-2 py-1.5 font-semibold text-pine-800">{it.desc}</td>
                      <td className="px-2 py-1.5 text-center font-mono tnum">{it.qty}</td>
                      <td className="px-2 py-1.5 text-right font-mono tnum">{fmtMoney(it.rate)}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold tnum">{fmtMoney(it.qty * it.rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-4 ml-auto w-full max-w-[260px] space-y-1 text-[12px]">
                <KV k="Billed amount" v={<span className="font-mono tnum">{fmtMoney(c.subtotal)}</span>} />
                <KV k={`HMO covered (${detail.coveragePct}%)`} v={<span className="font-mono text-[#6a48b8] tnum">−{fmtMoney(c.covered)}</span>} />
                <div className="flex items-baseline justify-between rounded bg-pine-900 px-2 py-1.5 text-pine-50">
                  <span className="font-bold">Client co-pay due</span><span className="font-mono text-[15px] font-semibold tnum">{fmtMoney(c.copay)}</span>
                </div>
              </div>

              {/* printed-output footer — Logo Standard §5 */}
              <div className="no-print-none mt-6 border-t border-pine-200 pt-2 text-center">
                <p className="font-mono text-[8.5px] tracking-wide text-pine-500">
                  FS CareOps v1.0.0 — © {new Date().getFullYear()} FS Softwares in collaboration with TophComm Systems · Program Creator & Owner: Fritz Suarez, CPM®, CLMP®, CLSSMBB®, CLSCM®, CISSP®, PMP®
                </p>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
