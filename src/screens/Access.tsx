import { useEffect, useMemo, useState } from "react";
import { ALL_ROLES, ROLE_META, genLicense } from "../data";
import type { Role } from "../data";
import type { SessionUser } from "../state";
import { CoBrandLine, Ecg, Emblem, Lockup, useClock } from "../components/Logo";
import { Btn, Icon, inputCls } from "../components/ui";

const BOOT_LINES = [
  "[ 0.002 ] FS CareOps kernel v1.0.0 — build 1.0.0+ga.win32-x64",
  "[ 0.114 ] Loading Business Solution Core (Part I §1.1–1.10) … ok",
  "[ 0.296 ] Industry modules: scheduling · rate card · HMO · roster · portal … ok",
  "[ 0.431 ] Integration gateway: FS EHR · PracticeSuite · MedCRM … handshake",
  "[ 0.562 ] Logo Positioning Standard … 8 surfaces verified",
  "[ 0.708 ] Anti-clone fingerprint service … armed",
];

export function Access({
  hasLicense, onLicensed, onAuthed,
}: { hasLicense: boolean; onLicensed: (key: string) => void; onAuthed: (u: SessionUser) => void }) {
  const [stage, setStage] = useState<"splash" | "activation" | "login" | "twofa">("splash");
  const [bootIdx, setBootIdx] = useState(0);
  const [pick, setPick] = useState<Role>("super");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [keyIn, setKeyIn] = useState("");
  const [keyErr, setKeyErr] = useState("");
  const demoCode = useMemo(() => String(Math.floor(100000 + Math.random() * 900000)), [stage === "twofa"]);

  useEffect(() => {
    if (stage !== "splash") return;
    if (bootIdx < BOOT_LINES.length) {
      const t = setTimeout(() => setBootIdx(i => i + 1), 260);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStage(hasLicense ? "login" : "activation"), 700);
    return () => clearTimeout(t);
  }, [stage, bootIdx, hasLicense]);

  /* ---------- splash ---------- */
  if (stage === "splash") {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-pine-950 noise-layer">
        <div className="p-6 anim-fade-up"><Lockup variant="header" light /></div>
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-pulse-300 anim-fade-in">Provisioning health care operations…</p>
            <h1 className="mt-2 font-display text-4xl font-black tracking-tight text-pine-50 sm:text-5xl anim-fade-up">
              Care, scheduled.<br />Claims, reconciled.<span className="text-pulse-400">_</span>
            </h1>
            <div className="mt-8 space-y-1.5 rounded-lg border border-pine-700 bg-pine-900/70 p-4 font-mono text-[11px]">
              {BOOT_LINES.slice(0, bootIdx).map((l, i) => (
                <p key={i} className="anim-fade-in text-pine-300">{l}</p>
              ))}
              <span className="inline-block h-3 w-2 bg-pulse-400" style={{ animation: "blinkCursor 1s infinite" }} />
            </div>
          </div>
        </div>
        <div className="relative h-16">
          <Ecg className="absolute inset-x-0 bottom-4 h-12 w-full" color="#3FA284" speed={2.6} />
          <div className="absolute bottom-3 right-6 font-mono text-[9px] uppercase tracking-[0.2em] text-pine-500">© FS Softwares × TophComm Systems</div>
        </div>
      </div>
    );
  }

  const shell = (children: React.ReactNode, title: string, sub: string) => (
    <div className="relative min-h-screen overflow-hidden bg-clinical noise-layer">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-6">
        <header className="flex items-center justify-between anim-fade-up">
          <Lockup variant="header" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-pine-400 sm:block">Secure session · TLS 1.3</span>
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md anim-pop">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-pulse-600">{sub}</p>
            <h2 className="mt-1 font-display text-[32px] font-extrabold leading-tight tracking-tight text-pine-900">{title}</h2>
            <div className="mt-5 rounded-lg border border-pine-200 bg-white p-5 shadow-pop">{children}</div>
          </div>
        </main>
        <footer className="flex items-center justify-between pb-2 anim-fade-in">
          <CoBrandLine />
          <span className="font-mono text-[10px] text-pine-400">v1.0.0 · {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );

  /* ---------- activation ---------- */
  if (stage === "activation") {
    const valid = /^FSCO(-[A-Z0-9]{4}){3}-[A-Z]{2}\d{2}$/.test(keyIn.trim().toUpperCase());
    return shell(
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-md border border-pulse-200 bg-pulse-50 p-3">
          <span className="text-pulse-600"><Icon name="key" size={18} /></span>
          <p className="text-[12px] leading-snug text-pulse-800">
            Enter the license key issued by <b>FSCareOps-License-Generator.exe</b> (FS Softwares / TophComm internal use), or start an evaluation.
          </p>
        </div>
        <div>
          <input
            value={keyIn}
            onChange={e => { setKeyIn(e.target.value.toUpperCase()); setKeyErr(""); }}
            placeholder="FSCO-XXXX-XXXX-XXXX-ST25"
            className={`${inputCls} font-mono text-[15px] font-semibold tracking-wider`}
          />
          {keyErr && <p className="mt-1 text-[11.5px] font-semibold text-danger-600">{keyErr}</p>}
          {valid && <p className="mt-1 text-[11.5px] font-semibold text-pulse-700">✓ Key format valid — edition {keyIn.slice(-4, -2)}, {parseInt(keyIn.slice(-2), 10)} seats</p>}
        </div>
        <div className="flex gap-2">
          <Btn className="flex-1" onClick={() => {
            if (!valid) { setKeyErr("Key must match FSCO-XXXX-XXXX-XXXX-ED## (ED = edition, ## = seats)."); return; }
            onLicensed(keyIn.trim().toUpperCase()); setStage("login");
          }}><Icon name="check" size={15} /> Activate</Btn>
        </div>
        <button
          onClick={() => { const k = genLicense("ST", 25); setKeyIn(k); setKeyErr(""); }}
          className="w-full rounded-md border border-dashed border-pine-300 py-2 text-[12.5px] font-bold text-pine-600 transition-colors hover:border-pulse-500 hover:text-pulse-700"
        >
          Generate 90-day evaluation key (sandbox)
        </button>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-pine-400">Anti-clone: key binds to machine fingerprint on first run</p>
      </div>,
      "Product Activation", "Ten Embedded Requirements · §2 licensing"
    );
  }

  /* ---------- login ---------- */
  if (stage === "login") {
    return shell(
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-1.5">
          {ALL_ROLES.map(r => (
            <button key={r} onClick={() => setPick(r)}
              className={`rounded-md border px-2.5 py-2 text-left transition-all duration-200 ${pick === r ? "border-pulse-500 bg-pulse-50 shadow-lift" : "border-pine-200 bg-white hover:border-pine-300"}`}>
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded font-mono text-[10px] font-bold text-white" style={{ background: ROLE_META[r].color }}>{ROLE_META[r].short}</span>
                <span className="text-[11.5px] font-bold leading-tight text-pine-900">{ROLE_META[r].label}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="rounded-md bg-paper px-3 py-2 text-[11px] leading-snug text-pine-500">{ROLE_META[pick].desc}</p>
        <div>
          <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">Password</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••  (demo: any password)" className={inputCls}
            onKeyDown={e => e.key === "Enter" && pw && setStage("twofa")} />
        </div>
        <button disabled={!pw} onClick={() => setStage("twofa")}
          className="group flex w-full items-center justify-center gap-2 py-1.5 text-[15px] font-extrabold tracking-tight text-pulse-600 transition-all hover:text-pulse-700 active:scale-[0.98] disabled:opacity-35">
          Sign in
          <span className="transition-transform duration-200 group-hover:translate-x-1.5">▸</span>
        </button>
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.14em] text-pine-400">TOTP challenge next · Ten Embedded Requirements §6</p>
      </div>,
      "Operator Sign-in", "RBAC · 6 roles provisioned"
    );
  }

  /* ---------- 2FA ---------- */
  return shell(
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border border-pine-200 bg-paper p-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded font-mono text-[12px] font-bold text-white" style={{ background: ROLE_META[pick].color }}>{ROLE_META[pick].short}</span>
        <div>
          <p className="text-[13px] font-bold text-pine-900">{pick === "super" ? "Fritz Suarez" : pick === "admin" ? "Dana Whitfield" : pick === "frontdesk" ? "Lia Santos" : pick === "caregiver" ? "Nadia Reyes" : pick === "billing" ? "Owen Park" : "Marta Vieira"}</p>
          <p className="text-[11px] text-pine-500">{ROLE_META[pick].label}</p>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-md border border-vita-400/60 bg-vita-100 px-3 py-2">
        <span className="text-[11.5px] font-bold text-vita-600">Authenticator preview (sandbox)</span>
        <span className="font-mono text-[18px] font-semibold tracking-[0.2em] text-pine-900 tnum">{demoCode}</span>
      </div>
      <div>
        <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">6-digit code</span>
        <input
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="______" className={`${inputCls} text-center font-mono text-[22px] font-semibold tracking-[0.5em]`}
          onKeyDown={e => e.key === "Enter" && code === demoCode && onAuthed(userFor(pick))}
        />
      </div>
      <Btn className="w-full" size="lg" disabled={code.length !== 6} onClick={() => {
        if (code === demoCode) onAuthed(userFor(pick));
        else { setCode(""); }
      }}>
        <Icon name="shield" size={15} /> Verify & enter console
      </Btn>
      {code.length === 6 && code !== demoCode && <p className="text-center text-[11.5px] font-bold text-danger-600">Code mismatch — session rejected, attempt logged.</p>}
    </div>,
    "Two-Factor Challenge", "2FA + anti-clone protection"
  );
}

function userFor(r: Role): SessionUser {
  const names: Record<Role, string> = {
    super: "Fritz Suarez", admin: "Dana Whitfield", frontdesk: "Lia Santos",
    caregiver: "Nadia Reyes", billing: "Owen Park", manager: "Marta Vieira",
  };
  return { name: names[r], role: r, initials: names[r].split(" ").map(w => w[0]).join("") };
}

/* clock re-exported for splash usage */
export function AccessClock() { return <>{useClock().toLocaleTimeString()}</>; }
export function MiniMark() { return <Emblem size={20} />; }
