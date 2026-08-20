import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

/* ---------------- icons ---------------- */
const PATHS: Record<string, ReactNode> = {
  pulse: <path d="M3 12h4l2.5-6 4 12 2.5-6H21" />,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M15.5 14.7c2.7.3 4.8 2 5.5 4.8" /></>,
  heart: <path d="M12 20.5S4 15.5 4 9.8C4 6.6 6.4 4.5 9 4.5c1.5 0 2.4.7 3 1.6.6-.9 1.5-1.6 3-1.6 2.6 0 5 2.1 5 5.3 0 5.7-8 10.7-8 10.7z" />,
  tag: <><path d="M3 11V4h7l10.5 10.5-7 7L3 11z" /><circle cx="8" cy="9" r="1.4" /></>,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 2.6 4 5.6 4 9s-1.2 6.4-4 9c-2.8-2.6-4-5.6-4-9s1.2-6.4 4-9z" /></>,
  invoice: <><path d="M6 2.5h12V21l-2.4-1.6L13.2 21l-2.4-1.6L8.4 21 6 19.4V2.5z" /><path d="M9 7h6M9 11h6M9 15h3.5" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8 16v-5M12 16V7M16 16v-8M20 16v-3" /></>,
  shield: <path d="M12 2.5l7.5 3v6c0 5-3.2 8.3-7.5 10-4.3-1.7-7.5-5-7.5-10v-6l7.5-3z" />,
  plug: <><path d="M9 3v5M15 3v5" /><path d="M6 8h12v3a6 6 0 01-6 6 6 6 0 01-6-6V8z" /><path d="M12 17v4" /></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2" /><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3" /><rect x="10" y="10" width="4" height="4" /></>,
  bell: <><path d="M6 16v-6a6 6 0 1112 0v6l1.5 2.5h-15L6 16z" /><path d="M10 21a2.2 2.2 0 004 0" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M4.5 12.5l5 5L19.5 7" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  chevD: <path d="M5 9l7 7 7-7" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 118 0v2.5" /></>,
  key: <><circle cx="8" cy="14" r="4.5" /><path d="M11.5 10.5L20 2M16 6l3 3M13.5 8.5l2 2" /></>,
  download: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 20h16" /></>,
  copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" /></>,
  printer: <><path d="M7 8V3h10v5" /><rect x="4" y="8" width="16" height="8" rx="1.5" /><path d="M7 13h10v8H7v-8z" /></>,
  phone: <path d="M5 4h4l1.5 4.5L8 10a12 12 0 006 6l1.5-2.5L20 15v4a1.5 1.5 0 01-1.7 1.5C10 19.7 4.3 14 3.5 5.7A1.5 1.5 0 015 4z" />,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3.5 7l8.5 6 8.5-6" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  pin: <><path d="M12 21s-6.5-5.7-6.5-10.5a6.5 6.5 0 1113 0C18.5 15.3 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.3" /></>,
  edit: <path d="M4 20l1-4L16.5 4.5a2.1 2.1 0 013 3L8 19l-4 1z" />,
  send: <path d="M21 3L10.5 13.5M21 3l-7 18-3.5-7.5L3 10l18-7z" />,
  refresh: <><path d="M20 12a8 8 0 11-2.3-5.6" /><path d="M20 3v4h-4" /></>,
  doc: <><path d="M6 2.5h8L19 8v13.5H6V2.5z" /><path d="M13.5 3v5h5" /></>,
  upload: <><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" /><path d="M4 20h16" /></>,
  home: <><path d="M4 11l8-7 8 7" /><path d="M6 10v10h12V10" /></>,
  monitor: <><rect x="3" y="4.5" width="18" height="12" rx="1.5" /><path d="M9 20.5h6M12 16.5v4" /></>,
  server: <><rect x="3" y="4" width="18" height="7" rx="1.5" /><rect x="3" y="13" width="18" height="7" rx="1.5" /><path d="M6.5 7.5h.01M6.5 16.5h.01" /></>,
  cloud: <path d="M7 18.5a4.5 4.5 0 01-.5-9A6 6 0 0118 11a3.8 3.8 0 01-.5 7.5H7z" />,
  alert: <><path d="M12 3.5l9.5 16.5h-19L12 3.5z" /><path d="M12 10v4.5M12 17.5v.01" /></>,
  logout: <><path d="M14 4H6v16h8" /><path d="M10 12h11M17.5 8.5L21 12l-3.5 3.5" /></>,
  external: <><path d="M14 4h6v6" /><path d="M20 4l-9 9" /><path d="M19 14v6H5V6h6" /></>,
  sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8" /></>,
  moon: <path d="M20 13.5A8.5 8.5 0 0110.5 4 7.5 7.5 0 1020 13.5z" />,
};
export function Icon({ name, size = 17, className = "", sw = 1.7 }: { name: string; size?: number; className?: string; sw?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {PATHS[name] ?? PATHS.sparkle}
    </svg>
  );
}

