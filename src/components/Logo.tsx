import { useEffect } from "react";

/* ============================================================
   FS CareOps identity system — emblem, lockups, client pairing,
   and the live Logo Positioning & Usage Standard surfaces.
   ============================================================ */

export function Emblem({ size = 28, tone = "color" }: { size?: number; tone?: "color" | "light" | "mono" }) {
  const bg = tone === "light" ? "#F2F6F4" : tone === "mono" ? "currentColor" : "#0D2A24";
  const cross = tone === "light" ? "#0D2A24" : "#F2F6F4";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-label="FS CareOps emblem" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="7" fill={tone === "color" ? bg : "transparent"} stroke={tone === "color" ? "none" : bg} strokeWidth={tone === "color" ? 0 : 1.5} />
      {tone === "color" && <path d="M16 7v18M7 16h18" stroke={cross} strokeWidth="4.4" strokeLinecap="round" />}
      {tone !== "color" && <path d="M16 7v18M7 16h18" stroke={bg} strokeWidth="4.4" strokeLinecap="round" fill="none" />}
      <path d="M4 21h5l2.2-5.4 3 8 2.2-5.4H28" stroke={tone === "color" ? "#3FA284" : bg} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Lockup({
  variant = "header", light = false, companyMark,
}: { variant?: "header" | "splash" | "stacked" | "tiny"; light?: boolean; companyMark?: string | null }) {
  if (variant === "tiny") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Emblem size={16} tone={light ? "light" : "color"} />
        <span className={`font-display font-bold text-[13px] tracking-tight ${light ? "text-pine-50" : "text-pine-900"}`}>FS CareOps</span>
      </span>
    );
  }
  if (variant === "stacked") {
    return (
      <span className="inline-flex flex-col items-center gap-2">
        <Emblem size={56} tone={light ? "light" : "color"} />
        <span className="text-center leading-none">
          <span className={`block font-display font-extrabold text-xl tracking-tight ${light ? "text-pine-50" : "text-pine-900"}`}>FS CareOps</span>
          <span className={`mt-1 block font-mono text-[9px] tracking-[0.18em] uppercase ${light ? "text-pine-300" : "text-pine-500"}`}>Health Care Operations Suite</span>
        </span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2.5">
      <Emblem size={variant === "splash" ? 44 : 30} tone={light ? "light" : "color"} />
      <span className="leading-none">
        <span className={`block font-display font-extrabold tracking-tight ${variant === "splash" ? "text-[26px]" : "text-[17px]"} ${light ? "text-pine-50" : "text-pine-900"}`}>
          FS CareOps
        </span>
        <span className={`mt-0.5 block font-mono uppercase ${variant === "splash" ? "text-[10px] tracking-[0.22em]" : "text-[8.5px] tracking-[0.16em]"} ${light ? "text-pine-300" : "text-pine-500"}`}>
          Clinics · Home Health · Wellness
        </span>
      </span>
      {companyMark && (
        <>
          <span className={`mx-1 h-8 w-px ${light ? "bg-pine-600" : "bg-pine-200"}`} />
          <CompanyMark src={companyMark} name="" size={variant === "splash" ? 40 : 28} />
        </>
      )}
    </span>
  );
}

