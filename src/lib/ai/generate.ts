import { isDemoSite } from "../runtime";
import { demoBundleFor } from "../demo/generate";
import { getBundle, getReview, getReviewsByIds, getSettings, saveContents } from "../db";
import { ContentBundleSchema, type ContentBundle, type ContentRow } from "../types";
import { generateStructured } from "./client";
import { BUNDLE_SYSTEM, bundleUserPrompt, CONTENT_SYSTEM, contentUserPrompt, type TrendPick } from "./prompts/content";

/** 묶음(리뷰 여러 개) → 캐러셀·릴스·새소식 3종을 종합 생성해 저장 */
export async function generateContentsForBundle(bundleId: number, trend?: TrendPick | null): Promise<{ bundle: ContentBundle; rows: ContentRow[]; model: string }> {
  const b = await getBundle(bundleId);
  if (!b) throw new Error("묶음을 찾을 수 없습니다.");
  const all = await getReviewsByIds(b.review_ids);
  const byId = new Map(all.map((r) => [r.id, r]));
  const reviews = b.review_ids.map((id) => byId.get(id)).filter((r): r is NonNullable<typeof r> => Boolean(r && r.review_text.trim()));
  if (reviews.length < 2) throw new Error("본문이 있는 리뷰가 2개 이상 필요합니다.");

  const settings = await getSettings();
  if (isDemoSite()) {
    const data = demoBundleFor(reviews, settings.storeName, trend);
    const rows = await saveContents({ bundleId }, [
      { kind: "carousel", payload: data.carousel, key_quote: data.key_quote, model: "demo-template" },
      { kind: "reels", payload: data.reels, key_quote: data.key_quote, model: "demo-template" },
      { kind: "news", payload: data.news, key_quote: data.key_quote, model: "demo-template" },
    ]);
    return { bundle: data, rows, model: "demo-template" };
  }
  const { data, model } = await generateStructured({
    system: BUNDLE_SYSTEM,
    user: bundleUserPrompt(reviews, settings, b.title, trend),
    schema: ContentBundleSchema,
    schemaName: "content_bundle",
  });
  const rows = await saveContents({ bundleId }, [
    { kind: "carousel", payload: data.carousel, key_quote: data.key_quote, model },
    { kind: "reels", payload: data.reels, key_quote: data.key_quote, model },
    { kind: "news", payload: data.news, key_quote: data.key_quote, model },
  ]);
  return { bundle: data, rows, model };
}

/** 리뷰 1개 → 캐러셀·릴스·새소식 3종을 한 번에 생성해 저장 */
export async function generateContentsForReview(reviewId: number, trend?: TrendPick | null): Promise<{ bundle: ContentBundle; rows: ContentRow[]; model: string }> {
  const review = await getReview(reviewId);
  if (!review) throw new Error("리뷰를 찾을 수 없습니다.");
  if (!review.review_text.trim()) throw new Error("리뷰 본문이 없는 리뷰(별점만)는 콘텐츠를 만들 수 없습니다.");

  const settings = await getSettings();
  if (isDemoSite()) {
    const data = demoBundleFor([review], settings.storeName, trend);
    const rows = await saveContents(reviewId, [
      { kind: "carousel", payload: data.carousel, key_quote: data.key_quote, model: "demo-template" },
      { kind: "reels", payload: data.reels, key_quote: data.key_quote, model: "demo-template" },
      { kind: "news", payload: data.news, key_quote: data.key_quote, model: "demo-template" },
    ]);
    return { bundle: data, rows, model: "demo-template" };
  }
  const { data, model } = await generateStructured({
    system: CONTENT_SYSTEM,
    user: contentUserPrompt(review, settings, trend),
    schema: ContentBundleSchema,
    schemaName: "content_bundle",
  });

  const rows = await saveContents(reviewId, [
    { kind: "carousel", payload: data.carousel, key_quote: data.key_quote, model },
    { kind: "reels", payload: data.reels, key_quote: data.key_quote, model },
    { kind: "news", payload: data.news, key_quote: data.key_quote, model },
  ]);
  return { bundle: data, rows, model };
}
