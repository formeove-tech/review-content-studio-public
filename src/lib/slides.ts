// 리뷰 사진 + 캐러셀 문구 → 슬라이드 설계 (그리는 건 /api/reviews/[id]/slides/[n] 라우트)
import { resolveStyle } from "./styles";
import { STYLE_KEYS, type Carousel, type Review, type StyleKey } from "./types";

export const SLIDE_SIZES = {
  insta: { width: 1080, height: 1350, label: "인스타 4:5" },
  threads: { width: 1080, height: 1080, label: "스레드 1:1" },
} as const;
export type SlideSize = keyof typeof SLIDE_SIZES;

export function parseSize(v: string | null | undefined): SlideSize {
  return v === "threads" ? "threads" : "insta";
}

export interface SlideSpec {
  index: number; // 1부터
  total: number;
  role: "cover" | "intro" | "body" | "closing";
  headline: string; // \n 줄바꿈 허용
  highlight: string; // headline 안에서 포인트 색으로 칠할 구절
  body: string;
  photo: string | null; // 배경 사진 주소 (없으면 단색 배경)
  photoIndex: number; // -1 = 사진 없음
  storeName: string;
  platformLabel: string;
  style: StyleKey; // 디자인 스타일 (AI 추천 또는 화면에서 바꾼 값)
}

/** 사진을 슬라이드에 나눠 배정: 표지는 첫 사진, 나머지는 순서대로 돌려 씀. 사진이 없으면 전부 -1 */
export function assignPhotos(slideCount: number, photoCount: number): number[] {
  if (photoCount <= 0) return Array.from({ length: slideCount }, () => -1);
  return Array.from({ length: slideCount }, (_, i) => i % photoCount);
}

export function buildSlides({
  carousel,
  review,
  storeName,
  platformLabel,
  overrides = {},
  style,
}: {
  carousel: Carousel;
  review: Pick<Review, "photo_urls">;
  storeName: string;
  platformLabel: string;
  overrides?: Record<number, number>; // 슬라이드 번호(1부터) → 사진 인덱스(-1 = 없음)
  style?: StyleKey | string | null; // 화면에서 바꾼 스타일 (없으면 AI가 고른 값)
}): SlideSpec[] {
  const photos = review.photo_urls || [];
  const slides = [...carousel.slides].sort((a, b) => a.index - b.index);
  const auto = assignPhotos(slides.length, photos.length);
  // 화면에서 고른 값이 올바른 스타일이면 그것, 아니면 AI가 고른 값(없으면 담백)
  const styleKey = style && (STYLE_KEYS as readonly string[]).includes(style) ? (style as StyleKey) : resolveStyle(carousel.style).key;
  return slides.map((s, i) => {
    const want = overrides[s.index] !== undefined ? overrides[s.index] : auto[i];
    const photoIndex = want >= 0 && want < photos.length ? want : -1;
    return {
      index: i + 1,
      total: slides.length,
      role: s.role || "body",
      headline: (s.headline || "").trim(),
      highlight: (s.highlight || "").trim(),
      body: (s.body || "").trim(),
      photo: photoIndex >= 0 ? photos[photoIndex] : null,
      photoIndex,
      storeName: storeName.trim(),
      platformLabel,
      style: styleKey,
    };
  });
}

/** 글자 수(줄바꿈 제외, 가장 긴 줄 기준)에 따라 큰 글씨 크기 (px, 1080 기준). 짧으면 크게, 길면 작게 */
export function headlineFontSize(text: string, size: SlideSize, scale = 1): number {
  const longest = Math.max(...text.split("\n").map((l) => l.length), 0);
  const lines = text.split("\n").length;
  const base = (size === "threads" ? 0.9 : 1) * scale;
  let px: number;
  if (longest <= 8) px = 112;
  else if (longest <= 12) px = 96;
  else if (longest <= 16) px = 82;
  else if (longest <= 22) px = 70;
  else px = 58;
  if (lines >= 3) px = Math.min(px, 84);
  return Math.round(px * base);
}

/** 사진 주소가 우리가 아는 공개 CDN 인지 (서버가 아무 주소나 가져오지 않게) */
export function isAllowedPhotoUrl(url: string): boolean {
  if (/^\/demo\/photo-\d{1,2}\.jpg$/.test(url)) return true; // 공개 데모의 가상 그림 (같은 사이트 안)
  try {
    const h = new URL(url).hostname;
    return /(^|\.)baemin\.com$|(^|\.)coupangcdn\.com$|(^|\.)pstatic\.net$|(^|\.)naver\.net$|(^|\.)naver\.com$/.test(h);
  } catch {
    return false;
  }
}
