// 리뷰 1개의 사진 + 캐러셀 문구로 슬라이드 PNG 1장을 그립니다.
// GET /api/reviews/:id/slides/:n?size=insta|threads&batch=<created_at>&photo=<사진번호|-1>
import { NextResponse, type NextRequest } from "next/server";
import { demoBundleFor } from "@/lib/demo/generate";
import { isDemoSite } from "@/lib/runtime";
import { getReview, getSettings, listContents } from "@/lib/db";
import { buildSlides, parseSize } from "@/lib/slides";
import { renderSlideResponse } from "@/lib/slides-render";
import { PLATFORM_LABEL, type Carousel } from "@/lib/types";

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

  const review = await getReview(id);
  if (!review) return NextResponse.json({ ok: false, message: "리뷰를 찾을 수 없어요." }, { status: 404 });
  const carousels = (await listContents(id)).filter((c) => c.kind === "carousel");
  let row: { payload: unknown } | undefined = (batch && carousels.find((c) => c.created_at === batch)) || carousels[0];
  // 데모: 화면마다 서버 함수가 따로라 방금 만든 콘텐츠가 여기에 없을 수 있음 → 같은 리뷰면 항상 같은 결과가 나오는 틀로 다시 만듦
  if (!row && isDemoSite()) row = { payload: demoBundleFor([review], (await getSettings()).storeName).carousel };
  if (!row) return NextResponse.json({ ok: false, message: "먼저 이 리뷰로 콘텐츠를 만들어주세요." }, { status: 404 });

  const settings = await getSettings();
  const overrides: Record<number, number> = {};
  if (photoParam !== null && photoParam !== "") overrides[n] = Number(photoParam);
  const slides = buildSlides({ carousel: row.payload as Carousel, review, storeName: settings.storeName || "", platformLabel: PLATFORM_LABEL[review.platform] || "", overrides, style: sp.get("style") });
  const slide = slides.find((s) => s.index === n);
  if (!slide) return NextResponse.json({ ok: false, message: "그 번호의 슬라이드가 없어요." }, { status: 404 });
  return renderSlideResponse(slide, size, settings.storeLogo, req.nextUrl.origin);
}
