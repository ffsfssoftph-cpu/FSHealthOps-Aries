import { useState } from "react";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Reveal, SectionHead, Toggle } from "../components/ui";

const FLOWS = [
  { from: "FS CareOps", to: "FS EHR", data: "schedules · demographics · visit completion" },
  { from: "FS EHR", to: "FS CareOps", data: "eligibility flags only — clinical notes stay in EHR" },
  { from: "FS CareOps", to: "FS PracticeSuite", data: "encounter stubs · superbilling codes" },
  { from: "FS MedCRM", to: "FS CareOps", data: "campaign leads · referral attribution" },
];

export function Integrations() {
  const { db, setDb, toast } = useApp();
  const [syncing, setSyncing] = useState<string | null>(null);

  const toggle = (id: string) => {
    const g = db.integrations.find(x => x.id === id);
    setDb(d => ({ ...d, integrations: d.integrations.map(x => x.id === id ? { ...x, on: !x.on } : x) }));
    toast(`${g?.name} gateway ${g?.on ? "paused — queued events will hold" : "reconnected"}`, g?.on ? "warn" : "ok");
  };

  const runSync = (id: string) => {
    const g = db.integrations.find(x => x.id === id);
    if (!g?.on) { toast("Enable the gateway before syncing.", "warn"); return; }
    setSyncing(id);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString("en-GB");
      setDb(d => ({
        ...d,
        sync: [{ ts: now, system: g.name, event: "Manual sync — deltas reconciled, 0 conflicts", level: "ok" as const }, ...d.sync].slice(0, 30),
        integrations: d.integrations.map(x => x.id === id ? { ...x, lastSync: "just now" } : x),
      }));
      setSyncing(null);
      toast(`${g.name} sync complete — 0 conflicts`, "ok");
    }, 1400);
  };

  return (
    <div className="space-y-5">
      <div className="anim-fade-up"><SectionHead kicker="Integration gateway · §1.10" title="FS Product Family Gateway" icon="plug"
        right={<Chip tone="green" pulse>gateway healthy</Chip>} /></div>

      <div className="grid gap-4 lg:grid-cols-3">
        {db.integrations.map((g, i) => (
          <Reveal key={g.id} delay={i * 80}>
            <Card className={`h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-pop ${!g.on ? "opacity-70" : ""}`} pad={false}>
              <div className={`h-1.5 rounded-t-lg ${g.on ? "bg-pulse-500" : "bg-pine-200"}`} />
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-[16px] font-extrabold text-pine-900">{g.name}</h3>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pulse-600">{g.volume}</p>
                  </div>
                  <Chip tone={g.on ? "green" : "gray"} pulse={g.on}>{g.on ? "connected" : "disabled"}</Chip>
                </div>
                <p className="mt-2.5 text-[12px] leading-snug text-pine-600">{g.desc}</p>
                <div className="mt-3 space-y-1.5 rounded-md bg-paper p-2.5 font-mono text-[10.5px] text-pine-500">
                  <p>MODE&nbsp;&nbsp;{g.mode}</p>
                  <p>SYNC&nbsp;&nbsp;{g.lastSync}</p>
                  <p>HEALTH&nbsp;{g.on ? "200 OK · latency 84ms" : "—"}</p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Toggle on={g.on} onChange={() => toggle(g.id)} />
                  <Btn size="sm" kind={g.on ? "dark" : "ghost"} disabled={!g.on || syncing === g.id} onClick={() => runSync(g.id)}>
                    <span className={syncing === g.id ? "animate-spin" : ""}><Icon name="refresh" size={13} /></span>
                    {syncing === g.id ? "Syncing…" : "Sync now"}
                  </Btn>
                </div>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionHead title="Data-flow map" icon="chart" />
          <div className="space-y-2">
            {FLOWS.map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-md border border-pine-100 bg-paper/70 px-3 py-2 text-[12px] transition-colors hover:border-pulse-300">
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${f.from === "FS CareOps" ? "bg-pine-900 text-pine-50" : "bg-pulse-100 text-pulse-800"}`}>{f.from}</span>
                <span className="text-pine-300"><Icon name="chevR" size={13} /></span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${f.to === "FS CareOps" ? "bg-pine-900 text-pine-50" : "bg-pulse-100 text-pulse-800"}`}>{f.to}</span>
                <span className="ml-auto text-right text-[10.5px] text-pine-500">{f.data}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-md border border-info-500/30 bg-info-100/60 px-3 py-2.5 text-[11.5px] leading-snug text-info-700">
            <b>Governance rule:</b> where clinical charting is required, notes remain in <b>FS EHR / FS PracticeSuite (Volume 1)</b>. CareOps stores operational data only and links out to the chart.
          </div>
        </Card>

        <Card pad={false}>
          <div className="border-b border-pine-200 bg-paper/80 px-4 py-2.5 font-display text-[14px] font-extrabold text-pine-900">Sync ledger</div>
          <div className="max-h-[340px] divide-y divide-pine-100 overflow-y-auto">
            {db.sync.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5 px-4 py-2 text-[12px] anim-fade-in">
                <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${s.level === "ok" ? "bg-pulse-500" : s.level === "warn" ? "bg-vita-500" : "bg-info-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-pine-800"><b>{s.system}</b> — {s.event}</p>
                  <p className="font-mono text-[9.5px] text-pine-400">{s.ts}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
