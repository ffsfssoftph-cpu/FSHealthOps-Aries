import { useState } from "react";
import { fmtMoney, uid } from "../data";
import type { ServiceItem, ServicePackage } from "../data";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Modal, SectionHead, Field, inputCls, Toggle } from "../components/ui";

export function Services() {
  const { db, setDb, toast, role } = useApp();
  const [cat, setCat] = useState("all");
  const [pkgOpen, setPkgOpen] = useState(false);
  const [pkgName, setPkgName] = useState("");
  const [pkgItems, setPkgItems] = useState<string[]>([]);

  const canEdit = ["super", "admin", "manager", "billing"].includes(role);
  const cats = ["all", ...Array.from(new Set(db.services.map(s => s.category)))];
  const list = db.services.filter(s => cat === "all" || s.category === cat);
  const svcName = (id: string) => db.services.find(s => s.id === id)?.name ?? "—";

  const setRate = (id: string, rate: number) =>
    setDb(d => ({ ...d, services: d.services.map(s => s.id === id ? { ...s, rate } : s) }));

  const toggleActive = (id: string) => {
    const s = db.services.find(x => x.id === id);
    setDb(d => ({ ...d, services: d.services.map(x => x.id === id ? { ...x, active: !x.active } : x) }));
    toast(`${s?.name} ${s?.active ? "retired from" : "published to"} the rate card`, s?.active ? "warn" : "ok");
  };

  const createPkg = () => {
    if (!pkgName.trim() || pkgItems.length === 0) { toast("Name the package and pick at least one service.", "warn"); return; }
    const base = pkgItems.reduce((a, id) => a + (db.services.find(s => s.id === id)?.rate ?? 0), 0);
    const p: ServicePackage = { id: uid(), name: pkgName.trim(), items: pkgItems, price: Math.round(base * 0.92) };
    setDb(d => ({ ...d, packages: [...d.packages, p] }));
    toast(`Package “${p.name}” published at ${fmtMoney(p.price)} (8% bundle discount)`, "ok");
    setPkgOpen(false); setPkgName(""); setPkgItems([]);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Service packages & rate card · §1.3" title="Packages & Rate Card" icon="tag" />
        <div className="flex flex-wrap gap-1.5">
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold capitalize transition-all ${cat === c ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>
              {c === "all" ? "All categories" : c}
            </button>
          ))}
          <Btn size="sm" className="ml-1" onClick={() => setPkgOpen(true)} disabled={!canEdit} title={canEdit ? "" : "Requires Billing/Admin role"}><Icon name="plus" size={14} /> New package</Btn>
        </div>
      </div>

      {/* packages */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {db.packages.map((p, i) => (
          <div key={p.id} className="group relative flex flex-col rounded-lg border border-pine-200 bg-pine-950 p-4 text-pine-50 shadow-lift transition-all duration-300 hover:-translate-y-1.5 hover:shadow-pop anim-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            {p.tag && <span className="absolute -top-2 right-3 rounded bg-vita-500 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-pine-950">{p.tag}</span>}
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-pulse-300">Care package</p>
            <h3 className="mt-1 font-display text-[17px] font-extrabold leading-tight">{p.name}</h3>
            <ul className="mt-3 flex-1 space-y-1.5">
              {p.items.map((id, j) => (
                <li key={j} className="flex items-center gap-2 text-[11.5px] text-pine-300">
                  <span className="text-pulse-400"><Icon name="check" size={12} sw={2.4} /></span>{svcName(id)}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-end justify-between border-t border-pine-800 pt-3">
              <div>
                <p className="font-mono text-[22px] font-semibold leading-none text-pulse-300 tnum">{fmtMoney(p.price)}</p>
                <p className="mt-1 text-[9.5px] uppercase tracking-wider text-pine-500">per episode · bundled</p>
              </div>
              <button onClick={() => toast(`“${p.name}” added to booking widget`, "ok")} className="rounded-md bg-pulse-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-pulse-500 active:scale-95">Offer</button>
            </div>
          </div>
        ))}
      </div>

      {/* rate card */}
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
          <h3 className="font-display text-[14px] font-extrabold text-pine-900">Rate card — Health Care preset</h3>
          <span className="font-mono text-[10px] uppercase tracking-wider text-pine-400">{canEdit ? "editable — changes apply to new invoices" : "read-only for your role"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b border-pine-200 text-left font-mono text-[9.5px] uppercase tracking-[0.14em] text-pine-500">
                <th className="px-4 py-2.5">Code</th><th className="px-3 py-2.5">Service</th><th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Rate</th><th className="px-3 py-2.5">Unit</th><th className="px-3 py-2.5">HMO covered</th><th className="px-3 py-2.5">Published</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} className={`border-b border-pine-100 transition-colors last:border-0 hover:bg-pulse-50/40 ${!s.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-pine-500">{s.code}</td>
                  <td className="px-3 py-2.5 font-bold text-pine-900">{s.name}</td>
                  <td className="px-3 py-2.5"><Chip tone="gray">{s.category}</Chip></td>
                  <td className="px-3 py-2.5">
                    {canEdit ? (
                      <span className="inline-flex items-center gap-1">
                        <span className="font-mono text-[11px] text-pine-400">$</span>
                        <input type="number" defaultValue={s.rate} key={s.rate}
                          onBlur={e => { const v = +e.target.value; if (v !== s.rate && v > 0) { setRate(s.id, v); toast(`${s.name} rate → ${fmtMoney(v)}`, "ok"); } }}
                          className="w-20 rounded border border-pine-200 bg-white px-2 py-1 font-mono text-[12px] font-semibold text-pine-900 outline-none focus:border-pulse-500 tnum" />
                      </span>
                    ) : <span className="font-mono font-semibold text-pine-900 tnum">{fmtMoney(s.rate)}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-pine-500">{s.unit}</td>
                  <td className="px-3 py-2.5">{s.hmoCovered ? <Chip tone="violet">covered</Chip> : <Chip tone="gray">self-pay</Chip>}</td>
                  <td className="px-3 py-2.5"><Toggle on={s.active} onChange={() => canEdit ? toggleActive(s.id) : toast("Requires Billing/Admin role", "warn")} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={pkgOpen} onClose={() => setPkgOpen(false)} title="Compose care package"
        footer={<>
          <span className="mr-auto font-mono text-[12px] font-semibold text-pine-700 tnum">
            Bundle price: {fmtMoney(Math.round(pkgItems.reduce((a, id) => a + (db.services.find(s => s.id === id)?.rate ?? 0), 0) * 0.92))}
          </span>
          <Btn kind="ghost" onClick={() => setPkgOpen(false)}>Cancel</Btn><Btn onClick={createPkg}><Icon name="check" size={14} /> Publish package</Btn>
        </>}>
        <div className="space-y-3">
          <Field label="Package name"><input className={inputCls} value={pkgName} onChange={e => setPkgName(e.target.value)} placeholder="e.g. Weekend Recovery Plus" /></Field>
          <div>
            <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Included services (bundle = 8% off)</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {db.services.filter(s => s.active).map(s => {
                const on = pkgItems.includes(s.id);
                return (
                  <button key={s.id} onClick={() => setPkgItems(on ? pkgItems.filter(x => x !== s.id) : [...pkgItems, s.id])}
                    className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-[12px] font-semibold transition-all ${on ? "border-pulse-500 bg-pulse-50 text-pulse-800" : "border-pine-200 text-pine-700 hover:border-pine-400"}`}>
                    {s.name}<span className="font-mono text-[10.5px] text-pine-400 tnum">{fmtMoney(s.rate)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
