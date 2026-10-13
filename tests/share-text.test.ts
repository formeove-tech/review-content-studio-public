import { describe, expect, it } from "vitest";
import { bundleFileName, bundleText, contentText } from "@/lib/share-text";
import type { ContentRow } from "@/lib/types";

const created_at = "2026-09-22T05:00:00.000Z";
const rows: ContentRow[] = [
  {
    id: 3, review_id: 1, bundle_id: null, kind: "news", key_quote: "국물이 진해요", model: "test", created_at,
    payload: { naver: { title: "네이버 제목", body: "네이버 본문" }, daangn: { title: "당근 제목", body: "당근 본문" } },
  },
  {
    id: 1, review_id: 1, bundle_id: null, kind: "carousel", key_quote: "국물이 진해요", model: "test", created_at,
    payload: {
      concept: "해장",
      style: "plain",
      hook_archetype: "",
      slides: [
        { index: 1, role: "cover", headline: "표지 문구", highlight: "", body: "", image_prompt: "p1", design_note: "d1" },
        { index: 2, role: "body", headline: "본문 문구", highlight: "", body: "보조", image_prompt: "p2", design_note: "d2" },
        { index: 3, role: "closing", headline: "마무리", highlight: "", body: "", image_prompt: "p3", design_note: "d3" },
      ],
      caption: "캡션입니다",
      hashtags: ["#국밥", "#해장"],
    },
  },
  {
    id: 2, review_id: 1, bundle_id: null, kind: "reels", key_quote: "국물이 진해요", model: "test", created_at,
    payload: {
      title: "릴스 제목", duration_sec: 30, hook: "훅 문구",
      scenes: [
        { order: 1, phase: "opening", duration_sec: 5, script: "대사1", subtitle: "자막1", visual: "장면1" },
        { order: 2, phase: "highlight", duration_sec: 20, script: "대사2", subtitle: "자막2", visual: "장면2" },
        { order: 3, phase: "closing", duration_sec: 5, script: "대사3", subtitle: "자막3", visual: "장면3" },
      ],
      bgm_style: "잔잔", mood: "따뜻", cta: "주문하세요",
    },
  },
];
const review = { review_text: "국물이 진해요", customer_name: "홍*동", review_date: "2026-09-20" };

describe("보내기 텍스트 묶음", () => {
  it("3종을 캐러셀 → 릴스 → 새소식 순서로 묶고 가게명·리뷰 인용을 앞에 둔다", () => {
    const t = bundleText({ storeName: "테스트 가게", reviews: [review], rows });
    expect(t.startsWith("테스트 가게 리뷰 콘텐츠 (2026-09-22)")).toBe(true);
    expect(t).toContain("손님 리뷰 (2026-09-20): “국물이 진해요”");
    expect(t.indexOf("【인스타 캐러셀")).toBeLessThan(t.indexOf("【릴스/쇼츠 대본】"));
    expect(t.indexOf("【릴스/쇼츠 대본】")).toBeLessThan(t.indexOf("【네이버·당근 새소식】"));
    expect(t).toContain("#국밥 #해장");
    expect(t).toContain("자막: 자막2");
    expect(t).toContain("당근 본문");
  });
  it("본문 없는 리뷰는 인용 줄을 뺀다", () => {
    const t = bundleText({ storeName: "", reviews: [{ ...review, review_text: "  " }], rows: rows.slice(0, 1) });
    expect(t).not.toContain("손님 리뷰");
    expect(t.startsWith("리뷰 콘텐츠 (2026-09-22)")).toBe(true);
  });
  it("종류별 텍스트와 파일 이름", () => {
    expect(contentText(rows[0])).toContain("■ 네이버 플레이스 새소식");
    expect(bundleFileName("가상/국밥:본점", created_at)).toBe("가상국밥본점_2026-09-22.txt");
    expect(bundleFileName("", undefined)).toMatch(/^리뷰콘텐츠_\d{4}-\d{2}-\d{2}\.txt$/);
  });
});
