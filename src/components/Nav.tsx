"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { APP_VERSION } from "@/lib/version";

const LINKS = [
  { href: "/", label: "리뷰 대시보드" },
  { href: "/bookmarks", label: "리뷰 수집함" },
  { href: "/weekly", label: "주간 베스트" },
  { href: "/bundles", label: "묶음 콘텐츠" },
  { href: "/settings", label: "설정" },
];

export function Nav({ authEnabled = false }: { authEnabled?: boolean }) {
  const path = usePathname();
  const [leaving, setLeaving] = useState(false);
  async function logout() {
    if (!confirm("로그아웃할까요? 다시 들어올 때 비밀번호가 필요해요.")) return;
    setLeaving(true);
    try {
      await fetch("/api/login", { method: "DELETE" });
    } finally {
      window.location.href = "/login";
    }
  }
  if (path === "/login") return null;
  return (
    <header className="sticky top-0 z-20 border-b border-[var(--line)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        <Link href="/" className="whitespace-nowrap text-base font-extrabold tracking-tight">
          <span className="text-[var(--accent)]">●</span> 리뷰 콘텐츠 스튜디오 <span className="ml-1 rounded bg-[#f1efe9] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">v{APP_VERSION}</span>
        </Link>
        <nav className="flex gap-1 text-xs md:text-sm">
          {LINKS.map((l) => {
            const active = l.href === "/" ? path === "/" || path.startsWith("/reviews") : path.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-2 py-1.5 font-semibold md:px-3 ${active ? "bg-[var(--ink)] text-white" : "text-[var(--muted)] hover:bg-white"}`}
              >
                {l.label}
              </Link>
            );
          })}
          {authEnabled ? (
            <button
              type="button"
              onClick={logout}
              disabled={leaving}
              title="공용 폰이나 다른 사람 기기에서는 다 쓰고 로그아웃하세요"
              className="whitespace-nowrap rounded-lg px-2 py-1.5 font-semibold text-[var(--muted)] hover:bg-white md:px-3"
            >
              {leaving ? "나가는 중…" : "로그아웃"}
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
