"use client";

import Link from "next/link";
import type { Review } from "@/lib/types";
import { maskName, PlatformBadge, SentimentTag, Stars } from "./ui";

export function ReviewCard({
  review,
  onBookmark,
  extra,
  selected,
  onSelect,
}: {
  review: Review;
  onBookmark?: (r: Review, next: boolean) => void;
  extra?: React.ReactNode;
  selected?: boolean; // 묶음용 체크 (onSelect 가 있을 때만 표시)
  onSelect?: (r: Review, next: boolean) => void;
}) {
  const r = review;
  return (
    <article className={`card flex flex-col gap-2 p-4 ${selected ? "ring-2 ring-[var(--accent)]" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        {onSelect ? (
          <label className="flex cursor-pointer items-center gap-1 rounded-md border border-[var(--line)] px-1.5 py-0.5 font-semibold" title="묶음 콘텐츠에 넣기">
            <input type="checkbox" checked={Boolean(selected)} disabled={!r.review_text.trim()} onChange={(e) => onSelect(r, e.target.checked)} />
            묶기
          </label>
        ) : null}
        <PlatformBadge platform={r.platform} />
        <span>{r.review_date}</span>
        <span>· {maskName(r.customer_name)}</span>
        {r.order_count ? <span>· {r.order_count}회 주문</span> : null}
        <Stars rating={r.rating} />
        {r.has_photo ? <span title="사진 리뷰">📷</span> : null}
        <span className="ml-auto flex items-center gap-2">
          <SentimentTag sentiment={r.sentiment} />
          <span className="tag" title="콘텐츠 소재 점수">{r.score}점</span>
          {onBookmark ? (
            <button
              type="button"
              aria-label={r.bookmarked ? "수집함에서 빼기" : "수집함에 담기"}
              title={r.bookmarked ? "리뷰 수집함에서 빼기" : "리뷰 수집함에 담기"}
              className={`flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold leading-none ${r.bookmarked ? "border-[var(--accent)] text-[var(--accent)]" : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--accent)]"}`}
              onClick={() => onBookmark(r, !r.bookmarked)}
            >
              <span className="text-base leading-none">{r.bookmarked ? "★" : "☆"}</span>
              {r.bookmarked ? "담김" : "담기"}
            </button>
          ) : null}
        </span>
      </div>

      <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{r.review_text || <span className="text-[var(--muted)]">(별점만 남긴 리뷰)</span>}</p>

      {r.order_menu ? <p className="text-xs text-[var(--muted)]">주문: {r.order_menu}</p> : null}
      {r.delivery_review ? <p className="text-xs text-[var(--muted)]">배달: {r.delivery_review}</p> : null}

      <div className="flex flex-wrap items-center gap-1">
        {r.categories.map((c) => (
          <span key={c} className={`tag ${c === "불만" ? "tag-neg" : ""}`}>
            {c}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-2">
          {r.content_count > 0 ? <span className="text-xs text-[var(--muted)]">콘텐츠 {r.content_count}개</span> : null}
          {extra}
          <Link href={`/reviews/${r.id}`} className={`btn btn-sm ${r.content_count > 0 ? "" : "btn-primary"}`}>
            {r.content_count > 0 ? "콘텐츠 보기" : "콘텐츠 만들기"}
          </Link>
        </span>
      </div>
    </article>
  );
}