/* ---------------- primitives ---------------- */
export function Btn({
  children, onClick, kind = "primary", size = "md", className = "", disabled, title,
}: {
  children: ReactNode; onClick?: () => void; kind?: "primary" | "dark" | "ghost" | "outline" | "danger" | "amber";
  size?: "sm" | "md" | "lg"; className?: string; disabled?: boolean; title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-1.5 font-semibold transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none rounded-md";
  const sizes = { sm: "text-[12px] px-2.5 py-1.5", md: "text-[13px] px-3.5 py-2", lg: "text-[14px] px-5 py-2.5" };
  const kinds = {
    primary: "bg-pulse-600 text-white hover:bg-pulse-500 shadow-lift hover:shadow-pop hover:-translate-y-px",
    dark: "bg-pine-900 text-pine-50 hover:bg-pine-700 shadow-lift hover:-translate-y-px",
    ghost: "text-pine-700 hover:bg-pine-100/70",
    outline: "border border-pine-300 text-pine-800 hover:border-pulse-500 hover:text-pulse-700 bg-white",
    danger: "bg-danger-600 text-white hover:bg-danger-500 shadow-lift",
    amber: "bg-vita-500 text-pine-950 hover:bg-vita-400 shadow-lift",
  };
  return (
    <button title={title} disabled={disabled} onClick={onClick} className={`${base} ${sizes[size]} ${kinds[kind]} ${className}`}>
      {children}
    </button>
  );
}

export function Chip({ tone = "gray", children, pulse }: { tone?: "green" | "amber" | "red" | "blue" | "gray" | "dark" | "violet"; children: ReactNode; pulse?: boolean }) {
  const tones: Record<string, string> = {
    green: "bg-[#e7f3eb] text-[#217a45] ring-[#bfe0cc]",
    amber: "bg-vita-100 text-vita-600 ring-vita-400/40",
    red: "bg-danger-100 text-danger-600 ring-danger-500/30",
    blue: "bg-info-100 text-info-600 ring-info-500/30",
    gray: "bg-pine-50 text-pine-600 ring-pine-200",
    dark: "bg-pine-900 text-pine-100 ring-pine-700",
    violet: "bg-[#efe9fb] text-[#6a48b8] ring-[#c9b8ef]",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ring-1 ${tones[tone]}`}>
      {pulse && <span className={`h-1.5 w-1.5 rounded-full ${tone === "amber" ? "bg-vita-500 dot-warn" : "bg-pulse-500 dot-live"}`} />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<string, "green" | "amber" | "red" | "blue" | "gray" | "dark" | "violet"> = {
  scheduled: "blue", "en-route": "amber", "in-progress": "green", completed: "dark", missed: "red",
  draft: "gray", "pending-approval": "amber", sent: "blue", paid: "green", overdue: "red", claim: "violet",
  pending: "amber", approved: "green", rejected: "red", posted: "violet", onboarding2: "blue",
  applied: "gray", interview: "blue", offer: "amber", hired: "green",
  "on-duty": "green", "off-duty": "gray", "on-leave": "amber", open: "blue", signed: "green",
  valid: "green", expiring: "amber", expired: "red", missing: "red",
  active: "green", onboarding: "blue", paused: "gray", terminated: "gray",
  new: "blue", contacted: "amber", booked: "green",
  connected: "green", disabled: "gray",
};

export function Card({ children, className = "", pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={`rounded-lg border border-pine-200/80 bg-card shadow-lift ${pad ? "p-4" : ""} ${className}`}>{children}</div>;
}

export function SectionHead({ kicker, title, right, icon }: { kicker?: string; title: string; right?: ReactNode; icon?: string }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
      <div>
        {kicker && <p className="mb-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-pulse-600">{kicker}</p>}
        <h2 className="font-display text-[19px] font-extrabold tracking-tight text-pine-900 flex items-center gap-2">
          {icon && <span className="text-pulse-600"><Icon name={icon} size={18} sw={2} /></span>}
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

/* ---------------- vitals stat (patient-monitor style) ---------------- */
export function useCountUp(target: number, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function Vitals({ label, value, prefix = "", suffix = "", spark, tone = "green", hint, onClick }: {
  label: string; value: number; prefix?: string; suffix?: string; spark?: number[];
  tone?: "green" | "amber" | "red" | "blue"; hint?: string; onClick?: () => void;
}) {
  const v = useCountUp(value);
  const colors = { green: "#2576eb", amber: "#e8a33d", red: "#e14d4d", blue: "#5c9cf5" };
  return (
    <button onClick={onClick} className={`group relative h-full overflow-hidden rounded-lg border border-pine-200/80 bg-white p-4 text-left shadow-lift transition-all duration-300 hover:-translate-y-1 hover:shadow-pop ${onClick ? "cursor-pointer" : "cursor-default"}`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-pine-500">{label}</span>
        <span className={`h-1.5 w-1.5 rounded-full ${tone === "amber" ? "bg-vita-400 dot-warn" : tone === "red" ? "bg-danger-500 dot-warn" : "bg-pulse-500 dot-live"}`} />
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="font-display text-[28px] font-extrabold leading-none tracking-tight text-ink tnum">
          {prefix}{v.toLocaleString()}{suffix}
        </span>
        {spark && <Spark data={spark} color={colors[tone]} />}
      </div>
      {hint && <p className="mt-2 text-[10.5px] text-pine-500">{hint}</p>}
      <span className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] opacity-80" style={{ background: colors[tone] }} />
    </button>
  );
}

export function Spark({ data, color, w = 72, h = 26 }: { data: number[]; color: string; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((d - min) / (max - min || 1)) * (h - 6)}`).join(" ");
  return (
    <svg width={w} height={h} className="shrink-0 opacity-90">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w} cy={h - 3 - ((data[data.length - 1] - min) / (max - min || 1)) * (h - 6)} r="2.4" fill={color} />
    </svg>
  );
}

