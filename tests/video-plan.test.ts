import { describe, expect, it } from "vitest";
import type { Reels } from "@/lib/types";
import { buildVideoPlan, normalizeDurations, subtitleFontSize, VIDEO, wrapText } from "@/lib/video/plan";

const reels: Reels = {
  title: "t", duration_sec: 30, hook: "훅",
  scenes: [
    { order: 3, phase: "closing", duration_sec: 5, script: "s3", subtitle: "가게 이름 | 동네", visual: "" },
    { order: 1, phase: "opening", duration_sec: 4, script: "s1", subtitle: "국밥집은 이제 여기로", visual: "" },
    { order: 2, phase: "highlight", duration_sec: 7, script: "s2", subtitle: "", visual: "" },
  ],
  bgm_style: "잔잔한 기타", mood: "따뜻", cta: "드시러 오세요",
};

describe("영상 장면 설계", () => {
  it("길이 정리: 2~12초로 자르고 전체 15~60초 유지", () => {
    expect(normalizeDurations([4, 7, 5])).toEqual([4, 7, 5]);
    expect(normalizeDurations([1, 1, 1])).toEqual([5, 5, 5]); // 15초로 늘림
    expect(normalizeDurations([30, 30, 30]).reduce((a, b) => a + b, 0)).toBeCloseTo(36, 0); // 12초씩으로 자름
    expect(normalizeDurations([0, NaN])).toEqual([7.5, 7.5]);
  });
  it("장면을 순서대로 정렬하고 시작 시각·프레임·사진을 배정한다", () => {
    const p = buildVideoPlan({ reels, photos: ["https://a/1.jpg", "https://a/2.jpg"], storeName: " 가게 " });
    expect(p.scenes.map((s) => s.phase)).toEqual(["opening", "highlight", "closing"]);
    expect(p.scenes.map((s) => s.startSec)).toEqual([0, 4, 11]);
    expect(p.totalSec).toBe(16);
    expect(p.totalFrames).toBe(16 * VIDEO.fps);
    expect(p.scenes[1].subtitle).toBe("s2"); // 자막이 비면 대사 사용
    expect(p.scenes.map((s) => s.photoIndex)).toEqual([0, 1, 0]);
    expect(p.storeName).toBe("가게");
    expect(p.cta).toBe("드시러 오세요");
  });
  it("장면별 사진 바꾸기·빼기", () => {
    const p = buildVideoPlan({ reels, photos: ["https://a/1.jpg"], storeName: "", overrides: { 1: -1, 2: 0, 3: 5 } });
    expect(p.scenes.map((s) => s.photo)).toEqual([null, "https://a/1.jpg", null]);
  });
  it("자막 줄바꿈·글자 크기", () => {
    expect(wrapText("국밥집은 이제 여기로 정착", 10)).toEqual(["국밥집은 이제", "여기로 정착"]);
    expect(wrapText("가나다라마바사아자차카타파하", 5)).toEqual(["가나다라마", "바사아자차", "카타파하"]);
    expect(wrapText("", 10)).toEqual([""]);
    expect(subtitleFontSize("짧게")).toBeGreaterThan(subtitleFontSize("이건 서른 글자를 넘기는 아주아주 긴 자막 문장입니다 정말로요"));
  });
});
