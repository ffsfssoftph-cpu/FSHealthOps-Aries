import { useState } from "react";
import { dayOffset, uid } from "../data";
import type { Provider } from "../data";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Modal, STATUS_TONE, SectionHead, Field, inputCls } from "../components/ui";

const PALETTE = ["#17876b", "#2e7da6", "#c77f1b", "#7a4fbf", "#b9526e", "#0d2a24"];

export function Staff() {
  const { db, setDb, toast } = useApp();
  const [team, setTeam] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", title: "", creds: "", team: "Team Alpha", capacity: 8 });

  const list = db.providers.filter(p => team === "all" || p.team === team);
  const assignedToday = (pid: string) => db.visits.filter(v => v.providerId === pid && v.date === dayOffset(0)).length;

  const cycleStatus = (pid: string) => {
    const order: Provider["status"][] = ["on-duty", "off-duty", "on-leave"];
    setDb(d => ({
      ...d, providers: d.providers.map(p =>
        p.id === pid ? { ...p, status: order[(order.indexOf(p.status) + 1) % 3] } : p),
    }));
  };

  const add = () => {
    if (!form.name.trim()) { toast("Caregiver name required.", "warn"); return; }
    const p: Provider = {
      id: uid(), name: form.name.trim(), title: form.title || "Caregiver", creds: form.creds || "—",
      color: PALETTE[db.providers.length % PALETTE.length], team: form.team, capacity: form.capacity,
      status: "on-duty", certs: [{ name: "BLS", exp: dayOffset(365) }], visitsWeek: 0,
    };
    setDb(d => ({ ...d, providers: [...d.providers, p] }));
    toast(`${p.name} added to ${p.team}`, "ok");
    setAddOpen(false); setForm({ ...form, name: "", title: "", creds: "" });
  };

  const certTone = (exp: string): "green" | "amber" | "red" => {
    const days = (new Date(exp).getTime() - Date.now()) / 86400000;
    return days < 0 ? "red" : days < 30 ? "amber" : "green";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Staff / resource management · §1.6" title="Caregiver Roster & Care Teams" icon="users"
          right={<span className="font-mono text-[11px] text-pine-500 tnum">{db.providers.filter(p => p.status === "on-duty").length} on duty now</span>} />
        <div className="flex gap-2">
          {["all", "Team Alpha", "Team Bravo"].map(t => (
            <Btn key={t} kind={team === t ? "dark" : "outline"} size="sm" onClick={() => setTeam(t)}>{t === "all" ? "All teams" : t}</Btn>
          ))}
          <Btn size="sm" onClick={() => setAddOpen(true)}><Icon name="plus" size={14} /> Add caregiver</Btn>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((p, i) => (
          <Card key={p.id} className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-pop anim-fade-up" pad={false}>
            <div className="h-1.5" style={{ background: p.color }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg font-display text-[15px] font-black text-white shadow-lift" style={{ background: p.color }}>
                    {p.name.split(" ").map(w => w[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-display text-[14.5px] font-extrabold leading-tight text-pine-900">{p.name}</p>
                    <p className="text-[11px] text-pine-500">{p.title} · <span className="font-mono">{p.creds}</span></p>
                  </div>
                </div>
                <button onClick={() => cycleStatus(p.id)} title="Click to change duty status">
                  <Chip tone={STATUS_TONE[p.status]} pulse={p.status === "on-duty"}>{p.status}</Chip>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-md bg-paper py-2"><p className="font-mono text-[17px] font-semibold text-pine-900 tnum">{assignedToday(p.id)}</p><p className="text-[9px] font-bold uppercase tracking-wider text-pine-400">today</p></div>
                <div className="rounded-md bg-paper py-2"><p className="font-mono text-[17px] font-semibold text-pine-900 tnum">{p.visitsWeek}</p><p className="text-[9px] font-bold uppercase tracking-wider text-pine-400">this wk</p></div>
                <div className="rounded-md bg-paper py-2"><p className="font-mono text-[17px] font-semibold text-pine-900 tnum">{Math.round((p.visitsWeek / p.capacity) * 100)}%</p><p className="text-[9px] font-bold uppercase tracking-wider text-pine-400">load</p></div>
              </div>

              <div className="mt-3">
                <p className="mb-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-pine-400">Certifications</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.certs.map(c => (
                    <span key={c.name} className={`rounded px-1.5 py-0.5 text-[10px] font-bold ring-1 ${certTone(c.exp) === "red" ? "bg-danger-100 text-danger-600 ring-danger-500/30" : certTone(c.exp) === "amber" ? "bg-vita-100 text-vita-600 ring-vita-400/40" : "bg-pulse-50 text-pulse-700 ring-pulse-200"}`}>
                      {c.name} · exp {c.exp.slice(5)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-pine-100 pt-2.5">
                <span className="text-[11px] font-bold text-pine-500">{p.team}</span>
                <button onClick={() => toast(`Visit assignment opened for ${p.name}`, "info")} className="text-[11px] font-bold text-pulse-600 transition-colors hover:text-pulse-800">Assign visit →</button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add caregiver / provider"
        footer={<><Btn kind="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn onClick={add}><Icon name="check" size={14} /> Add to roster</Btn></>}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name & credentials"><input className={inputCls} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Joy Lim, RN" /></Field>
          <Field label="Title"><input className={inputCls} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Staff Nurse" /></Field>
          <Field label="Credential codes"><input className={inputCls} value={form.creds} onChange={e => setForm({ ...form, creds: e.target.value })} placeholder="RN, BLS" /></Field>
          <Field label="Care team"><select className={inputCls} value={form.team} onChange={e => setForm({ ...form, team: e.target.value })}><option>Team Alpha</option><option>Team Bravo</option></select></Field>
          <Field label="Weekly capacity (visits)"><input type="number" className={inputCls} value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
