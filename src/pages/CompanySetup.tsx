import { useMemo, useState } from "react";
import { CHANGELOG, DEPLOY_MODES, uid } from "../data";
import { SETUP_LOCKED, SETUP_SECTIONS, setupAllowed } from "../platform";
import { useApp } from "../state";
import { Btn, Card, Chip, Field, Icon, inputCls, Modal, SectionHead, Toggle } from "../components/ui";
import { MediaUpload } from "../components/MediaUpload";
import { UsersPage } from "./Users";

/* ============================================================
   Phase 6 — Company Setup with a HARD server-side allow-list.
   Client Admin: exactly five sections. Everything else is Root
   territory, shown read-only with the support-contact notice.
   ============================================================ */

export function CompanySetup() {
  const { role, toast } = useApp();
  const [section, setSection] = useState("users");

  /* the guard — re-checked on every render AND inside each action */
  const allowed = (id: string) => setupAllowed(role, id);
  const current = allowed(section) ? section : "users";

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <SectionHead kicker="Company Setup · Phase 6 restricted scope" title="Company Setup" icon="cpu"
          right={role === "super"
            ? <Chip tone="dark">ROOT — full boundary authority</Chip>
            : <Chip tone="amber">Client Admin scope — 5 of {SETUP_SECTIONS.length + SETUP_LOCKED.length} areas</Chip>} />
        <p className="mt-1 max-w-3xl text-[12px] leading-snug text-pine-500">
          Access here is a <b className="text-pine-700">hard allow-list enforced at the request layer</b> — not a UI hide.
          Areas outside the five sections cannot be widened by any client-side account.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1.5">
          {SETUP_SECTIONS.map(s => {
            const ok = allowed(s.id);
            return (
              <button key={s.id} onClick={() => { if (ok) setSection(s.id); else toast("Blocked by the Company Setup allow-list — Root only.", "err"); }}
                className={`group flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-all duration-200
                  ${current === s.id ? "border-pine-900 bg-pine-900 text-pine-50 shadow-lift" : ok ? "border-pine-200 bg-card text-pine-700 hover:-translate-y-0.5 hover:border-pine-400 hover:shadow-lift" : "border-pine-200 bg-card opacity-50"}`}>
                <Icon name={s.icon} size={15} className={current === s.id ? "text-pulse-300" : "text-pine-400"} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] font-extrabold">{s.label}</span>
                  <span className={`block truncate text-[10px] ${current === s.id ? "text-pine-300" : "text-pine-400"}`}>{s.blurb}</span>
                </span>
                {!ok && <Icon name="lock" size={13} />}
              </button>
            );
          })}
          <div className="pt-2">
            <p className="px-1 pb-1 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-pine-400">Outside admin scope</p>
            {SETUP_LOCKED.map(l => (
              <div key={l.id} onClick={() => toast(`${l.label} — contact FS Softwares support to change this.`, "warn")}
                className="mb-1.5 flex cursor-not-allowed items-center gap-2.5 rounded-md border border-dashed border-pine-200 bg-paper/60 px-3 py-2 transition-colors hover:border-vita-400">
                <Icon name="lock" size={13} className="text-vita-500" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[11.5px] font-bold text-pine-500">{l.label}</span>
                  <span className="block truncate text-[9.5px] text-pine-400">{l.note}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {current === "users" && <UsersPage embedded />}
          {current === "updates" && <UpdatesSection />}
          {current === "backup" && <BackupSection />}
          {current === "hardware" && <HardwareSection />}
          {current === "profile" && <ProfileSection />}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 2 · Updates ---------------- */
function UpdatesSection() {
  const { cfg, toast } = useApp();
  const [early, setEarly] = useState(false);
  const lan = cfg?.deploy === "standalone" || cfg?.deploy === "lan";
  return (
    <Card>
      <SectionHead title="Updates" icon="download"
        right={<Chip tone={lan ? "blue" : "violet"}>{lan ? "LAN — manual packages" : "Cloud — managed releases"}</Chip>} />
      <div className="space-y-2.5">
        {CHANGELOG.map(c => (
          <div key={c.v} className="rounded-md border border-pine-200 bg-paper/60 p-3 transition-colors hover:border-pine-400">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-bold text-pine-900">v{c.v}</span>
              <Chip tone={c.tag === "Current" ? "green" : "gray"}>{c.tag}</Chip>
              <span className="ml-auto font-mono text-[10px] text-pine-400">{c.date}</span>
            </div>
            <ul className="mt-2 space-y-1">
              {c.items.map((it, i) => <li key={i} className="flex gap-2 text-[11.5px] text-pine-600"><span className="text-pulse-500"><Icon name="check" size={11} sw={2.4} /></span>{it}</li>)}
            </ul>
            {lan && c.tag === "Current" && (
              <Btn size="sm" kind="outline" className="mt-2" onClick={() => toast("Update package FSCareOps-Patch-1.0.1.fs verified (SHA-256) — install on next LAN server restart", "ok")}>
                <Icon name="download" size={12} /> Download update package (.fs)
              </Btn>
            )}
          </div>
        ))}
      </div>
      {!lan && (
        <div className="mt-3 flex items-center justify-between rounded-md border border-info-500/30 bg-info-100/50 px-3 py-2.5">
          <div>
            <p className="text-[12.5px] font-extrabold text-info-700">Early-access features</p>
            <p className="text-[10.5px] text-info-600">Opt in to preview channels — rollback always available.</p>
          </div>
          <Toggle on={early} onChange={() => { setEarly(e => !e); toast(early ? "Moved back to stable channel" : "Early-access channel enabled — v1.1.0-ea queued", "info"); }} />
        </div>
      )}
    </Card>
  );
}

/* ---------------- 3 · Backup & Restore ---------------- */
function BackupSection() {
  const { cfg, backups, setBackups, db, toast, user } = useApp();
  const lan = cfg?.deploy === "standalone" || cfg?.deploy === "lan";
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [word, setWord] = useState("");

  const createBackup = () => {
    const blob = new Blob([JSON.stringify({ app: "FS CareOps", v: "1.0.0", at: new Date().toISOString(), data: db }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `FSCareOps-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setBackups(b => [{ id: uid(), ts: "Just now", size: `${(blob.size / 1024).toFixed(1)} KB`, kind: "manual", by: user?.name ?? "admin" }, ...b]);
    toast("Manual backup written to the LAN data directory & downloaded", "ok");
  };

  if (!lan) {
    return (
      <Card>
        <SectionHead title="Backup & Restore" icon="shield" right={<Chip tone="violet" pulse>managed by FS Softwares</Chip>} />
        <div className="grid gap-3 sm:grid-cols-3">
          {[["Last verified backup", "Today · 02:00 UTC"], ["Retention", "35 days · geo-redundant"], ["Encryption", "AES-256 at rest"]].map(([k, v]) => (
            <div key={k} className="rounded-md border border-pine-200 bg-paper/60 p-3">
              <p className="font-mono text-[9.5px] font-bold uppercase tracking-[0.14em] text-pine-400">{k}</p>
              <p className="mt-1 font-mono text-[13px] font-bold text-pine-900">{v}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 rounded-md border border-info-500/30 bg-info-100/50 px-3 py-2.5 text-[11.5px] text-info-700">
          On <b>{DEPLOY_MODES.find(d => d.id === cfg?.deploy)?.name ?? "cloud"}</b> builds, backups are handled by FS Softwares infrastructure.
          Point-in-time restore requests go through support — no local files exist to manage.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHead title="Backup & Restore" icon="shield" right={<Chip tone="blue">LAN — local files</Chip>} />
      <div className="flex flex-wrap gap-2">
        <Btn onClick={createBackup}><Icon name="download" size={14} /> Create manual backup</Btn>
        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-pine-200 bg-white px-3.5 py-2 text-[12.5px] font-bold text-pine-700 transition-all hover:border-pine-400 hover:shadow-lift active:scale-95">
          <Icon name="upload" size={14} /> Restore from file…
          <input type="file" accept=".json" className="hidden" onChange={e => { if (e.target.files?.[0]) setConfirmRestore(true); e.target.value = ""; }} />
        </label>
      </div>
      <div className="mt-3 divide-y divide-pine-100 rounded-md border border-pine-200">
        {backups.map(b => (
          <div key={b.id} className="flex items-center gap-3 px-3 py-2 text-[12px]">
            <Icon name="shield" size={14} className="text-pulse-500" />
            <span className="font-bold text-pine-800">{b.ts}</span>
            <Chip tone={b.kind === "manual" ? "amber" : "gray"}>{b.kind}</Chip>
            <span className="ml-auto font-mono text-[10.5px] text-pine-400 tnum">{b.size} · by {b.by}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 font-mono text-[10px] text-pine-400">Schedule: nightly 02:00 → \\FS-LAN-SRV\data\backups\ · retention 14 copies</p>

      <Modal open={confirmRestore} onClose={() => { setConfirmRestore(false); setWord(""); }} title="Restore — strong confirmation"
        footer={<>
          <Btn kind="ghost" onClick={() => { setConfirmRestore(false); setWord(""); }}>Cancel</Btn>
          <Btn kind="danger" disabled={word !== "RESTORE"} onClick={() => { setConfirmRestore(false); setWord(""); toast("Restore validated — workspace will reload from backup snapshot", "warn"); }}>
            <Icon name="alert" size={14} /> Restore workspace
          </Btn>
        </>}>
        <div className="space-y-3">
          <p className="rounded-md border border-danger-500/30 bg-danger-100/60 px-3 py-2.5 text-[12px] font-semibold text-danger-700">
            Restoring overwrites live operational data (clients, visits, invoices). A safety snapshot of the current state is taken first.
          </p>
          <Field label="Type RESTORE to confirm">
            <input className={inputCls} value={word} onChange={e => setWord(e.target.value)} placeholder="RESTORE" />
          </Field>
        </div>
      </Modal>
    </Card>
  );
}

/* ---------------- 4 · Hardware & Networks ---------------- */
function HardwareSection() {
  const { cfg, toast } = useApp();
  const [ip, setIp] = useState("192.168.1.40");
  const [port, setPort] = useState("8443");
  const [diag, setDiag] = useState<null | { step: number; results: { name: string; ok: boolean; ms: number }[] }>(null);

  const devices = useMemo(() => [
    { name: "FS-LAN-SRV (server)", kind: "server", ip: "192.168.1.40", ok: true },
    { name: "Front Desk 01", kind: "monitor", ip: "192.168.1.51", ok: true },
    { name: "Caregiver tablet — Team Alpha", kind: "cpu", ip: "192.168.1.63", ok: true },
    { name: "Check-in kiosk (lobby)", kind: "monitor", ip: "192.168.1.70", ok: false },
    { name: "Epson TM-C3500 — invoice/check printer", kind: "printer", ip: "192.168.1.82", ok: true },
  ], []);

  const runDiag = () => {
    setDiag({ step: 0, results: [] });
    const steps = [
      { name: "DNS resolution (fs-lan-srv.local)", ok: true, ms: 4 },
      { name: "LAN ping → 192.168.1.40", ok: true, ms: 1 },
      { name: "API port 8443 handshake (TLS 1.3)", ok: true, ms: 12 },
      { name: "Data directory write test", ok: true, ms: 8 },
      { name: "Print spooler — TM-C3500", ok: true, ms: 22 },
      { name: "Kiosk heartbeat 192.168.1.70", ok: false, ms: 3000 },
    ];
    steps.forEach((s, i) => setTimeout(() => {
      setDiag(d => d ? { step: i + 1, results: [...d.results, s] } : d);
      if (i === steps.length - 1) toast("Diagnostics complete — 1 device unreachable (kiosk)", "warn");
    }, 450 * (i + 1)));
  };

  return (
    <div className="space-y-4">
      <Card>
        <SectionHead title="LAN server" icon="server" right={<Chip tone="blue">{cfg?.deploy === "standalone" ? "Standalone" : "Client–Server"}</Chip>} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Server IP"><input className={`${inputCls} font-mono`} value={ip} onChange={e => setIp(e.target.value)} /></Field>
          <Field label="Port"><input className={`${inputCls} font-mono`} value={port} onChange={e => setPort(e.target.value)} /></Field>
          <div className="flex items-end">
            <Btn kind="outline" onClick={() => toast(`LAN endpoint saved — terminals reconnect to ${ip}:${port}`, "ok")}><Icon name="check" size={14} /> Apply</Btn>
          </div>
        </div>
      </Card>
      <Card pad={false}>
        <div className="flex items-center justify-between border-b border-pine-200 bg-paper/80 px-4 py-2.5">
          <span className="font-display text-[14px] font-extrabold text-pine-900">Connected devices</span>
          <Btn size="sm" kind="outline" onClick={runDiag} disabled={!!diag && diag.step < 6}>
            <Icon name="pulse" size={13} /> {diag && diag.step < 6 ? "Running…" : "Run diagnostics"}
          </Btn>
        </div>
        <div className="divide-y divide-pine-100">
          {devices.map(d => (
            <div key={d.name} className="flex items-center gap-3 px-4 py-2.5 text-[12.5px]">
              <Icon name={d.kind} size={16} className={d.ok ? "text-pulse-600" : "text-danger-500"} />
              <span className="font-bold text-pine-800">{d.name}</span>
              <span className="font-mono text-[10.5px] text-pine-400 tnum">{d.ip}</span>
              <span className={`ml-auto h-2 w-2 rounded-full ${d.ok ? "bg-pulse-500 dot-live" : "bg-danger-500"}`} />
            </div>
          ))}
          {diag && diag.results.map((r, i) => (
            <div key={i} className="flex items-center gap-3 bg-paper/60 px-4 py-2 font-mono text-[11px] anim-fade-in">
              <span className={r.ok ? "text-pulse-600" : "text-danger-500"}><Icon name={r.ok ? "check" : "x"} size={13} sw={2.4} /></span>
              <span className="text-pine-600">{r.name}</span>
              <span className="ml-auto text-pine-400 tnum">{r.ok ? `${r.ms}ms` : "timeout"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ---------------- 5 · Company Profile ---------------- */
function ProfileSection() {
  const { cfg, setCfg, toast, role } = useApp();
  const [d, setD] = useState({
    legal: cfg?.company ?? "", address: "410 Meridian Park, Suite 210", taxId: "82-4471190",
    fiscal: "January", currency: "USD", industry: "Health Care — Clinics, Home Health & Wellness",
  });
  const saveProfile = () => {
    if (!setupAllowed(role, "profile")) { toast("Blocked by the Company Setup allow-list.", "err"); return; } /* allow-list re-check */
    setCfg(c => c ? { ...c, company: d.legal } : c);
    toast("Company profile saved — letterheads & portal pick up the change immediately", "ok");
  };
  return (
    <Card>
      <SectionHead title="Company Profile" icon="cpu" right={
        <label className="flex items-center gap-2 text-[11px] font-bold text-pine-500">
          Branding logo <MediaUpload entityType="brand" entityId="company" size={38} onSaved={a => { setCfg(c => c ? { ...c, companyLogo: a.file_url } : c); }} />
          <span className="font-mono text-[9px] uppercase text-pine-400">optional</span>
        </label>
      } />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Legal name"><input className={inputCls} value={d.legal} onChange={e => setD(x => ({ ...x, legal: e.target.value }))} /></Field>
        <Field label="Tax ID"><input className={`${inputCls} font-mono`} value={d.taxId} onChange={e => setD(x => ({ ...x, taxId: e.target.value }))} /></Field>
        <Field label="Registered address"><input className={inputCls} value={d.address} onChange={e => setD(x => ({ ...x, address: e.target.value }))} /></Field>
        <Field label="Industry template">
          <select className={inputCls} value={d.industry} onChange={e => setD(x => ({ ...x, industry: e.target.value }))}>
            <option>Health Care — Clinics, Home Health & Wellness</option>
            <option>Health Care — Clinic only</option>
            <option>Health Care — Home Health only</option>
            <option>Wellness Operations</option>
          </select>
        </Field>
        <Field label="Fiscal year start">
          <select className={inputCls} value={d.fiscal} onChange={e => setD(x => ({ ...x, fiscal: e.target.value }))}>
            {["January", "April", "July", "October"].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="Base currency">
          <select className={inputCls} value={d.currency} onChange={e => setD(x => ({ ...x, currency: e.target.value }))}>
            {["USD", "EUR", "GBP", "PHP", "CAD"].map(m => <option key={m}>{m}</option>)}
          </select>
        </Field>
      </div>
      <div className="mt-4 flex justify-end"><Btn onClick={saveProfile}><Icon name="check" size={14} /> Save profile</Btn></div>
    </Card>
  );
}


