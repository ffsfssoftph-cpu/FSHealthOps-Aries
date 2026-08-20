import { useMemo, useState } from "react";
import { fmtMoney, weekDays, toISO } from "../data";
import { useApp } from "../state";
import { calc } from "./Billing";
import { Card, Chip, Icon, Progress, Reveal, SectionHead, STATUS_TONE, Vitals } from "../components/ui";
import { Ecg, useClock } from "../components/Logo";

/* ============================================================
   FS CareOps — Ops Console (§1.1)
   Patient-monitor style command surface: vitals KPIs, today's
   run sheet with live delivery workflow, alerts rail, roster
   load, and the integration sync ticker.
   ============================================================ */

const NEXT_STATUS: Record<string, { to: "en-route" | "in-progress" | "completed"; label: string }> = {
  scheduled: { to: "en-route", label: "Dispatch" },
  "en-route": { to: "in-progress", label: "Arrived" },
  "in-progress": { to: "completed", label: "Complete" },
};

export function Dashboard() {
  const { db, setDb, toast, setNav } = useApp();
  const now = useClock();
  const [zone, setZone] = useState<string | null>(null);
  const todayIso = toISO(new Date());

  const zones = useMemo(() => Array.from(new Set(db.clients.map(c => c.zone))), [db.clients]);
  const todayVisits = useMemo(
    () => db.visits
      .filter(v => v.date === todayIso && (!zone || db.clients.find(c => c.id === v.clientId)?.zone === zone))
      .sort((a, b) => a.start.localeCompare(b.start)),
    [db.visits, todayIso, zone, db.clients],
  );

  const openInv = db.invoices.filter(i => ["sent", "overdue", "pending-approval"].includes(i.status));
  const copayDue = openInv.reduce((a, i) => a + calc(i).copay, 0);
  const done = db.visits.filter(v => v.status === "completed").length;
  const closed = db.visits.filter(v => ["completed", "missed"].includes(v.status)).length;
  const completion = Math.round((done / Math.max(1, closed)) * 100);
  const active = db.clients.filter(c => c.status === "active").length;
  const onDuty = db.providers.filter(p => p.status === "on-duty").length;
  const liveNow = db.visits.filter(v => v.date === todayIso && ["en-route", "in-progress"].includes(v.status)).length;

  const client = (id: string) => db.clients.find(c => c.id === id);
  const provider = (id: string) => db.providers.find(p => p.id === id);

  const advance = (id: string) => {
    const v = db.visits.find(x => x.id === id);
    const step = v && NEXT_STATUS[v.status];
    if (!v || !step) return;
    setDb(d => ({ ...d, visits: d.visits.map(x => x.id === id ? { ...x, status: step.to } : x) }));
    toast(`${client(v.clientId)?.name} — visit ${step.to.replace("-", " ")} · synced to FS EHR schedule`, "ok");
  };

  const alerts = useMemo(() => {
    const a: { icon: string; tone: "err" | "warn" | "info"; text: string; meta: string; go: "billing" | "documents" | "portal" | "schedule" }[] = [];
    db.invoices.filter(i => i.status === "overdue").forEach(i =>
      a.push({ icon: "invoice", tone: "err", text: `${i.number} overdue — ${client(i.clientId)?.name}`, meta: `${fmtMoney(calc(i).copay)} co-pay due`, go: "billing" }));
    db.invoices.filter(i => i.status === "pending-approval").forEach(i =>
      a.push({ icon: "shield", tone: "warn", text: `${i.number} awaiting Accountable (A) approval`, meta: "maker-checker queue", go: "billing" }));
    db.providers.flatMap(p => p.certs.filter(c => c.exp !== "—" && (new Date(c.exp).getTime() - Date.now()) / 86400000 < 30)
      .map(c => ({ icon: "users", tone: "warn" as const, text: `${p.name.split(",")[0]} — ${c.name} expiring`, meta: c.exp, go: "documents" as const })));
    const fresh = db.inquiries.filter(q => q.status === "new").length;
    if (fresh) a.push({ icon: "globe", tone: "info", text: `${fresh} new portal ${fresh === 1 ? "inquiry" : "inquiries"}`, meta: "FS MedCRM attribution", go: "portal" });
    return a.slice(0, 6);
  }, [db]);

  return (
    <div className="space-y-5">
      {/* -------- patient-monitor band -------- */}
      <section className="relative overflow-hidden rounded-lg bg-pine-900 text-pine-50 shadow-lift anim-fade-up">
        <div className="relative z-10 flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-5">
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em] text-pulse-300">§1.1 · live operations</p>
            <h1 className="mt-1 font-display text-[26px] font-extrabold leading-none tracking-tight">Ops Console</h1>
            <p className="mt-1.5 text-[12px] text-pine-300">
              <span className="mr-3 inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-pulse-400 dot-live" />{onDuty} caregivers on duty</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-vita-400 dot-warn" />{liveNow} visits live now</span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-mono text-[24px] font-semibold leading-none tnum">
              {now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="mt-1 font-mono text-[9.5px] uppercase tracking-[0.18em] text-pine-400">
              {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
        <Ecg className="absolute inset-x-0 bottom-0 h-12 w-full opacity-70" />
      </section>

      {/* -------- vitals row -------- */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Reveal><Vitals label="Today's visits" value={todayVisits.length} spark={[3, 5, 4, 6, 5, 7, todayVisits.length + 2]} tone="green" hint="all delivery modes" onClick={() => setNav("schedule")} /></Reveal>
        <Reveal delay={70}><Vitals label="Completion rate" value={completion} suffix="%" spark={[86, 88, 91, 89, 93, 92, completion]} tone="green" hint="closed visits" onClick={() => setNav("reports")} /></Reveal>
        <Reveal delay={140}><Vitals label="Co-pay outstanding" value={Math.round(copayDue)} prefix="$" spark={[420, 380, 510, 460, 390, 350, Math.round(copayDue)]} tone="amber" hint={`${openInv.length} open invoices`} onClick={() => setNav("billing")} /></Reveal>
        <Reveal delay={210}><Vitals label="Active clients" value={active} spark={[6, 7, 7, 8, 8, 9, active]} tone="blue" hint="home health + clinic" onClick={() => setNav("clients")} /></Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* -------- run sheet -------- */}
        <Card pad={false}>
          <div className="flex flex-wrap items-center gap-2 border-b border-pine-200 bg-paper/70 px-4 py-2.5">
            <SectionHead title={`Today's run sheet`} icon="calendar" />
            <div className="ml-auto flex flex-wrap gap-1">
              <button onClick={() => setZone(null)} className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all ${zone === null ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-500 hover:border-pine-400"}`}>All zones</button>
              {zones.map(z => (
                <button key={z} onClick={() => setZone(zone === z ? null : z)} className={`rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition-all ${zone === z ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-500 hover:border-pine-400"}`}>{z}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-pine-100">
            {todayVisits.length === 0 && (
              <div className="circuit-bg px-4 py-10 text-center">
                <p className="text-[12.5px] font-semibold text-pine-500">No visits scheduled for this zone today.</p>
                <button onClick={() => setNav("schedule")} className="mt-2 font-mono text-[11px] font-bold text-pulse-600 transition-colors hover:text-pulse-800">Open scheduling engine →</button>
              </div>
            )}
            {todayVisits.map((v, i) => {
              const c = client(v.clientId); const p = provider(v.providerId);
              const step = NEXT_STATUS[v.status];
              return (
                <div key={v.id} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pulse-50/40 anim-fade-up" style={{ animationDelay: `${i * 45}ms` }}>
                  <div className="w-[52px] shrink-0">
                    <p className="font-mono text-[13px] font-bold text-pine-900 tnum">{v.start}</p>
                    <p className="font-mono text-[9.5px] text-pine-400 tnum">→ {v.end}</p>
                  </div>
                  <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: p?.color ?? "#17876b" }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold text-pine-900">{c?.name} <span className="font-normal text-pine-400">· {c?.zone} zone</span></p>
                    <p className="truncate text-[11px] text-pine-500">
                      {v.svc} — {p?.name.split(",")[0]}
                      <span className="ml-2 font-mono text-[9px] uppercase tracking-wider text-pine-400">{v.kind.replace("-", " ")}</span>
                    </p>
                  </div>
                  <Chip tone={STATUS_TONE[v.status]}>{v.status}</Chip>
                  {step ? (
                    <button onClick={() => advance(v.id)}
                      className="shrink-0 rounded-md bg-pulse-600 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-pulse-500 active:scale-95">
                      {step.label}
                    </button>
                  ) : (
                    <span className="w-[74px] shrink-0 text-center font-mono text-[9.5px] uppercase tracking-wider text-pine-400">{v.status === "missed" ? "follow up" : "closed"}</span>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* -------- right rail -------- */}
        <div className="space-y-4">
          <Card pad={false}>
            <div className="border-b border-pine-200 bg-paper/70 px-4 py-2.5"><SectionHead title="Needs attention" icon="alert" /></div>
            <div className="divide-y divide-pine-100">
              {alerts.length === 0 && <p className="px-4 py-6 text-center text-[12px] text-pine-400">All clear — nothing queued.</p>}
              {alerts.map((al, i) => (
                <button key={i} onClick={() => setNav(al.go)} className="group flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-pulse-50/40">
                  <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md ${al.tone === "err" ? "bg-danger-100 text-danger-600" : al.tone === "warn" ? "bg-vita-100 text-vita-600" : "bg-info-100 text-info-600"}`}>
                    <Icon name={al.icon} size={14} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-bold text-pine-800">{al.text}</span>
                    <span className="block font-mono text-[9.5px] uppercase tracking-wider text-pine-400">{al.meta}</span>
                  </span>
                  <span className="ml-auto mt-1 text-pine-300 transition-transform group-hover:translate-x-0.5 group-hover:text-pulse-600"><Icon name="chevR" size={13} /></span>
                </button>
              ))}
            </div>
          </Card>

          <Card pad={false}>
            <div className="border-b border-pine-200 bg-paper/70 px-4 py-2.5"><SectionHead title="Roster load — week" icon="users" /></div>
            <div className="space-y-2.5 p-4">
              {db.providers.slice(0, 5).map(p => (
                <div key={p.id}>
                  <div className="mb-1 flex items-center justify-between text-[11.5px]">
                    <span className="font-bold text-pine-800">{p.name.split(",")[0]}</span>
                    <span className="font-mono text-pine-400 tnum">{p.visitsWeek}/{p.capacity}</span>
                  </div>
                  <Progress pct={Math.round((p.visitsWeek / p.capacity) * 100)} tone={p.visitsWeek / p.capacity > 0.85 ? "amber" : "green"} />
                </div>
              ))}
              <button onClick={() => setNav("staff")} className="w-full rounded-md border border-dashed border-pine-300 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-pine-500 transition-all hover:border-pulse-500 hover:text-pulse-700">
                care teams →
              </button>
            </div>
          </Card>

          <Card pad={false}>
            <div className="flex items-center gap-2 border-b border-pine-200 bg-paper/70 px-4 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-pulse-500 dot-live" />
              <span className="font-display text-[13px] font-extrabold text-pine-900">Integration sync</span>
              <button onClick={() => setNav("integrations")} className="ml-auto font-mono text-[9.5px] font-bold uppercase tracking-wider text-pulse-600 transition-colors hover:text-pulse-800">gateway</button>
            </div>
            <div className="overflow-hidden">
              <div className="ticker-track flex w-max gap-8 whitespace-nowrap px-4 py-2.5">
                {[...db.sync, ...db.sync].map((s, i) => (
                  <span key={i} className="font-mono text-[10px] text-pine-500">
                    <b className={s.level === "ok" ? "text-pulse-600" : "text-info-600"}>{s.ts}</b> {s.system} · {s.event}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* -------- care journey pipeline -------- */}
      <Reveal>
        <Card>
          <SectionHead kicker="end-to-end cycle · avg 4.2 days" title="Care journey pipeline" icon="pulse" />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {["Portal inquiry", "Booking confirmed", "Caregiver assigned", "Visit delivered", "Notes → FS EHR", "HMO claim + co-pay"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="rounded-full border-[1.5px] border-pulse-500 bg-pulse-50/60 px-3 py-1.5 text-[11.5px] font-bold text-pulse-800 transition-all hover:-translate-y-0.5 hover:bg-pulse-100 hover:shadow-lift">
                  <span className="mr-1.5 font-mono text-[9px] text-pulse-500 tnum">{i + 1}</span>{s}
                </span>
                {i < arr.length - 1 && <span className="text-pine-300"><Icon name="chevR" size={13} sw={2.2} /></span>}
              </span>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-pine-500">
            Clinical notes stay in <b className="text-pine-700">FS EHR / FS PracticeSuite (Volume 1)</b> — CareOps tracks the operational pipeline only.
          </p>
        </Card>
      </Reveal>
    </div>
  );
}
