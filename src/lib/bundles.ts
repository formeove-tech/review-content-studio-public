// 묶음(리뷰 여러 개) 공용 도우미 — 사진 모으기, 플랫폼 라벨
import { PLATFORM_LABEL, PLATFORMS, type Review } from "./types";

/** 묶인 리뷰들의 사진을 순서대로 모읍니다 (중복 제거, 최대 12장) */
export function bundlePhotos(reviews: Pick<Review, "photo_urls">[]): string[] {
  const out: string[] = [];
  for (const r of reviews) for (const u of r.photo_urls || []) if (!out.includes(u)) out.push(u);
  return out.slice(0, 12);
}

/** 플랫폼이 하나면 그 이름, 여럿이면 "배민·네이버" 식으로 (항상 배민→쿠팡→요기요→네이버 순) */
export function bundlePlatformLabel(reviews: Pick<Review, "platform">[]): string {
  const present = new Set(reviews.map((r) => r.platform));
  return PLATFORMS.filter((p) => present.has(p)).map((p) => PLATFORM_LABEL[p]).join("·");
}
