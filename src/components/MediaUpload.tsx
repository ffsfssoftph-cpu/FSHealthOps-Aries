import { useCallback, useEffect, useRef, useState } from "react";
import { IMAGE_MIMES, MAX_MB_DEFAULT, mediaStoreFor } from "../platform";
import type { Attachment } from "../platform";
import { uid } from "../data";
import { useApp } from "../state";
import { Btn, Icon, Modal } from "./ui";

/* ============================================================
   Phase 3 — Universal MediaUpload. ONE component, every module.
   Image-only · configurable max size (default 5MB) · automatic
   thumbnail · per-entity placeholder · optional crop/rotate for
   profile-style photos. ALWAYS optional — no required-image rule
   exists anywhere in the system.
   ============================================================ */

const PH: Record<string, { icon: string; label: string }> = {
  profile: { icon: "users", label: "No profile photo" },
  employee: { icon: "users", label: "No employee photo" },
  customer: { icon: "heart", label: "No client photo" },
  vendor: { icon: "tag", label: "No vendor logo" },
  inventory: { icon: "tag", label: "No item photo" },
  asset: { icon: "monitor", label: "No asset photo" },
  receipt: { icon: "invoice", label: "No receipt scan" },
  brand: { icon: "sparkle", label: "No logo uploaded" },
  candidate: { icon: "users", label: "No candidate photo" },
};

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
export async function makeThumb(dataUrl: string, size = 96): Promise<string> {
  const img = await loadImage(dataUrl);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const ctx = c.getContext("2d")!;
  const s = Math.min(img.width, img.height);
  ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
  return c.toDataURL("image/jpeg", 0.82);
}
async function renderCrop(src: string, z: number, rot: number, ox: number, oy: number, out: number): Promise<string> {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = out; c.height = out;
  const ctx = c.getContext("2d")!;
  const s = Math.min(img.width, img.height);
  const base = out / s;
  ctx.translate(out / 2 + ox, out / 2 + oy);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(z * base, z * base);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return c.toDataURL("image/jpeg", 0.88);
}

function CropModal({ src, onDone, onClose }: { src: string; onDone: (dataUrl: string) => void; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [rot, setRot] = useState(0);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let live = true;
    renderCrop(src, zoom, rot, off.x, off.y, 240).then(u => { if (live) setPreview(u); });
    return () => { live = false; };
  }, [src, zoom, rot, off]);

  const apply = async () => {
    setBusy(true);
    const full = await renderCrop(src, zoom, rot, off.x * (384 / 240), off.y * (384 / 240), 384);
    onDone(full);
  };

  return (
    <Modal open onClose={onClose} title="Crop & rotate before save"
      footer={<>
        <span className="mr-auto font-mono text-[10px] uppercase tracking-wider text-pine-400">384 × 384 · jpeg</span>
        <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={apply} disabled={busy}>{busy ? "Rendering…" : "Apply crop"}</Btn>
      </>}>
      <div className="flex flex-col items-center gap-3">
        <div
          className="checker relative h-60 w-60 cursor-grab touch-none overflow-hidden rounded-lg ring-1 ring-pine-200 active:cursor-grabbing"
          onPointerDown={e => { drag.current = { x: e.clientX - off.x, y: e.clientY - off.y }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={e => { if (drag.current) setOff({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }); }}
          onPointerUp={() => { drag.current = null; }}
        >
          {preview && <img src={preview} alt="crop preview" className="h-full w-full select-none" draggable={false} />}
        </div>
        <div className="flex w-full items-center gap-3">
          <Btn kind="outline" size="sm" onClick={() => setRot(r => (r + 90) % 360)}><Icon name="refresh" size={13} /> Rotate 90°</Btn>
          <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(+e.target.value)} className="flex-1 accent-[#2576eb]" />
          <span className="w-12 text-right font-mono text-[11px] font-semibold text-pine-500 tnum">{zoom.toFixed(2)}×</span>
        </div>
        <p className="text-[11px] text-pine-400">Drag to reposition · used for avatars & small display sizes</p>
      </div>
    </Modal>
  );
}

