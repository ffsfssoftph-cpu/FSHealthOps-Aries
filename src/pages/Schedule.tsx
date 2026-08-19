import { useMemo, useState } from "react";
import { dayOffset, uid, weekDays } from "../data";
import type { Visit } from "../data";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, Modal, SectionHead, STATUS_TONE, Field, inputCls, Empty } from "../components/ui";

const FLOW: Visit["status"][] = ["scheduled", "en-route", "in-progress", "completed"];

export function Schedule() {
  const { db, setDb, toast, cfg } = useApp();
  const days = useMemo(weekDays, []);
  const [provFilter, setProvFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [detail, setDetail] = useState<Visit | null>(null);
  const [form, setForm] = useState({ clientId: "", providerId: "", date: dayOffset(1), start: "09:00", kind: "home-visit" as Visit["kind"], svc: "" });

  const visits = db.visits.filter(v => provFilter === "all" || v.providerId === provFilter);
  const clientName = (id: string) => db.clients.find(c => c.id === id)?.name ?? "—";
  const prov = (id: string) => db.providers.find(p => p.id === id);

  const book = () => {
    if (!form.clientId || !form.providerId || !form.svc) { toast("Select client, caregiver and service to book.", "warn"); return; }
    const dur = cfg?.bookingRules.visitDurationMin ?? 60;
    const [h, m] = form.start.split(":").map(Number);
    const endD = new Date(2000, 0, 1, h, m + dur);
    const v: Visit = {
      id: uid(), clientId: form.clientId, providerId: form.providerId, date: form.date,
      start: form.start, end: `${String(endD.getHours()).padStart(2, "0")}:${String(endD.getMinutes()).padStart(2, "0")}`,
      kind: form.kind, status: "scheduled", svc: form.svc,
    };
    setDb(d => ({ ...d, visits: [...d.visits, v] }));
    toast(`Booked ${clientName(form.clientId)} — ${form.date} ${form.start}${cfg?.bookingRules.doubleConfirm ? " (double-confirm sent)" : ""}`, "ok");
    setAddOpen(false);
    setForm({ ...form, clientId: "", svc: "" });
  };

  const setStatus = (id: string, status: Visit["status"]) => {
    setDb(d => ({ ...d, visits: d.visits.map(v => v.id === id ? { ...v, status } : v) }));
    setDetail(dd => dd && dd.id === id ? { ...dd, status } : dd);
    toast(`Visit marked ${status.replace("-", " ")}`, status === "missed" ? "warn" : "ok");
  };

  const cancelVisit = (id: string) => {
    setDb(d => ({ ...d, visits: d.visits.filter(v => v.id !== id) }));
    toast(`Visit cancelled inside ${cfg?.bookingRules.cancelWindowHrs}h window — no penalty`, "info");
    setDetail(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Scheduling / booking engine · §1.2" title="Appointments & Home Visits" icon="calendar" />
        <div className="flex gap-2">
          <Btn kind="outline" onClick={() => setProvFilter("all")}>All providers</Btn>
          <Btn onClick={() => setAddOpen(true)}><Icon name="plus" size={15} /> Book visit</Btn>
        </div>
      </div>

      {/* provider filter chips */}
      <div className="flex flex-wrap gap-2">
        {db.providers.map(p => (
          <button key={p.id} onClick={() => setProvFilter(provFilter === p.id ? "all" : p.id)}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-all duration-200 ${provFilter === p.id ? "border-transparent text-white shadow-lift -translate-y-px" : "border-pine-200 bg-white text-pine-700 hover:border-pine-400"}`}
            style={provFilter === p.id ? { background: p.color } : {}}>
            <span className="h-2 w-2 rounded-full" style={{ background: provFilter === p.id ? "#fff" : p.color }} />
            {p.name.split(",")[0]}
            <span className="font-mono text-[10px] opacity-70 tnum">{db.visits.filter(v => v.providerId === p.id).length}</span>
          </button>
        ))}
      </div>

      {/* week grid */}
      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {days.map(day => {
          const dayVisits = visits.filter(v => v.date === day.iso).sort((a, b) => a.start.localeCompare(b.start));
          return (
            <div key={day.iso} className={`rounded-lg border p-2 transition-colors ${day.isToday ? "border-pulse-400 bg-pulse-50/60 shadow-lift" : "border-pine-200 bg-white"}`}>
              <div className="mb-2 flex items-center justify-between px-1">
                <span className={`font-display text-[12.5px] font-extrabold ${day.isToday ? "text-pulse-700" : "text-pine-800"}`}>{day.label} <span className="font-mono text-[10px] font-semibold text-pine-400 tnum">{day.dayNum}</span></span>
                {day.isToday && <Chip tone="green" pulse>today</Chip>}
              </div>
              <div className="min-h-[92px] space-y-1.5">
                {dayVisits.map(v => {
                  const p = prov(v.providerId);
                  return (
                    <button key={v.id} onClick={() => setDetail(v)}
                      className="group block w-full rounded-md border border-pine-100 bg-white p-2 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-pulse-300 hover:shadow-lift"
                      style={{ borderLeft: `3px solid ${p?.color}` }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-pine-700 tnum">{v.start}</span>
                        <span className={`h-1.5 w-1.5 rounded-full ${v.status === "completed" ? "bg-pine-400" : v.status === "missed" ? "bg-danger-500" : v.status === "in-progress" ? "bg-pulse-500 dot-live" : v.status === "en-route" ? "bg-vita-500 dot-warn" : "bg-info-500"}`} />
                      </div>
                      <p className="mt-0.5 truncate text-[11px] font-bold leading-tight text-pine-900">{clientName(v.clientId)}</p>
                      <p className="truncate text-[9.5px] text-pine-500">{v.svc}</p>
                    </button>
                  );
                })}
                {dayVisits.length === 0 && <p className="py-3 text-center font-mono text-[9.5px] uppercase tracking-wider text-pine-300">— open —</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-pine-200 bg-white px-4 py-2.5 shadow-lift">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Legend</span>
        {FLOW.concat(["missed"]).map(s => <Chip key={s} tone={STATUS_TONE[s]}>{s}</Chip>)}
        <span className="ml-auto font-mono text-[10.5px] text-pine-400">Lead time {cfg?.bookingRules.leadTimeHrs}h · cancel window {cfg?.bookingRules.cancelWindowHrs}h · {cfg?.bookingRules.weekendVisits ? "weekends open" : "weekends closed"}</span>
      </div>

      {/* book modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={<span className="flex items-center gap-2"><Icon name="calendar" size={16} className="text-pulse-600" /> Book appointment / home visit</span>}
        footer={<><Btn kind="ghost" onClick={() => setAddOpen(false)}>Cancel</Btn><Btn onClick={book}><Icon name="check" size={14} /> Confirm booking</Btn></>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client">
              <select className={inputCls} value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}>
                <option value="">Select client…</option>
                {db.clients.map(c => <option key={c.id} value={c.id}>{c.name} · {c.zone}</option>)}
              </select>
            </Field>
            <Field label="Caregiver / provider">
              <select className={inputCls} value={form.providerId} onChange={e => setForm({ ...form, providerId: e.target.value })}>
                <option value="">Select provider…</option>
                {db.providers.filter(p => p.status !== "on-leave").map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Service">
              <select className={inputCls} value={form.svc} onChange={e => setForm({ ...form, svc: e.target.value })}>
                <option value="">Select service…</option>
                {db.services.filter(s => s.active).map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="Mode">
              <select className={inputCls} value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as Visit["kind"] })}>
                <option value="home-visit">Home visit</option><option value="clinic">In-clinic</option><option value="telehealth">Telehealth</option>
              </select>
            </Field>
            <Field label="Date"><input type="date" className={inputCls} value={form.date} min={dayOffset(0)} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
            <Field label="Start time"><input type="time" className={inputCls} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></Field>
          </div>
          {cfg?.bookingRules.hmoPreauth && (
            <p className="rounded-md bg-vita-100 px-3 py-2 text-[11.5px] font-semibold text-vita-600">
              HMO pre-auth required — eligibility will be verified against the payer before confirmation.
            </p>
          )}
        </div>
      </Modal>

      {/* detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `${clientName(detail.clientId)} — ${detail.svc}` : ""}>
        {detail && (() => { const p = prov(detail.providerId); return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={STATUS_TONE[detail.status]} pulse={detail.status === "in-progress"}>{detail.status}</Chip>
              <Chip tone="gray">{detail.kind === "home-visit" ? "home visit" : detail.kind}</Chip>
              <span className="ml-auto font-mono text-[12px] font-semibold text-pine-700 tnum">{detail.date} · {detail.start}–{detail.end}</span>
            </div>
            <div className="rounded-md border border-pine-100 bg-paper p-3 text-[12.5px]">
              <p className="flex items-center gap-2 font-bold text-pine-900"><span className="h-2.5 w-2.5 rounded-full" style={{ background: p?.color }} />{p?.name} <span className="font-medium text-pine-500">· {p?.title}</span></p>
              <p className="mt-1 flex items-center gap-1.5 text-pine-600"><Icon name="pin" size={13} /> {db.clients.find(c => c.id === detail.clientId)?.address}</p>
              <p className="mt-1 flex items-center gap-1.5 text-pine-500"><Icon name="clock" size={13} /> Default duration {cfg?.bookingRules.visitDurationMin} min · team {p?.team}</p>
            </div>
            <div className="rounded-md border border-info-500/30 bg-info-100/60 px-3 py-2 text-[11.5px] text-info-700">
              <b>Clinical charting lives in FS EHR / PracticeSuite</b> — CareOps syncs the schedule; notes are not replicated here.
            </div>
            <div className="flex flex-wrap gap-2">
              {FLOW.filter(s => s !== detail.status).map(s => (
                <Btn key={s} size="sm" kind={s === "completed" ? "dark" : "outline"} onClick={() => setStatus(detail.id, s)}>{s}</Btn>
              ))}
              <Btn size="sm" kind="danger" onClick={() => cancelVisit(detail.id)}><Icon name="x" size={13} /> Cancel visit</Btn>
            </div>
          </div>
        ); })()}
      </Modal>

      {visits.length === 0 && <Empty icon="calendar" text="No visits match this provider filter." />}
    </div>
  );
}
