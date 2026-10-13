import type { NextRequest } from "next/server";
import { setMeta, stopRequestedIds, takePendingCrawlJob } from "@/lib/db";
import { errorMessage, fail, ok } from "@/lib/http";

export const runtime = "nodejs";

/** 노트북 앱이 8초마다 호출: 대기 중인 수집 요청과 중단 요청을 돌려주고, 노트북이 살아 있다는 신호를 남깁니다 (수집 토큰으로 보호) */
export async function GET(req: NextRequest) {
  const expected = process.env.INGEST_TOKEN?.trim();
  if (expected && (req.headers.get("x-extension-token") || "") !== expected) return fail("연동 토큰이 올바르지 않습니다.", 401);
  try {
    await setMeta("laptop_last_seen", new Date().toISOString());
    const pending = await takePendingCrawlJob();
    return ok({ pending: pending ? { id: pending.id, platform: pending.platform } : null, stopIds: await stopRequestedIds() });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
