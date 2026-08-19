import { useMemo, useState } from "react";
import { CHANGELOG, DEPLOY_MODES, E2E_TESTS, LOGO_SURFACES, TEN_REQUIREMENTS, genLicense, machineFingerprint } from "../data";
import { useApp } from "../state";
import { CoBrandLine, Emblem, Lockup, LogoStandardGrid } from "../components/Logo";
import { Btn, Card, Chip, Icon, KV, Modal, Progress, Reveal, SectionHead, Tabs, Toggle, Field, inputCls } from "../components/ui";

const ARTIFACTS = [
  { name: "FSCareOps-Setup-1.0.0.exe", size: "96.4 MB", desc: "Windows installer — composition follows the selected Pattern", sha: "3f9a…c41e" },
  { name: "FSCareOps.apk", size: "41.8 MB", desc: "Android field app — caregiver run sheets, offline queue", sha: "8b21…77aa" },
  { name: "FSCareOps-RemoteAccess-Edition", size: "profile", desc: "Parallel build profile · same v1.0.0 · hardened TLS tunnel", sha: "d0c5…19f2" },
  { name: "FSCareOps-Source-1.0.0.zip", size: "18.2 MB", desc: "Full source repository with build manifests", sha: "5e10…b3d8" },
  { name: "FSCareOps-UserManual-1.0.0.docx", size: "8.7 MB", desc: "End-to-end manual — credited to the Program Creator & Owner", sha: "a77e…04cc" },
];

