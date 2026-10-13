"use client";

import { useMemo, useState } from "react";
import type { TrendPick } from "@/lib/ai/prompts/content";
import { bundleFileName, bundleText } from "@/lib/share-text";
import { carouselStyleKey } from "@/lib/styles";
import { CONTENT_KIND_LABEL, CONTENT_KINDS, PLATFORM_LABEL, type Carousel, type ContentKind, type ContentRow, type News, type Reels, type Review } from "@/lib/types";
import { CarouselView, NewsView, ReelsView } from "./ContentViews";
import { ReviewCard } from "./ReviewCard";
import { SlidesPanel } from "./SlidesPanel";
import { TrendPicker } from "./TrendPicker";
import { VideoPanel } from "./VideoPanel";
import { ShareButton } from "./ui";

export function ContentStudio({ review: initialReview, initialContents, aiReady, storeName = "", storeLogo = "" }: { review: Review; initialContents: ContentRow[]; aiReady: boolean; storeName?: string; storeLogo?: string }) {
  const [review, setReview] = useState(initialReview);
  const [contents, setContents] = useState(initialContents);
  const [tab, setTab] = useState<ContentKind>("carousel");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [batchIdx, setBatchIdx] = useState(0);
  const [trend, setTrend] = useState<TrendPick | null>(null); // 고른 "요즘 뜨는 소재"

  // 같은 시각(created_at)에 저장된 3종을 한 묶음으로
  const batches = useMemo(() => {
    const map = new Map<string, ContentRow[]>();
    for (const c of contents) {
      const arr = map.get(c.created_at) || [];
      arr.push(c);
      map.set(c.created_at, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([created_at, rows]) => ({ created_at, rows }));
  }, [contents]);

  const batch = batches[batchIdx];
  const current = batch?.rows.find((r) => r.kind === tab) || null;

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/${review.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trend }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setContents((prev) => [...data.contents, ...prev]);
      setBatchIdx(0);
      setReview((r) => ({ ...r, content_count: r.content_count + 1 }));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function toggleBookmark(r: Review, next: boolean) {
    setReview({ ...r, bookmarked: next });
    await fetch(`/api/reviews/${r.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookmarked: next }) });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,380px)_1fr]">
      <div className="flex flex-col gap-3">
        <ReviewCard review={review} onBookmark={toggleBookmark} />
        <div className="card p-4">
          <button type="button" className="btn btn-primary w-full justify-center" disabled={busy || !aiReady || !review.review_text.trim()} onClick={generate}>
            {busy ? "AI가 3가지 콘텐츠를 만드는 중… (30초~1분)" : contents.length ? "다시 생성하기" : "이 리뷰로 콘텐츠 3종 만들기"}
          </button>
          {!aiReady ? <p className="mt-2 text-xs text-red-700">AI 키가 연결되지 않았습니다. 설정 화면의 &quot;AI 연결 상태&quot; 안내를 따라주세요.</p> : null}
          {!review.review_text.trim() ? <p className="mt-2 text-xs text-[var(--muted)]">본문이 없는 리뷰(별점만)는 콘텐츠를 만들 수 없어요.</p> : null}
          {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          <p className="mt-2 text-xs text-[var(--muted)]">인스타 캐러셀(4~6장) · 릴스/쇼츠 대본 · 네이버/당근 새소식 문구가 한 번에 만들어집니다. 소재가 얇으면 리뷰 목록에서 여러 개를 체크해 <b>묶음</b>으로 만들어보세요.</p>
        </div>
        <TrendPicker value={trend} onChange={setTrend} disabled={busy} />
        {batches.length > 1 ? (
          <div className="card p-3 text-sm">
            <label className="label">생성 기록</label>
            <select className="select" value={batchIdx} onChange={(e) => setBatchIdx(Number(e.target.value))}>
              {batches.map((b, i) => (
                <option key={b.created_at} value={i}>
                  {i === 0 ? "최신 · " : ""}{b.created_at.slice(0, 16).replace("T", " ")} ({b.rows[0]?.model})
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        {batch ? (
          <div className="card flex flex-wrap items-center gap-3 p-3">
            <div className="text-sm">
              <p className="font-bold">올리는 사람에게 보내기</p>
              <p className="text-xs text-[var(--muted)]">캐러셀·릴스·새소식 3가지가 글 하나로 묶여요. 받은 사람은 로그인 없이 그대로 복사해 올리면 됩니다.</p>
            </div>
            <ShareButton
              className="ml-auto"
              title={`${storeName ? storeName + " " : ""}리뷰 콘텐츠`}
              text={bundleText({ storeName, reviews: [review], rows: batch.rows })}
              fileName={bundleFileName(storeName, batch.created_at)}
            />
          </div>
        ) : null}
        <div className="flex gap-1">
          {CONTENT_KINDS.map((k) => (
            <button key={k} type="button" className={`chip ${tab === k ? "active" : ""}`} onClick={() => setTab(k)}>
              {CONTENT_KIND_LABEL[k]}
            </button>
          ))}
        </div>

        {!current ? (
          <div className="card p-10 text-center text-sm text-[var(--muted)]">
            {busy ? "만드는 중입니다…" : "아직 만든 콘텐츠가 없어요. 왼쪽 버튼을 눌러보세요."}
          </div>
        ) : current.kind === "carousel" ? (
          <>
            <SlidesPanel slideBase={`/api/reviews/${review.id}/slides`} subjectKey={`review-${review.id}`} photos={review.photo_urls} carousel={current.payload as Carousel} batch={current.created_at} storeName={storeName} />
            <CarouselView data={current.payload as Carousel} quote={current.key_quote} />
          </>
        ) : current.kind === "reels" ? (
          <>
            <VideoPanel photos={review.photo_urls} platformLabel={PLATFORM_LABEL[review.platform] || ""} subjectKey={`review-${review.id}`} reels={current.payload as Reels} batch={current.created_at} storeName={storeName} storeLogo={storeLogo} styleKey={carouselStyleKey(batch?.rows.find((r) => r.kind === "carousel")?.payload as Carousel | undefined)} />
            <ReelsView data={current.payload as Reels} />
          </>
        ) : (
          <NewsView data={current.payload as News} />
        )}
      </div>
    </div>
  );
}
