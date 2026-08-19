import { useRef, useState } from "react";
import { DEPLOY_MODES, PATTERN_ROWS, seedChecklist } from "../data";
import type { BookingRules, ChecklistItem, SetupConfig } from "../data";
import { CompanyMark, Ecg, Emblem, Lockup } from "../components/Logo";
import { Btn, Field, Icon, Progress, Toggle, inputCls } from "../components/ui";

const STEPS = ["Identity", "Build Pattern", "Deployment", "Care Defaults", "Provision"];

export function SetupWizard({ onComplete }: { onComplete: (cfg: SetupConfig) => void }) {
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [owner, setOwner] = useState("");
  const [am, setAm] = useState("");
  const [dept, setDept] = useState("Operations");
  const [sysLogo, setSysLogo] = useState<string | null>(null);
  const [coLogo, setCoLogo] = useState<string | null>(null);
  const [pattern, setPattern] = useState<"A" | "B">("A");
  const [deploy, setDeploy] = useState("standalone");
  const [remote, setRemote] = useState(true);
  const [rules, setRules] = useState<BookingRules>({ leadTimeHrs: 24, cancelWindowHrs: 12, visitDurationMin: 60, overbookAllowed: false, weekendVisits: true, hmoPreauth: true, doubleConfirm: true });
  const [checklist, setChecklist] = useState<ChecklistItem[]>(seedChecklist());
  const [newItem, setNewItem] = useState("");
  const [provision, setProvision] = useState(0);
  const [provisioning, setProvisioning] = useState(false);
  const sysRef = useRef<HTMLInputElement>(null);
  const coRef = useRef<HTMLInputElement>(null);

  const readFile = (f: File | undefined, set: (s: string) => void) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => set(String(r.result));
    r.readAsDataURL(f);
  };

  const startProvision = () => {
    setProvisioning(true);
    const t = setInterval(() => {
      setProvision(p => {
        if (p >= 100) {
          clearInterval(t);
          setTimeout(() => onComplete({
            company: company.trim() || "Meridian Home Health & Wellness",
            owner: owner.trim() || "Fritz Suarez",
            accountManager: am.trim() || "TophComm Success Desk",
            department: dept.trim() || "Operations",
            systemLogo: sysLogo, companyLogo: coLogo,
            pattern, deploy, remoteAccess: remote,
            edition: remote ? "Remote-Access Edition" : "Standard Edition",
            bookingRules: rules, checklist,
            provisionedAt: new Date().toISOString(),
          }), 500);
          return 100;
        }
        return p + 4;
      });
    }, 55);
  };

  const stepValid =
    step === 0 ? company.trim() && owner.trim() && am.trim() :
    step === 3 ? checklist.length > 0 : true;

  return (
    <div className="relative min-h-screen bg-clinical noise-layer">
      <div className="mx-auto w-full max-w-4xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
          <Lockup variant="header" />
          <div className="flex items-center gap-2 rounded-md border border-pine-200 bg-white px-3 py-1.5 shadow-lift">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-pine-500">First-run setup</span>
            <span className="font-mono text-[10px] font-bold text-pulse-600">Step {step + 1}/5</span>
          </div>
        </header>

        {/* step rail */}
        <div className="mt-6 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <button onClick={() => !provisioning && i < step && setStep(i)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-bold transition-all ${i === step ? "bg-pine-900 text-pine-50 shadow-lift" : i < step ? "text-pulse-700 hover:bg-pulse-50" : "text-pine-400"}`}>
                <span className={`inline-flex h-4.5 w-4.5 items-center justify-center rounded-full font-mono text-[9.5px] ${i === step ? "bg-pulse-500 text-white" : i < step ? "bg-pulse-100 text-pulse-700" : "bg-pine-100 text-pine-500"}`} style={{ width: 18, height: 18 }}>
                  {i < step ? <Icon name="check" size={10} sw={2.6} /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < step ? "bg-pulse-400" : "bg-pine-200"}`} />}
            </div>
          ))}
        </div>

        <main className="mt-5 rounded-lg border border-pine-200 bg-white p-6 shadow-pop anim-pop" key={step}>
          {/* ---- 1 identity ---- */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">§A · Company / Owner / Account-Manager sync</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-pine-900">Who operates this installation?</h2>
                <p className="mt-1 text-[13px] text-pine-500">These fields sync across every module, letterhead and printed surface.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Company / Clinic Name"><input className={inputCls} value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Meridian Home Health & Wellness" /></Field>
                <Field label="Software Owner"><input className={inputCls} value={owner} onChange={e => setOwner(e.target.value)} placeholder="e.g. Fritz Suarez" /></Field>
                <Field label="Account Manager / Department Lead"><input className={inputCls} value={am} onChange={e => setAm(e.target.value)} placeholder="e.g. TophComm Success Desk" /></Field>
                <Field label="Department"><input className={inputCls} value={dept} onChange={e => setDept(e.target.value)} placeholder="Operations" /></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "System Logo (FS CareOps)", ref: sysRef, val: sysLogo, set: setSysLogo, note: "Per Logo Positioning Standard — used when you override the bundled mark." },
                  { label: "Company Logo", ref: coRef, val: coLogo, set: setCoLogo, note: "Paired left of the system lockup on letterheads & portal." },
                ].map((u, i) => (
                  <div key={i} className="rounded-md border border-dashed border-pine-300 bg-paper p-3">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">{u.label}</p>
                    <div className="mt-2 flex items-center gap-3">
                      {u.val ? (
                        <img src={u.val} alt="logo preview" className="h-12 w-12 rounded-md object-cover ring-1 ring-pine-200" />
                      ) : (
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-white ring-1 ring-pine-200 text-pine-300">
                          {i === 0 ? <Emblem size={30} /> : <CompanyMark src={null} name={company || "Your Clinic"} size={40} />}
                        </span>
                      )}
                      <div className="space-y-1.5">
                        <Btn size="sm" kind="outline" onClick={() => u.ref.current?.click()}><Icon name="upload" size={13} /> Upload image</Btn>
                        {u.val && <button className="block text-[11px] font-bold text-danger-600 hover:underline" onClick={() => u.set(null)}>Remove</button>}
                      </div>
                    </div>
                    <p className="mt-2 text-[10.5px] leading-snug text-pine-400">{u.note}</p>
                    <input ref={u.ref} type="file" accept="image/*" className="hidden" onChange={e => readFile(e.target.files?.[0], u.set)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- 2 pattern ---- */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">§D · Client's build selection</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-pine-900">Pattern A vs Pattern B</h2>
                <p className="mt-1 text-[13px] text-pine-500">Sets the packaged composition of FSCareOps-Setup-1.0.0.exe and FSCareOps.apk.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {(["A", "B"] as const).map(p => (
                  <button key={p} onClick={() => setPattern(p)}
                    className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${pattern === p ? "border-pulse-500 bg-pulse-50 shadow-pop -translate-y-0.5" : "border-pine-200 hover:border-pine-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-lg font-black text-pine-900">Pattern {p}</span>
                      {pattern === p && <span className="text-pulse-600"><Icon name="check" size={18} sw={2.4} /></span>}
                    </div>
                    <p className="mt-1 font-mono text-[11px] font-semibold text-pulse-700">
                      {p === "A" ? "Node/Express + SQLite · Electron · Capacitor" : "NestJS/.NET + PostgreSQL · Tauri · Flutter"}
                    </p>
                    <p className="mt-2 text-[11.5px] leading-snug text-pine-500">
                      {p === "A" ? "Volume 1 composition — fastest to ship, embedded database, batteries included." : "Volume 2 composition — leaner binaries, strict enterprise typing, native runtimes."}
                    </p>
                  </button>
                ))}
              </div>
              <div className="overflow-hidden rounded-md border border-pine-200">
                <table className="w-full text-[12px]">
                  <thead className="bg-pine-900 text-left font-mono text-[10px] uppercase tracking-wider text-pine-200">
                    <tr><th className="px-3 py-2">Aspect</th><th className="px-3 py-2">Pattern A</th><th className="px-3 py-2">Pattern B</th></tr>
                  </thead>
                  <tbody>
                    {PATTERN_ROWS.map(r => (
                      <tr key={r.aspect} className={`border-t border-pine-100 ${r.aspect === "Best fit" ? "bg-pulse-50/60 font-semibold" : ""}`}>
                        <td className="px-3 py-2 font-bold text-pine-700">{r.aspect}</td>
                        <td className={`px-3 py-2 ${pattern === "A" ? "text-pulse-700 font-semibold" : "text-pine-500"}`}>{r.a}</td>
                        <td className={`px-3 py-2 ${pattern === "B" ? "text-pulse-700 font-semibold" : "text-pine-500"}`}>{r.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ---- 3 deployment ---- */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">§10 · All 4 deployment modes</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-pine-900">Where will CareOps live?</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {DEPLOY_MODES.map(m => (
                  <button key={m.id} onClick={() => setDeploy(m.id)}
                    className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${deploy === m.id ? "border-pulse-500 bg-pulse-50 shadow-pop -translate-y-0.5" : "border-pine-200 hover:border-pine-300"}`}>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 font-display text-[15px] font-extrabold text-pine-900">
                        <span className={deploy === m.id ? "text-pulse-600" : "text-pine-400"}><Icon name={m.icon} size={18} /></span>{m.name}
                      </span>
                      {deploy === m.id && <span className="text-pulse-600"><Icon name="check" size={16} sw={2.4} /></span>}
                    </div>
                    <p className="mt-1.5 text-[12px] leading-snug text-pine-500">{m.blurb}</p>
                  </button>
                ))}
              </div>
              <div className={`rounded-lg border-2 p-4 transition-all ${remote ? "border-vita-500 bg-vita-100/60" : "border-pine-200"}`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[15px] font-extrabold text-pine-900">Remote-Access Edition</p>
                    <p className="mt-0.5 text-[12px] text-pine-500">Parallel build profile — same v1.0.0 version number, hardened TLS tunnel for caregivers in the field.</p>
                  </div>
                  <Toggle on={remote} onChange={setRemote} label={remote ? "Enabled" : "Disabled"} />
                </div>
              </div>
            </div>
          )}

          {/* ---- 4 care defaults ---- */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">Health Care preset · fully editable</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-pine-900">Booking rules, rate card & document checklist</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Booking lead time (hrs)"><input type="number" className={inputCls} value={rules.leadTimeHrs} onChange={e => setRules({ ...rules, leadTimeHrs: +e.target.value })} /></Field>
                <Field label="Cancellation window (hrs)"><input type="number" className={inputCls} value={rules.cancelWindowHrs} onChange={e => setRules({ ...rules, cancelWindowHrs: +e.target.value })} /></Field>
                <Field label="Default visit length (min)"><input type="number" className={inputCls} value={rules.visitDurationMin} onChange={e => setRules({ ...rules, visitDurationMin: +e.target.value })} /></Field>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-paper p-3">
                <Toggle on={rules.weekendVisits} onChange={v => setRules({ ...rules, weekendVisits: v })} label="Weekend visits" />
                <Toggle on={rules.hmoPreauth} onChange={v => setRules({ ...rules, hmoPreauth: v })} label="Require HMO pre-auth" />
                <Toggle on={rules.doubleConfirm} onChange={v => setRules({ ...rules, doubleConfirm: v })} label="Double-confirm bookings" />
                <Toggle on={rules.overbookAllowed} onChange={v => setRules({ ...rules, overbookAllowed: v })} label="Allow overbooking" />
              </div>
              <div className="rounded-md border border-pulse-200 bg-pulse-50 px-3 py-2.5 text-[12px] text-pulse-800">
                <b>Rate card:</b> 10 Health Care services pre-loaded (Skilled Nursing, Wound Care, PT, Personal Care…). Edit every rate later under <b>Packages & Rates</b>.
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-pine-500">Intake document checklist (default)</p>
                <div className="space-y-1.5">
                  {checklist.map(c => (
                    <div key={c.id} className="flex items-center gap-2 rounded-md border border-pine-100 bg-white px-3 py-1.5">
                      <input type="checkbox" checked={c.required} onChange={() => setChecklist(checklist.map(x => x.id === c.id ? { ...x, required: !x.required } : x))} className="accent-[#17876b]" />
                      <span className="flex-1 text-[12.5px] text-pine-800">{c.label}</span>
                      <span className={`font-mono text-[9px] font-bold uppercase ${c.required ? "text-danger-500" : "text-pine-400"}`}>{c.required ? "required" : "optional"}</span>
                      <button onClick={() => setChecklist(checklist.filter(x => x.id !== c.id))} className="text-pine-300 hover:text-danger-500"><Icon name="x" size={13} /></button>
                    </div>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <input className={inputCls} placeholder="Add checklist item…" value={newItem} onChange={e => setNewItem(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && newItem.trim()) { setChecklist([...checklist, { id: "k" + Date.now(), label: newItem.trim(), required: false }]); setNewItem(""); } }} />
                    <Btn kind="outline" onClick={() => { if (newItem.trim()) { setChecklist([...checklist, { id: "k" + Date.now(), label: newItem.trim(), required: false }]); setNewItem(""); } }}><Icon name="plus" size={14} /></Btn>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---- 5 provision ---- */}
          {step === 4 && (
            <div className="space-y-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">Review & provision</p>
                <h2 className="mt-1 font-display text-2xl font-black tracking-tight text-pine-900">Everything look right?</h2>
              </div>
              {!provisioning ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Company", company || "—"], ["Software owner", owner || "—"],
                    ["Account manager", am || "—"], ["Department", dept || "—"],
                    ["Build pattern", `Pattern ${pattern} (${pattern === "A" ? "Node/Express + SQLite, Electron, Capacitor" : "NestJS/.NET + PostgreSQL, Tauri, Flutter"})`],
                    ["Deployment", DEPLOY_MODES.find(d => d.id === deploy)?.name ?? deploy],
                    ["Edition", remote ? "Remote-Access Edition (parallel profile, v1.0.0)" : "Standard Edition"],
                    ["Checklist items", `${checklist.length} (${checklist.filter(c => c.required).length} required)`],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-md border border-pine-100 bg-paper px-3 py-2">
                      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-pine-400">{k}</p>
                      <p className="mt-0.5 text-[12.5px] font-bold text-pine-900">{v}</p>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 rounded-md border border-pine-100 bg-paper px-3 py-2 sm:col-span-2">
                    <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-pine-400">Logo pairing preview</span>
                    <span className="ml-auto flex items-center gap-2">
                      <CompanyMark src={coLogo} name={company} size={22} />
                      <span className="h-4 w-px bg-pine-200" />
                      {sysLogo ? <img src={sysLogo} alt="system logo" className="h-6 w-6 rounded object-cover" /> : <Emblem size={22} />}
                      <span className="font-display text-[13px] font-extrabold text-pine-900">FS CareOps</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-6">
                  <div className="flex items-center justify-between font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-pine-500">
                    <span>Provisioning workspace…</span><span className="text-pulse-600 tnum">{provision}%</span>
                  </div>
                  <Progress pct={provision} />
                  <div className="space-y-1 font-mono text-[11px] text-pine-500">
                    {provision > 10 && <p className="anim-fade-in">▸ Writing company profile & owner sync … ok</p>}
                    {provision > 30 && <p className="anim-fade-in">▸ Applying Pattern {pattern} runtime profile … ok</p>}
                    {provision > 50 && <p className="anim-fade-in">▸ Loading Health Care rate card (10 services) … ok</p>}
                    {provision > 70 && <p className="anim-fade-in">▸ Configuring booking engine & checklist … ok</p>}
                    {provision > 90 && <p className="anim-fade-in">▸ Placing logos on 8 standard surfaces … ok</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-pine-100 pt-4">
            <Btn kind="ghost" disabled={step === 0 || provisioning} onClick={() => setStep(s => s - 1)}>← Back</Btn>
            {step < 4 ? (
              <Btn size="lg" disabled={!stepValid} onClick={() => setStep(s => s + 1)}>Continue <Icon name="chevR" size={14} /></Btn>
            ) : (
              <Btn size="lg" kind="dark" disabled={provisioning} onClick={startProvision}>
                <Icon name="sparkle" size={15} /> {provisioning ? "Provisioning…" : "Provision workspace"}
              </Btn>
            )}
          </div>
        </main>

        <footer className="mt-4 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-pine-400">© FS Softwares × TophComm Systems</span>
          <Ecg className="h-5 w-40 text-pulse-400" speed={2.8} />
        </footer>
      </div>
    </div>
  );
}
