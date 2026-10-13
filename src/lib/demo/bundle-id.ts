// 데모 전용: 묶음 번호 안에 리뷰 번호를 담습니다.
// Vercel 은 화면(경로)마다 따로 서버 함수를 띄워 서로 DB 를 공유하지 못합니다.
// 번호만 받아도 어느 함수에서든 같은 묶음을 다시 만들 수 있게 하려는 장치입니다 (가상 리뷰 번호는 항상 같음).
const BASE = 1_000_000_000;
const RADIX = 64;

export function encodeDemoBundleId(reviewIds: number[]): number {
  const ids = reviewIds.map(Number).filter((n) => Number.isInteger(n) && n >= 1 && n < RADIX).slice(0, 8);
  let v = 0;
  for (const id of ids) v = v * RADIX + id;
  return BASE + v;
}

/** 번호 → 리뷰 번호들 (데모용 번호가 아니면 null) */
export function decodeDemoBundleId(bundleId: number): number[] | null {
  if (!Number.isFinite(bundleId) || bundleId < BASE + 1) return null;
  let v = bundleId - BASE;
  const out: number[] = [];
  while (v > 0) {
    const d = v % RADIX;
    if (d === 0) return null;
    out.unshift(d);
    v = Math.floor(v / RADIX);
  }
  return out.length ? out : null;
}
