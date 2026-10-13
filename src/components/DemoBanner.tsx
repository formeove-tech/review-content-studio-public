"use client";

import { useState } from "react";

/** 공개 데모 사이트 맨 위 안내 띠 — 가상 데이터임을 알리고, 눌러서 바뀐 것을 처음 상태로 되돌리는 버튼 */
export function DemoBanner() {
  const [busy, setBusy] = useState(false);
  async function reset() {
    setBusy(true);
    try {
      await fetch("/api/demo/reset", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  }
  return (
    <div className="border-b border-[#f1c9bb] bg-[var(--accent-soft)] px-4 py-2 text-center text-xs md:text-sm">
      <b>🧪 데모입니다 · 가상 가게·가상 리뷰·가상 그림만 들어 있어요.</b> 로그인 없이 눌러 보세요. AI 대신 미리 정한 틀로 콘텐츠를 만들어 줍니다(진짜 앱은 AI가 리뷰마다 새로 씁니다).{" "}
      <button type="button" className="ml-1 rounded-md border border-[var(--line)] bg-white px-2 py-0.5 font-semibold" disabled={busy} onClick={reset}>
        {busy ? "되돌리는 중…" : "데모 데이터 다시 채우기"}
      </button>
    </div>
  );
}