export function MediaUpload({
  entityType, entityId, shape = "avatar", crop = false, maxMB = MAX_MB_DEFAULT,
  onSaved, size = 56,
}: {
  entityType: string; entityId: string; shape?: "avatar" | "tile" | "doc";
  crop?: boolean; maxMB?: number; size?: number;
  onSaved?: (a: Attachment) => void;
}) {
  const { db, setDb, cfg, user, toast } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const current = db.attachments.find(a => a.entity_type === entityType && a.entity_id === entityId);
  const store = mediaStoreFor(cfg?.deploy);
  const ph = PH[entityType] ?? PH.profile;

  const save = useCallback(async (dataUrl: string, mime: string, sizeBytes: number, converting = false) => {
    setBusy(true);
    try {
      const url = converting ? null : store.put(`${entityType}/${entityId}/${Date.now()}`, dataUrl);
      const thumb = converting ? null : await makeThumb(dataUrl, 128);
      const att: Attachment = {
        id: uid(), entity_type: entityType, entity_id: entityId,
        file_url: url, mime_type: mime, size: sizeBytes,
        uploaded_by_user_id: user?.name ?? "system", uploaded_at: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        thumb, converting,
      };
      setDb(d => ({ ...d, attachments: [...d.attachments.filter(a => !(a.entity_type === entityType && a.entity_id === entityId)), att] }));
      onSaved?.(att);
      toast(converting
        ? "HEIC queued for server-side conversion — placeholder shown meanwhile"
        : `Saved · ${store.mode === "cloud" ? "object storage" : "LAN data dir"} · thumbnail generated`, "ok");
    } finally { setBusy(false); setCropSrc(null); }
  }, [entityType, entityId, store, user, setDb, onSaved, toast]);

  const pick = async (file: File) => {
    setErr(null);
    const mime = file.type || (file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif") ? "image/heic" : "");
    if (!IMAGE_MIMES.includes(mime)) { setErr("Image files only — jpg, png, webp or heic."); return; }
    if (file.size > maxMB * 1024 * 1024) { setErr(`Over the ${maxMB}MB limit — this upload stays optional, resize and retry.`); return; }
    if (mime === "image/heic" || mime === "image/heif") {
      void save("", mime, file.size, true);
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    if (crop) setCropSrc(dataUrl);
    else void save(dataUrl, mime, file.size);
  };

  const remove = () => {
    setDb(d => ({ ...d, attachments: d.attachments.filter(a => !(a.entity_type === entityType && a.entity_id === entityId)) }));
    toast("Photo removed — field remains optional", "info");
  };

  const box = shape === "doc"
    ? "flex w-full items-center gap-3 rounded-md border border-dashed border-pine-300 bg-paper/60 px-3 py-2.5 text-left transition-all hover:border-pulse-500 hover:bg-pulse-50/50"
    : `relative grid place-items-center overflow-hidden rounded-${shape === "avatar" ? "full" : "lg"} border border-dashed border-pine-300 bg-paper/60 transition-all hover:border-pulse-500 hover:shadow-lift`;

  return (
    <div className={shape === "doc" ? "" : "inline-flex flex-col items-center gap-1"}>
      <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = ""; }} />
      {current ? (
        <div className="group relative">
          {current.file_url ? (
            <img src={current.thumb ?? current.file_url} alt={`${entityType} visual`}
              className={shape === "avatar" ? "rounded-full object-cover ring-2 ring-pulse-300" : shape === "tile" ? "rounded-lg object-cover ring-1 ring-pine-200" : "h-11 w-11 rounded-md object-cover ring-1 ring-pine-200"}
              style={{ width: shape === "doc" ? 44 : size, height: shape === "doc" ? 44 : size }} />
          ) : (
            <span className="grid h-11 w-11 place-items-center rounded-md bg-vita-100 text-vita-600 ring-1 ring-vita-400" title="HEIC converting server-side">
              <span className="animate-pulse"><Icon name="refresh" size={16} /></span>
            </span>
          )}
          <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-pine-900 text-pine-50 opacity-0 shadow-pop transition-opacity group-hover:opacity-100">
            <button onClick={() => inputRef.current?.click()} title="Replace" className="grid h-full w-full place-items-center"><Icon name="upload" size={10} sw={2.4} /></button>
          </span>
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-danger-500 text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100">
            <button onClick={remove} title="Remove" className="grid h-full w-full place-items-center"><Icon name="x" size={10} sw={2.6} /></button>
          </span>
          {shape === "doc" && (
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12px] font-bold text-pine-800">{current.converting ? "converting… (heic)" : `${entityType} media attached`}</span>
              <span className="block font-mono text-[9.5px] text-pine-400">{current.mime_type} · {(current.size / 1024).toFixed(0)}KB · {current.uploaded_by_user_id} · {current.uploaded_at}</span>
            </span>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void pick(f); }}
          className={`${box} ${drag ? "border-pulse-500 bg-pulse-50 ring-2 ring-pulse-300" : ""} ${shape !== "doc" ? "cursor-pointer" : ""}`}
          style={shape === "doc" ? undefined : { width: size, height: size }}
          title={`Optional ${entityType} photo — drag & drop or click`}>
          {shape === "doc" ? (
            <>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-md ${drag ? "bg-pulse-100 text-pulse-700" : "bg-pine-100 text-pine-500"}`}><Icon name="upload" size={18} /></span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[12px] font-bold text-pine-800">{busy ? "Processing…" : `Attach ${entityType} media (optional)`}</span>
                <span className="block font-mono text-[9.5px] text-pine-400">jpg · png · webp · heic → converted · ≤ {maxMB}MB</span>
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-0.5 text-pine-400">
              <Icon name={ph.icon} size={size * 0.32} />
              {size >= 56 && <span className="px-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wide">{busy ? "…" : "add"}</span>}
            </span>
          )}
        </button>
      )}
      {err && <p className="max-w-[180px] text-center text-[10.5px] font-semibold text-danger-600 anim-fade-in">{err}</p>}
      {shape === "doc" && !current && err && <p className="mt-1 text-[10.5px] font-semibold text-danger-600">{err}</p>}
      {cropSrc && <CropModal src={cropSrc} onClose={() => setCropSrc(null)} onDone={u => {
        void (async () => {
          const bytes = Math.round((u.length - "data:image/jpeg;base64,".length) * 0.75);
          await save(u, "image/jpeg", bytes);
        })();
      }} />}
    </div>
  );
}

/** Read-only helper — avatar for any entity, falls back to placeholder. */
export function EntityAvatar({ entityType, entityId, size = 34, name }: { entityType: string; entityId: string; size?: number; name?: string }) {
  const { db } = useApp();
  const att = db.attachments.find(a => a.entity_type === entityType && a.entity_id === entityId);
  const ph = PH[entityType] ?? PH.profile;
  if (att?.file_url) {
    return <img src={att.thumb ?? att.file_url} alt="" style={{ width: size, height: size }} className="shrink-0 rounded-full object-cover ring-1 ring-pine-200" />;
  }
  const initials = (name ?? "?").split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.34 }}
      className="grid shrink-0 place-items-center rounded-full bg-pine-100 font-display font-bold text-pine-600 ring-1 ring-pine-200"
      title={att?.converting ? "HEIC converting server-side" : ph.label}>
      {att?.converting ? <span className="animate-pulse"><Icon name="refresh" size={size * 0.4} /></span> : name ? initials : <Icon name={ph.icon} size={size * 0.45} />}
    </span>
  );
}
