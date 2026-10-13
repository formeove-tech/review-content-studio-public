// 묶음(리뷰 여러 개 → 콘텐츠)
// GET  /api/bundles                → 목록
// POST /api/bundles { review_ids?, source: manual|weekly|auto, title?, theme?, days? } → 묶음 만들고 바로 3종 생성
import type { NextRequest } from "next/server";
import { generateContentsForBundle } from "@/lib/ai/generate";
import { createBundle, getReviewsByIds, listBundles, pickReviewsByTheme } from "@/lib/db";
import { errorMessage, fail, ok } from "@/lib/http";
import { BUNDLE_SOURCES, CATEGORIES, type BundleSource, type Category } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const MIN_REVIEWS = 2;
const MAX_REVIEWS = 8;

export async function GET() {
  return ok({ items: await listBundles() });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { review_ids?: unknown; source?: string; title?: string; theme?: string; days?: number };
  const source = (BUNDLE_SOURCES as readonly string[]).includes(body.source || "") ? (body.source as BundleSource) : "manual";
  let ids: number[] = Array.isArray(body.review_ids) ? body.review_ids.map(Number).filter((n) => Number.isFinite(n) && n > 0) : [];
  let title = (body.title || "").trim();
  const theme = (CATEGORIES as readonly string[]).includes(body.theme || "") ? (body.theme as Category) : "";

  try {
    if (source === "auto") {
      const days = body.days === 90 ? 90 : 30;
      const picked = await pickReviewsByTheme(theme, days, 5);
      ids = picked.map((r) => r.id);
      if (!title) title = `${theme ? `'${theme}' 리뷰` : "최근 리뷰"} 모음 (최근 ${days}일)`;
      if (ids.length < MIN_REVIEWS) return fail(`최근 ${days}일 안에 ${theme ? `'${theme}' ` : ""}본문 있는 긍정 리뷰가 2개 미만이에요. 기간을 늘리거나 다른 주제를 골라주세요.`);
    }
    ids = Array.from(new Set(ids)).slice(0, MAX_REVIEWS);
    if (ids.length < MIN_REVIEWS) return fail(`리뷰를 ${MIN_REVIEWS}개 이상 골라주세요.`);
    const reviews = await getReviewsByIds(ids);
    const withText = reviews.filter((r) => r.review_text.trim());
    if (withText.length < MIN_REVIEWS) return fail("본문(글)이 있는 리뷰가 2개 이상 필요해요. 별점만 남긴 리뷰는 빼주세요.");
    if (!title) title = `${withText[0].review_date} 외 ${withText.length - 1}개 리뷰 모음`;

    const bundle = await createBundle({ title, review_ids: withText.map((r) => r.id), source, theme });
    const res = await generateContentsForBundle(bundle.id);
    return ok({ bundle, contents: res.rows, model: res.model });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