/* ---------------- charts ---------------- */
export function Bars({ data, labels, color = "#2576eb", h = 120, fmt }: { data: number[]; labels: string[]; color?: string; h?: number; fmt?: (n: number) => string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height: h }}>
      {data.map((d, i) => (
        <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="font-mono text-[9px] font-semibold text-pine-500 opacity-0 transition-opacity group-hover:opacity-100 tnum">{fmt ? fmt(d) : d}</span>
          <div className="w-full rounded-t-[3px] bar-grow transition-colors group-hover:opacity-80" style={{ height: `${(d / max) * 78}%`, background: color, animationDelay: `${i * 60}ms` }} />
          <span className="font-mono text-[9px] text-pine-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function Donut({ parts, size = 132 }: { parts: { label: string; value: number; color: string }[]; size?: number }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const R = size / 2 - 10, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="#edf4f1" strokeWidth="14" />
        {parts.map((p, i) => {
          const frac = p.value / total;
          const el = (
            <circle key={i} cx={size / 2} cy={size / 2} r={R} fill="none" stroke={p.color} strokeWidth="14"
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} strokeLinecap="butt" />
          );
          acc += frac;
          return el;
        })}
      </svg>
      <div className="space-y-1.5">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: p.color }} />
            <span className="text-pine-600">{p.label}</span>
            <span className="ml-auto font-mono font-semibold text-pine-900 tnum">{Math.round((p.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TrendLine({ data, color = "#2576eb", h = 110, labels }: { data: number[]; color?: string; h?: number; labels?: string[] }) {
  const w = 100;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (d: number) => 8 + (1 - (d - min) / (max - min || 1)) * (h - 24);
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * w},${norm(d)}`);
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full" style={{ height: h }}>
        <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} opacity="0.1" />
        <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={(i / (data.length - 1)) * w} cy={norm(d)} r="1.6" fill="#fff" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {labels && <div className="mt-1 flex justify-between font-mono text-[9px] text-pine-400">{labels.map((l, i) => <span key={i}>{l}</span>)}</div>}
    </div>
  );
}

/* ---------------- overlay ---------------- */
export function Modal({ open, onClose, title, children, wide, footer }: {
  open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="frost-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pine-950/40 p-4 pt-[7vh] anim-fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} anim-pop rounded-lg border border-pine-200/70 bg-white shadow-pop`}>
        <div className="flex items-center justify-between border-b border-pine-100 px-4 py-3">
          <h3 className="font-display text-[15px] font-extrabold tracking-tight text-pine-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-pine-400 transition-colors hover:bg-pine-100 hover:text-pine-800"><Icon name="x" size={16} /></button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-pine-100 bg-paper/60 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-pine-950/45 anim-fade-in" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm border-l border-pine-200 bg-white shadow-pop anim-slide-right">
        <div className="flex items-center justify-between border-b border-pine-100 px-4 py-3">
          <h3 className="font-display text-[15px] font-extrabold text-pine-900">{title}</h3>
          <button onClick={onClose} className="rounded p-1 text-pine-400 hover:bg-pine-100 hover:text-pine-800"><Icon name="x" size={16} /></button>
        </div>
        <div className="h-[calc(100%-53px)] overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}

/* ---------------- form bits ---------------- */
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-pine-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-pine-400">{hint}</span>}
    </label>
  );
}
export const inputCls = "w-full rounded-md border border-pine-300 bg-white px-3 py-2 text-[13px] text-pine-900 outline-none transition-all placeholder:text-pine-300 focus:border-pulse-500 focus:ring-2 focus:ring-pulse-200";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-pine-700">
      <span className={`relative h-[20px] w-[36px] rounded-full transition-colors duration-200 ${on ? "bg-pulse-600" : "bg-pine-200"}`}>
        <span className={`absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all duration-200 ${on ? "left-[18px]" : "left-[2px]"}`} />
      </span>
      {label}
    </button>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs: { key: string; label: string; icon?: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-lg border border-pine-200 bg-pine-50 p-1">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-bold transition-all duration-200 ${active === t.key ? "bg-pine-900 text-pine-50 shadow-lift" : "text-pine-600 hover:bg-white hover:text-pine-900"}`}>
          {t.icon && <Icon name={t.icon} size={14} />}{t.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------- scroll reveal ---------------- */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); ob.disconnect(); } }, { threshold: 0.08 });
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ---------------- toasts ---------------- */
export interface ToastMsg { id: number; msg: string; kind: "ok" | "warn" | "err" | "info" }
export function ToastHost({ toasts, dismiss }: { toasts: ToastMsg[]; dismiss: (id: number) => void }) {
  const meta = {
    ok: { icon: "check", cls: "border-pulse-300 bg-pulse-50 text-pulse-800", dot: "bg-pulse-500" },
    warn: { icon: "alert", cls: "border-vita-400 bg-vita-100 text-vita-600", dot: "bg-vita-500" },
    err: { icon: "alert", cls: "border-danger-500/50 bg-danger-100 text-danger-700", dot: "bg-danger-500" },
    info: { icon: "bell", cls: "border-info-500/40 bg-info-100 text-info-700", dot: "bg-info-500" },
  };
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-80 flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 shadow-pop anim-slide-right ${meta[t.kind].cls}`}>
          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${meta[t.kind].dot}`} />
          <p className="flex-1 text-[12.5px] font-semibold leading-snug">{t.msg}</p>
          <button onClick={() => dismiss(t.id)} className="opacity-50 transition-opacity hover:opacity-100"><Icon name="x" size={13} /></button>
        </div>
      ))}
    </div>
  );
}

/* ---------------- misc ---------------- */
export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-pine-100 py-1.5 text-[12.5px]">
      <span className="text-pine-500">{k}</span>
      <span className="text-right font-semibold text-pine-900">{v}</span>
    </div>
  );
}

export function Progress({ pct, tone = "green" }: { pct: number; tone?: "green" | "amber" | "red" }) {
  const c = tone === "green" ? "bg-pulse-500" : tone === "amber" ? "bg-vita-500" : "bg-danger-500";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-pine-100">
      <div className={`h-full rounded-full ${c} transition-all duration-700`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  );
}

export function Empty({ icon = "doc", text }: { icon?: string; text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-pine-400">
      <Icon name={icon} size={28} sw={1.4} />
      <p className="text-[12.5px]">{text}</p>
    </div>
  );
}
