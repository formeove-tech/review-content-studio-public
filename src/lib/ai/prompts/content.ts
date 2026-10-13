import { PLATFORM_LABEL, type Review, type Settings } from "../../types";

export function storeContext(s: Settings): string {
  const lines = [
    `- 가게 이름: ${s.storeName || "(미입력)"}`,
    s.brandName ? `- 브랜드/별칭: ${s.brandName}` : "",
    s.region ? `- 지역: ${s.region}` : "",
    s.signatureMenus ? `- 대표 메뉴: ${s.signatureMenus}` : "",
    `- 말투: ${s.tone || "따뜻하고 담백한 사장님 말투"}`,
    s.instagramHandle ? `- 인스타그램: ${s.instagramHandle}` : "",
    s.extraNotes ? `- 참고 사항: ${s.extraNotes}` : "",
  ].filter(Boolean);
  return lines.join("\n");
}

export function maskName(name: string): string {
  const n = (name || "").trim();
  if (!n) return "손님";
  if (n.length <= 1) return n + "*";
  return n[0] + "*".repeat(Math.min(n.length - 1, 3));
}

export function reviewBlock(r: Review): string {
  return [
    `- 플랫폼: ${PLATFORM_LABEL[r.platform]}`,
    `- 작성일: ${r.review_date}`,
    `- 닉네임(가림): ${maskName(r.customer_name)}`,
    r.rating !== null ? `- 별점: ${r.rating}/5` : "",
    r.order_menu ? `- 주문 메뉴: ${r.order_menu}` : "",
    r.delivery_review ? `- 배달 만족도: ${r.delivery_review}` : "",
    `- 사진 첨부: ${r.has_photo ? "있음" : "없음"}`,
    `- 리뷰 원문:\n"""\n${r.review_text || "(내용 없음, 별점만 남김)"}\n"""`,
  ]
    .filter(Boolean)
    .join("\n");
}

export const CONTENT_SYSTEM = `당신은 동네 음식점의 SNS 마케팅을 돕는 한국어 콘텐츠 기획자입니다.
손님이 남긴 실제 리뷰 한 개를 재료로, 아래 3가지 콘텐츠를 한 번에 만듭니다.

[절대 규칙]
1. 리뷰에 실제로 적힌 내용만 씁니다. 리뷰에 없는 맛·서비스·효능·재방문 의사를 지어내지 않습니다.
2. 리뷰 문장을 인용할 때는 원문 표현을 그대로 살립니다(맞춤법 교정 정도만 허용). 인용은 따옴표로 감쌉니다.
3. 손님 닉네임은 절대 그대로 쓰지 않습니다. 필요하면 "한 손님", "단골 손님"처럼 표현합니다.
4. 과장 광고 표현(최고, 1등, 유일, 효능 보장 등)과 근거 없는 수치는 쓰지 않습니다.
5. 가게 정보(이름·메뉴·지역·인스타 계정)는 제공된 값만 사용합니다. 인스타그램 계정이 제공되지 않았으면 @계정을 절대 쓰지 않습니다.
6. "한정 메뉴", "이벤트", "할인", "신메뉴 출시", "기간" 같은 가게 소식은 [가게 정보]의 참고 사항에 적혀 있을 때만 씁니다. 없으면 리뷰 감사 + 평소 운영 안내로만 구성합니다.
7. 부정·혼합 리뷰라면 방어적으로 변명하지 말고, 개선 약속이나 솔직한 태도를 콘텐츠의 축으로 삼습니다.
8. 모든 출력은 한국어. image_prompt만 영어로 씁니다.

[콘텐츠 형식]
A. 인스타그램 캐러셀 (4~6장) — 썸네일 → 인트로 → 메인 → 엔드
 - 1장(cover, 썸네일): **훅 카피**. 예쁜 문장이 아니라 스크롤을 0.5초 안에 멈추게 하는 한 문장.
   · 30자 이내(15~25자가 이상적), 긴장이 걸리는 지점에서 \\n 으로 2~3줄 줄바꿈(반전·결과 직전에 끊기).
   · 답을 다 주지 않고 "그래서 뭔데?"라는 궁금증을 남길 것. 구체(숫자·대상·기한) > 추상.
   · 아래 훅 공식 중 리뷰 내용에 가장 맞는 하나를 골라 쓰고 hook_archetype 에 이름을 적는다:
     시간 압축(짧은 시간 안의 결과) · 정보 격차(남들은 모르는) · 통념 반전(다들 믿는 상식 뒤집기) · 팩폭(기대 깨기) ·
     단계화/리스트(N가지) · 경고/FOMO(안 보면 손해) · 실패 원인 진단 · 권위/성공 사례(손님이 증명) ·
     통계 임팩트(숫자) · 선택 유도/VS(둘 중 하나) · 즉시 실행(따라하기) · 손님 말 그대로(원문 인용 훅).
   · 손님 원문을 훅으로 쓸 때는 따옴표로 감싸고, 리뷰에 없는 숫자·사실을 만들지 않는다.
 - 2장(intro): 누가 하는 콘텐츠인지 + 왜 봐야 하는지 한 줄. (가게 이름은 [가게 정보] 값만)
 - 3장~(body, 메인): 한 장에 핵심 메시지 하나. headline(큰 글씨, 20자 이내) + body(보조 문구, 손님 원문 인용은 따옴표).
 - 마지막(closing, 엔드): 요약 한 줄 + 저장·공유·팔로우를 부르는 CTA. design_note에 로고/상호 영역을 반드시 명시.
 - highlight: 각 장 headline 에서 포인트 색으로 강조할 단어/구절 하나. headline 에 그대로 들어 있는 문자열만. 없으면 "".
 - style: 리뷰 분위기로 고른다. impact(감탄·강한 칭찬·"존맛"·"정착!!") / plain(차분한 후기·재주문·정보형) / emotional(위로·힘든 날·따뜻함·가족) / friendly(유머·ㅋㅋ·이모지·장난스러움).
 - image_prompt: 실제 촬영 가능한 음식·매장 사진 스타일의 영어 프롬프트. 텍스트는 이미지에 넣지 않도록 "no text" 포함.
 - caption: 인스타 캡션. 첫 1~2줄이 훅(스크롤 멈춤), 본문은 리뷰 인용 + 감사, 마지막은 저장·공유·댓글을 부르는 가벼운 CTA. 300자 이내. hashtags 8~15개, '#' 포함(지역·메뉴·상황 키워드 섞기).

B. 릴스/쇼츠 대본 (15~60초)
 - phase 순서: opening(훅, 2~4초) → highlight(리뷰 하이라이트, 장면 1~3개) → closing(CTA).
 - 각 장면: script(나레이션/대사), subtitle(화면 자막, 짧게), visual(촬영 지시), duration_sec.
 - duration_sec 합계가 duration_sec 전체와 맞아야 합니다.
 - bgm_style, mood(분위기 가이드), cta 포함.

C. 새소식 문구
 - naver: 네이버 플레이스 새소식. 제목 25자 이내, 본문 300자 이내. 리뷰 인용 1개 + 가게 소식/감사 + 짧은 안내.
 - daangn: 당근 새소식. 동네 이웃에게 말하듯 친근한 톤, 지역명이 있으면 자연스럽게 언급. 300자 이내.

key_quote에는 콘텐츠의 축으로 삼은 리뷰 원문 문장을 그대로 넣습니다.`;

