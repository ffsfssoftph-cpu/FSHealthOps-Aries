import { useMemo, useState } from "react";
import { ROLE_META, uid } from "../data";
import type { Role } from "../data";
import { LEVEL_META, LEVELS, MODULES } from "../platform";
import type { Level, Matrix, UserRec } from "../platform";
import { useApp } from "../state";
import { Btn, Card, Chip, Field, Icon, inputCls, Modal, SectionHead, Toggle } from "../components/ui";
import { EntityAvatar, MediaUpload } from "../components/MediaUpload";

/* ============================================================
   Phase 5 — User Management & RACI-style permission matrix.
   Every cell toggle is audited. Root sits outside the matrix.
   ============================================================ */

export function RACIEditor({ matrix, hrOn, onCell, readOnly }: {
  matrix: Matrix; hrOn: boolean; readOnly?: boolean;
  onCell: (moduleId: string, level: Level | null) => void;
}) {
  const rows = MODULES.filter(m => !m.hrGated || hrOn);
  return (
    <div className="overflow-hidden rounded-md border border-pine-200">
      <div className="grid grid-cols-[1fr_repeat(4,44px)] items-center gap-x-1 border-b border-pine-200 bg-pine-100 px-3 py-2 font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-pine-500">
        <span>Module / function</span>
        {LEVELS.map(l => <span key={l} className="text-center" title={`${LEVEL_META[l].name} — ${LEVEL_META[l].desc}`}>{l}</span>)}
      </div>
      {rows.map(m => (
        <div key={m.id} className="grid grid-cols-[1fr_repeat(4,44px)] items-center gap-x-1 border-b border-pine-100 px-3 py-1.5 last:border-0 transition-colors hover:bg-pulse-50/40">
          <span className="flex items-center gap-2 text-[12px] font-bold text-pine-800">
            <span className="text-pine-400"><Icon name={m.icon} size={13} /></span>{m.label}
            {m.hrGated && <span className="rounded bg-vita-100 px-1 font-mono text-[8px] font-bold uppercase text-vita-600">add-on</span>}
          </span>
          {LEVELS.map(l => {
            const active = matrix[m.id] === l;
            return (
              <button key={l} disabled={readOnly}
                onClick={() => onCell(m.id, active ? null : l)}
                title={`${LEVEL_META[l].name} — ${LEVEL_META[l].desc}${readOnly ? " (read-only for your role)" : ""}`}
                className={`mx-auto grid h-7 w-9 place-items-center rounded border font-mono text-[10.5px] font-bold transition-all duration-150 active:scale-90 disabled:cursor-not-allowed
                  ${active ? `${LEVEL_META[l].chip} shadow-lift scale-105` : "border-pine-200 text-pine-300 hover:border-pine-400 hover:text-pine-500"}`}>
                {l}
              </button>
            );
          })}
        </div>
      ))}
      <p className="bg-paper/70 px-3 py-2 text-[10px] leading-snug text-pine-500">
        Blank = module hidden entirely · <b className="text-vita-600">A</b> carries maker-checker approval authority · changes are audit-logged
      </p>
    </div>
  );
}

