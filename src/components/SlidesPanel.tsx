"use client";

import { useEffect, useMemo, useState } from "react";
import { SLIDE_SIZES, assignPhotos, type SlideSize } from "@/lib/slides";
import { carouselStyleKey, STYLE_PRESETS } from "@/lib/styles";
import { STYLE_KEYS, type Carousel, type StyleKey } from "@/lib/types";

/**
 * 사진 + 캐러셀 문구로 만든 슬라이드 이미지 미리보기 · 저장 · 보내기
 * 이미지는 `${slideBase}/:n` 이 그때그때 그립니다 (서버 보관 없음). 리뷰 1개·묶음 모두 사용
 */
export function SlidesPanel({ slideBase, subjectKey, photos, carousel, batch, storeName }: {
  slideBase: string; // 예: /api/reviews/12/slides 또는 /api/bundles/3/slides
  subjectKey: string; // 대상이 바뀌면 선택 초기화
  photos: string[];
  carousel: Carousel;
  batch: string;
  storeName: string;
}) {
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<SlideSize>("insta");
  const aiStyle = carouselStyleKey(carousel); // AI가 리뷰 분위기로 고른 스타일
  const [style, setStyle] = useState<StyleKey>(aiStyle);
  const [photoPick, setPhotoPick] = useState<Record<number, number>>({}); // 슬라이드 번호 → 사진 인덱스(-1 없음)
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const slides = useMemo(() => [...carousel.slides].sort((a, b) => a.index - b.index), [carousel]);
  const auto = useMemo(() => assignPhotos(slides.length, photos.length), [slides.length, photos.length]);

  useEffect(() => { setPhotoPick({}); setStyle(aiStyle); }, [batch, subjectKey, aiStyle]);

  const urlFor = (n: number) => {
    const p = photoPick[n];
    const q = new URLSearchParams({ size, batch, style });
    if (p !== undefined) q.set("photo", String(p));
    return `${slideBase}/${n}?${q}`;
  };
  const fileName = (n: number) => `${(storeName || "슬라이드").replace(/[\\/:*?"<>|]/g, "")}_${size}_${n}.png`;

  async function fetchPng(n: number): Promise<File> {
    const res = await fetch(urlFor(n));
    if (!res.ok) throw new Error(`슬라이드 ${n}을 만들지 못했어요.`);
    return new File([await res.blob()], fileName(n), { type: "image/png" });
  }
  function download(file: File) {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  async function saveOne(n: number) {
    setBusy(`save-${n}`); setMsg("");
    try { download(await fetchPng(n)); } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  async function saveAll() {
    setBusy("all"); setMsg("");
    try {
      for (const s of slides) { download(await fetchPng(s.index)); await new Promise((r) => setTimeout(r, 400)); }
      setMsg(`${slides.length}장을 저장했어요. 휴대폰이면 갤러리(다운로드)에서 확인하세요.`);
    } catch (e) { setMsg(e instanceof Error ? e.message : String(e)); } finally { setBusy(""); }
  }
  async function shareAll() {
    setBusy("share"); setMsg("");
    try {
      const files = [];
      for (const s of slides) files.push(await fetchPng(s.index));
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean; share?: (d: { files: File[]; title?: string }) => Promise<void> };
      if (nav.share && nav.canShare && nav.canShare({ files })) {
        await nav.share({ files, title: `${storeName} 리뷰 슬라이드` });
        setMsg("보냈어요 ✓");
      } else {
        for (const f of files) { download(f); await new Promise((r) => setTimeout(r, 400)); }
        setMsg("이 기기는 이미지 공유창이 없어 파일로 저장했어요. 저장된 사진을 카톡에 첨부해 보내주세요.");
      }
    } catch (e) {
      if (!(e instanceof Error && e.name === "AbortError")) setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(""); }
  }

  if (!open) {
    return (
      <div className="card flex flex-wrap items-center gap-3 p-4">
        <div className="text-sm">
          <p className="font-bold">🖼 사진으로 슬라이드 이미지 만들기</p>
          <p className="text-xs text-[var(--muted)]">
            {photos.length ? `리뷰 사진 ${photos.length}장을 배경으로` : "사진이 없어 진한 단색 배경으로"} 위 문구를 얹은 이미지 {slides.length}장을 만듭니다. 인스타·스레드에 바로 올릴 수 있어요.
          </p>
        </div>
        <button type="button" className="btn btn-primary ml-auto" onClick={() => setOpen(true)}>이미지 만들기</button>
      </div>
    );
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="font-bold">슬라이드 이미지 · {slides.length}장</h4>
        <div className="flex gap-1">
          {(Object.keys(SLIDE_SIZES) as SlideSize[]).map((k) => (
            <button key={k} type="button" className={`chip ${size === k ? "active" : ""}`} onClick={() => setSize(k)}>{SLIDE_SIZES[k].label}</button>
          ))}
        </div>
        <label className="flex items-center gap-1 text-xs text-[var(--muted)]">
          스타일
          <select className="select py-1 text-xs" value={style} onChange={(e) => setStyle(e.target.value as StyleKey)} title="AI가 리뷰 분위기로 고른 스타일. 바꿔볼 수 있어요">
            {STYLE_KEYS.map((k) => (
              <option key={k} value={k}>{STYLE_PRESETS[k].label}{k === aiStyle ? " (AI 추천)" : ""} · {STYLE_PRESETS[k].when}</option>
            ))}
          </select>
        </label>
        <span className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary btn-sm" disabled={Boolean(busy)} onClick={shareAll}>{busy === "share" ? "만드는 중…" : "📤 카톡으로 보내기"}</button>
          <button type="button" className="btn btn-sm" disabled={Boolean(busy)} onClick={saveAll}>{busy === "all" ? "저장 중…" : "전체 저장"}</button>
        </span>
      </div>
      {msg ? <p className="text-xs text-[var(--muted)]">{msg}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {slides.map((s, i) => {
          const n = s.index;
          const pick = photoPick[n] !== undefined ? photoPick[n] : auto[i];
          return (
            <div key={`${n}-${size}-${batch}`} className="flex flex-col gap-2">
              <div className="overflow-hidden rounded-xl bg-[#e9e6df]" style={{ aspectRatio: `${SLIDE_SIZES[size].width} / ${SLIDE_SIZES[size].height}` }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlFor(n)} alt={`슬라이드 ${n}`} className="h-full w-full object-cover" />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--muted)]">{n}장</span>
                {photos.length ? (
                  <select className="select flex-1 py-1 text-xs" value={pick} onChange={(e) => setPhotoPick((p) => ({ ...p, [n]: Number(e.target.value) }))}>
                    {photos.map((_, pi) => <option key={pi} value={pi}>사진 {pi + 1}</option>)}
                    <option value={-1}>사진 없이</option>
                  </select>
                ) : null}
                <button type="button" className="btn btn-sm ml-auto" disabled={Boolean(busy)} onClick={() => saveOne(n)}>{busy === `save-${n}` ? "…" : "저장"}</button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[var(--muted)]">
        사진은 손님이 올린 리뷰 사진입니다. 홍보에 쓰기 전에 답글로 양해를 구하면 더 안전해요. 문구를 바꾸려면 위의 &quot;다시 생성하기&quot;를 누르세요.
      </p>
    </div>
  );
}
