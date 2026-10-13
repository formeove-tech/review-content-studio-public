"use client";

import { useState } from "react";

export function LoginForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [shared, setShared] = useState(false); // 공용 기기: 브라우저를 닫으면 로그아웃
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password, remember: !shared }) });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "로그인 실패");
      window.location.href = next;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
      <input
        type="password"
        className="input"
        placeholder="비밀번호"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input type="checkbox" className="mt-0.5" checked={shared} onChange={(e) => setShared(e.target.checked)} />
        <span>
          다른 사람과 같이 쓰는 폰·PC예요
          <span className="block text-xs text-[var(--muted)]">체크하면 브라우저를 닫을 때 자동으로 로그아웃돼요. 체크 안 하면 30일간 로그인이 유지됩니다.</span>
        </span>
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" className="btn btn-primary justify-center" disabled={busy || !password}>
        {busy ? "확인 중…" : "들어가기"}
      </button>
    </form>
  );
}
