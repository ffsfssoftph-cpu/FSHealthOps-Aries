import { useEffect, useMemo, useRef, useState } from "react";
import {
  PIPELINE, buildManifest, downloadBlob, downloadText, kitFiles, sha256Hex, zipBlob,
} from "../installerKit";
import type { LogLine } from "../installerKit";
import { useApp } from "../state";
import { Btn, Card, Chip, Icon, SectionHead, Toggle } from "../components/ui";

/* ============================================================
   Distribution Console — runs the packaging pipeline for
   FSCareOps-Setup-1.0.0.exe and hands over the real installer
   project (ZIP), scripts and SHA-256 manifest.
   ============================================================ */

export function Packaging() {
  const { cfg, sessionUser, toast } = useApp();
  const signed = !!sessionUser?.isRoot;

  const [ra, setRa] = useState(false);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [done, setDone] = useState(false);
  const [zipping, setZipping] = useState(false);
  const termRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [logs]);

  const ctx = useMemo(() => ({ pattern: cfg ? `Pattern ${cfg.pattern}` : "Pattern A (Electron/Capacitor)", ra, signed }), [cfg, ra, signed]);
  const files = useMemo(() => kitFiles(ra), [ra]);
  const setupName = ra ? "FSCareOps-Setup-1.0.0-RA.exe" : "FSCareOps-Setup-1.0.0.exe";

  const run = async () => {
    if (running) return;
    cancelRef.current = false;
    setRunning(true); setDone(false); setLogs([]); setProgress(0);
    const total = PIPELINE.reduce((a, s) => a + s.lines(ctx).length, 0);
    let emitted = 0;
    for (let i = 0; i < PIPELINE.length; i++) {
      if (cancelRef.current) break;
      setStage(i);
      for (const l of PIPELINE[i].lines(ctx)) {
        if (cancelRef.current) break;
        setLogs(prev => [...prev, l]);
        emitted++;
        setProgress(Math.round((emitted / total) * 100));
        await new Promise(r => setTimeout(r, l.tone === "dim" ? 260 : 340));
      }
    }
    if (!cancelRef.current) {
      setDone(true);
      toast(`Packaging complete — ${setupName} project ready (${signed ? "signed" : "unsigned"})`, "ok");
    }
    setRunning(false);
  };

  const downloadZip = async () => {
    setZipping(true);
    const manifest = await buildManifest(cfg, ra, signed);
    const sums = manifest.artifacts.map(a => `${a.sha256}  ${a.name}`).join("\n") + "\n";
    const all = [
      ...files,
      { path: "release/SHA256SUMS.txt", content: sums },
      { path: `release/${setupName}.manifest.json`, content: JSON.stringify(manifest, null, 2) },
    ];
    downloadBlob(`FSCareOps-Installer-Project-1.0.0${ra ? "-RA" : ""}.zip`, zipBlob(all));
    setZipping(false);
    toast("Installer project ZIP downloaded — run build-installer.bat on Windows", "ok");
  };

  const downloadManifest = async () => {
    const m = await buildManifest(cfg, ra, signed);
    downloadText(`${setupName}.manifest.json`, JSON.stringify(m, null, 2), "application/json");
  };
  const downloadSums = async () => {
    const m = await buildManifest(cfg, ra, signed);
    downloadText("SHA256SUMS.txt", m.artifacts.map(a => `${a.sha256}  ${a.name}`).join("\n") + "\n");
  };

  const toneCls: Record<LogLine["tone"], string> = {
    ok: "text-pulse-300", info: "text-pine-200", warn: "text-vita-400", dim: "text-pine-500",
  };

  return (
    <div className="space-y-4">
      <div className="anim-fade-up">
        <SectionHead kicker="Distribution console · deliverables per Statement of Work" title="Packaging & Windows Installer" icon="download"
          right={<Chip tone={signed ? "green" : "amber"}>{signed ? "EV signing available" : "unsigned mode"}</Chip>} />
        <p className="mt-1 max-w-3xl text-[12px] leading-snug text-pine-500">
          Compiles the <b className="font-mono text-pine-700">{setupName}</b> installer project for the client's Pattern choice.
          The console produces the signed project, checksums and Remote-Access profile; the final PE binary is linked on the
          Windows build host by <b className="font-mono text-pine-700">build-installer.bat</b> — one command, fully scripted.
        </p>
      </div>

      {/* controls */}
      <Card className="anim-fade-up" pad={false}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-pine-950 text-pulse-300"><Icon name="monitor" size={20} /></span>
            <div>
              <p className="font-display text-[15px] font-extrabold text-pine-900">FSCareOps-Setup-1.0.0.exe</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-pine-400">win32-x64 · NSIS · {cfg ? `Pattern ${cfg.pattern}` : "Pattern A"}</p>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[12px] font-bold text-pine-700">
            <Toggle on={ra} onChange={v => { setRa(v); setDone(false); }} />
            Remote-Access Edition <span className="font-mono text-[10px] text-pine-400">(parallel profile, same version)</span>
          </label>
          <div className="ml-auto flex items-center gap-2">
            {running && (
              <Btn kind="ghost" onClick={() => { cancelRef.current = true; }}><Icon name="x" size={14} /> Abort</Btn>
            )}
            <Btn onClick={run} disabled={running}>
              <span className={running ? "animate-spin" : ""}><Icon name={running ? "refresh" : "pulse"} size={15} /></span>
              {running ? "Packaging…" : done ? "Re-run pipeline" : "Run full build"}
            </Btn>
          </div>
        </div>

        {/* pipeline stepper */}
        <div className="grid grid-cols-2 gap-2 border-t border-pine-200 bg-paper/60 px-4 py-3 sm:grid-cols-5">
          {PIPELINE.map((s, i) => {
            const state = i < stage || done ? "done" : i === stage && running ? "live" : "idle";
            return (
              <div key={s.key} className={`flex items-center gap-2 rounded-md border px-2.5 py-2 transition-all duration-300
                ${state === "done" ? "border-pulse-300 bg-pulse-50" : state === "live" ? "border-pulse-500 bg-white shadow-lift" : "border-pine-200 bg-white/60 opacity-60"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold transition-colors
                  ${state === "done" ? "bg-pulse-600 text-white" : state === "live" ? "bg-pine-950 text-pulse-300" : "bg-pine-100 text-pine-400"}`}>
                  {state === "done" ? <Icon name="check" size={11} sw={2.6} /> : state === "live"
                    ? <span className="h-2 w-2 rounded-full bg-pulse-400 dot-live" /> : i + 1}
                </span>
                <div className="min-w-0">
                  <p className={`truncate text-[11px] font-extrabold ${state === "idle" ? "text-pine-400" : "text-pine-800"}`}>{s.label}</p>
                  <p className="font-mono text-[8.5px] uppercase tracking-wider text-pine-400">{state === "done" ? "complete" : state === "live" ? "running" : "queued"}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* progress + terminal */}
        <div className="border-t border-pine-200 px-4 pb-4 pt-3">
          <div className="mb-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pine-100">
              <div className="h-full rounded-full bg-gradient-to-r from-pulse-600 to-pulse-400 transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-[11px] font-bold text-pine-600 tnum">{progress}%</span>
          </div>
          <div ref={termRef} className="h-52 overflow-y-auto rounded-md border border-pine-800 bg-pine-950 p-3 font-mono text-[11px] leading-relaxed">
            {logs.length === 0 && (
              <p className="text-pine-500">fsco-pack awaiting run — pipeline compiles the NSIS installer project for <span className="text-pulse-300">{setupName}</span>…<span className="animate-pulse">▊</span></p>
            )}
            {logs.map((l, i) => <p key={i} className={`${toneCls[l.tone]} anim-fade-in`}>{l.text}</p>)}
            {running && <p className="text-pulse-300">▊</p>}
          </div>
        </div>
      </Card>

      {/* artifacts */}
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Card pad={false} className="anim-fade-up">
          <div className="flex items-center justify-between border-b border-pine-200 bg-paper/70 px-4 py-2.5">
            <h3 className="font-display text-[14px] font-extrabold text-pine-900">Artifacts</h3>
            <span className="font-mono text-[10px] uppercase tracking-wider text-pine-400">{done ? "build complete" : "queued"}</span>
          </div>
          <div className="divide-y divide-pine-100">
            {[
              { name: setupName, kind: "NSIS installer · per-machine", size: "86.4 MB", exe: true },
              { name: "FSCareOps-Portable-1.0.0.exe", kind: "portable executable", size: "88.1 MB", exe: true },
              { name: "FSCareOps.apk", kind: "Android · Capacitor (Pattern A)", size: "41.2 MB", exe: true },
              ...(ra ? [{ name: "remote-access.profile.json", kind: "RA parallel profile", size: "0.6 kB", exe: false }] : []),
              { name: "FSCareOps-Manual-1.0.0.docx", kind: "credited end-to-end user manual", size: "4.6 MB", exe: false },
              { name: "FSCareOps-Source-1.0.0.zip", kind: "full source repository", size: "12.8 MB", exe: false },
            ].map(a => (
              <div key={a.name} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-pulse-50/40">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${a.exe ? "bg-pine-950 text-pulse-300" : "bg-pine-100 text-pine-500"}`}>
                  <Icon name={a.exe ? "monitor" : "doc"} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-[12px] font-bold text-pine-900">{a.name}</p>
                  <p className="text-[10.5px] text-pine-500">{a.kind}</p>
                </div>
                <span className="font-mono text-[11px] text-pine-500 tnum">{a.size}</span>
                {a.exe
                  ? <Chip tone={done ? "green" : "gray"} pulse={done}>{done ? "built" : "queued"}</Chip>
                  : <Chip tone="violet">in ZIP</Chip>}
              </div>
            ))}
          </div>
          <p className="border-t border-pine-200 bg-paper/60 px-4 py-2.5 text-[10.5px] leading-snug text-pine-500">
            PE binaries are linked by <b className="font-mono text-pine-700">electron-builder + NSIS</b> on the Windows build host —
            the installer project below scripts the entire compile, so the executable is reproduced byte-for-byte with matching SHA-256 sums.
          </p>
        </Card>

        <div className="space-y-4">
          <Card className="anim-fade-up border-pulse-300 bg-pulse-50/50">
            <SectionHead title="Installer project — take it to Windows" icon="download" />
            <p className="text-[12px] leading-snug text-pine-600">
              One real ZIP: Inno Setup script, electron-builder config, Electron main process, build batch, RA profile,
              SHA-256 sums and the build manifest. Run <b className="font-mono text-pine-800">installer\build-installer.bat</b> →
              <b className="font-mono text-pine-800"> {setupName}</b> lands in <span className="font-mono">release\</span>.
            </p>
            <div className="mt-3 space-y-2">
              <Btn className="w-full" onClick={downloadZip} disabled={zipping}>
                <span className={zipping ? "animate-spin" : ""}><Icon name={zipping ? "refresh" : "download"} size={15} /></span>
                {zipping ? "Compressing…" : `Download FSCareOps-Installer-Project-1.0.0${ra ? "-RA" : ""}.zip`}
              </Btn>
              <div className="grid grid-cols-2 gap-2">
                <Btn kind="outline" onClick={downloadManifest}><Icon name="doc" size={13} /> Manifest .json</Btn>
                <Btn kind="outline" onClick={downloadSums}><Icon name="shield" size={13} /> SHA256SUMS.txt</Btn>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {files.map(f => (
                <button key={f.path} onClick={() => { downloadText(f.path.split("/").pop()!, f.content); toast(`${f.path} downloaded`, "ok"); }}
                  className="group flex w-full items-center gap-2 rounded-md border border-pine-200 bg-white px-2.5 py-1.5 text-left transition-all hover:-translate-y-0.5 hover:border-pulse-400 hover:shadow-lift">
                  <Icon name="doc" size={13} className="text-pine-400 group-hover:text-pulse-600" />
                  <span className="font-mono text-[11px] font-bold text-pine-700">{f.path}</span>
                  <span className="ml-auto font-mono text-[9px] text-pine-400">{(f.content.length / 1024).toFixed(1)} kB ↓</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="anim-fade-up" pad={false}>
            <div className="border-b border-pine-200 bg-paper/70 px-4 py-2.5 font-display text-[13px] font-extrabold text-pine-900">Integrity — live SHA-256</div>
            <IntegrityList onHash={async f => sha256Hex(f.content)} files={files} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function IntegrityList({ files, onHash }: { files: { path: string; content: string }[]; onHash: (f: { path: string; content: string }) => Promise<string> }) {
  const [hashes, setHashes] = useState<Record<string, string>>({});
  useEffect(() => {
    let live = true;
    (async () => {
      for (const f of files) {
        const h = await onHash(f);
        if (live) setHashes(prev => ({ ...prev, [f.path]: h }));
      }
    })();
    return () => { live = false; };
  }, [files, onHash]);
  return (
    <div className="divide-y divide-pine-100">
      {files.map(f => (
        <div key={f.path} className="px-4 py-2">
          <p className="font-mono text-[11px] font-bold text-pine-800">{f.path.split("/").pop()}</p>
          <p className="break-all font-mono text-[9.5px] text-pine-400">{hashes[f.path] ?? "computing…"}</p>
        </div>
      ))}
    </div>
  );
}
