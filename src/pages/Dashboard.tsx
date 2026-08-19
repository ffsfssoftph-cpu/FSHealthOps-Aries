import { dayOffset, fmtMoney } from "../data";
import { useApp } from "../state";
import { Ecg } from "../components/Logo";
import { Btn, Card, Chip, Icon, SectionHead, STATUS_TONE, Vitals } from "../components/ui";

const NEXT: Record<string, string> = { scheduled: "en-route", "en-route": "in-progress", "in-progress": "completed" };

export function Dashboard() {
  const { db, setDb, user, cfg, setNav, toast } = useApp();
  const today = dayOffset(0);
  const todays = db.visits.filter(v => v.date === today).sort((a, b) => a.start.localeCompare(b.start));
  const onDuty = db.providers.filter(p => p.status === "on-duty");
  const openAR = db.invoices.filter(i => ["sent", "overdue", "claim"].includes(i.status))
    .reduce((a, i) => a + i.items.reduce((s, it) => s + it.qty * it.rate, 0) * (1 - i.coveragePct / 100), 0);
  const newInq = db.inquiries.filter(i => i.status === "new").length;
  const completed = db.visits.filter(v => v.status === "completed").length;
  const util = Math.round((db.visits.length / (db.providers.reduce((a, p) => a + p.capacity, 0) * 1.4)) * 100);
  const clientName = (id: string) => db.clients.find(c => c.id === id)?.name ?? "—";
  const prov = (id: string) => db.providers.find(p => p.id === id);

  const advance = (id: string) => {
    const v = db.visits.find(x => x.id === id);
    if (!v || !NEXT[v.status]) return;
    setDb(d => ({ ...d, visits: d.visits.map(x => x.id === id ? { ...x, status: NEXT[x.status] as typeof x.status } : x) }));
    toast(`${clientName(v.clientId)} → ${NEXT[v.status].replace("-", " ")}`, "ok");
  };

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-5">
      {/* shift banner */}
      <div className="relative overflow-hidden rounded-lg bg-pine-950 p-5 shadow-pop anim-fade-up">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-300">
              {cfg?.company} · {cfg?.department} desk
            </p>
            <h1 className="mt-1 font-display text-[26px] font-black tracking-tight text-pine-50 sm:text-[30px]">
              {greet}, {user?.name.split(" ")[0]} — <span className="text-pulse-400">{todays.length} visits on today's run sheet.</span>
            </h1>
            <p className="mt-1 text-[12.5px] text-pine-300">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {onDuty.length} caregivers on duty · {cfg?.edition}
            </p>
          </div>
          <div className="flex gap-2">
            <Btn kind="amber" size="md" onClick={() => setNav("schedule")}><Icon name="calendar" size={15} /> New booking</Btn>
            <Btn kind="ghost" className="text-pine-200! hover:bg-pine-800!" onClick={() => setNav("clients")}><Icon name="plus" size={15} /> New client</Btn>
          </div>
        </div>
        <Ecg className="absolute -bottom-1 left-0 h-14 w-full opacity-70" speed={3} />
      </div>

      {/* vitals */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Vitals label="Today's visits" value={todays.length} spark={[3, 5, 4, 6, todays.length]} hint={`${todays.filter(v => v.status === "completed").length} completed · ${todays.filter(v => v.status === "in-progress").length} in progress`} onClick={() => setNav("schedule")} />
        <Vitals label="On duty" value={onDuty.length} tone="blue" spark={[4, 4, 5, 4, onDuty.length]} hint={`of ${db.providers.length} rostered caregivers`} onClick={() => setNav("staff")} />
        <Vitals label="Open A/R (co-pay)" value={Math.round(openAR)} prefix="$" tone="amber" spark={[420, 380, 510, 466, Math.round(openAR)]} hint="client-responsible balances" onClick={() => setNav("billing")} />
        <Vitals label="New referrals" value={newInq} tone="green" spark={[1, 2, 2, 3, newInq]} hint="synced from FS MedCRM" onClick={() => setNav("portal")} />
        <Vitals label="Week utilization" value={util} suffix="%" tone={util > 85 ? "red" : "green"} spark={[61, 66, 72, 70, util]} hint="visits vs roster capacity" onClick={() => setNav("reports")} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* today timeline */}
        <Card className="xl:col-span-2" pad={false}>
          <div className="p-4 pb-2"><SectionHead kicker="Service delivery workflow" title="Today's run sheet" icon="calendar"
            right={<Chip tone="green" pulse>live</Chip>} /></div>
          <div className="px-4 pb-4">
            <div className="space-y-1.5">
              {todays.map((v, i) => {
                const p = prov(v.providerId);
                return (
                  <div key={v.id} className="group flex items-center gap-3 rounded-md border border-pine-100 bg-paper/70 px-3 py-2.5 transition-all duration-200 hover:border-pulse-300 hover:bg-white hover:shadow-lift anim-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="w-14 shrink-0 font-mono text-[12px] font-semibold text-pine-700 tnum">{v.start}</span>
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: p?.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-pine-900">{clientName(v.clientId)} <span className="font-medium text-pine-500">· {v.svc}</span></p>
                      <p className="truncate text-[11px] text-pine-500">{p?.name} · {v.kind === "home-visit" ? "home visit" : v.kind === "clinic" ? "in-clinic" : "telehealth"}</p>
                    </div>
                    <Chip tone={STATUS_TONE[v.status]} pulse={v.status === "in-progress"}>{v.status}</Chip>
                    {NEXT[v.status] && (
                      <button onClick={() => advance(v.id)} title={`Mark ${NEXT[v.status]}`}
                        className="rounded-md border border-pine-200 bg-white px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-pine-600 opacity-0 transition-all group-hover:opacity-100 hover:border-pulse-500 hover:text-pulse-700">
                        → {NEXT[v.status]}
                      </button>
                    )}
                  </div>
                );
              })}
              {todays.length === 0 && <p className="py-6 text-center text-[12.5px] text-pine-400">No visits scheduled today.</p>}
            </div>
          </div>
        </Card>

        {/* alerts + capacity */}
        <div className="space-y-5">
          <Card>
            <SectionHead kicker="Attention" title="Alert rail" icon="alert" />
            <div className="space-y-2">
              {db.docs.filter(d => d.status !== "valid").slice(0, 3).map(d => (
                <div key={d.id} className="flex items-start gap-2.5 rounded-md border border-pine-100 bg-paper/70 p-2.5">
                  <span className={d.status === "missing" || d.status === "expired" ? "text-danger-500" : "text-vita-500"}><Icon name="shield" size={16} /></span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold leading-snug text-pine-900">{d.name}</p>
                    <p className="text-[10.5px] text-pine-500">{d.holder} · {d.status}</p>
                  </div>
                  <button onClick={() => setNav("documents")} className="ml-auto shrink-0 text-[10.5px] font-bold text-pulse-600 hover:underline">Open</button>
                </div>
              ))}
              <div className="flex items-start gap-2.5 rounded-md border border-danger-500/30 bg-danger-100/50 p-2.5">
                <span className="text-danger-500"><Icon name="invoice" size={16} /></span>
                <div>
                  <p className="text-[12px] font-bold leading-snug text-pine-900">Overdue: INV-2604 · Harold Jensen</p>
                  <p className="text-[10.5px] text-pine-500">MediPlus co-pay {fmtMoney(125)} — 2 days past due</p>
                </div>
                <button onClick={() => setNav("billing")} className="ml-auto shrink-0 text-[10.5px] font-bold text-danger-600 hover:underline">Bill</button>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHead kicker="Capacity" title="Roster load" icon="users" />
            <div className="space-y-2.5">
              {db.providers.slice(0, 5).map(p => {
                const pct = Math.round((p.visitsWeek / p.capacity) * 100);
                return (
                  <div key={p.id}>
                    <div className="mb-1 flex items-center justify-between text-[11.5px]">
                      <span className="flex items-center gap-1.5 font-semibold text-pine-800">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name.split(",")[0]}
                      </span>
                      <span className="font-mono text-[10.5px] text-pine-500 tnum">{p.visitsWeek}/{p.capacity}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-pine-100">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, pct)}%`, background: pct > 90 ? "#d64545" : p.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* sync ticker */}
      <div className="overflow-hidden rounded-lg border border-pine-200 bg-pine-900 py-2 shadow-lift">
        <div className="ticker-track flex w-max items-center gap-8 px-4">
          {[...db.sync, ...db.sync].map((s, i) => (
            <span key={i} className="flex items-center gap-2 font-mono text-[11px] text-pine-300">
              <span className={`h-1.5 w-1.5 rounded-full ${s.level === "ok" ? "bg-pulse-400" : s.level === "warn" ? "bg-vita-400" : "bg-info-500"}`} />
              <b className="text-pine-100">{s.system}</b> {s.event} <span className="text-pine-500">· {s.ts}</span>
            </span>
          ))}
        </div>
      </div>
      <p className="text-center font-mono text-[9px] uppercase tracking-[0.16em] text-pine-400">
        {completed} visits completed this period · integration gateway healthy · printed surfaces comply with Logo Standard §B
      </p>
    </div>
  );
}
