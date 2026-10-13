// "요즘 뜨는 소재 찾기" — Anthropic 웹 검색 도구로 최근 음식·식당 SNS(인스타·릴스·쇼츠)에서 먹히는 형식·밈·시즌 이슈를 찾습니다
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getMeta, getSettings, setMeta } from "../db";
import { storeContext } from "./prompts/content";

export const TrendItemSchema = z.object({
  title: z.string().min(1),
  why_hot: z.string().default(""),
  how_to_use: z.string().default(""),
  example: z.string().default(""), // 실제 사례 한 줄
  source_url: z.string().default(""),
  fit: z.number().min(1).max(5).default(3), // 우리 가게 적합도
});
export type TrendItem = z.infer<typeof TrendItemSchema>;
export const TrendListSchema = z.object({ items: z.array(TrendItemSchema).min(1).max(8) });

export interface TrendCache { at: string; items: TrendItem[]; model: string; query: string }

const CACHE_KEY = "trends_cache";
const CACHE_HOURS = 24;
const TREND_MODEL = process.env.TREND_MODEL?.trim() || "claude-sonnet-5";

export async function getCachedTrends(): Promise<TrendCache | null> {
  const raw = await getMeta(CACHE_KEY);
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as TrendCache;
    if (Date.now() - new Date(c.at).getTime() > CACHE_HOURS * 3600_000) return null;
    return c;
  } catch {
    return null;
  }
}

/** 마지막 JSON 블록을 뽑아 파싱 (검색 도구를 쓰면 구조화 출력 대신 본문에 JSON 을 적게 함) */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/g);
  const candidates = fenced ? fenced.map((f) => f.replace(/```(?:json)?/g, "").trim()) : [];
  const first = text.indexOf("{"), last = text.lastIndexOf("}");
  if (first >= 0 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates.reverse()) {
    try { return JSON.parse(c); } catch { /* 다음 후보 */ }
  }
  throw new Error("AI 응답에서 JSON 을 찾지 못했습니다.");
}

export async function searchTrends({ refresh = false, hint = "" }: { refresh?: boolean; hint?: string } = {}): Promise<TrendCache> {
  if (!refresh) {
    const cached = await getCachedTrends();
    if (cached) return cached;
  }
  if (!process.env.ANTHROPIC_API_KEY?.trim()) throw new Error("요즘 뜨는 소재 찾기는 Anthropic 키가 필요합니다 (.env.local 의 ANTHROPIC_API_KEY).");
  const settings = await getSettings();
  const month = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" });
  const client = new Anthropic();
  const query = `${settings.signatureMenus || settings.storeName || "동네 식당"} ${hint}`.trim();
  const response = await client.messages.create({
    model: TREND_MODEL,
    max_tokens: 4000,
    system: `당신은 동네 음식점 SNS 마케터의 리서처입니다. 웹 검색으로 최근 1~2개월(${month} 기준) 한국 인스타그램 릴스·유튜브 쇼츠·스레드에서 음식점/맛집 계정이 실제로 쓰고 있는 "먹히는 형식·밈·시즌 이슈"를 찾습니다.
규칙:
- 검색은 3~5회. 한국어 위주("맛집 릴스 트렌드", "식당 인스타 밈 ${month}", "쇼츠 음식 챌린지" 등), 필요하면 영어 1회.
- 실제 게시물·기사·트렌드 언급이 근거인 것만 고릅니다. 지어내지 않습니다. 근거가 약하면 fit 점수를 낮춥니다.
- 각 항목은 "형식/밈"(예: 후회형 훅, 사장님 vs 손님, 손님 리뷰 읽어주기, 원가 공개, 시즌 메뉴 이슈)처럼 손님 리뷰 콘텐츠에 바로 적용 가능한 것. 상호 비방·정치·자극적 이슈 제외.
- 마지막에 반드시 아래 JSON 만 코드블록으로 출력합니다(설명 문장 금지):
{"items":[{"title":"소재 이름(20자 이내)","why_hot":"왜 지금 뜨는지 1~2문장","how_to_use":"손님 리뷰 콘텐츠에 적용하는 법 1~2문장","example":"실제 사례 한 줄","source_url":"근거 주소","fit":1~5}]}
항목은 5개.`,
    messages: [{ role: "user", content: `[가게 정보]\n${storeContext(settings)}\n\n검색 힌트: ${query}\n\n지금 우리 가게 손님 리뷰로 인스타 캐러셀·릴스를 만들 때 활용할 만한, 요즘 뜨는 소재 5개를 찾아 JSON 으로 주세요.` }],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 5 } as unknown as Anthropic.Messages.Tool],
  });
  const text = response.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === "text").map((b) => b.text).join("\n");
  const parsed = TrendListSchema.parse(extractJson(text));
  const cache: TrendCache = { at: new Date().toISOString(), items: parsed.items.slice(0, 5), model: response.model, query };
  await setMeta(CACHE_KEY, JSON.stringify(cache));
  return cache;
}
