// 화면에서 고른 "요즘 뜨는 소재"를 안전하게 읽습니다 (없거나 이상하면 null)
import type { TrendPick } from "./prompts/content";

export function parseTrendPick(v: unknown): TrendPick | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim().slice(0, 80) : "";
  if (!title) return null;
  return {
    title,
    how_to_use: typeof o.how_to_use === "string" ? o.how_to_use.trim().slice(0, 300) : "",
    why_hot: typeof o.why_hot === "string" ? o.why_hot.trim().slice(0, 300) : "",
  };
}
