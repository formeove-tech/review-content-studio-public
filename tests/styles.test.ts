import { describe, expect, it } from "vitest";
import { extractJson } from "@/lib/ai/trends";
import { trendBlock } from "@/lib/ai/prompts/content";
import { parseTrendPick } from "@/lib/ai/trend-pick";
import { buildSlides, headlineFontSize } from "@/lib/slides";
import { carouselStyleKey, hookIssues, resolveStyle, splitHighlight, STYLE_PRESETS } from "@/lib/styles";
import type { Carousel } from "@/lib/types";

describe("디자인 스타일", () => {
  it("스타일 키 해석: 모르는 값·예전 데이터는 담백(plain)", () => {
    expect(resolveStyle("impact").key).toBe("impact");
    expect(resolveStyle("weird").key).toBe("plain");
    expect(resolveStyle(undefined).key).toBe("plain");
    expect(carouselStyleKey({ style: "emotional" } as Partial<Carousel>)).toBe("emotional");
    expect(carouselStyleKey(undefined)).toBe("plain");
  });
  it("스타일마다 글꼴 파일·3색 이하 색 구성이 있다", () => {
    for (const p of Object.values(STYLE_PRESETS)) {
      expect(p.fonts.length).toBeGreaterThan(0);
      for (const f of p.fonts) expect(f.url).toMatch(/^https:\/\/cdn\.jsdelivr\.net\//);
      expect(p.colors.accent).toMatch(/^#/);
    }
  });
  it("강조 구절 자르기", () => {
    expect(splitHighlight("국밥집은 이제 여기로 정착", "정착")).toEqual({ before: "국밥집은 이제 여기로 ", hit: "정착", after: "" });
    expect(splitHighlight("국밥집은 이제", "없는말")).toEqual({ before: "국밥집은 이제", hit: "", after: "" });
    expect(splitHighlight("국밥집은 이제", "")).toEqual({ before: "국밥집은 이제", hit: "", after: "" });
  });
  it("훅 규칙 점검: 30자·3줄", () => {
    expect(hookIssues("국밥집은\n이제 여기로 정착")).toEqual([]);
    expect(hookIssues("가".repeat(31))).toEqual(["30자 초과 (31자)"]);
    expect(hookIssues("a\nb\nc\nd")).toEqual(["3줄 초과"]);
  });
  it("줄바꿈 있는 큰 글씨는 가장 긴 줄 기준으로 크기를 정하고 3줄이면 줄인다", () => {
    expect(headlineFontSize("짧게", "insta")).toBe(112);
    expect(headlineFontSize("국밥집은 이제\n여기로 정착!!", "insta")).toBe(112); // 가장 긴 줄 8자
    expect(headlineFontSize("가\n나\n다", "insta")).toBe(84);
    expect(headlineFontSize("짧게", "insta", 1.12)).toBe(Math.round(112 * 1.12));
  });
  it("buildSlides 는 스타일·강조·인트로 역할을 넘기고 화면 스타일이 AI 값을 덮는다", () => {
    const carousel = {
      concept: "c", style: "impact", hook_archetype: "통념 반전", caption: "", hashtags: [],
      slides: [
        { index: 1, role: "cover", headline: "국밥집은\n이제 여기로", highlight: "여기로", body: "", image_prompt: "", design_note: "" },
        { index: 2, role: "intro", headline: "누가", highlight: "", body: "", image_prompt: "", design_note: "" },
        { index: 3, role: "body", headline: "본문", highlight: "", body: "", image_prompt: "", design_note: "" },
        { index: 4, role: "closing", headline: "끝", highlight: "", body: "", image_prompt: "", design_note: "" },
      ],
    } as Carousel;
    const s = buildSlides({ carousel, review: { photo_urls: [] }, storeName: "가게", platformLabel: "배민" });
    expect(s.map((x) => x.style)).toEqual(["impact", "impact", "impact", "impact"]);
    expect(s[0].highlight).toBe("여기로");
    expect(s[1].role).toBe("intro");
    expect(buildSlides({ carousel, review: { photo_urls: [] }, storeName: "", platformLabel: "", style: "friendly" })[0].style).toBe("friendly");
    expect(buildSlides({ carousel, review: { photo_urls: [] }, storeName: "", platformLabel: "", style: "bogus" })[0].style).toBe("impact"); // 이상한 값이면 AI 값 유지
  });
});

describe("요즘 뜨는 소재", () => {
  it("응답 본문에서 JSON 블록을 뽑는다", () => {
    expect(extractJson('설명…\n```json\n{"items":[{"title":"후회형 훅"}]}\n```\n끝')).toEqual({ items: [{ title: "후회형 훅" }] });
    expect(extractJson('앞 글 {"items":[{"title":"a"}]} 뒤 글')).toEqual({ items: [{ title: "a" }] });
    expect(() => extractJson("JSON 없음")).toThrow();
  });
  it("고른 소재를 안전하게 읽고 프롬프트 블록을 만든다", () => {
    expect(parseTrendPick(null)).toBeNull();
    expect(parseTrendPick({ title: "  " })).toBeNull();
    const t = parseTrendPick({ title: "후회형 훅", how_to_use: "리뷰 인용", why_hot: "요즘 유행", junk: 1 })!;
    expect(t).toEqual({ title: "후회형 훅", how_to_use: "리뷰 인용", why_hot: "요즘 유행" });
    expect(trendBlock(t)).toContain("후회형 훅");
    expect(trendBlock(t)).toContain("리뷰에 없는 사실·숫자는 절대 만들지");
    expect(trendBlock(null)).toBe("");
  });
});
