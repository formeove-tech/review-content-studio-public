"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { assignPhotos } from "@/lib/slides";
import { STYLE_PRESETS } from "@/lib/styles";
import { STYLE_KEYS, type Reels, type StyleKey } from "@/lib/types";
import { buildVideoPlan } from "@/lib/video/plan";
import { renderVideo, videoSupport, type VideoSupport } from "@/lib/video/render";

/** 릴스 대본 + 사진 → 세로 영상(MP4). 브라우저가 직접 만들고 서버에는 저장하지 않습니다. 리뷰 1개·묶음 모두 사용 */
export function VideoPanel({ photos, platformLabel, subjectKey, reels, batch, storeName, storeLogo, styleKey = "plain" }: {
  photos: string[];
  platformLabel: string;
  subjectKey: string;
  reels: Reels;
  batch: string;
  storeName: string;
  storeLogo: string;
  styleKey?: StyleKey; // 같은 묶음의 캐러셀이 고른 디자인 스타일
}) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<StyleKey>(styleKey);
  useEffect(() => { setStyle(styleKey); }, [styleKey]);
  const [support, setSupport] = useState<VideoSupport>("none");
  const [photoPick, setPhotoPick] = useState<Record<number, number>>({});
  const [progress, setProgress] = useState<{ done: number; total: number; stage: string } | null>(null);
  const [result, setResult] = useState<{ url: string; file: File } | null>(null);
  const [msg, setMsg] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const scenes = useMemo(() => [...reels.scenes].sort((a, b) => a.order - b.order), [reels]);
  const auto = useMemo(() => assignPhotos(scenes.length, photos.length), [scenes.length, photos.length]);
  const plan = useMemo(() => buildVideoPlan({ reels, photos, storeName, overrides: photoPick }), [reels, photos, storeName, photoPick]);

  useEffect(() => { setSupport(videoSupport()); }, []);
  useEffect(() => { setPhotoPick({}); setResult(null); }, [batch, subjectKey]);
  useEffect(() => () => { if (result) URL.revokeObjectURL(result.url); }, [result]);

  async function make() {
    setMsg(""); setResult(null);
    const ac = new AbortController(); abortRef.current = ac;
    setProgress({ done: 0, total: plan.totalFrames, stage: "준비 중" });
    try {
      const { blob, ext } = await renderVideo(plan, {
        logo: storeLogo || undefined,
        platformLabel,
        style,
        signal: ac.signal,
        onProgress: (done, total, stage) => setProgress({ done, total, stage }),
      });
      const name = `${(storeName || "릴스").replace(/[\\/:*?"<>|]/g, "")}_릴스_${new Date().toISOString().slice(0, 10)}.${ext}`;
      const file = new File([blob], name, { type: blob.type });
      setResult({ url: URL.createObjectURL(file), file });
      if (ext === "webm") setMsg("이 기기는 MP4를 못 만들어 WebM으로 저장했어요. 인스타에 안 올라가면 PC 크롬에서 다시 만들어주세요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null); abortRef.current = null;
    }
  }
  function save() {
    if (!result) return;
    const a = document.createElement("a"); a.href = result.url; a.download = result.file.name; a.click();
  }
  async function share() {
    if (!result) return;
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> };
    if (nav.share && nav.canShare && nav.canShare({ files: [result.file] })) {
      try { await nav.share({ files: [result.file], title: `${storeName} 릴스` }); setMsg("보냈어요 ✓"); } catch (e) { if (!(e instanceof Error && e.name === "AbortError")) setMsg("보내기에 실패했어요. '저장' 후 카톡에서 첨부해주세요."); }
    } else {
      save();
      setMsg("이 기기는 영상 공유창이 없어 파일로 저장했어요. 저장된 영상을 카톡에 첨부해 보내주세요.");
    }
  }

  if (!open) {
    return (
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="text-sm">
          <p className="font-bold">🎬 사진으로 릴스·쇼츠 영상 만들기</p>
          <p className="text-xs text-[var(--muted)]">
            {photos.length ? `리뷰 사진 ${photos.length}장이 천천히 움직이면서` : "사진이 없어 진한 배경 위에"} 대본의 자막이 장면마다 바뀌는 세로 영상(약 {plan.totalSec}초, 무음)을 만듭니다. 음악은 인스타·유튜브 앱에서 올릴 때 고르세요.
          </p>
        </div>
        <button type="button" className="btn btn-primary ml-auto" onClick={() => setOpen(true)}>영상 만들기</button>
      </div>
    );
  }

  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-bold">릴스 영상 · {plan.scenes.length}장면 · 약 {plan.totalSec}초 · 1080×1920</h4>
        <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
          스타일
          <select className="select py-1 text-xs" value={style} disabled={Boolean(progress)} onChange={(e) => setStyle(e.target.value as StyleKey)}>
            {STYLE_KEYS.map((k) => (
              <option key={k} value={k}>{STYLE_PRESETS[k].label}{k === styleKey ? " (AI 추천)" : ""}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto flex flex-wrap gap-2">
          {progress ? (
            <button type="button" className="btn btn-sm" onClick={() => abortRef.current?.abort()}>취소</button>
          ) : (
            <button type="button" className="btn btn-primary btn-sm" disabled={support === "none"} onClick={make}>{result ? "다시 만들기" : "🎬 영상 만들기"}</button>
          )}
        </span>
      </div>
      {support === "none" ? <p className="text-sm text-red-700">이 기기의 브라우저는 영상 만들기를 지원하지 않아요. 최신 크롬(PC·안드로이드) 또는 아이폰 사파리에서 열어주세요.</p> : null}
      {support === "mediarecorder" ? <p className="text-xs text-[var(--muted)]">이 기기는 실시간 녹화 방식이라 영상 길이만큼(약 {plan.totalSec}초) 걸리고 WebM 파일로 나와요.</p> : null}

      {progress ? (
        <div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#e9e6df]"><div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 text-xs text-[var(--muted)]">{progress.stage} · {pct}% · 만드는 동안 이 화면을 켜 두세요</p>
        </div>
      ) : null}
      {msg ? <p className="text-xs text-[var(--muted)]">{msg}</p> : null}

      {result ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <video src={result.url} controls playsInline className="w-full max-w-[280px] rounded-xl bg-black" style={{ aspectRatio: "9 / 16" }} />
          <div className="flex flex-col gap-2 text-sm">
            <p className="font-bold">완성! {Math.round(result.file.size / 1024 / 1024 * 10) / 10}MB</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-sm" onClick={share}>📤 카톡으로 보내기</button>
              <button type="button" className="btn btn-sm" onClick={save}>저장</button>
            </div>
            <p className="text-xs text-[var(--muted)]">
              인스타·유튜브 앱에서 올릴 때 <b>음악 추가</b>를 눌러 분위기에 맞는 곡을 고르세요.{plan.bgmStyle ? ` 대본이 제안한 분위기: "${plan.bgmStyle}"` : ""}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {plan.scenes.map((s, i) => {
          const pick = photoPick[s.order] !== undefined ? photoPick[s.order] : auto[i];
          return (
            <div key={s.order} className="flex gap-2 rounded-xl bg-[#f6f5f1] p-2 text-xs">
              <div className="h-20 w-12 shrink-0 overflow-hidden rounded-lg bg-[#1f1d1a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.photo ? <img src={`/api/photo?u=${encodeURIComponent(s.photo)}`} alt="" className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="font-bold">#{s.order} {s.phase === "opening" ? "오프닝" : s.phase === "closing" ? "클로징" : "하이라이트"} · {s.durationSec}초</p>
                <p className="truncate text-[var(--muted)]" title={s.subtitle}>{s.subtitle}</p>
                {photos.length ? (
                  <select className="select py-0.5 text-xs" value={pick} disabled={Boolean(progress)} onChange={(e) => setPhotoPick((p) => ({ ...p, [s.order]: Number(e.target.value) }))}>
                    {photos.map((_, pi) => <option key={pi} value={pi}>사진 {pi + 1}</option>)}
                    <option value={-1}>사진 없이</option>
                  </select>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[var(--muted)]">사진은 손님이 올린 리뷰 사진입니다. 홍보에 쓰기 전에 답글로 양해를 구하면 더 안전해요.</p>
    </div>
  );
}
