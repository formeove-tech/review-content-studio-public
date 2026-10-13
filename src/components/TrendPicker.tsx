"use client";

import { useEffect, useState } from "react";
import type { TrendPick } from "@/lib/ai/prompts/content";

interface TrendItem { title: string; why_hot: string; how_to_use: string; example: string; source_url: string; fit: number }

/**
 * "요즘 뜨는 소재 찾기" — AI 웹 검색 후보 5개를 보여주고 하나를 고르면 부모가 그 소재로 콘텐츠를 만듭니다.
 * value: 현재 고른 소재(없으면 null). onChange 로 부모에 알림.
 */
export function TrendPicker({ value, onChange, disabled }: { value: TrendPick | null; onChange: (t: TrendPick | null) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TrendItem[]>([]);
  const [at, setAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [hint, setHint] = useState("");

  async function load(refresh: boolean) {
    setBusy(true); setMsg("");
    try {
      const q = new URLSearchParams();
      if (refresh) q.set("refresh", "1"); else q.set("cachedOnly", "1");
      if (hint.trim()) q.set("hint", hint.trim());
      const res = await fetch(`/api/trends?${q}`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setItems(data.items || []);
      setAt(data.at || "");
      if (!data.items?.length && !refresh) setMsg("아직 찾아둔 소재가 없어요. '지금 검색'을 눌러주세요.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally { setBusy(false); }
  }
  useEffect(() => { if (open && !items.length) load(false); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [open]);

  return (
    <div className="card flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm">
          <p className="font-bold">🔥 요즘 뜨는 소재로 만들기 <span className="font-normal text-[var(--muted)]">(선택)</span></p>
          <p className="text-xs text-[var(--muted)]">
            {value ? <>고른 소재: <b>{value.title}</b> · 다음 생성부터 이 틀을 씁니다. </> : "AI가 인터넷을 검색해 요즘 음식·식당 릴스/캐러셀에서 먹히는 형식·밈·시즌 이슈 5개를 찾아옵니다. 하루 동안 저장돼요."}
          </p>
        </div>
        <span className="ml-auto flex gap-2">
          {value ? <button type="button" className="btn btn-sm" disabled={disabled} onClick={() => onChange(null)}>소재 해제</button> : null}
          <button type="button" className="btn btn-sm" onClick={() => setOpen((v) => !v)}>{open ? "접기" : "소재 보기"}</button>
        </span>
      </div>
      {open ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <input className="input !w-56 text-xs" placeholder="검색 힌트 (예: 국밥, 해장, 가을)" value={hint} onChange={(e) => setHint(e.target.value)} />
            <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => load(true)}>{busy ? "검색 중… (30초~1분)" : "지금 검색"}</button>
            {at ? <span className="text-xs text-[var(--muted)]">찾은 시각 {at.slice(0, 16).replace("T", " ")}</span> : null}
          </div>
          {msg ? <p className="text-xs text-red-700">{msg}</p> : null}
          <div className="grid gap-2 md:grid-cols-2">
            {items.map((t, i) => {
              const picked = value?.title === t.title;
              return (
                <div key={i} className={`flex flex-col gap-1 rounded-xl border p-3 text-xs ${picked ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[#f6f5f1]"}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{t.title}</p>
                    <span className="tag ml-auto" title="우리 가게 적합도">적합 {"★".repeat(Math.max(1, Math.min(5, Math.round(t.fit))))}</span>
                  </div>
                  {t.why_hot ? <p><b>왜 뜨나</b> {t.why_hot}</p> : null}
                  {t.how_to_use ? <p><b>우리 리뷰에</b> {t.how_to_use}</p> : null}
                  {t.example ? <p className="text-[var(--muted)]">예: {t.example}</p> : null}
                  <div className="mt-1 flex items-center gap-2">
                    {t.source_url ? <a href={t.source_url} target="_blank" rel="noreferrer" className="text-[#3b5bdb] underline">근거 보기</a> : null}
                    <button type="button" className={`btn btn-sm ml-auto ${picked ? "" : "btn-primary"}`} disabled={disabled} onClick={() => onChange(picked ? null : { title: t.title, how_to_use: t.how_to_use, why_hot: t.why_hot })}>
                      {picked ? "선택됨 ✓" : "이 소재로"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-[var(--muted)]">검색으로 공개된 글·기사·트렌드 언급을 근거로 삼습니다. 인스타·유튜브 내부 수치는 볼 수 없어요. 검색 1회 약 20~50원.</p>
        </div>
      ) : null}
    </div>
  );
}