export function SystemPage() {
  const { db, setDb, toast, cfg, license, user, resetDemo, role } = useApp();
  const [tab, setTab] = useState("updates");
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [dlPct, setDlPct] = useState(0);
  const [genOpen, setGenOpen] = useState(false);
  const [genEdition, setGenEdition] = useState("Standard");
  const [genSeats, setGenSeats] = useState(25);
  const [genKey, setGenKey] = useState("");
  const [running, setRunning] = useState(false);
  const [runIdx, setRunIdx] = useState(-1);
  const [twofa, setTwofa] = useState(true);
  const fingerprint = useMemo(machineFingerprint, []);
  const [devices, setDevices] = useState([
    { id: "MC-9f2a-K1LP-08bd", label: "Front-desk terminal · Windows 11", current: true },
    { id: "MC-44c1-Qx8M-71aa", label: "Scheduler laptop · Windows 11", current: false },
    { id: "MC-b07e-Zz3R-5510", label: "Field tablet · Android 14 (RA Edition)", current: false },
  ]);

  const checkUpdates = () => {
    setChecking(true);
    setTimeout(() => { setChecking(false); toast("You're on the latest GA — v1.0.0 (build 1.0.0+ga)", "ok"); }, 1500);
  };

  const download = (name: string) => {
    setDownloading(name); setDlPct(0);
    const t = setInterval(() => setDlPct(p => {
      if (p >= 100) { clearInterval(t); setTimeout(() => { setDownloading(null); toast(`${name} verified against SHA-256 manifest`, "ok"); }, 300); return 100; }
      return p + 7;
    }), 70);
  };

  const generate = () => {
    const k = genLicense(genEdition, genSeats);
    setGenKey(k);
    const blob = new Blob([`FS CareOps License File\n=======================\nKey: ${k}\nEdition: ${genEdition}\nSeats: ${genSeats}\nIssued: ${new Date().toISOString()}\nIssued by: FSCareOps-License-Generator.exe (portable)\n© FS Softwares in collaboration with TophComm Systems — internal use only\n`], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = k + ".fsclic";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Key generated — .fsclic downloaded", "ok");
  };

  const runE2E = () => {
    setRunning(true); setRunIdx(-1);
    E2E_TESTS.forEach((_, i) => setTimeout(() => {
      setRunIdx(i);
      if (i === E2E_TESTS.length - 1) { setRunning(false); toast("E2E sweep complete — 214/214 assertions passed", "ok"); }
    }, (i + 1) * 420));
  };

  const tabs = [
    { key: "updates", label: "Updates & Builds", icon: "download" },
    { key: "license", label: "License & Security", icon: "key" },
    { key: "deploy", label: "Deployment", icon: "server" },
    { key: "e2e", label: "E2E QA", icon: "check" },
    { key: "about", label: "About & Brand", icon: "sparkle" },
  ];

  return (
    <div className="space-y-4">
      <div className="anim-fade-up"><SectionHead kicker="Ten Embedded Requirements · §1–§10" title="System, License & Delivery" icon="cpu"
        right={<span className="font-mono text-[11px] text-pine-500">signed in as <b className="text-pine-800">{user?.name}</b> · {role === "super" ? "Super User tier" : "Administrator tier"}</span>} /></div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ================= UPDATES ================= */}
      {tab === "updates" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <SectionHead title="Release channel" icon="refresh" />
              <div className="rounded-md bg-pine-950 p-4 text-pine-50">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pine-400">Installed</p>
                <p className="mt-1 font-display text-[30px] font-black leading-none">v1.0.0 <span className="text-pulse-400">GA</span></p>
                <p className="mt-2 font-mono text-[10.5px] text-pine-400">build 1.0.0+ga · Pattern {cfg?.pattern} · {DEPLOY_MODES.find(d => d.id === cfg?.deploy)?.name}</p>
                <Btn size="sm" className="mt-3 w-full" onClick={checkUpdates} disabled={checking}>
                  <span className={checking ? "animate-spin" : ""}><Icon name="refresh" size={13} /></span>{checking ? "Checking mirrors…" : "Check for updates"}
                </Btn>
              </div>
              <div className="mt-4 space-y-3">
                {CHANGELOG.map(c => (
                  <div key={c.v} className="border-l-2 border-pine-200 pl-3">
                    <p className="flex items-center gap-2 font-mono text-[12px] font-bold text-pine-900">v{c.v}
                      <Chip tone={c.tag === "Current" ? "green" : "gray"}>{c.tag}</Chip></p>
                    <p className="text-[10.5px] text-pine-400">{c.date}</p>
                    <ul className="mt-1 space-y-0.5">
                      {c.items.slice(0, 3).map((it, i) => <li key={i} className="text-[11.5px] leading-snug text-pine-600">· {it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>

            <div className="lg:col-span-2">
              <Card pad={false} className="h-full">
                <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
                  <h3 className="font-display text-[14px] font-extrabold text-pine-900">Packaged deliverables</h3>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-pine-400">SHA-256 verified</span>
                </div>
                <div className="divide-y divide-pine-100">
                  {ARTIFACTS.map(a => (
                    <div key={a.name} className="flex flex-wrap items-center gap-3 px-4 py-3 transition-colors hover:bg-pulse-50/40">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-pine-100 text-pine-700"><Icon name={a.name.endsWith(".apk") ? "monitor" : a.name.includes("Manual") ? "doc" : "download"} size={17} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[12.5px] font-bold text-pine-900">{a.name}</p>
                        <p className="text-[11px] text-pine-500">{a.desc}</p>
                      </div>
                      <span className="font-mono text-[10px] text-pine-400">{a.size} · {a.sha}</span>
                      {downloading === a.name ? (
                        <div className="w-28"><Progress pct={dlPct} /><p className="mt-0.5 text-center font-mono text-[9px] text-pine-500 tnum">{dlPct}%</p></div>
                      ) : (
                        <Btn size="sm" kind="outline" onClick={() => download(a.name)}><Icon name="download" size={13} /> Fetch</Btn>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-start gap-2.5 border-t border-pine-100 bg-vita-100/50 px-4 py-2.5">
                  <span className="mt-0.5 text-vita-600"><Icon name="lock" size={14} /></span>
                  <p className="text-[11px] leading-snug text-vita-600"><b>FSCareOps-License-Generator.exe</b> (portable) ships under separate custody — FS Softwares / TophComm Systems internal use only. Generate sandbox keys from the License tab.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ================= LICENSE ================= */}
      {tab === "license" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <SectionHead title="Active license" icon="key" />
            <div className="rounded-md bg-pine-950 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-pine-400">License key</p>
              <p className="mt-1 break-all font-mono text-[17px] font-semibold tracking-wider text-pulse-300">{license}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10.5px] text-pine-400">
                <p>EDITION&nbsp;&nbsp;<b className="text-pine-100">{cfg?.edition}</b></p>
                <p>SEATS&nbsp;&nbsp;<b className="text-pine-100">{license?.slice(-2) ?? "25"}</b></p>
                <p>BOUND&nbsp;&nbsp;<b className="text-pine-100">{fingerprint}</b></p>
                <p>STATUS&nbsp;&nbsp;<b className="text-pulse-400">ACTIVE</b></p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Btn kind="dark" size="sm" onClick={() => setGenOpen(true)}><Icon name="key" size={13} /> Open license generator</Btn>
              <Btn kind="outline" size="sm" onClick={() => toast("Offline activation file (.fscact) exported", "info")}><Icon name="download" size={13} /> Offline activation file</Btn>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-md border border-pine-200 bg-paper px-3 py-2.5">
              <div>
                <p className="text-[12.5px] font-bold text-pine-900">2FA enforcement (TOTP)</p>
                <p className="text-[10.5px] text-pine-500">Every new session requires a 6-digit challenge — Ten Embedded Requirements §6</p>
              </div>
              <Toggle on={twofa} onChange={v => { setTwofa(v); toast(v ? "2FA enforcement enabled org-wide" : "2FA cannot be disabled on production licenses (sandbox override)", "warn"); }} />
            </div>
            <div className="mt-3 rounded-md border border-pulse-200 bg-pulse-50 px-3 py-2.5">
              <p className="flex items-center gap-2 text-[12.5px] font-bold text-pulse-800"><Icon name="globe" size={14} /> Remote-Access Edition — {cfg?.remoteAccess ? "ENABLED" : "disabled"}</p>
              <p className="mt-0.5 text-[11px] text-pulse-700">Parallel profile, same v1.0.0 · TLS 1.3 tunnel · field offline queue {cfg?.remoteAccess ? "active on 3 devices" : "—"}</p>
            </div>
          </Card>

          <Card pad={false}>
            <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
              <h3 className="font-display text-[14px] font-extrabold text-pine-900">Anti-clone device ledger</h3>
              <Chip tone="green" pulse>fingerprint lock armed</Chip>
            </div>
            <div className="divide-y divide-pine-100">
              {devices.map(dv => (
                <div key={dv.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md ${dv.current ? "bg-pulse-50 text-pulse-600" : "bg-pine-100 text-pine-500"}`}><Icon name="monitor" size={15} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-pine-900">{dv.label}</p>
                    <p className="font-mono text-[10px] text-pine-400">{dv.id}</p>
                  </div>
                  {dv.current ? <Chip tone="green">this device</Chip> : (
                    <button onClick={() => { setDevices(devices.filter(x => x.id !== dv.id)); toast(`Device ${dv.id} revoked — clone protection triggered re-auth`, "warn"); }}
                      className="rounded-md border border-danger-500/40 px-2 py-1 text-[10.5px] font-bold uppercase tracking-wide text-danger-600 transition-all hover:bg-danger-100">Revoke</button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t border-pine-100 px-4 py-3 text-[11px] leading-snug text-pine-500">
              Keys bind to a machine fingerprint on first activation. Cloned volumes fail the heartbeat and are auto-revoked — verified in E2E §2FA + anti-clone.
            </div>
          </Card>

          <Modal open={genOpen} onClose={() => setGenOpen(false)} title="License generator — internal custody"
            footer={<><Btn kind="ghost" onClick={() => setGenOpen(false)}>Close</Btn><Btn onClick={generate}><Icon name="key" size={14} /> Generate & download .fsclic</Btn></>}>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-md border border-vita-400/60 bg-vita-100 px-3 py-2 text-[11.5px] text-vita-600">
                <Icon name="lock" size={15} className="mt-0.5 shrink-0" /> Mirrors <b>FSCareOps-License-Generator.exe</b> (portable). For FS Softwares / TophComm Systems internal issuance only.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Edition"><select className={inputCls} value={genEdition} onChange={e => setGenEdition(e.target.value)}><option>Standard</option><option>Remote-Access</option><option>Enterprise</option></select></Field>
                <Field label="Seats"><input type="number" min={1} max={500} className={inputCls} value={genSeats} onChange={e => setGenSeats(Math.max(1, +e.target.value))} /></Field>
              </div>
              {genKey && (
                <div className="rounded-md bg-pine-950 p-3 text-center anim-pop">
                  <p className="break-all font-mono text-[16px] font-semibold tracking-wider text-pulse-300">{genKey}</p>
                  <p className="mt-1 font-mono text-[9.5px] uppercase tracking-wider text-pine-500">.fsclic saved to downloads</p>
                </div>
              )}
            </div>
          </Modal>
        </div>
      )}

      {/* ================= DEPLOYMENT ================= */}
      {tab === "deploy" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {DEPLOY_MODES.map((m, i) => {
              const active = cfg?.deploy === m.id;
              return (
                <Reveal key={m.id} delay={i * 70}>
                  <div className={`relative h-full rounded-lg border-2 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-pop ${active ? "border-pulse-500 bg-pulse-50 shadow-pop" : "border-pine-200 bg-white"}`}>
                    {active && <span className="absolute -top-2.5 left-3 rounded bg-pulse-600 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white">active</span>}
                    <span className={active ? "text-pulse-600" : "text-pine-400"}><Icon name={m.icon} size={22} /></span>
                    <h3 className="mt-2 font-display text-[15px] font-extrabold text-pine-900">{m.name}</h3>
                    <p className="mt-1 text-[11.5px] leading-snug text-pine-500">{m.blurb}</p>
                    {!active && <Btn size="sm" kind="outline" className="mt-3" onClick={() => toast(`Migration plan to ${m.name} queued — runbook generated`, "info")}><Icon name="chevR" size={12} /> Migrate</Btn>}
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Card>
            <SectionHead title="Build composition (client's Pattern choice)" icon="cpu" />
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Backend", cfg?.pattern === "A" ? "Node.js + Express + SQLite" : "NestJS / .NET + PostgreSQL"],
                ["Desktop shell", cfg?.pattern === "A" ? "Electron" : "Tauri"],
                ["Mobile shell", cfg?.pattern === "A" ? "Capacitor" : "Flutter"],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-pine-200 bg-paper px-3 py-2.5">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-pine-400">{k} · Pattern {cfg?.pattern}</p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold text-pine-900">{v}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ================= E2E ================= */}
      {tab === "e2e" && (
        <Card pad={false}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pine-200 bg-paper/80 px-4 py-2.5">
            <h3 className="font-display text-[14px] font-extrabold text-pine-900">End-to-end sweep — every packaged build</h3>
            <div className="flex items-center gap-2">
              <Chip tone="green">214/214 assertions</Chip>
              <Btn size="sm" kind="dark" onClick={runE2E} disabled={running}><Icon name="refresh" size={13} /> {running ? "Sweeping…" : "Re-run sweep"}</Btn>
            </div>
          </div>
          <div className="divide-y divide-pine-100">
            {E2E_TESTS.map((t, i) => (
              <div key={t.area} className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-all duration-300 ${running && i <= runIdx ? "bg-pulse-50/60" : ""} ${running && i > runIdx ? "opacity-40" : ""}`}>
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${running && i > runIdx ? "bg-pine-100 text-pine-400" : "bg-pulse-50 text-pulse-600"}`}>
                  {running && i > runIdx ? <Icon name="clock" size={14} /> : <Icon name="check" size={14} sw={2.4} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-pine-900">{t.area}</p>
                  <p className="text-[11px] text-pine-500">{t.detail}</p>
                </div>
                <span className="font-mono text-[10px] text-pine-400 tnum">{t.asserts} asserts</span>
                <Chip tone="green">{running && i > runIdx ? "queued" : t.status}</Chip>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ================= ABOUT ================= */}
      {tab === "about" && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-col items-center gap-2 py-4 text-center">
              {cfg?.systemLogo ? <img src={cfg.systemLogo} alt="System logo" className="h-14 w-14 rounded-lg object-cover shadow-lift" /> : <Emblem size={56} />}
              <Lockup variant="splash" />
              <CoBrandLine size="text-[11px]" />
              <div className="mt-2 max-w-xl rounded-md bg-paper px-4 py-2.5">
                <p className="text-[12px] text-pine-600">Program Creator & Owner</p>
                <p className="font-display text-[15px] font-extrabold text-pine-900">Fritz Suarez, CPM®, CLMP®, CLSSMBB®, CLSCM®, CISSP®, PMP®</p>
              </div>
              <p className="font-mono text-[10px] text-pine-400">v1.0.0 GA · © {new Date().getFullYear()} FS Softwares in collaboration with TophComm Systems · All rights reserved</p>
              <button onClick={() => { if (window.confirm("Reset the demo workspace? Licenses, setup and data return to first-run state.")) resetDemo(); }}
                className="mt-1 text-[11px] font-bold text-danger-500 hover:underline">Reset demo workspace</button>
            </div>
          </Card>

          <div>
            <SectionHead kicker="Enhancement section — Official System Logo Positioning & Usage Standard" title="Logo placement across every surface" icon="sparkle" />
            <LogoStandardGrid company={cfg?.companyLogo ?? null} companyName={cfg?.company ?? ""} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <SectionHead title="Organization sync (§4)" icon="users" />
              <KV k="Company" v={cfg?.company ?? "—"} />
              <KV k="Software owner" v={cfg?.owner ?? "—"} />
              <KV k="Account manager" v={cfg?.accountManager ?? "—"} />
              <KV k="Department" v={cfg?.department ?? "—"} />
              <KV k="Provisioned" v={cfg ? new Date(cfg.provisionedAt).toLocaleString() : "—"} />
              <p className="mt-2 text-[11px] text-pine-500">These values render identically on the letterhead, portal widget, printed footer and mobile splash.</p>
            </Card>
            <Card>
              <SectionHead title="Ten Embedded Requirements" icon="check" />
              <ol className="space-y-1.5">
                {TEN_REQUIREMENTS.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[11.5px] leading-snug text-pine-700">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-pulse-50 font-mono text-[8.5px] font-bold text-pulse-700">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <Card>
            <SectionHead title="Surface compliance matrix" icon="shield" />
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {LOGO_SURFACES.map((s, i) => (
                <div key={s.id} className="rounded-md border border-pine-100 bg-paper/70 p-2.5 transition-colors hover:border-pulse-300 anim-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <p className="flex items-center justify-between text-[12px] font-bold text-pine-900">{s.name}<Chip tone="green">live</Chip></p>
                  <p className="mt-1 text-[10.5px] leading-snug text-pine-500">{s.rule}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
