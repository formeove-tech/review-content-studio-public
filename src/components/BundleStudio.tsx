"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { TrendPick } from "@/lib/ai/prompts/content";
import { bundlePhotos, bundlePlatformLabel } from "@/lib/bundles";
import { bundleFileName, bundleText } from "@/lib/share-text";
import { carouselStyleKey } from "@/lib/styles";
import { BUNDLE_SOURCE_LABEL, CONTENT_KIND_LABEL, CONTENT_KINDS, type Bundle, type Carousel, type ContentKind, type ContentRow, type News, type Reels, type Review } from "@/lib/types";
import { CarouselView, NewsView, ReelsView } from "./ContentViews";
import { ReviewCard } from "./ReviewCard";
import { SlidesPanel } from "./SlidesPanel";
import { TrendPicker } from "./TrendPicker";
import { VideoPanel } from "./VideoPanel";
import { ShareButton } from "./ui";

/** 묶음(리뷰 여러 개) 콘텐츠 화면 — 들어간 리뷰 목록 + 3종 탭 + 슬라이드·영상·보내기 */
export function BundleStudio({ bundle, reviews, initialContents, aiReady, storeName = "", storeLogo = "" }: {
  bundle: Bundle; reviews: Review[]; initialContents: ContentRow[]; aiReady: boolean; storeName?: string; storeLogo?: string;
}) {
  const [contents, setContents] = useState(initialContents);
  const [tab, setTab] = useState<ContentKind>("carousel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [batchIdx, setBatchIdx] = useState(0);
  const [showReviews, setShowReviews] = useState(false);
  const [trend, setTrend] = useState<TrendPick | null>(null);

  const batches = useMemo(() => {
    const map = new Map<string, ContentRow[]>();
    for (const c of contents) { const arr = map.get(c.created_at) || []; arr.push(c); map.set(c.created_at, arr); }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([created_at, rows]) => ({ created_at, rows }));
  }, [contents]);
  const batch = batches[batchIdx];
  const current = batch?.rows.find((r) => r.kind === tab) || null;
  const photos = useMemo(() => bundlePhotos(reviews), [reviews]);
  const platformLabel = useMemo(() => bundlePlatformLabel(reviews), [reviews]);

  async function generate() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/bundles/${bundle.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trend }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setContents((prev) => [...data.contents, ...prev]);
      setBatchIdx(0);
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); } finally { setBusy(false); }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="flex flex-col gap-3">
        <div className="card p-4">
          <p className="text-xs text-[var(--muted)]">묶음 · {BUNDLE_SOURCE_LABEL[bundle.source]}{bundle.theme ? ` · 주제 '${bundle.theme}'` : ""} · {bundle.created_at.slice(0, 10)}</p>
          <h2 className="mt-1 text-lg font-bold">{bundle.title}</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">리뷰 {reviews.length}개 · 사진 {photos.length}장</p>
          <button type="button" className="btn btn-sm mt-2" onClick={() => setShowReviews((v) => !v)}>{showReviews ? "리뷰 접기" : `들어간 리뷰 ${reviews.length}개 보기`}</button>
        </div>
        <div className="card p-4">
          <button type="button" className="btn btn-primary w-full justify-center" disabled={busy || !aiReady} onClick={generate}>
            {busy ? "AI가 리뷰들을 종합하는 중… (30초~1분)" : contents.length ? "다시 생성하기" : "이 묶음으로 콘텐츠 3종 만들기"}
          </button>
          {!aiReady ? <p className="mt-2 text-xs text-red-700">AI 키가 연결되지 않았습니다. 설정 화면의 &quot;AI 연결 상태&quot; 안내를 따라주세요.</p> : null}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          <p className="mt-2 text-xs text-[var(--muted)]">여러 손님의 문장을 골고루 인용해 캐러셀·릴스 대본·새소식을 만듭니다.</p>
        </div>
        <TrendPicker value={trend} onChange={setTrend} disabled={busy} />
        {batches.length > 1 ? (
          <div className="card p-3 text-sm">
            <label className="label">생성 기록</label>
            <select className="select" value={batchIdx} onChange={(e) => setBatchIdx(Number(e.target.value))}>
              {batches.map((b, i) => <option key={b.created_at} value={i}>{i === 0 ? "최신 · " : ""}{b.created_at.slice(0, 16).replace("T", " ")} ({b.rows[0]?.model})</option>)}
            </select>
          </div>
        ) : null}
        {showReviews ? (
          <div className="flex flex-col gap-2">
            {reviews.map((r) => <ReviewCard key={r.id} review={r} extra={<Link href={`/reviews/${r.id}`} className="tag">리뷰 화면</Link>} />)}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {batch ? (
          <div className="card flex flex-wrap items-center gap-3 p-3">
            <div className="text-sm">
              <p className="font-bold">올리는 사람에게 보내기</p>
              <p className="text-xs text-[var(--muted)]">캐러셀·릴스·새소식 3가지와 인용한 리뷰 원문이 글 하나로 묶여요.</p>
            </div>
            <ShareButton className="ml-auto" title={`${storeName ? storeName + " " : ""}리뷰 모음 콘텐츠`} text={bundleText({ storeName, reviews, rows: batch.rows, title: bundle.title })} fileName={bundleFileName(storeName, batch.created_at)} />
          </div>
        ) : null}
        <div className="flex gap-1">
          {CONTENT_KINDS.map((k) => (
            <button key={k} type="button" className={`chip ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>{CONTENT_KIND_LABEL[k]}</button>
          ))}
        </div>
        {!current ? (
          <div className="card p-10 text-center text-sm text-[var(--muted)]">{busy ? "만드는 중입니다…" : "아직 만든 콘텐츠가 없어요. 왼쪽 버튼을 눌러보세요."}</div>
        ) : current.kind === "carousel" ? (
          <>
            <SlidesPanel slideBase={`/api/bundles/${bundle.id}/slides`} subjectKey={`bundle-${bundle.id}`} photos={photos} carousel={current.payload as Carousel} batch={current.created_at} storeName={storeName} />
            <CarouselView data={current.payload as Carousel} quote={current.key_quote} />
          </>
        ) : current.kind === "reels" ? (
          <>
            <VideoPanel photos={photos} platformLabel={platformLabel} subjectKey={`bundle-${bundle.id}`} reels={current.payload as Reels} batch={current.created_at} storeName={storeName} storeLogo={storeLogo} styleKey={carouselStyleKey(batch?.rows.find((r) => r.kind === "carousel")?.payload as Carousel | undefined)} />
            <ReelsView data={current.payload as Reels} />
          </>
        ) : (
          <NewsView data={current.payload as News} />
        )}
      </div>
    </div>
  );
}
