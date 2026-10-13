import type { NextRequest } from "next/server";
import { generateContentsForReview } from "@/lib/ai/generate";
import { parseTrendPick } from "@/lib/ai/trend-pick";
import { errorMessage, fail, ok } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST /api/reviews/:id/generate  body(optional): { trend: { title, how_to_use, why_hot } } */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  const body = (await req.json().catch(() => ({}))) as { trend?: unknown };
  try {
    const res = await generateContentsForReview(id, parseTrendPick(body.trend));
    return ok({ contents: res.rows, model: res.model, key_quote: res.bundle.key_quote });
  } catch (e) {
    return fail(errorMessage(e), 500);
  }
}
