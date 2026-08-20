import { useState } from "react";
import { SLA_META } from "../platform";
import { useApp } from "../state";
import { Btn, Icon } from "./ui";
import { CoBrandLine } from "./Logo";

/* ============================================================
   Phase 12 — In-app support widget, FS Softwares branded.
   KB + status + contact; SLA mapped to the corporate tier.
   ============================================================ */

const KB = [
  { q: "Activating a license on a new machine", a: "Settings → System & License → enter the FSCO-… key. Anti-clone binds the machine fingerprint; previous devices can be revoked from the device ledger." },
  { q: "Why is an invoice stuck in “pending-approval”?", a: "Maker-checker: a Responsible (R) user drafts, an Accountable (A) user on Billing & Claims posts. Assign A in Users & Roles → RACI matrix." },
  { q: "HR module not visible after purchase", a: "HR is license-gated. Root activates it in the Pricing Console → Entitlements. The RACI row appears immediately." },
  { q: "Restoring a LAN backup", a: "Company Setup → Backup & Restore → Restore from file, then type RESTORE. A safety snapshot is taken first." },
  { q: "Logo placement looks off on printouts", a: "The Logo Positioning Standard (§B) governs every surface — letterhead pairing, 2px rule, 8px mono footer credit. Re-upload marks in Company Profile." },
];

const STATUS = [
  { name: "CareOps API", ok: true, ms: 84 },
  { name: "FS EHR bridge", ok: true, ms: 112 },
  { name: "FS PracticeSuite bridge", ok: true, ms: 97 },
  { name: "FS MedCRM feed", ok: true, ms: 143 },
  { name: "Portal booking widget", ok: true, ms: 61 },
];

export function SupportWidget() {
  const { toast, sessionUser } = useApp();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"kb" | "status" | "contact">("kb");
  const [q, setQ] = useState("");
  const [ticket, setTicket] = useState({ subject: "", body: "" });

  const sla = SLA_META.priority; /* current demo entitlement: Corporate Pro */

  const submit = () => {
    if (!ticket.subject.trim()) { toast("Add a subject so support can triage.", "warn"); return; }
    const id = `FS-${Math.floor(10000 + Math.random() * 90000)}`;
    toast(`Ticket ${id} opened — ${sla} response clock started`, "ok");
    setTicket({ subject: "", body: "" });
    setTab("kb");
  };

  return (
    <>
      <button onClick={() => setOpen(o => !o)}
        className={`no-print fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-full border px-4 py-2.5 shadow-pop transition-all duration-300 hover:-translate-y-0.5 active:scale-95
          ${open ? "border-pine-200 bg-card text-pine-700" : "border-pine-800 bg-pine-900 text-pine-50"}`}>
        <span className="relative">
          <Icon name={open ? "x" : "phone"} size={16} />
          {!open && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-pulse-400 dot-live" />}
        </span>
        <span className="text-[12px] font-extrabold">{open ? "Close" : "FS Softwares Support"}</span>
      </button>

      {open && (
        <div className="no-print fixed bottom-20 right-5 z-[80] w-[340px] overflow-hidden rounded-xl border border-pine-200 bg-card shadow-pop anim-pop">
          <div className="border-b border-pine-800 bg-pine-950 px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-[14px] font-extrabold text-pine-50">FS Softwares Support</span>
              <span className="rounded bg-pulse-600/20 px-1.5 py-0.5 font-mono text-[8.5px] font-bold uppercase tracking-wider text-pulse-300">Pro SLA</span>
            </div>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-pine-500">{sla}</p>
          </div>
          <div className="flex border-b border-pine-200">
            {(["kb", "status", "contact"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-[11px] font-extrabold uppercase tracking-wide transition-colors ${tab === t ? "border-b-2 border-pulse-500 text-pulse-700" : "text-pine-400 hover:text-pine-600"}`}>
                {t === "kb" ? "Knowledge" : t === "status" ? "Status" : "Contact"}
              </button>
            ))}
          </div>
          <div className="max-h-[320px] overflow-y-auto p-3">
            {tab === "kb" && (
              <>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search the knowledge base…"
                  className="mb-2 w-full rounded-md border border-pine-200 bg-white px-3 py-2 text-[12px] font-semibold text-pine-800 outline-none focus:border-pulse-500" />
                <div className="space-y-1.5">
                  {KB.filter(k => (k.q + k.a).toLowerCase().includes(q.toLowerCase())).map(k => (
                    <details key={k.q} className="group rounded-md border border-pine-200 bg-paper/60 transition-colors open:border-pulse-300 open:bg-pulse-50/40">
                      <summary className="cursor-pointer list-none px-3 py-2 text-[12px] font-bold text-pine-800 marker:hidden">
                        <span className="flex items-center gap-2"><Icon name="doc" size={13} className="text-pine-400" />{k.q}
                          <span className="ml-auto text-pine-300 transition-transform group-open:rotate-90"><Icon name="chevR" size={12} /></span></span>
                      </summary>
                      <p className="px-3 pb-2.5 text-[11px] leading-snug text-pine-600">{k.a}</p>
                    </details>
                  ))}
                </div>
              </>
            )}
            {tab === "status" && (
              <div className="space-y-1.5">
                <div className="mb-2 flex items-center gap-2 rounded-md border border-pulse-300 bg-pulse-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-pulse-500 dot-live" />
                  <span className="text-[12px] font-extrabold text-pulse-800">All systems operational</span>
                  <span className="ml-auto font-mono text-[9.5px] text-pine-400">checked 30s ago</span>
                </div>
                {STATUS.map(s => (
                  <div key={s.name} className="flex items-center gap-2 rounded-md border border-pine-100 px-3 py-1.5 text-[11.5px]">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.ok ? "bg-pulse-500" : "bg-danger-500"}`} />
                    <span className="font-bold text-pine-700">{s.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-pine-400 tnum">{s.ms}ms</span>
                  </div>
                ))}
                {sessionUser?.isRoot && (
                  <p className="mt-2 rounded-md border border-vita-400 bg-vita-100 px-3 py-2 text-[10px] leading-snug text-vita-600">
                    <b>Root tools:</b> diagnostics & impersonation for LAN customers are available in System → Diagnostics.
                    Every session is audit-logged per Phase 0.
                  </p>
                )}
              </div>
            )}
            {tab === "contact" && (
              <div className="space-y-2">
                <input value={ticket.subject} onChange={e => setTicket(t => ({ ...t, subject: e.target.value }))} placeholder="Subject *"
                  className="w-full rounded-md border border-pine-200 bg-white px-3 py-2 text-[12px] font-semibold text-pine-800 outline-none focus:border-pulse-500" />
                <textarea value={ticket.body} onChange={e => setTicket(t => ({ ...t, body: e.target.value }))} rows={4} placeholder="Describe the issue — include module, role and what you expected…"
                  className="w-full resize-none rounded-md border border-pine-200 bg-white px-3 py-2 text-[12px] font-semibold text-pine-800 outline-none focus:border-pulse-500" />
                <Btn className="w-full" onClick={submit}><Icon name="send" size={14} /> Open ticket</Btn>
                <p className="text-center font-mono text-[9px] text-pine-400">support.fssoftwares.com · status.fssoftwares.com</p>
              </div>
            )}
          </div>
          <div className="border-t border-pine-200 bg-paper/70 px-3 py-2 text-center">
            <CoBrandLine size="text-[8px]" />
          </div>
        </div>
      )}
    </>
  );
}
