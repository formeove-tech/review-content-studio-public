// 데모 사이트 전용: AI 를 부르지 않고 "미리 정한 틀"로 콘텐츠 3종을 만듭니다 (비용 0원, 남용 걱정 없음).
// 손님 문장은 리뷰 원문을 그대로 잘라 쓰므로 지어내지 않습니다. 진짜 앱은 같은 자리에서 AI(Claude)가 만듭니다.
import type { TrendPick } from "../ai/prompts/content";
import type { Carousel, ContentBundle, News, Reels, Review, StyleKey } from "../types";

/** 리뷰 문장 나누기 (원문 그대로, 너무 짧은 조각은 버림) */
export function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…~])\s+|\n+/)
    .map((s) => s.replace(/^["“”']|["“”']$/g, "").trim())
    .filter((s) => s.length >= 6);
}

/** 문장을 maxChars 안에서 단어 단위로 자르기 (원문 앞부분) */
export function clip(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  const cut = s.slice(0, maxChars);
  const sp = cut.lastIndexOf(" ");
  return (sp > maxChars * 0.5 ? cut.slice(0, sp) : cut).replace(/[,.\s]+$/, "");
}

/** 2~3줄로 나누기: 단어 단위로 줄당 약 maxLine 글자 */
export function breakLines(s: string, maxLine = 9): string {
  const words = s.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (cur && (cur + " " + w).length > maxLine) { lines.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3).join("\n");
}

/** 리뷰 분위기로 스타일 고르기 (진짜 앱에서는 AI가 고르는 부분을 규칙으로 흉내) */
export function pickStyle(texts: string[]): StyleKey {
  const t = texts.join(" ");
  if (/눈물|위로|힘든|엄마|따뜻|고단|야근|퇴근|감사|마음/.test(t)) return "emotional";
  if (/ㅋㅋ|ㅎㅎ|ㅠㅠ|이모지|웃|개이득|말해 뭐해/.test(t)) return "friendly";
  if (/!!|정착|최고|미쳤|존맛|대박|인생/.test(t)) return "impact";
  return "plain";
}

function pickHighlight(line: string): string {
  const words = line.replace(/\n/g, " ").split(/\s+/).filter((w) => w.length >= 2);
  const strong = words.find((w) => /진하|얼큰|푸짐|든든|정착|최고|대박|끝내|따뜻|눈물|단골|넉넉|칼칼|깊/.test(w));
  return (strong || words[words.length - 1] || "").replace(/[,.!?]+$/, "");
}

const ARCHETYPES = {
  single: "손님 말 그대로",
  list: "단계화/리스트",
  vs: "선택 유도/VS",
};

export function demoBundleFor(reviews: Review[], storeName: string, trend?: TrendPick | null): ContentBundle {
  const texts = reviews.map((r) => r.review_text).filter((t) => t.trim());
  const all = texts.flatMap((t) => sentences(t));
  const picks: string[] = [];
  // 서로 다른 리뷰에서 한 문장씩 (골고루 인용)
  for (let round = 0; round < 3 && picks.length < 3; round++) {
    for (const t of texts) {
      const s = sentences(t)[round];
      if (s && !picks.includes(s) && picks.length < 3) picks.push(s);
    }
  }
  while (picks.length < 2 && all[picks.length]) picks.push(all[picks.length]);
  const best = picks[0] || texts[0] || "";
  const style = pickStyle(texts);
  const multi = reviews.length > 1;
  const store = storeName || "우리 가게";

  const coverText = multi ? `손님들이 말하는\n우리 가게 ${Math.min(picks.length, 3)}가지` : breakLines(clip(`"${best}"`, 26), 10);
  const hook = multi ? ARCHETYPES.list : ARCHETYPES.single;
  const bodies = picks.slice(0, 3);

  const slides: Carousel["slides"] = [
    { index: 1, role: "cover", headline: coverText, highlight: multi ? `${Math.min(picks.length, 3)}가지` : pickHighlight(coverText), body: multi ? `${reviews.length}명의 리뷰를 그대로 옮겼어요` : "별점과 함께 남겨진 한 줄", image_prompt: "overhead photo of a steaming bowl of Korean gukbap on a wooden table, warm light, no text", design_note: "표지: 큰 글씨 3줄, 포인트 선, 로고 우측 상단" },
    { index: 2, role: "intro", headline: `${store}\n손님 이야기`, highlight: store.length <= 8 ? store : "", body: `${store}에 남겨진 후기를 그대로 옮겼습니다.`, image_prompt: "close-up of a spoon lifting soup, no text", design_note: "인트로: 가게 이름과 이 콘텐츠를 보는 이유" },
    ...bodies.map((q, i): Carousel["slides"][number] => ({
      index: 3 + i, role: "body", headline: breakLines(clip(q, 18), 9), highlight: pickHighlight(clip(q, 18)), body: `"${clip(q, 46)}"`,
      image_prompt: "side dish and bowl on wooden table, soft light, no text", design_note: "메인: 한 장에 손님 문장 하나",
    })),
    { index: 3 + bodies.length, role: "closing", headline: "저장해두고\n생각날 때 오세요", highlight: "저장해두고", body: `${store} · 방문·배달 모두 가능합니다.`, image_prompt: "storefront or logo area, no text", design_note: "엔드: 가게 이름·로고, 저장·공유 유도" },
  ];

  const carousel: Carousel = {
    concept: trend?.title ? `손님 리뷰를 그대로 옮긴 후기형 캐러셀 (활용한 소재: ${trend.title})` : multi ? `${reviews.length}명의 리뷰를 한 장씩 나눠 보여주는 모음형 캐러셀` : "리뷰 한 줄을 그대로 앞세운 후기형 캐러셀",
    style,
    hook_archetype: hook,
    slides,
    caption: `${clip(best, 40)}\n\n${store}에 남겨주신 리뷰를 그대로 옮겼습니다. 읽는 내내 힘이 났어요. 저장해두고 생각날 때 들러주세요.\n\n(데모: 진짜 앱에서는 AI가 리뷰마다 새로 씁니다)`,
    hashtags: ["#가상국밥집", "#국밥맛집", "#해장", "#동네맛집", "#리뷰감사", "#얼큰국밥", "#점심추천", "#배달맛집"],
  };

  const scenes: Reels["scenes"] = [
    { order: 1, phase: "opening", duration_sec: 4, script: "이런 리뷰가 올라왔습니다.", subtitle: clip(best, 22), visual: "뚝배기 뚜껑을 여는 순간 김이 올라오는 클로즈업" },
    ...bodies.slice(0, 3).map((q, i): Reels["scenes"][number] => ({ order: 2 + i, phase: "highlight", duration_sec: 7, script: clip(q, 40), subtitle: clip(q, 22), visual: i % 2 ? "국물을 뜨는 숟가락 클로즈업" : "주방에서 끓는 육수와 국자" })),
    { order: 2 + Math.min(bodies.length, 3), phase: "closing", duration_sec: 5, script: `${store}에서 기다리고 있겠습니다.`, subtitle: `${store} · 방문·배달 모두 가능`, visual: "완성된 국밥 정면 컷에서 매장으로 전환" },
  ];
  const reels: Reels = {
    title: multi ? "손님이 남긴 말 모음" : "손님 리뷰 한 줄",
    duration_sec: Math.max(15, Math.min(60, scenes.reduce((a, s) => a + s.duration_sec, 0))),
    hook: clip(best, 24),
    scenes,
    bgm_style: "잔잔한 어쿠스틱 기타",
    mood: "과장 없이 담백하게, 따뜻한 톤",
    cta: `${store}에서 한 그릇 드셔보세요.`,
  };

  const quoteLines = bodies.slice(0, 2).map((q) => `"${clip(q, 50)}"`).join(" ");
  const news: News = {
    naver: { title: "손님 리뷰 감사합니다", body: `안녕하세요, ${store}입니다.\n\n${quoteLines}\n\n남겨주신 말씀 덕분에 오늘도 힘을 얻습니다. 앞으로도 한결같은 맛으로 준비하겠습니다.` },
    daangn: { title: "이웃님들이 남겨주신 후기", body: `안녕하세요, ${store}입니다.\n\n${quoteLines}\n\n동네 이웃님들의 한마디가 큰 힘이 됩니다. 가까이 계시다면 편하게 들러주세요.` },
  };

  return { key_quote: best, carousel, reels, news };
}

/** 데모 화면에 보여줄 "요즘 뜨는 소재" 예시 5개 (진짜 앱은 AI 웹 검색 결과) */
export const DEMO_TRENDS = [
  { title: "손님 리뷰 읽어주기 릴스", why_hot: "식당 계정에서 손님 후기를 자막으로 읽어주는 형식이 저장·공유를 많이 받는다는 사례가 늘고 있어요.", how_to_use: "손님 문장을 자막으로 한 줄씩 보여주고, 마지막에 가게 한마디로 마무리해요.", example: "후기 한 줄 + 클로즈업 국물 샷", source_url: "", fit: 5 },
  { title: "3초 안에 장점 하나만", why_hot: "첫 3초에 가장 큰 장점을 보여주는 도입이 이탈을 줄인다고 자주 언급돼요.", how_to_use: "리뷰에서 가장 강한 문장을 표지 훅으로 쓰고 바로 음식 사진을 보여줘요.", example: "‘이 집 국물 진짜…’ 후 바로 뚝배기", source_url: "", fit: 4 },
  { title: "날씨·계절 해장 이슈", why_hot: "쌀쌀해지는 시기에 따뜻한 국물 음식 검색이 늘어요.", how_to_use: "‘오늘 같은 날’ 문장이 들어간 리뷰를 모아 모음형 캐러셀로 만들어요.", example: "비 오는 날 국밥 후기 모음", source_url: "", fit: 4 },
  { title: "공유 유도형 캐러셀", why_hot: "저장·공유 수가 노출에 중요하다는 이야기가 많아요.", how_to_use: "마지막 장에 ‘해장 필요한 친구에게 보내주세요’ 같은 한 줄을 넣어요.", example: "마지막 장 CTA 한 줄", source_url: "", fit: 3 },
  { title: "사장님이 답글 읽는 장면", why_hot: "사장님이 직접 등장하는 짧은 영상이 신뢰를 준다는 사례가 있어요.", how_to_use: "리뷰 인용 장면 뒤에 사장님 답글 한 줄을 자막으로 붙여요.", example: "리뷰 → 답글 자막", source_url: "", fit: 3 },
];
