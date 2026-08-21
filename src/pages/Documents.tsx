import { useState } from "react";
import { fmtDate, uid } from "../data";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, SectionHead, STATUS_TONE, inputCls, Empty } from "../components/ui";

export function Documents() {
  const { db, setDb, toast } = useApp();
  const [filter, setFilter] = useState("all");
  const [newItem, setNewItem] = useState("");

  const list = db.docs.filter(d => filter === "all" || d.status === filter);
  const counts = {
    valid: db.docs.filter(d => d.status === "valid").length,
    expiring: db.docs.filter(d => d.status === "expiring").length,
    expired: db.docs.filter(d => d.status === "expired").length,
    missing: db.docs.filter(d => d.status === "missing").length,
  };

  const renew = (id: string) => {
    setDb(d => ({ ...d, docs: d.docs.map(x => x.id === id ? { ...x, status: "valid", updated: new Date().toISOString().slice(0, 10), expiry: `${new Date().getFullYear() + 1}${x.expiry.slice(4)}` } : x) }));
    toast("Renewal request sent to document owner — e-sign link issued", "ok");
  };

  const simulateUpload = () => {
    const names = ["HMO Eligibility Response", "Signed Care Plan", "TB Clearance — Staff", "Liability Insurance COI"];
    const n = names[Math.floor(Math.random() * names.length)];
    setDb(d => ({ ...d, docs: [{ id: uid(), name: n, kind: "Upload", holder: "Organization", updated: new Date().toISOString().slice(0, 10), expiry: `${new Date().getFullYear() + 1}-12-31`, status: "valid" }, ...d.docs] }));
    toast(`“${n}” uploaded, virus-scanned & indexed`, "ok");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Compliance / document management · §1.7" title="Compliance Vault" icon="shield" />
        <Btn onClick={simulateUpload}><Icon name="upload" size={15} /> Upload document</Btn>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([["valid", "Valid", "text-pulse-600"], ["expiring", "Expiring ≤ 60d", "text-vita-600"], ["expired", "Expired", "text-danger-600"], ["missing", "Missing", "text-danger-600"]] as const).map(([k, label, tone], i) => (
          <button key={k} onClick={() => setFilter(filter === k ? "all" : k)}
            className={`rounded-lg border bg-white p-3.5 text-left shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop anim-fade-up ${filter === k ? "border-pine-900 ring-2 ring-pine-900/20" : "border-pine-200"}`}
            style={{ animationDelay: `${i * 60}ms` }}>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-pine-400">{label}</p>
            <p className={`mt-1 font-mono text-[24px] font-semibold leading-none tnum ${tone}`}>{counts[k]}</p>
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card pad={false} className="xl:col-span-2">
          <div className="border-b border-pine-200 bg-paper/80 px-4 py-2.5 font-display text-[14px] font-extrabold text-pine-900">Document register</div>
          <div className="divide-y divide-pine-100">
            {list.map((d, i) => (
              <div key={d.id} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pulse-50/50 anim-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                <span className={`shrink-0 ${d.status === "valid" ? "text-pulse-600" : d.status === "expiring" ? "text-vita-500" : "text-danger-500"}`}><Icon name="doc" size={18} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-pine-900">{d.name}</p>
                  <p className="text-[10.5px] text-pine-500">{d.kind} · {d.holder} · updated {d.updated === "—" ? "never" : fmtDate(d.updated)}</p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="font-mono text-[10.5px] text-pine-500 tnum">exp {d.expiry === "—" ? "—" : fmtDate(d.expiry)}</p>
                </div>
                <Chip tone={STATUS_TONE[d.status]}>{d.status}</Chip>
                {d.status !== "valid" && (
                  <button onClick={() => renew(d.id)} className="rounded-md border border-pine-200 bg-white px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-pine-600 opacity-0 transition-all group-hover:opacity-100 hover:border-pulse-500 hover:text-pulse-700">
                    Renew
                  </button>
                )}
              </div>
            ))}
            {list.length === 0 && <Empty icon="shield" text="Nothing in this state — vault is clean." />}
          </div>
        </Card>

        <Card>
          <SectionHead kicker="Editable defaults" title="Intake checklist template" icon="check" />
          <div className="space-y-1.5">
            {db.checklist.map(c => (
              <div key={c.id} className="flex items-center gap-2 rounded-md border border-pine-100 bg-paper/70 px-2.5 py-1.5">
                <input type="checkbox" checked={c.required} onChange={() => setDb(d => ({ ...d, checklist: d.checklist.map(x => x.id === c.id ? { ...x, required: !x.required } : x) }))} className="accent-[#0f6f58]" />
                <span className="flex-1 text-[12px] text-pine-800">{c.label}</span>
                <span className={`font-mono text-[8.5px] font-bold uppercase ${c.required ? "text-danger-500" : "text-pine-400"}`}>{c.required ? "req" : "opt"}</span>
                <button onClick={() => setDb(d => ({ ...d, checklist: d.checklist.filter(x => x.id !== c.id) }))} className="text-pine-300 hover:text-danger-500"><Icon name="x" size={12} /></button>
              </div>
            ))}
            <div className="flex gap-2 pt-1">
              <input className={inputCls} placeholder="Add requirement…" value={newItem} onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) { setDb(d => ({ ...d, checklist: [...d.checklist, { id: uid(), label: newItem.trim(), required: false }] })); setNewItem(""); toast("Checklist item added", "ok"); } }} />
              <Btn kind="outline" size="sm" onClick={() => { if (newItem.trim()) { setDb(d => ({ ...d, checklist: [...d.checklist, { id: uid(), label: newItem.trim(), required: false }] })); setNewItem(""); toast("Checklist item added", "ok"); } }}><Icon name="plus" size={14} /></Btn>
            </div>
          </div>
          <div className="mt-4 rounded-md border border-info-500/30 bg-info-100/60 px-3 py-2 text-[11px] leading-snug text-info-700">
            Checklist applies to every new client intake; blockers prevent first-visit booking until required items are on file.
          </div>
        </Card>
      </div>
    </div>
  );
}
