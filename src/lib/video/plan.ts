// 릴스 대본 + 리뷰 사진 → 영상 장면 설계 (순수 로직, 테스트 가능). 실제로 그리는 건 render.ts
import { assignPhotos } from "../slides";
import type { Reels } from "../types";

export const VIDEO = { width: 1080, height: 1920, fps: 30 } as const;

export interface ScenePlan {
  order: number; // 1부터
  phase: "opening" | "highlight" | "closing";
  durationSec: number;
  startSec: number;
  frames: number; // 이 장면의 프레임 수
  subtitle: string; // 화면 자막
  photo: string | null; // 배경 사진 주소 (없으면 단색)
  photoIndex: number;
  kenBurns: { from: number; to: number; dx: number; dy: number }; // 확대 배율·이동 방향
}

export interface VideoPlan {
  scenes: ScenePlan[];
  totalSec: number;
  totalFrames: number;
  hook: string;
  cta: string;
  bgmStyle: string;
  storeName: string;
}

/** 장면 길이 정리: 2~12초로 자르고, 전체가 15~60초를 벗어나면 비율로 맞춤 */
export function normalizeDurations(raw: number[]): number[] {
  const clipped = raw.map((d) => Math.min(12, Math.max(2, Number.isFinite(d) && d > 0 ? d : 4)));
  const total = clipped.reduce((a, b) => a + b, 0);
  const target = total < 15 ? 15 : total > 60 ? 60 : total;
  const k = target / total;
  return clipped.map((d) => Math.round(d * k * 10) / 10);
}

export function buildVideoPlan({
  reels,
  photos,
  storeName,
  overrides = {},
}: {
  reels: Reels;
  photos: string[];
  storeName: string;
  overrides?: Record<number, number>; // 장면 번호 → 사진 인덱스(-1 없음)
}): VideoPlan {
  const scenes = [...reels.scenes].sort((a, b) => a.order - b.order);
  const durations = normalizeDurations(scenes.map((s) => s.duration_sec));
  const auto = assignPhotos(scenes.length, photos.length);
  let start = 0;
  const out: ScenePlan[] = scenes.map((s, i) => {
    const want = overrides[s.order] !== undefined ? overrides[s.order] : auto[i];
    const photoIndex = want >= 0 && want < photos.length ? want : -1;
    const durationSec = durations[i];
    const frames = Math.round(durationSec * VIDEO.fps);
    // 장면마다 확대 방향을 바꿔 지루하지 않게 (짝수: 확대, 홀수: 축소)
    const zoomIn = i % 2 === 0;
    const plan: ScenePlan = {
      order: i + 1,
      phase: s.phase,
      durationSec,
      startSec: start,
      frames,
      subtitle: (s.subtitle || s.script || "").trim(),
      photo: photoIndex >= 0 ? photos[photoIndex] : null,
      photoIndex,
      kenBurns: { from: zoomIn ? 1.0 : 1.12, to: zoomIn ? 1.12 : 1.0, dx: i % 3 === 0 ? 0.04 : i % 3 === 1 ? -0.04 : 0, dy: i % 2 === 0 ? -0.03 : 0.03 },
    };
    start += durationSec;
    return plan;
  });
  return {
    scenes: out,
    totalSec: Math.round(start * 10) / 10,
    totalFrames: out.reduce((a, s) => a + s.frames, 0),
    hook: (reels.hook || "").trim(),
    cta: (reels.cta || "").trim(),
    bgmStyle: (reels.bgm_style || "").trim(),
    storeName: storeName.trim(),
  };
}

/** 글자 수에 맞춘 자막 글꼴 크기 (1080 기준) */
export function subtitleFontSize(text: string): number {
  const n = text.length;
  if (n <= 10) return 84;
  if (n <= 18) return 70;
  if (n <= 30) return 58;
  return 48;
}

/** 캔버스 자막 줄바꿈: 최대 폭에 맞춰 단어 단위로, 단어가 너무 길면 글자 단위로 */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n/)) {
    const words = para.split(/\s+/).filter(Boolean);
    let line = "";
    for (const w of words) {
      const candidate = line ? line + " " + w : w;
      if (candidate.length <= maxChars) { line = candidate; continue; }
      if (line) lines.push(line);
      if (w.length > maxChars) {
        for (let i = 0; i < w.length; i += maxChars) lines.push(w.slice(i, i + maxChars));
        line = "";
      } else line = w;
    }
    if (line) lines.push(line);
  }
  return lines.length ? lines : [""];
}
