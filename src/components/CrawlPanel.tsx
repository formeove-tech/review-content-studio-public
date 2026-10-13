"use client";

import { useEffect, useRef, useState } from "react";

const LABEL: Record<string, string> = { baemin: "배민", coupangeats: "쿠팡이츠", naver: "네이버 플레이스" };

interface JobView {
  id: number;
  platform: string;
  status: "pending" | "running" | "done" | "error" | "stopped";
  log: string[];
  result: { inserted: number; updated: number; total: number } | null;
  startedAt: string | null;
  finishedAt: string | null;
}

function daysAgo(iso: string | null): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

export function CrawlPanel({ hasNaver, ingestUrl, cloud = false, cloudDb = false, lastCollectedAt = null }: { hasNaver: boolean; ingestUrl: string; cloud?: boolean; cloudDb?: boolean; lastCollectedAt?: string | null }) {
  const [job, setJob] = useState<JobView | null>(null);
  const [recent, setRecent] = useState<JobView[]>([]);
  const [laptopOnline, setLaptopOnline] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showLog, setShowLog] = useState(false);
  const wasActive = useRef(false);

  async function refresh() {
    try {
      const res = await fetch("/api/crawl", { cache: "no-store" });
      const data = await res.json();
      if (!data.ok) return;
      setJob(data.job);
      setRecent(data.recent || []);
      setLaptopOnline(data.laptopOnline !== false);
      const active = data.job?.status === "running" || data.job?.status === "pending";
      if (wasActive.current && !active) window.dispatchEvent(new Event("reviews:refresh"));
      wasActive.current = active;
    } catch { /* 네트워크 일시 오류 */ }
  }

  useEffect(() => {
    refresh();
    // 진행 중이면 2초, 인터넷 화면은 노트북 상태 확인을 위해 10초마다
    const t = setInterval(() => { if (wasActive.current) refresh(); }, 2000);
    const t2 = cloud ? setInterval(() => { if (!wasActive.current) refresh(); }, 10000) : null;
    return () => { clearInterval(t); if (t2) clearInterval(t2); };
  }, [cloud]);

  async function start(platform: string) {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setJob(data.job);
      wasActive.current = true;
      setShowLog(true);
      setMsg(cloud
        ? "노트북에서 크롬이 열리고 자동으로 진행됩니다. 로그인이 풀렸을 때만 그 창에서 한 번 로그인해주세요."
        : "크롬 창이 열립니다. 로그인이 풀렸으면 그 창에서 로그인해주세요. 리뷰 화면은 자동으로 찾아갑니다.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    await fetch("/api/crawl", { method: "DELETE" });
    await refresh();
  }

  const active = job?.status === "running" || job?.status === "pending";
  const last = active ? null : job || recent[0] || null;
  const waitedSec = job?.status === "pending" && job.startedAt ? Math.floor((Date.now() - new Date(job.startedAt).getTime()) / 1000) : 0;
  const offline = cloud && laptopOnline === false;
  const staleDays = daysAgo(lastCollectedAt);
  const canStart = !busy && !active && !offline;

  return (
    <section className="card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-bold">리뷰 수집</h2>
        <span className="text-xs text-[var(--muted)]">
          {cloud ? "버튼 한 번이면 노트북이 새 리뷰를 읽어옵니다" : `버튼 한 번이면 크롬이 열리고 새 리뷰를 읽어옵니다${cloudDb ? " · 저장은 클라우드 DB" : ""}`}
        </span>
        <span className="ml-auto flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={!canStart} onClick={() => start("baemin")}>배민 수집</button>
          <button type="button" className="btn" disabled={!canStart} onClick={() => start("coupangeats")}>쿠팡이츠 수집</button>
          <button type="button" className="btn" disabled={!canStart || !hasNaver} title={hasNaver ? "" : "설정에서 네이버 플레이스 주소를 먼저 넣어주세요"} onClick={() => start("naver")}>
            네이버 수집
          </button>
          {active ? <button type="button" className="btn" onClick={stop}>중단</button> : null}
        </span>
      </div>

      {cloud ? (
        <p className={`mt-2 text-sm ${offline ? "text-red-700" : "text-green-800"}`}>
          {laptopOnline === null ? "노트북 연결 확인 중…" : offline
            ? "● 노트북 앱이 꺼져 있어요. 노트북에서 바탕화면의 review-studio-start.bat 을 더블클릭해 켜면 여기 버튼이 살아납니다."
            : "● 노트북 앱 연결됨 — 버튼을 누르면 바로 시작돼요."}
        </p>
      ) : null}

      {!active && staleDays !== null && staleDays >= 2 ? (
        <p className="mt-2 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-sm">
          마지막 수집이 <b>{staleDays}일 전</b>이에요. 그 사이 새 리뷰가 들어왔을 수 있으니 <b>배민 수집</b>을 한 번 눌러주세요. (새 리뷰만 가져오고 1~2분이면 끝나요)
        </p>
      ) : null}

      {msg ? <p className="mt-2 text-sm text-[var(--muted)]">{msg}</p> : null}

      {active && job ? (
        <div className="mt-3">
          <p className="mb-1 text-sm font-semibold">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--accent)]" />
            {job.status === "pending" ? `${LABEL[job.platform]} 수집 시작 대기 중… (${waitedSec}초)` : `${LABEL[job.platform]} 수집 중…`}
            {job.log.length ? <span className="ml-2 font-normal text-[var(--muted)]">{job.log[job.log.length - 1]}</span> : null}
          </p>
          {job.status === "pending" && waitedSec > 30 ? (
            <p className="mb-1 text-xs text-red-700">30초가 지나도 시작되지 않네요. 노트북에서 review-studio-start.bat 이 켜져 있는지 확인하고, 안 되면 [중단] 후 다시 눌러주세요.</p>
          ) : null}
          <pre className="log">{job.log.slice(-40).join("\n") || "시작하는 중…"}</pre>
        </div>
      ) : null}

      {!active && last ? (
        <div className="mt-3 text-sm">
          <span className={last.status === "done" ? "text-green-800" : last.status === "stopped" ? "text-[var(--muted)]" : "text-red-700"}>
            {LABEL[last.platform]} 수집 {last.status === "done" ? "완료" : last.status === "stopped" ? "중단됨" : "실패"}
            {last.result ? ` — 새 리뷰 ${last.result.inserted}개 저장${last.result.updated ? `, 갱신 ${last.result.updated}개` : ""}` : ""}
            {last.finishedAt ? <span className="ml-2 text-xs text-[var(--muted)]">{last.finishedAt.slice(0, 16).replace("T", " ")}</span> : null}
          </span>
          <button type="button" className="ml-2 text-xs text-[var(--muted)] underline" onClick={() => setShowLog((v) => !v)}>
            {showLog ? "기록 닫기" : "기록 보기"}
          </button>
          {showLog ? <pre className="log mt-2">{last.log.slice(-60).join("\n")}</pre> : null}
        </div>
      ) : null}

      {!cloud ? (
        <details className="mt-3 text-xs text-[var(--muted)]">
          <summary className="cursor-pointer">크롬 확장(배달 리뷰 자동답글 도우미)에서 보내는 방법</summary>
          <p className="mt-1">
            확장 팝업의 <b>전송 URL</b>에 <code className="rounded bg-[#f1efe9] px-1">{ingestUrl}</code> 를 넣고, 리뷰 수집 후 <b>어드민으로 전송</b>을 누르면 여기에 저장됩니다.
            연동 토큰은 .env.local의 INGEST_TOKEN과 같게 넣으세요 (비워두면 검사하지 않음).
          </p>
        </details>
      ) : null}
    </section>
  );
}
