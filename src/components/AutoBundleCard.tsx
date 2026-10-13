"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/types";

/** 주제·기간을 고르면 리뷰 5개를 자동으로 묶어 콘텐츠를 만듭니다 */
export function AutoBundleCard({ aiReady }: { aiReady: boolean }) {
  const router = useRouter();
  const [theme, setTheme] = useState("");
  const [days, setDays] = useState(30);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run() {
    setBusy(true); setMsg("");
    try {
      const res = await fetch("/api/bundles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ source: "auto", theme, days }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      router.push(`/bundles/${data.bundle.id}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm">
          <p className="font-bold">🧺 주제 골라 자동 묶기</p>
          <p className="text-xs text-[var(--muted)]">고른 주제의 긍정 리뷰 중 소재 점수 높은 5개를 모아 콘텐츠 3종을 한 번에 만듭니다.</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <select className="select py-1 text-sm" value={theme} disabled={busy} onChange={(e) => setTheme(e.target.value)}>
            <option value="">주제 상관없이</option>
            {CATEGORIES.filter((c) => c !== "불만").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="select py-1 text-sm" value={days} disabled={busy} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy || !aiReady} onClick={run}>{busy ? "리뷰 고르고 만드는 중… (1분)" : "자동으로 묶어 만들기"}</button>
        </div>
      </div>
      {msg ? <p className="text-xs text-red-700">{msg}</p> : null}
      {!aiReady ? <p className="text-xs text-red-700">AI 키가 연결되지 않아 만들 수 없어요.</p> : null}
    </div>
  );
}
