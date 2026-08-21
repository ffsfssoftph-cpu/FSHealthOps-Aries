import { useState } from "react";
import { dayOffset, uid } from "../data";
import { useApp } from "../state";
import { Emblem } from "../components/Logo";
import { Btn, Card, Chip, Icon, SectionHead, STATUS_TONE, Toggle, inputCls } from "../components/ui";

export function Portal() {
  const { db, setDb, toast, cfg } = useApp();
  const [online, setOnline] = useState(true);
  const [leadTime, setLeadTime] = useState(cfg?.bookingRules.leadTimeHrs ?? 24);
  const [allowed, setAllowed] = useState<string[]>(db.services.filter(s => s.active && s.hmoCovered).map(s => s.name));
  const [copied, setCopied] = useState(false);

  /* widget state */
  const [step, setStep] = useState(0);
  const [wSvc, setWSvc] = useState("");
  const [wProv, setWProv] = useState("any");
  const [wDate, setWDate] = useState(dayOffset(2));
  const [wTime, setWTime] = useState("");
  const [wName, setWName] = useState("");
  const [wPhone, setWPhone] = useState("");
  const [wRef, setWRef] = useState("");

  const slots = ["08:30", "09:30", "10:30", "13:00", "14:00", "15:30"];
  const embed = `<script src="https://cdn.fssoftwares.com/careops/widget.js"
  data-org="${(cfg?.company ?? "your-org").toLowerCase().replace(/\s+/g, "-")}"
  data-edition="${cfg?.remoteAccess ? "remote-access" : "standard"}"
  data-leadtime="${leadTime}"></script>`;

  const copy = (txt: string, what: string) => {
    navigator.clipboard?.writeText(txt).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 1600);
    toast(`${what} copied to clipboard`, "ok");
  };

  const confirmBooking = () => {
    if (!wName.trim() || !wPhone.trim()) { toast("Name and phone are required to confirm.", "warn"); return; }
    const ref = "PB-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    setWRef(ref);
    setDb(d => ({
      ...d,
      inquiries: [{ id: uid(), name: wName.trim(), contact: wPhone.trim(), service: wSvc, when: "Just now — widget", status: "booked", note: `Online booking ${ref} · ${wDate} ${wTime} · pref. ${wProv === "any" ? "any caregiver" : wProv}` }, ...d.inquiries],
      notifs: [{ id: uid(), icon: "globe", text: `Portal booking ${ref} — ${wName.trim()} (${wSvc})`, meta: "Self-service · needs assignment", read: false, tone: "info" }, ...d.notifs],
    }));
    toast(`Portal booking ${ref} received — scheduler notified`, "ok");
  };

  const resetWidget = () => { setStep(0); setWSvc(""); setWProv("any"); setWTime(""); setWName(""); setWPhone(""); setWRef(""); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
        <SectionHead kicker="Client self-service portal / app · §1.9" title="Online Booking & Inquiry" icon="globe" />
        <div className="flex items-center gap-3">
          <Toggle on={online} onChange={v => { setOnline(v); toast(v ? "Online booking is live on the public portal" : "Online booking paused — inquiries only", v ? "ok" : "warn"); }} label={online ? "Booking live" : "Paused"} />
          <Btn kind="outline" onClick={() => copy(`https://portal.fssoftwares.com/${(cfg?.company ?? "your-org").toLowerCase().replace(/\s+/g, "-")}`, "Portal link")}><Icon name="external" size={14} /> Share portal</Btn>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        {/* widget preview */}
        <RevealWrap className="xl:col-span-2">
          <Card pad={false} className="overflow-hidden">
            <div className="flex items-center justify-between bg-pine-950 px-4 py-2.5">
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.18em] text-pine-300">Live widget preview</span>
              <span className="flex gap-1"><span className="h-2 w-2 rounded-full bg-danger-500/70" /><span className="h-2 w-2 rounded-full bg-vita-500/70" /><span className="h-2 w-2 rounded-full bg-pulse-500/70" /></span>
            </div>
            <div className="bg-paper p-4">
              <div className="rounded-lg border border-pine-200 bg-white p-4 shadow-lift">
                <div className="flex items-center justify-between border-b border-pine-100 pb-3">
                  <span className="font-display text-[14px] font-extrabold text-pine-900">{cfg?.company ?? "Your Clinic"} — Book Care</span>
                  <Emblem size={22} />
                </div>

                {/* progress */}
                <div className="mt-3 flex items-center gap-1">
                  {["Service", "Time", "Details"].map((s, i) => (
                    <div key={s} className="flex flex-1 items-center gap-1">
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[9px] font-bold ${step > i || (wRef && true) ? "bg-pulse-600 text-white" : step === i ? "bg-pine-900 text-pine-50" : "bg-pine-100 text-pine-400"}`}>{wRef ? "✓" : i + 1}</span>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wide ${step >= i && !wRef ? "text-pine-800" : "text-pine-300"}`}>{s}</span>
                      {i < 2 && <span className={`h-px flex-1 ${step > i ? "bg-pulse-500" : "bg-pine-100"}`} />}
                    </div>
                  ))}
                </div>

                {wRef ? (
                  <div className="py-6 text-center anim-pop">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pulse-50 text-pulse-600"><Icon name="check" size={24} sw={2.4} /></span>
                    <p className="mt-3 font-display text-[16px] font-extrabold text-pine-900">Request received!</p>
                    <p className="mt-1 font-mono text-[12px] text-pine-500">Reference <b className="text-pulse-700">{wRef}</b> · {wDate} {wTime}</p>
                    <p className="mt-2 text-[11px] text-pine-500">Our scheduler will confirm within {leadTime}h. HMO eligibility is verified automatically.</p>
                    <button onClick={resetWidget} className="mt-4 text-[11.5px] font-bold text-pulse-600 hover:underline">Book another visit</button>
                  </div>
                ) : step === 0 ? (
                  <div className="mt-4 space-y-1.5 anim-fade-in">
                    {allowed.length === 0 && <p className="text-[11.5px] text-pine-400">No services enabled for online booking.</p>}
                    {allowed.map(s => (
                      <button key={s} onClick={() => { setWSvc(s); setStep(1); }}
                        className={`flex w-full items-center justify-between rounded-md border px-3 py-2.5 text-left text-[12.5px] font-bold transition-all duration-150 hover:-translate-y-px hover:shadow-lift ${wSvc === s ? "border-pulse-500 bg-pulse-50 text-pulse-800" : "border-pine-200 text-pine-800 hover:border-pine-400"}`}>
                        {s}<Icon name="chevR" size={14} className="text-pine-300" />
                      </button>
                    ))}
                  </div>
                ) : step === 1 ? (
                  <div className="mt-4 space-y-3 anim-fade-in">
                    <select className={inputCls} value={wProv} onChange={e => setWProv(e.target.value)}>
                      <option value="any">Any available caregiver</option>
                      {db.providers.filter(p => p.status === "on-duty").map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                    <input type="date" className={inputCls} min={dayOffset(Math.ceil(leadTime / 24))} value={wDate} onChange={e => setWDate(e.target.value)} />
                    <div className="grid grid-cols-3 gap-1.5">
                      {slots.map(t => (
                        <button key={t} onClick={() => { setWTime(t); setStep(2); }}
                          className={`rounded-md border py-2 font-mono text-[12px] font-semibold transition-all ${wTime === t ? "border-pulse-500 bg-pulse-600 text-white" : "border-pine-200 text-pine-700 hover:border-pulse-400"}`}>{t}</button>
                      ))}
                    </div>
                    <button onClick={() => setStep(0)} className="text-[11px] font-bold text-pine-400 hover:text-pine-700">← change service</button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5 anim-fade-in">
                    <p className="rounded-md bg-pulse-50 px-3 py-2 text-[11.5px] font-semibold text-pulse-800">{wSvc} · {wDate} at {wTime} · {wProv === "any" ? "any caregiver" : wProv}</p>
                    <input className={inputCls} placeholder="Full name" value={wName} onChange={e => setWName(e.target.value)} />
                    <input className={inputCls} placeholder="Phone or email" value={wPhone} onChange={e => setWPhone(e.target.value)} />
                    <textarea className={`${inputCls} h-16 resize-none`} placeholder="Anything we should know? (optional)" />
                    <Btn className="w-full" onClick={confirmBooking}><Icon name="check" size={14} /> Request booking</Btn>
                    <button onClick={() => setStep(1)} className="w-full text-center text-[11px] font-bold text-pine-400 hover:text-pine-700">← change time</button>
                  </div>
                )}
              </div>
              <p className="mt-3 text-center font-mono text-[8.5px] uppercase tracking-[0.14em] text-pine-400">Powered by FS CareOps · © FS Softwares × TophComm Systems</p>
            </div>
          </Card>
        </RevealWrap>

        {/* settings + embed + inquiries */}
        <div className="space-y-4 xl:col-span-3">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <SectionHead title="Widget settings" icon="cpu" />
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2">
                  <span className="text-[12.5px] font-bold text-pine-800">Booking lead time</span>
                  <select className="w-28 rounded-md border border-pine-300 bg-white px-2 py-1.5 text-[12px] font-semibold" value={leadTime} onChange={e => setLeadTime(+e.target.value)}>
                    {[4, 12, 24, 48, 72].map(h => <option key={h} value={h}>{h}h</option>)}
                  </select>
                </div>
                <div>
                  <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Bookable services</p>
                  <div className="flex flex-wrap gap-1.5">
                    {db.services.filter(s => s.active).map(s => {
                      const on = allowed.includes(s.name);
                      return (
                        <button key={s.id} onClick={() => setAllowed(on ? allowed.filter(a => a !== s.name) : [...allowed, s.name])}
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition-all ${on ? "border-pulse-500 bg-pulse-50 text-pulse-700" : "border-pine-200 text-pine-500 hover:border-pine-400"}`}>{s.name}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-md border border-vita-400/50 bg-vita-100/60 px-3 py-2 text-[11px] leading-snug text-vita-600">
                  Inquiries never auto-displace existing visits — scheduler confirms within the lead-time window.
                </div>
              </div>
            </Card>

            <Card>
              <SectionHead title="Embed on your website" icon="copy" />
              <pre className="overflow-x-auto rounded-md bg-pine-950 p-3 font-mono text-[10.5px] leading-relaxed text-pulse-200">{embed}</pre>
              <div className="mt-3 flex gap-2">
                <Btn size="sm" kind="dark" onClick={() => copy(embed, "Embed snippet")}><Icon name={copied ? "check" : "copy"} size={13} /> {copied ? "Copied!" : "Copy snippet"}</Btn>
                <Btn size="sm" kind="outline" onClick={() => toast("Widget QR + print kit generated", "info")}><Icon name="download" size={13} /> Print kit</Btn>
              </div>
              <p className="mt-3 text-[11px] leading-snug text-pine-500">Widget inherits the Logo Positioning Standard: client logo left, FS CareOps mark right, credit footer.</p>
            </Card>
          </div>

          <Card pad={false}>
            <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
              <h3 className="font-display text-[14px] font-extrabold text-pine-900">Inquiry pipeline</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-pine-400">{db.inquiries.filter(i => i.status === "new").length} new</span>
            </div>
            <div className="divide-y divide-pine-100">
              {db.inquiries.map(q => (
                <div key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-pulse-50/40">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pine-100 font-display text-[11px] font-bold text-pine-700">{q.name.split(" ").map(w => w[0]).join("")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-pine-900">{q.name} <span className="font-mono text-[10px] font-medium text-pine-400">· {q.contact}</span></p>
                    <p className="truncate text-[11px] text-pine-500">{q.service} · {q.note}</p>
                  </div>
                  <span className="font-mono text-[10px] text-pine-400">{q.when}</span>
                  <Chip tone={STATUS_TONE[q.status]}>{q.status}</Chip>
                  {q.status === "new" && (
                    <button onClick={() => { setDb(d => ({ ...d, inquiries: d.inquiries.map(x => x.id === q.id ? { ...x, status: "contacted" } : x) })); toast(`Follow-up logged for ${q.name}`, "ok"); }}
                      className="rounded-md border border-pine-200 bg-white px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-pine-600 transition-all hover:border-pulse-500 hover:text-pulse-700">Contact</button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
function RevealWrap({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${className} anim-fade-up`}>{children}</div>;
}
