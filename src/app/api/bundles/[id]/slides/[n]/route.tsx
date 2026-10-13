// 묶음(리뷰 여러 개)의 사진 + 캐러셀 문구로 슬라이드 PNG 1장.
// GET /api/bundles/:id/slides/:n?size=insta|threads&batch=<created_at>&photo=<사진번호|-1>
import { NextResponse, type NextRequest } from "next/server";
import { getBundle, getReviewsByIds, getSettings, listBundleContents } from "@/lib/db";
import { buildSlides, parseSize } from "@/lib/slides";
import { renderSlideResponse } from "@/lib/slides-render";
import { bundlePhotos, bundlePlatformLabel } from "@/lib/bundles";
import type { Carousel } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string; n: string }> }) {
  const { id: idRaw, n: nRaw } = await ctx.params;
  const id = Number(idRaw);
  const n = Number(nRaw);
  const sp = req.nextUrl.searchParams;
  const size = parseSize(sp.get("size"));
  const batch = sp.get("batch") || "";
  const photoParam = sp.get("photo");

  const bundle = await getBundle(id);
  if (!bundle) return NextResponse.json({ ok: false, message: "묶음을 찾을 수 없어요." }, { status: 404 });
  const carousels = (await listBundleContents(id)).filter((c) => c.kind === "carousel");
  const row = (batch && carousels.find((c) => c.created_at === batch)) || carousels[0];
  if (!row) return NextResponse.json({ ok: false, message: "먼저 이 묶음으로 콘텐츠를 만들어주세요." }, { status: 404 });

  const reviews = await getReviewsByIds(bundle.review_ids);
  const settings = await getSettings();
  const overrides: Record<number, number> = {};
  if (photoParam !== null && photoParam !== "") overrides[n] = Number(photoParam);
  const slides = buildSlides({
    carousel: row.payload as Carousel,
    review: { photo_urls: bundlePhotos(reviews) },
    storeName: settings.storeName || "",
    platformLabel: bundlePlatformLabel(reviews),
    overrides,
    style: sp.get("style"),
  });
  const slide = slides.find((s) => s.index === n);
  if (!slide) return NextResponse.json({ ok: false, message: "그 번호의 슬라이드가 없어요." }, { status: 404 });
  return renderSlideResponse(slide, size, settings.storeLogo, req.nextUrl.origin);
}
