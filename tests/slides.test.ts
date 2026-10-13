import { describe, expect, it } from "vitest";
import { assignPhotos, buildSlides, headlineFontSize, isAllowedPhotoUrl, parseSize } from "@/lib/slides";
import type { Carousel } from "@/lib/types";

const carousel: Carousel = {
  concept: "c",
  style: "plain",
  hook_archetype: "",
  slides: [
    { index: 3, role: "closing", headline: "마무리", highlight: "", body: "", image_prompt: "", design_note: "" },
    { index: 1, role: "cover", headline: "표지", highlight: "", body: "부제", image_prompt: "", design_note: "" },
    { index: 2, role: "body", headline: "본문", highlight: "", body: "", image_prompt: "", design_note: "" },
  ],
  caption: "",
  hashtags: [],
};

describe("슬라이드 사진 배정", () => {
  it("사진이 없으면 전부 -1, 있으면 순서대로 돌려 쓴다", () => {
    expect(assignPhotos(5, 0)).toEqual([-1, -1, -1, -1, -1]);
    expect(assignPhotos(5, 2)).toEqual([0, 1, 0, 1, 0]);
    expect(assignPhotos(3, 4)).toEqual([0, 1, 2]);
  });
  it("index 순서로 정렬하고 사진 주소를 붙인다", () => {
    const s = buildSlides({ carousel, review: { photo_urls: ["https://a/1.jpg", "https://a/2.jpg"] }, storeName: " 가게 ", platformLabel: "배민" });
    expect(s.map((x) => x.headline)).toEqual(["표지", "본문", "마무리"]);
    expect(s.map((x) => x.photoIndex)).toEqual([0, 1, 0]);
    expect(s[0].photo).toBe("https://a/1.jpg");
    expect(s[0].storeName).toBe("가게");
    expect(s[0].total).toBe(3);
  });
  it("슬라이드별로 사진을 바꾸거나 뺄 수 있다", () => {
    const s = buildSlides({ carousel, review: { photo_urls: ["https://a/1.jpg", "https://a/2.jpg"] }, storeName: "", platformLabel: "", overrides: { 1: 1, 2: -1, 3: 9 } });
    expect(s[0].photo).toBe("https://a/2.jpg");
    expect(s[1].photo).toBeNull();
    expect(s[2].photo).toBeNull(); // 범위 밖이면 사진 없음
  });
  it("크기·글자 크기·허용 주소", () => {
    expect(parseSize("threads")).toBe("threads");
    expect(parseSize("x")).toBe("insta");
    expect(headlineFontSize("짧게", "insta")).toBeGreaterThan(headlineFontSize("이건 스물두 글자를 넘기는 아주 긴 제목입니다 정말로", "insta"));
    expect(isAllowedPhotoUrl("https://bmreview.cdn.baemin.com/x.jpg")).toBe(true);
    expect(isAllowedPhotoUrl("https://t4c.coupangcdn.com/image/x.jpg")).toBe(true);
    expect(isAllowedPhotoUrl("https://ldb-phinf.pstatic.net/x.jpg")).toBe(true);
    expect(isAllowedPhotoUrl("https://evil.example.com/x.jpg")).toBe(false);
    expect(isAllowedPhotoUrl("not a url")).toBe(false);
  });
});
