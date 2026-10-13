// 만든 콘텐츠를 카톡·문자·메일로 "보내기" 할 때 쓰는 순수 텍스트 묶음
// (올리는 사람이 자녀·직원인 경우가 많아, 로그인 없이 받은 글만으로 바로 올릴 수 있게 전부 담습니다)
import type { Carousel, ContentRow, News, Reels, Review } from "./types";

const PHASE: Record<string, string> = { opening: "오프닝", highlight: "하이라이트", closing: "클로징" };

export function carouselText(d: Carousel): string {
  return d.slides.map((s) => `[${s.index}] ${s.headline}${s.body ? "\n" + s.body : ""}`).join("\n\n");
}

export function carouselCaption(d: Carousel): string {
  return `${d.caption}\n\n${d.hashtags.join(" ")}`;
}

export function reelsText(d: Reels): string {
  const scenes = d.scenes.map((s) => `#${s.order} [${PHASE[s.phase] || s.phase} · ${s.duration_sec}초]\n대사: ${s.script}\n자막: ${s.subtitle}\n장면: ${s.visual}`).join("\n\n");
  return `${d.title} (${d.duration_sec}초)\n훅: ${d.hook}\n\n${scenes}\n\nBGM: ${d.bgm_style}\n분위기: ${d.mood}\nCTA: ${d.cta}`;
}

export function newsText(d: News): string {
  return `■ 네이버 플레이스 새소식\n${d.naver.title}\n\n${d.naver.body}\n\n■ 당근 새소식\n${d.daangn.title}\n\n${d.daangn.body}`;
}

export function contentText(row: ContentRow): string {
  if (row.kind === "carousel") {
    const d = row.payload as Carousel;
    return `【인스타 캐러셀 · ${d.slides.length}장】\n${carouselText(d)}\n\n캡션:\n${carouselCaption(d)}`;
  }
  if (row.kind === "reels") return `【릴스/쇼츠 대본】\n${reelsText(row.payload as Reels)}`;
  return `【네이버·당근 새소식】\n${newsText(row.payload as News)}`;
}

/** 3종 전체를 한 덩어리 텍스트로. 받는 사람이 그대로 복사해 올릴 수 있는 형태 (리뷰 1개 또는 묶음) */
export function bundleText({ storeName, reviews, rows, title }: { storeName?: string; reviews: Pick<Review, "review_text" | "customer_name" | "review_date">[]; rows: ContentRow[]; title?: string }): string {
  const order = ["carousel", "reels", "news"] as const;
  const sorted = [...rows].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  const date = sorted[0]?.created_at.slice(0, 10) || reviews[0]?.review_date || "";
  const head = `${storeName ? storeName + " " : ""}${title ? title + " " : ""}리뷰 콘텐츠 (${date})`;
  const withText = reviews.filter((r) => r.review_text.trim());
  const quote = withText.length
    ? (withText.length > 1 ? `손님 리뷰 ${withText.length}개\n` : "") + withText.map((r) => `손님 리뷰 (${r.review_date}): “${r.review_text.trim()}”`).join("\n\n")
    : "";
  const parts = sorted.map(contentText);
  return [head, quote, ...parts].filter(Boolean).join("\n\n────────────\n\n");
}

export function bundleFileName(storeName: string | undefined, createdAt: string | undefined): string {
  const base = (storeName || "리뷰콘텐츠").replace(/[\\/:*?"<>|]/g, "").trim() || "리뷰콘텐츠";
  return `${base}_${(createdAt || new Date().toISOString()).slice(0, 10)}.txt`;
}
