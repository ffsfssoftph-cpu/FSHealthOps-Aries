import { useMemo, useState } from "react";
import { fmtMoney, weekDays } from "../data";
import { useApp } from "../state";
import { calc } from "./Billing";
import { Btn, Card, Chip, Icon, Reveal, SectionHead, STATUS_TONE, Vitals } from "../components/ui";
import { Ecg, Emblem } from "../components/Logo";

/* tilted KPI accent classes */
const TILTS = ["tilt-a", "tilt-b", "tilt-c", "tilt-d"];

/* Philippine regional hub map — Luzon / Visayas / Mindanao */
const HUBS = [
  { id: "NCR", label: "NCR Hub", x: 46, y: 34, zone: "Central", visits: 9, main: true },
  { id: "NRTH", label: "North Luzon", x: 42, y: 14, zone: "North", visits: 6 },
  { id: "VIS", label: "Visayas", x: 58, y: 56, zone: "East", visits: 4 },
  { id: "WST", label: "West", x: 22, y: 44, zone: "West", visits: 3 },
  { id: "MND", label: "Mindanao", x: 52, y: 82, zone: "South", visits: 5 },
];

function PHMap({ onSelect }: { onSelect: (zone: string) => void }) {
  return (
    <div className="relative h-[300px] select-none sm:h-[340px]">
      <svg viewBox="0 0 100 110" className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        {/* graticule */}
        {[20, 40, 60, 80].map(y => <line key={`h${y}`} x1="4" y1={y} x2="96" y2={y} stroke="var(--color-pine-200)" strokeWidth="0.25" strokeDasharray="1.5 2.5" />)}
        {[25, 50, 75].map(x => <line key={`v${x}`} x1={x} y1="4" x2={x} y2="106" stroke="var(--color-pine-200)" strokeWidth="0.25" strokeDasharray="1.5 2.5" />)}
        {/* Luzon */}
        <path d="M38 6 C44 5 50 9 51 15 C52 20 50 24 52 28 C55 33 54 38 50 40 C46 42 42 40 40 36 C37 31 34 27 35 21 C35.5 16 34 8 38 6 Z"
          fill="var(--color-pulse-100)" stroke="var(--color-pulse-400)" strokeWidth="0.7" />
        {/* Mindoro / Palawan */}
        <path d="M34 44 C37 42 41 44 41 47 C41 50 38 52 35 51 C32 50 31 46 34 44 Z" fill="var(--color-pulse-100)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        <path d="M14 58 C18 52 24 48 29 49 C31 50 30 52 27 54 C22 57 18 61 15 62 C12 62 12 60 14 58 Z" fill="var(--color-pulse-50)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        {/* Visayas cluster */}
        <path d="M48 50 C52 48 57 49 58 52 C59 55 56 57 52 57 C49 57 46 53 48 50 Z" fill="var(--color-pulse-100)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        <path d="M61 52 C64 50 68 51 69 54 C69 57 66 59 63 58 C60 57 59 54 61 52 Z" fill="var(--color-pulse-100)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        <path d="M52 60 C55 58 60 59 61 62 C61 64 58 66 55 65 C52 64 50 62 52 60 Z" fill="var(--color-pulse-50)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        <path d="M65 60 C68 59 71 61 71 63 C70 66 67 66 65 65 C63 63 63 61 65 60 Z" fill="var(--color-pulse-50)" stroke="var(--color-pulse-300)" strokeWidth="0.5" />
        {/* Mindanao */}
        <path d="M44 72 C50 68 58 69 62 74 C66 78 66 84 62 88 C59 91 56 90 54 93 C52 96 49 96 47 93 C44 90 41 88 41 83 C41 78 40 75 44 72 Z"
          fill="var(--color-pulse-100)" stroke="var(--color-pulse-400)" strokeWidth="0.7" />
        {/* hub rings */}
        {HUBS.map(h => (
          <g key={h.id} className="cursor-pointer" onClick={() => onSelect(h.zone)}>
            <circle cx={h.x} cy={h.y} r="3.4" fill="none" stroke={h.main ? "var(--color-pulse-600)" : "var(--color-pulse-400)"} strokeWidth="0.6" className="map-ring" style={{ animationDelay: `${HUBS.indexOf(h) * 0.4}s` }} />
            <circle cx={h.x} cy={h.y} r={h.main ? 2 : 1.5} fill={h.main ? "var(--color-pulse-600)" : "var(--color-pulse-400)"} />
            <circle cx={h.x} cy={h.y} r={h.main ? 0.7 : 0.55} fill="#fff" />
          </g>
        ))}
      </svg>
      {HUBS.map(h => (
        <button key={h.id} onClick={() => onSelect(h.zone)}
          className={`group absolute -translate-x-1/2 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-lift
            ${h.main ? "border-pulse-500 bg-pulse-600 text-white" : "border-pine-200 bg-white text-pine-600"}`}
          style={{ left: `${h.x}%`, top: `calc(${h.y}% + 10px)` }}>
          {h.label} <span className={h.main ? "text-pulse-200" : "text-pine-400"}>{h.visits}</span>
        </button>
      ))}
      <span className="absolute right-2 top-1 font-mono text-[8.5px] uppercase tracking-[0.18em] text-pine-400">PH regional coverage</span>
    </div>
  );
}