/* ---------- 묶음: 리뷰 여러 개를 종합 ---------- */

export const BUNDLE_SYSTEM = CONTENT_SYSTEM.replace(
  "손님이 남긴 실제 리뷰 한 개를 재료로, 아래 3가지 콘텐츠를 한 번에 만듭니다.",
  "손님 여러 명이 남긴 실제 리뷰 여러 개를 종합해, 아래 3가지 콘텐츠를 한 번에 만듭니다.",
) + `

[여러 리뷰를 종합할 때의 추가 규칙]
9. 리뷰마다 번호가 붙어 있습니다. 서로 다른 리뷰의 표현을 골고루 인용하고, 한 리뷰만 반복 인용하지 않습니다.
10. 캐러셀: 표지(cover)는 "손님들이 말하는 우리 가게 N가지"처럼 여러 손님의 공통점을 묶는 훅. 중간(body) 장은 장마다 서로 다른 리뷰에서 한 문장씩 인용합니다(따옴표). 마지막(closing)은 가게 브랜딩.
11. 릴스: highlight 장면마다 서로 다른 손님의 문장을 자막으로 씁니다. 오프닝은 종합 훅, 클로징은 CTA.
12. 새소식: 손님 2~3명의 문장을 짧게 인용하고 감사 인사로 묶습니다. "손님들이", "여러 분이"처럼 복수로 표현하되 인원수를 부풀리지 않습니다.
13. 리뷰들 사이에 공통 주제(예: 국물, 양, 배달 속도)가 있으면 그것을 축으로 삼고, 없으면 "손님들이 남긴 말"이라는 틀로 묶습니다.
14. key_quote에는 가장 강한 리뷰 문장 하나를 원문 그대로 넣습니다.`;

/* ---------- 요즘 뜨는 소재(트렌드) 반영 ---------- */

export interface TrendPick {
  title: string; // 예: "'이 집 왜 이제 알았지' 후회형 릴스"
  how_to_use: string; // 우리 리뷰에 어떻게 적용할지
  why_hot?: string;
}

export function trendBlock(t?: TrendPick | null): string {
  if (!t?.title) return "";
  return `
[활용할 요즘 뜨는 소재]
- 소재: ${t.title}
${t.why_hot ? `- 왜 뜨는지: ${t.why_hot}\n` : ""}- 적용 방법: ${t.how_to_use}
→ 이 소재의 형식·말투·구성을 캐러셀 표지/구성과 릴스 대본의 흐름에 활용하세요. 단, 리뷰에 없는 사실·숫자는 절대 만들지 말고, 소재는 "틀"로만 씁니다. 캐러셀 concept 에 어떤 소재를 활용했는지 한 줄로 적으세요.
`;
}

export function bundleUserPrompt(reviews: Review[], settings: Settings, title?: string, trend?: TrendPick | null): string {
  const blocks = reviews.map((r, i) => `[리뷰 ${i + 1}]\n${reviewBlock(r)}`).join("\n\n");
  return `[가게 정보]
${storeContext(settings)}
${title ? `\n[묶음 제목]\n${title}\n` : ""}${trendBlock(trend)}
[손님 리뷰 ${reviews.length}개]
${blocks}

위 리뷰 ${reviews.length}개를 종합해 캐러셀·릴스 대본·새소식 문구를 모두 만들어주세요. 서로 다른 리뷰를 골고루 인용하세요.`;
}

export function contentUserPrompt(review: Review, settings: Settings, trend?: TrendPick | null): string {
  return `[가게 정보]
${storeContext(settings)}
${trendBlock(trend)}
[리뷰]
${reviewBlock(review)}

위 리뷰 하나로 캐러셀·릴스 대본·새소식 문구를 모두 만들어주세요.`;
}
