import { useState } from "react";
import { fmtMoney } from "../data";
import { useApp } from "../state";
import { calc } from "./Billing";
import { Bars, Card, Donut, Icon, Reveal, SectionHead, TrendLine, Chip } from "../components/ui";

const REFERRALS = [
  { campaign: "Spring Wellness Drive", leads: 42, booked: 18, source: "FS MedCRM" },
  { campaign: "Post-Discharge Outreach", leads: 31, booked: 14, source: "FS MedCRM" },
  { campaign: "Physician Referral Loop", leads: 24, booked: 11, source: "FS PracticeSuite" },
];

export function Reports() {
  const { db, toast } = useApp();
  const [range, setRange] = useState("This month");
  const visitsByDay = [4, 6, 5, 7, 6, 3, 2];
  const booked = db.visits.length;
  const revenue = db.invoices.reduce((a, i) => a + calc(i).subtotal, 0);
  const copay = db.invoices.reduce((a, i) => a + calc(i).copay, 0);
  const hmoPart = db.invoices.reduce((a, i) => a + calc(i).covered, 0);

  const topSvcs = db.services
    .map(s => ({ s, n: db.visits.filter(v => v.svc === s.name).length + db.invoices.filter(i => i.items.some(it => it.desc.startsWith(s.name))).length }))
    .sort((a, b) => b.n - a.n).slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Reporting / analytics · §1.8" title="Operations Analytics" icon="chart" />
        <div className="flex gap-1.5">
          {["This week", "This month", "Quarter"].map(r => (
            <button key={r} onClick={() => setRange(r)} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold transition-all ${range === r ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>{r}</button>
          ))}
          <button onClick={() => toast(`“Branch performance — ${range}” exported (letterhead PDF)`, "ok")} className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-pulse-600 px-3 py-1.5 text-[11.5px] font-bold text-white transition-all hover:bg-pulse-500 active:scale-95"><Icon name="download" size={13} /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Gross revenue", fmtMoney(revenue), "all payers, billed"],
          ["HMO adjudicated", fmtMoney(hmoPart), "covered portion"],
          ["Co-pay collected", fmtMoney(copay), "client responsibility"],
          ["Visits in period", String(booked), "all delivery modes"],
        ].map(([k, v, sub], i) => (
          <Reveal key={k} delay={i * 70}>
            <Card className="transition-all duration-300 hover:-translate-y-1 hover:shadow-pop" pad={false}>
              <div className="p-4">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-pine-400">{k}</p>
                <p className="mt-1 font-mono text-[21px] font-semibold leading-none text-pine-900 tnum">{v}</p>
                <p className="mt-1.5 text-[11px] text-pine-500">{sub} · {range.toLowerCase()}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal><Card>
          <SectionHead title="Visits by weekday" icon="calendar" />
          <Bars data={visitsByDay} labels={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]} fmt={n => `${n} visits`} />
        </Card></Reveal>

        <Reveal delay={90}><Card>
          <SectionHead title="Revenue by payer mix" icon="invoice" />
          <Donut parts={[
            { label: "HMO covered", value: Math.round(hmoPart), color: "#7a4fbf" },
            { label: "Client co-pay", value: Math.round(copay), color: "#e8a33d" },
            { label: "Self-pay", value: Math.max(60, Math.round(revenue - hmoPart - copay)), color: "#9aa4af" },
          ]} />
          <p className="mt-3 text-[11px] text-pine-500">SeniorCare 90% · MediPlus 80% · BlueCare 70% coverage schedules applied at invoice time.</p>
        </Card></Reveal>

        <Reveal><Card>
          <SectionHead title="Booking trend — 8 weeks" icon="chart" />
          <TrendLine data={[22, 25, 24, 29, 31, 30, 34, booked + 28]} labels={["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]} />
          <p className="mt-2 text-[11px] text-pine-500">Portal widget contributed <b className="text-pulse-700">31%</b> of new bookings in W8.</p>
        </Card></Reveal>

        <Reveal delay={90}><Card>
          <SectionHead title="Top services by volume" icon="tag" />
          <div className="space-y-2">
            {topSvcs.map((t, i) => (
              <div key={t.s.id} className="flex items-center gap-3">
                <span className="w-5 font-mono text-[11px] font-bold text-pine-400 tnum">{i + 1}</span>
                <div className="flex-1">
                  <div className="mb-1 flex justify-between text-[12px]"><span className="font-bold text-pine-800">{t.s.name}</span><span className="font-mono text-pine-500 tnum">{t.n} uses · {fmtMoney(t.s.rate)}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-pine-100">
                    <div className="h-full rounded-full bg-pulse-500 transition-all duration-700" style={{ width: `${(t.n / (topSvcs[0]?.n || 1)) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card></Reveal>
      </div>

      <Reveal><Card>
        <SectionHead kicker="FS MedCRM · Volume 3 feed" title="Referral & campaign intelligence" icon="globe" right={<Chip tone="green" pulse>auto-synced</Chip>} />
        <div className="grid gap-3 md:grid-cols-3">
          {REFERRALS.map((r, i) => (
            <div key={r.campaign} className="rounded-md border border-pine-200 bg-paper/70 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lift anim-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-extrabold text-pine-900">{r.campaign}</p>
                <Chip tone="violet">{r.source}</Chip>
              </div>
              <div className="mt-3 flex items-end gap-4">
                <div><p className="font-mono text-[20px] font-semibold text-pine-900 tnum">{r.leads}</p><p className="text-[9.5px] font-bold uppercase tracking-wider text-pine-400">leads</p></div>
                <div><p className="font-mono text-[20px] font-semibold text-pulse-600 tnum">{r.booked}</p><p className="text-[9.5px] font-bold uppercase tracking-wider text-pine-400">booked</p></div>
                <div className="ml-auto text-right"><p className="font-mono text-[20px] font-semibold text-vita-600 tnum">{Math.round((r.booked / r.leads) * 100)}%</p><p className="text-[9.5px] font-bold uppercase tracking-wider text-pine-400">conversion</p></div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-pine-100">
                <div className="h-full rounded-full bg-gradient-to-r from-pulse-500 to-pulse-300" style={{ width: `${(r.booked / r.leads) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card></Reveal>
    </div>
  );
}