/* orthogonal care-journey flow diagram */
const FLOW = [
  ["Portal inquiry", "Booking confirmed", "Caregiver assigned"],
  ["Visit in progress", "Notes → FS EHR", "HMO claim + co-pay"],
];
function FlowDiagram() {
  return (
    <div className="space-y-5">
      {FLOW.map((row, r) => (
        <div key={r} className="flex flex-wrap items-center gap-2">
          {row.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="rounded-full border-[1.5px] border-pulse-600 bg-white px-3 py-1.5 text-[11.5px] font-bold text-pulse-700 shadow-lift transition-all hover:-translate-y-0.5 hover:shadow-pop">
                <span className="mr-1.5 font-mono text-[9px] text-pulse-400 tnum">{r * 3 + i + 1}</span>{step}
              </span>
              {i < row.length - 1 && (
                <svg width="34" height="12" className="text-pine-300"><path d="M0 6h28m0 0l-5-4m5 4l-5 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          ))}
          {r === 0 && (
            <svg width="14" height="34" className="ml-2 hidden text-pine-300 sm:block"><path d="M7 0v26m0 0l-4-5m4 5l4-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          )}
        </div>
      ))}
      <p className="text-[11px] text-pine-500">
        End-to-end cycle averages <b className="font-mono text-pulse-700 tnum">4.2 days</b> inquiry → payment posting · clinical notes stay in <b>FS EHR</b>
      </p>
    </div>
  );
}

export function Dashboard() {
  const { db, setDb, toast, nav, setNav, sessionUser } = useApp();
  const [zoneFilter, setZoneFilter] = useState<string | null>(null);
  const today = weekDays().find(d => d.isToday) ?? weekDays()[0];

  const todayVisits = useMemo(() => db.visits.filter(v => v.date === today.iso && (!zoneFilter || db.clients.find(c => c.id === v.clientId)?.zone === zoneFilter)), [db.visits, today.iso, zoneFilter, db.clients]);
  const openInvoices = db.invoices.filter(i => ["sent", "overdue", "pending-approval"].includes(i.status));
  const copayOutstanding = openInvoices.reduce((a, i) => a + calc(i).copay, 0);
  const completed = db.visits.filter(v => v.status === "completed").length;
  const successRate = Math.round((completed / Math.max(1, db.visits.filter(v => ["completed", "missed"].includes(v.status)).length)) * 100);

  const setStatus = (id: string, status: (typeof db.visits)[0]["status"]) => {
    setDb(d => ({ ...d, visits: d.visits.map(v => v.id === id ? { ...v, status } : v) }));
    const label = ({ "en-route": "en route", "in-progress": "in progress", completed: "completed" } as Record<string, string>)[status] ?? status;
    toast(`Visit marked ${label} — synced to FS EHR schedule`, "ok");
  };

  const kpis = [
    { label: "Today's visits", value: todayVisits.length, spark: [3, 5, 4, 6, 5, 7, todayVisits.length + 2], suffix: "" },
    { label: "Completion rate", value: successRate, spark: [86, 88, 91, 89, 93, 92, successRate], suffix: "%" },
    { label: "Co-pay outstanding", value: Math.round(copayOutstanding), spark: [420, 380, 510, 460, 390, 350, Math.round(copayOutstanding)], prefix: "$" },
    { label: "Active clients", value: db.clients.filter(c => c.status === "active").length, spark: [6, 7, 7, 8, 8, 9, db.clients.filter(c => c.status === "active").length] },
  ];

  return (
    <div className="space-y-5">
      {/* tilted KPI row */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`tilt-wrap ${TILTS[i]} anim-fade-up`} style={{ animationDelay: `${i * 80}ms` }}>
            <Vitals label={k.label} value={k.value} prefix={k.prefix} suffix={k.suffix} spark={k.spark} tone={i === 2 ? "amber" : "green"} />
          </div>
        ))}
      </div>

      {/* command strip */}
      <div className="anim-fade-up flex flex-wrap items-center gap-2 rounded-lg border border-pine-200 bg-white px-3 py-2 shadow-lift" style={{ animationDelay: "120ms" }}>
        <span className="hidden items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-400 sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#34c06f] dot-live" /> live ops
        </span>
        <span className="h-4 w-px bg-pine-200" />
        <Ecg className="h-5 w-40 text-pulse-500" />
        <span className="h-4 w-px bg-pine-200" />
        <span className="font-mono text-[10.5px] text-pine-500 tnum">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {db.providers.filter(p => p.status === "on-duty").length} providers on duty
        </span>
        {zoneFilter && (
          <button onClick={() => setZoneFilter(null)} className="ml-auto inline-flex items-center gap-1 rounded-full bg-pulse-100 px-2.5 py-1 text-[10.5px] font-bold text-pulse-700 transition-colors hover:bg-pulse-200">
            zone: {zoneFilter} <Icon name="x" size={11} />
          </button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* floating PH map module */}
        <Reveal className="lg:col-span-2">
          <Card pad={false} className="overflow-hidden transition-shadow hover:shadow-pop">
            <div className="flex items-center justify-between px-4 pt-3.5">
              <SectionHead title="Regional Coverage" icon="pin" />
            </div>
            <div className="anim-float">
              <PHMap onSelect={z => { setZoneFilter(z === zoneFilter ? null : z); toast(`${z} zone focused — timeline filtered`, "info"); }} />
            </div>
            <div className="flex items-center justify-between border-t border-pine-100 bg-paper/70 px-4 py-2.5">
              <span className="font-mono text-[10px] text-pine-500">GPS-tagged POD · {db.visits.filter(v => v.status === "completed").length} geotagged today</span>
              <button onClick={() => { setNav("reports"); }} className="text-[11px] font-extrabold text-pulse-600 transition-colors hover:text-pulse-800">Zone analytics ▸</button>
            </div>
          </Card>
        </Reveal>

        {/* today's run sheet */}
        <Reveal delay={90} className="lg:col-span-3">
          <Card pad={false} className="h-full">
            <div className="flex items-center justify-between border-b border-pine-100 px-4 py-3">
              <SectionHead title={`Today's Run Sheet ${zoneFilter ? `· ${zoneFilter}` : ""}`} icon="calendar" right={<Chip tone="blue">{todayVisits.length} visits</Chip>} />
            </div>
            <div className="divide-y divide-pine-100">
              {todayVisits.length === 0 && (
                <p className="circuit-bg px-4 py-10 text-center text-[12px] font-semibold text-pine-400">No visits in this zone today.</p>
              )}
              {todayVisits.map(v => {
                const client = db.clients.find(c => c.id === v.clientId);
                const prov = db.providers.find(p => p.id === v.providerId);
                return (
                  <div key={v.id} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pulse-50/50">
                    <span className="w-14 font-mono text-[12px] font-bold text-pine-700 tnum">{v.start}</span>
                    <span className="h-8 w-1 rounded-full" style={{ background: prov?.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold text-pine-900">{client?.name} <span className="font-normal text-pine-400">· {v.svc}</span></p>
                      <p className="text-[10.5px] text-pine-500">{prov?.name} · {v.kind} · {client?.zone} zone</p>
                    </div>
                    <Chip tone={STATUS_TONE[v.status]}>{v.status}</Chip>
                    {v.status === "scheduled" && <Btn size="sm" kind="outline" onClick={() => setStatus(v.id, "en-route")}>En route</Btn>}
                    {v.status === "en-route" && <Btn size="sm" kind="dark" onClick={() => setStatus(v.id, "in-progress")}>Arrived</Btn>}
                    {v.status === "in-progress" && <Btn size="sm" onClick={() => setStatus(v.id, "completed")}><Icon name="check" size={13} /> Complete POD</Btn>}
                  </div>
                );
              })}
            </div>
          </Card>
        </Reveal>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal><Card>
          <SectionHead kicker="Order-to-cash analog" title="Care Journey Flow" icon="chart" />
          <FlowDiagram />
        </Card></Reveal>

        <Reveal delay={80}><Card pad={false}>
          <div className="flex items-center justify-between border-b border-pine-100 px-4 py-3">
            <SectionHead title="Attention needed" icon="alert" />
          </div>
          <div className="divide-y divide-pine-100">
            {db.notifs.filter(n => !n.read).map(n => (
              <div key={n.id} className="flex items-start gap-2.5 px-4 py-2.5">
                <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${n.tone === "err" ? "bg-danger-100 text-danger-600" : n.tone === "warn" ? "bg-vita-100 text-vita-600" : "bg-info-100 text-info-600"}`}>
                  <Icon name={n.icon} size={13} />
                </span>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold leading-snug text-pine-800">{n.text}</p>
                  <p className="font-mono text-[9.5px] uppercase tracking-wider text-pine-400">{n.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </Card></Reveal>

        <Reveal delay={160}><Card pad={false}>
          <div className="flex items-center justify-between border-b border-pine-100 px-4 py-3">
            <SectionHead title="Roster load" icon="users" right={<button onClick={() => setNav("staff")} className="text-[11px] font-extrabold text-pulse-600 hover:text-pulse-800">Manage ▸</button>} />
          </div>
          <div className="space-y-3 px-4 py-3.5">
            {db.providers.slice(0, 5).map(p => (
              <div key={p.id}>
                <div className="mb-1 flex items-center justify-between text-[11.5px]">
                  <span className="flex items-center gap-1.5 font-bold text-pine-800">
                    <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />{p.name.split(",")[0]}
                  </span>
                  <span className="font-mono text-pine-500 tnum">{p.visitsWeek}/{p.capacity}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-pine-100">
                  <div className={`h-full rounded-full transition-all duration-700 ${p.visitsWeek / p.capacity > 0.85 ? "bg-vita-500" : "bg-pulse-500"}`} style={{ width: `${Math.min(100, (p.visitsWeek / p.capacity) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card></Reveal>
      </div>

      {/* onboarding quick-start (first session) */}
      <Onboarding />
    </div>
  );
}

function Onboarding() {
  const { setNav, toast } = useApp();
  const [open, setOpen] = useState(() => !localStorage.getItem("fsco_onboarded"));
  if (!open) return null;
  const steps: { icon: string; text: string; go: () => void }[] = [
    { icon: "calendar", text: "Open the week grid and book a multi-provider visit", go: () => setNav("schedule") },
    { icon: "invoice", text: "Draft an invoice — watch the HMO co-pay split compute", go: () => setNav("billing") },
    { icon: "globe", text: "Preview the public booking widget clients actually see", go: () => setNav("portal") },
    { icon: "key", text: "Press ⌘K anywhere — command palette quick actions", go: () => toast("Try ⌘K (or Ctrl+K) right now", "info") },
  ];
  return (
    <div className="anim-fade-up rounded-lg border border-pulse-200 bg-pulse-50/60 p-4 shadow-lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Emblem size={26} />
          <div>
            <p className="font-display text-[14px] font-extrabold text-pine-900">2-minute quick start</p>
            <p className="text-[11px] text-pine-500">Sandbox data — nothing here affects a live deployment.</p>
          </div>
        </div>
        <button onClick={() => { localStorage.setItem("fsco_onboarded", "1"); setOpen(false); }} className="rounded-md p-1.5 text-pine-400 transition-colors hover:bg-white hover:text-pine-700"><Icon name="x" size={15} /></button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((s, i) => (
          <button key={i} onClick={s.go} className="group flex items-center gap-2.5 rounded-md border border-pine-200 bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-pulse-400 hover:shadow-lift">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-[1.5px] border-pulse-600 text-pulse-600 transition-colors group-hover:bg-pulse-600 group-hover:text-white"><Icon name={s.icon} size={14} /></span>
            <span className="text-[11.5px] font-bold leading-snug text-pine-700">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