export function CoBrandLine({ light = false, size = "text-[9px]" }: { light?: boolean; size?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono uppercase tracking-[0.14em] ${size} ${light ? "text-pine-400" : "text-pine-400"}`}>
      <span className="font-semibold">FS Softwares</span>
      <span className={light ? "text-pulse-300" : "text-pulse-500"}>×</span>
      <span className="font-semibold">TophComm Systems</span>
    </span>
  );
}

export function CompanyMark({ src, name, size = 28 }: { src?: string | null; name: string; size?: number }) {
  if (src) return <img src={src} alt="Company logo" style={{ width: size, height: size }} className="rounded-md object-cover ring-1 ring-pine-200 bg-white" />;
  const initials = (name || "Your Clinic").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <span
      className="inline-flex items-center justify-center rounded-md bg-pine-100 font-display font-bold text-pine-700 ring-1 ring-pine-200"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      title={name || "Company logo"}
    >{initials}</span>
  );
}

/* animated electrocardiogram trace */
export function Ecg({ className = "", color = "#3FA284", speed = 3.4 }: { className?: string; color?: string; speed?: number }) {
  return (
    <svg viewBox="0 0 640 60" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M0 30 H70 l10-12 12 24 10-12 H150 l8-4 6 8 8-26 10 34 8-12 H280 l10-12 12 24 10-12 H370 l8-4 6 8 8-26 10 34 8-12 H500 l10-10 10 20 8-10 H640"
        fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        className="anim-ecg" style={{ animationDuration: `${speed}s` }}
      />
    </svg>
  );
}

/* live-rendered Logo Positioning & Usage Standard surfaces */
export function LogoStandardGrid({ company, companyName }: { company: string | null; companyName: string }) {
  const Sur = ({ label, rule, children }: { label: string; rule: string; children: React.ReactNode }) => (
    <div className="group rounded-lg border border-pine-200 bg-white p-3 shadow-lift transition-all duration-300 hover:-translate-y-1 hover:shadow-pop">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-[13px] font-bold text-pine-900">{label}</span>
        <span className="rounded-sm bg-pulse-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-pulse-700">§B</span>
      </div>
      <div className="rounded-md border border-dashed border-pine-200 bg-paper px-3 py-4">{children}</div>
      <p className="mt-2 text-[11px] leading-snug text-pine-500">{rule}</p>
    </div>
  );
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Sur label="1 · Login / Splash" rule="Lockup top-left, 24px clear-space; credit bottom-right.">
        <div className="relative h-20 overflow-hidden rounded bg-pine-900">
          <div className="absolute left-2 top-2"><Lockup variant="tiny" light /></div>
          <div className="absolute bottom-1.5 right-2 font-mono text-[7px] text-pine-400">© FS Softwares × TophComm</div>
          <Ecg className="absolute bottom-3 left-0 h-6 w-full opacity-60" />
        </div>
      </Sur>
      <Sur label="2 · App Header" rule="Emblem + wordmark left-anchored; never centered.">
        <div className="rounded bg-white p-2 ring-1 ring-pine-200"><Lockup variant="tiny" /></div>
      </Sur>
      <Sur label="3 · Client-Logo Pairing" rule="Client mark left ÷ system right, 1px divider.">
        <div className="flex items-center justify-between gap-2 rounded bg-white px-2 py-2 ring-1 ring-pine-200">
          <CompanyMark src={company} name={companyName} size={24} />
          <span className="h-5 w-px bg-pine-200" />
          <Lockup variant="tiny" />
        </div>
      </Sur>
      <Sur label="4 · Report Letterhead" rule="Pairing row + 2px pine rule; 24mm margins.">
        <div className="rounded bg-white p-2 ring-1 ring-pine-200">
          <div className="flex items-center justify-between">
            <CompanyMark src={company} name={companyName} size={16} />
            <Lockup variant="tiny" />
          </div>
          <div className="mt-1.5 h-[2px] w-full bg-pine-800" />
          <div className="mt-1.5 space-y-1">
            <div className="h-1 w-11/12 rounded bg-pine-100" /><div className="h-1 w-9/12 rounded bg-pine-100" /><div className="h-1 w-10/12 rounded bg-pine-100" />
          </div>
        </div>
      </Sur>
      <Sur label="5 · Printed-Output Footer" rule="Mono 8px centered credit on every printed page.">
        <div className="flex h-16 flex-col justify-end rounded bg-white p-1.5 ring-1 ring-pine-200">
          <div className="h-1 w-full rounded bg-pine-50" />
          <p className="mt-2 text-center font-mono text-[7px] tracking-wide text-pine-500">FS CareOps v1.0.0 — © FS Softwares in collaboration with TophComm Systems</p>
        </div>
      </Sur>
      <Sur label="6 · Mobile Splash / Header" rule="Stacked centered splash; emblem-only app header.">
        <div className="flex gap-2">
          <div className="flex h-20 flex-1 items-center justify-center rounded bg-pine-900"><Lockup variant="stacked" light /></div>
          <div className="flex w-10 flex-col items-center justify-start gap-1 rounded bg-white pt-1.5 ring-1 ring-pine-200">
            <Emblem size={16} />
            <div className="h-1 w-5 rounded bg-pine-100" />
          </div>
        </div>
      </Sur>
      <Sur label="7 · Favicon / App Icon" rule="Emblem on pine tile, radius 22%, pulse retained at 16px.">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-[22%] bg-pine-950 ring-1 ring-pine-200"><Emblem size={34} tone="light" /></span>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-[22%] bg-pine-950 ring-1 ring-pine-200"><Emblem size={20} tone="light" /></span>
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-[22%] bg-pine-950"><Emblem size={12} tone="light" /></span>
        </div>
      </Sur>
      <Sur label="8 · About / License" rule="Full co-brand lockup + creator credit; min width 240px.">
        <div className="rounded bg-white p-2 text-center ring-1 ring-pine-200">
          <Lockup variant="stacked" />
          <p className="mt-1.5 font-mono text-[7.5px] text-pine-500">Program Creator & Owner — Fritz Suarez, CPM®, CLMP®, CLSSMBB®, CLSCM®, CISSP®, PMP®</p>
        </div>
      </Sur>
    </div>
  );
}

/* live clock hook for headers / splash */
import { useState } from "react";
export function useClock(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
