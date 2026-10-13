// 데모 데이터를 처음 상태로 되돌립니다 (공개 데모 전용)
import { resetDemoDb } from "@/lib/db";
import { errorMessage, fail, ok } from "@/lib/http";
import { isDemoSite } from "@/lib/runtime";

export const runtime = "nodejs";

export async function POST() {
  if (!isDemoSite()) return fail("데모 사이트에서만 쓸 수 있어요.", 403);
  try {
    await resetDemoDb();
    return ok({ message: "데모 데이터를 다시 채웠어요." });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