export function UsersPage({ embedded = false }: { embedded?: boolean }) {
  const { users, setUsers, sessionUser, setMatrixCell, audit, templates, saveTemplate, canMod, hrEnabled, toast, role } = useApp();
  const [editing, setEditing] = useState<UserRec | null>(null);
  const [creating, setCreating] = useState(false);
  const [tab, setTab] = useState<"users" | "audit">("users");
  const canEdit = canMod("usersMgmt", "edit");

  const blank: Matrix = {};
  const [draft, setDraft] = useState<{ name: string; email: string; title: string; role: Role; matrix: Matrix }>({ name: "", email: "", title: "", role: "frontdesk", matrix: { ...blank } });

  const applyTemplate = (tid: string) => {
    const t = templates.find(x => x.id === tid);
    if (!t) return;
    setDraft(d => ({ ...d, matrix: { ...t.matrix } }));
    toast(`Template “${t.name}” applied to the matrix`, "info");
  };

  const createUser = () => {
    if (!draft.name.trim()) { toast("User name is required.", "warn"); return; }
    const u: UserRec = {
      id: uid(), name: draft.name.trim(), email: draft.email || "—", title: draft.title || ROLE_META[draft.role].label,
      role: draft.role, active: true, photo: null, matrix: { ...draft.matrix },
    };
    setUsers(us => [...us, u]);
    toast(`${u.name} created — matrix assigned, invite queued`, "ok");
    setCreating(false);
    setDraft({ name: "", email: "", title: "", role: "frontdesk", matrix: {} });
  };

  const toggleActive = (u: UserRec) => {
    if (u.isRoot) { toast("The Root account cannot be deactivated.", "err"); return; }
    setUsers(us => us.map(x => x.id === u.id ? { ...x, active: !x.active } : x));
    toast(`${u.name} ${u.active ? "deactivated" : "reactivated"}`, u.active ? "warn" : "ok");
  };

  const saveAsTemplate = () => {
    if (!editing || editing.matrix === null) return;
    const name = window.prompt("Template name (e.g. “Night Scheduler”):");
    if (name?.trim()) saveTemplate(name.trim(), editing.matrix);
  };

  const head = (
    <div className="flex flex-wrap items-center justify-between gap-3 anim-fade-up">
      <SectionHead kicker="User management · Phase 5 RACI" title="Users & Role Matrix" icon="users"
        right={
          <span className="flex gap-1.5">
            {(["users", "audit"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-3 py-1.5 text-[11.5px] font-bold capitalize transition-all ${tab === t ? "border-pine-900 bg-pine-900 text-pine-50" : "border-pine-200 bg-white text-pine-600 hover:border-pine-400"}`}>
                {t === "users" ? `${users.length} users` : "Audit trail"}
              </button>
            ))}
          </span>
        } />
      {!embedded && canEdit && <Btn onClick={() => setCreating(true)}><Icon name="plus" size={14} /> Create user</Btn>}
      {embedded && canEdit && <Btn size="sm" onClick={() => setCreating(true)}><Icon name="plus" size={14} /> Create user</Btn>}
    </div>
  );

  return (
    <div className="space-y-4">
      {head}
      {tab === "users" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {users.map((u, i) => (
            <Card key={u.id} className={`anim-fade-up transition-all duration-300 hover:-translate-y-0.5 hover:shadow-pop ${!u.active ? "opacity-60" : ""}`} pad={false}>
              <div className="flex items-start gap-3 p-4">
                <div className="relative">
                  <EntityAvatar entityType="profile" entityId={u.id} size={44} name={u.name} />
                  {canEdit && !u.isRoot && (
                    <span className="absolute -bottom-1 -right-1">
                      <MediaUpload entityType="profile" entityId={u.id} size={16} />
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-[15px] font-extrabold text-pine-900">{u.name}</h3>
                    {u.isRoot && <Chip tone="dark">ROOT · outside matrix</Chip>}
                    {!u.isRoot && <span className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-white" style={{ background: ROLE_META[u.role].color }}>{ROLE_META[u.role].short}</span>}
                  </div>
                  <p className="truncate text-[11.5px] text-pine-500">{u.title} · {u.email}</p>
                  <p className="mt-1.5 flex flex-wrap gap-1">
                    {u.matrix === null
                      ? <span className="font-mono text-[10px] text-pine-400">full access — Phase 0 authority, not representable as R/A/C/I</span>
                      : MODULES.filter(m => u.matrix![m.id] && (!m.hrGated || hrEnabled)).map(m => (
                        <span key={m.id} className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${LEVEL_META[u.matrix![m.id]!].chip}`} title={m.label}>
                          {m.label.split(" ")[0]}·{u.matrix![m.id]}
                        </span>
                      ))}
                    {u.matrix !== null && Object.keys(u.matrix).filter(k => u.matrix![k]).length === 0 && (
                      <span className="font-mono text-[10px] text-danger-600">no module access — nav empty</span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Toggle on={u.active} onChange={() => toggleActive(u)} />
                  <div className="flex gap-1.5">
                    {u.matrix !== null && (
                      <Btn size="sm" kind="outline" onClick={() => setEditing(u)}><Icon name="edit" size={12} /> Matrix</Btn>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card pad={false}>
          <div className="border-b border-pine-200 bg-paper/80 px-4 py-2.5 font-display text-[14px] font-extrabold text-pine-900">
            Permission-matrix audit <span className="ml-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-pine-400">every cell change, immutable</span>
          </div>
          <div className="divide-y divide-pine-100">
            {audit.map(a => (
              <div key={a.id} className="grid grid-cols-[130px_1fr_1fr_90px] items-center gap-3 px-4 py-2.5 text-[12px] anim-fade-in">
                <span className="font-mono text-[10.5px] text-pine-400">{a.ts}</span>
                <span className="text-pine-700"><b className="text-pine-900">{a.actor}</b> changed <b className="text-pine-900">{a.target}</b></span>
                <span className="text-pine-600">{a.module}</span>
                <span className="text-right font-mono text-[11px] font-bold">
                  <span className="text-pine-400">{a.from}</span> <span className="text-pine-300">→</span> <span className={a.to === "—" ? "text-danger-600" : "text-pulse-700"}>{a.to}</span>
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* edit matrix */}
      <Modal open={!!editing} onClose={() => setEditing(null)} wide
        title={<span className="flex items-center gap-2">RACI matrix — {editing?.name}
          <span className="rounded bg-pine-100 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-pine-500">{editing && ROLE_META[editing.role].label}</span></span>}
        footer={<>
          <button onClick={saveAsTemplate} className="mr-auto inline-flex items-center gap-1.5 text-[11.5px] font-bold text-pulse-700 transition-colors hover:text-pulse-600">
            <Icon name="copy" size={13} /> Save as role template
          </button>
          <Btn kind="ghost" onClick={() => setEditing(null)}>Close</Btn>
        </>}>
        {editing && (
          <div className="space-y-3">
            {role !== "super" && !sessionUser?.isRoot && (
              <p className="rounded-md border border-vita-400 bg-vita-100 px-3 py-2 text-[11.5px] font-semibold text-vita-600 anim-fade-in">
                Read-only — editing matrices requires Accountable (A) on User Management. Your changes are enforced server-side and audit-logged.
              </p>
            )}
            <RACIEditor matrix={editing.matrix ?? {}} hrOn={hrEnabled} readOnly={!canEdit}
              onCell={(m, l) => setMatrixCell(editing.id, m, l)} />
          </div>
        )}
      </Modal>

      {/* create user */}
      <Modal open={creating} onClose={() => setCreating(false)} wide title="Create user & assign RACI matrix"
        footer={<>
          <label className="mr-auto flex items-center gap-2 text-[11px] font-semibold text-pine-500">
            Profile photo
            <MediaUpload entityType="profile" entityId="new-user-preview" size={30} />
            <span className="font-mono text-[9px] uppercase text-pine-400">optional</span>
          </label>
          <Btn kind="ghost" onClick={() => setCreating(false)}>Cancel</Btn>
          <Btn onClick={createUser}><Icon name="check" size={14} /> Create & assign</Btn>
        </>}>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full name *"><input className={inputCls} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="e.g. Noor Haddad" /></Field>
            <Field label="Email"><input className={inputCls} value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} placeholder="noor@brightcare.co" /></Field>
            <Field label="Base role">
              <select className={inputCls} value={draft.role} onChange={e => setDraft(d => ({ ...d, role: e.target.value as Role }))}>
                {(Object.keys(ROLE_META) as Role[]).filter(r => r !== "super").map(r => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
              </select>
            </Field>
            <Field label="Apply role template">
              <select className={inputCls} defaultValue="" onChange={e => { if (e.target.value) applyTemplate(e.target.value); e.target.value = ""; }}>
                <option value="" disabled>Choose a saved template…</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name} — {t.desc}</option>)}
              </select>
            </Field>
          </div>
          <RACIEditor matrix={draft.matrix} hrOn={hrEnabled}
            onCell={(m, l) => setDraft(d => ({ ...d, matrix: { ...d.matrix, [m]: l ?? undefined } }))} />
        </div>
      </Modal>
    </div>
  );
}
