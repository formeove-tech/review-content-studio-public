// 슬라이드·영상 디자인 스타일 4종 (AI가 리뷰 분위기로 고르고, 화면에서 바꿀 수 있음)
import { STYLE_KEYS, type Carousel, type StyleKey } from "./types";

export interface FontFile { name: string; url: string; weight: 400 | 500 | 700 | 800 }

export interface StylePreset {
  key: StyleKey;
  label: string;
  when: string; // 화면 설명
  headlineFont: string; // CSS font-family 이름
  bodyFont: string;
  fonts: FontFile[]; // 서버(satori)·브라우저(FontFace) 공용
  headlineScale: number; // 기본 글자 크기 배율
  headlineWeight: 400 | 700 | 800;
  letterSpacing: number;
  colors: { bg: string; bg2: string; ink: string; accent: string; muted: string; pill: string };
  photoOverlay: [string, string, string, string]; // 사진 위 그라데이션 4단계
}

const PRETENDARD = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/";
const GF = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/";

export const STYLE_PRESETS: Record<StyleKey, StylePreset> = {
  impact: {
    key: "impact", label: "임팩트", when: "감탄·강한 칭찬",
    headlineFont: "Black Han Sans", bodyFont: "Pretendard",
    fonts: [
      { name: "Black Han Sans", url: GF + "blackhansans/BlackHanSans-Regular.ttf", weight: 400 },
      { name: "Pretendard", url: PRETENDARD + "Pretendard-Medium.otf", weight: 500 },
    ],
    headlineScale: 1.12, headlineWeight: 400, letterSpacing: 0,
    colors: { bg: "#1a1614", bg2: "#2a2320", ink: "#ffffff", accent: "#ffe600", muted: "rgba(255,255,255,0.85)", pill: "rgba(0,0,0,0.5)" },
    photoOverlay: ["rgba(0,0,0,0.35)", "rgba(0,0,0,0.12)", "rgba(0,0,0,0.75)", "rgba(0,0,0,0.9)"],
  },
  plain: {
    key: "plain", label: "담백", when: "차분한 후기·재주문",
    headlineFont: "Pretendard", bodyFont: "Pretendard",
    fonts: [
      { name: "Pretendard", url: PRETENDARD + "Pretendard-ExtraBold.otf", weight: 800 },
      { name: "Pretendard", url: PRETENDARD + "Pretendard-Medium.otf", weight: 500 },
    ],
    headlineScale: 1, headlineWeight: 800, letterSpacing: -1,
    colors: { bg: "#2b211b", bg2: "#1a1614", ink: "#ffffff", accent: "#ff6b35", muted: "rgba(255,255,255,0.88)", pill: "rgba(0,0,0,0.45)" },
    photoOverlay: ["rgba(0,0,0,0.30)", "rgba(0,0,0,0.10)", "rgba(0,0,0,0.72)", "rgba(0,0,0,0.88)"],
  },
  emotional: {
    key: "emotional", label: "감성", when: "위로·따뜻함·힘든 날",
    headlineFont: "Gowun Batang", bodyFont: "Gowun Batang",
    fonts: [
      { name: "Gowun Batang", url: GF + "gowunbatang/GowunBatang-Bold.ttf", weight: 700 },
      { name: "Gowun Batang", url: GF + "gowunbatang/GowunBatang-Regular.ttf", weight: 400 },
    ],
    headlineScale: 0.92, headlineWeight: 700, letterSpacing: 0,
    colors: { bg: "#3b2a1f", bg2: "#5a4030", ink: "#fff7ea", accent: "#f2c18d", muted: "rgba(255,247,234,0.88)", pill: "rgba(40,25,15,0.55)" },
    photoOverlay: ["rgba(30,18,10,0.35)", "rgba(30,18,10,0.15)", "rgba(30,18,10,0.72)", "rgba(30,18,10,0.9)"],
  },
  friendly: {
    key: "friendly", label: "친근", when: "유머·ㅋㅋ·이모지",
    headlineFont: "Gaegu", bodyFont: "Gaegu",
    fonts: [
      { name: "Gaegu", url: GF + "gaegu/Gaegu-Bold.ttf", weight: 700 },
      { name: "Gaegu", url: GF + "gaegu/Gaegu-Regular.ttf", weight: 400 },
    ],
    headlineScale: 1.15, headlineWeight: 700, letterSpacing: 0,
    colors: { bg: "#fff3c4", bg2: "#ffe08a", ink: "#1f1d1a", accent: "#e8552c", muted: "rgba(31,29,26,0.8)", pill: "rgba(31,29,26,0.12)" },
    photoOverlay: ["rgba(0,0,0,0.25)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.68)", "rgba(0,0,0,0.86)"],
  },
};

export function resolveStyle(v: unknown): StylePreset {
  return STYLE_PRESETS[(STYLE_KEYS as readonly string[]).includes(String(v)) ? (v as StyleKey) : "plain"];
}

/** 저장된 캐러셀(예전 것은 style 이 없음)에서 스타일 키 */
export function carouselStyleKey(c: Partial<Carousel> | null | undefined): StyleKey {
  return resolveStyle(c?.style).key;
}

/** 큰 글씨에서 강조 구절을 잘라 [앞, 강조, 뒤] 로. 없거나 안 맞으면 강조 없음 */
export function splitHighlight(text: string, highlight: string): { before: string; hit: string; after: string } {
  const h = (highlight || "").trim();
  const i = h ? text.indexOf(h) : -1;
  if (i < 0) return { before: text, hit: "", after: "" };
  return { before: text.slice(0, i), hit: h, after: text.slice(i + h.length) };
}

/** 표지 훅 규칙 점검 (테스트·품질 확인용): 30자 이내, 3줄 이내 */
export function hookIssues(headline: string): string[] {
  const issues: string[] = [];
  const flat = headline.replace(/\n/g, "");
  if (flat.length > 30) issues.push(`30자 초과 (${flat.length}자)`);
  if (headline.split("\n").length > 3) issues.push("3줄 초과");
  return issues;
}
