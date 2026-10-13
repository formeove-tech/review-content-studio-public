// 요즘 뜨는 소재: GET /api/trends (하루 캐시) · GET /api/trends?refresh=1 (다시 검색) · &hint=키워드
import type { NextRequest } from "next/server";
import { getCachedTrends, searchTrends } from "@/lib/ai/trends";
import { DEMO_TRENDS } from "@/lib/demo/generate";
import { errorMessage, fail, ok } from "@/lib/http";
import { isDemoSite } from "@/lib/runtime";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  if (isDemoSite()) return ok({ items: DEMO_TRENDS, at: new Date().toISOString(), model: "demo", query: "", cached: true });
  const refresh = sp.get("refresh") === "1";
  const hint = (sp.get("hint") || "").slice(0, 80);
  try {
    if (!refresh) {
      const cached = await getCachedTrends();
      if (cached) return ok({ ...cached, cached: true });
      if (sp.get("cachedOnly") === "1") return ok({ items: [], cached: false });
    }
    const res = await searchTrends({ refresh: true, hint });
    return ok({ ...res, cached: false });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
