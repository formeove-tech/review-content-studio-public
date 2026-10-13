"use client";

import { useState } from "react";
import { PLATFORM_LABEL, SENTIMENT_LABEL, type Platform, type Sentiment } from "@/lib/types";

export function PlatformBadge({ platform }: { platform: Platform }) {
  const color: Record<Platform, string> = {
    baemin: "bg-[#2ac1bc] text-white",
    coupangeats: "bg-[#0074e4] text-white",
    yogiyo: "bg-[#fa0050] text-white",
    naver: "bg-[#03c75a] text-white",
  };
  return <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${color[platform]}`}>{PLATFORM_LABEL[platform]}</span>;
}

export function SentimentTag({ sentiment }: { sentiment: Sentiment }) {
  const cls = sentiment === "positive" ? "tag tag-pos" : sentiment === "negative" ? "tag tag-neg" : sentiment === "mixed" ? "tag tag-mix" : "tag";
  return <span className={cls}>{SENTIMENT_LABEL[sentiment]}</span>;
}

export function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <span className="text-[13px] text-[#e6a400]" title={`별점 ${rating}`}>
      {"★".repeat(Math.max(0, Math.min(5, Math.round(rating))))}
      <span className="text-[#ddd]">{"★".repeat(5 - Math.max(0, Math.min(5, Math.round(rating))))}</span>
    </span>
  );
}

/**
 * "보내기" — 휴대폰이면 카톡·문자·메일 공유창(navigator.share)을 띄우고,
 * PC 등 공유창이 없는 곳에서는 복사한 뒤 붙여넣기 안내를 보여줍니다.
 */
export function ShareButton({ title, text, fileName, label = "카톡·문자로 보내기", className = "" }: { title: string; text: string; fileName?: string; label?: string; className?: string }) {
  const [msg, setMsg] = useState("");
  const [showText, setShowText] = useState(false); // 복사도 안 되는 기기: 글을 펼쳐서 직접 복사
  async function share() {
    setMsg("");
    setShowText(false);
    const nav = typeof navigator !== "undefined" ? (navigator as Navigator & { share?: (d: { title?: string; text?: string }) => Promise<void> }) : null;
    if (nav?.share) {
      try {
        // title 을 같이 넘기면 안드로이드 카톡 등이 "제목 - 본문" 으로 제목을 한 번 더 붙임 → 본문만 전송 (title 은 파일 이름용)
        void title;
        await nav.share({ text });
        setMsg("보냈어요 ✓");
        setTimeout(() => setMsg(""), 2000);
        return;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return; // 사용자가 공유창을 닫음
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setMsg("복사했어요. 카톡·문자 대화창에 붙여넣기(길게 누르기 → 붙여넣기) 하면 보내져요.");
      setTimeout(() => setMsg(""), 6000);
    } catch {
      setMsg("자동 복사가 안 되는 기기예요. 아래 글을 길게 눌러 전체 선택 → 복사하거나, '파일로 저장'을 눌러 파일을 보내주세요.");
      setShowText(true);
    }
  }
  function download() {
    const blob = new Blob(["﻿" + text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "content.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary btn-sm" onClick={share}>📤 {label}</button>
        <button type="button" className="btn btn-sm" onClick={download}>파일로 저장</button>
      </div>
      {msg ? <p className="text-xs text-[var(--muted)]">{msg}</p> : null}
      {showText ? (
        <textarea
          readOnly
          className="input mt-1 h-40 w-full text-xs"
          value={text}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
    </div>
  );
}

export function CopyButton({ text, label = "복사", className = "" }: { text: string; label?: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-sm ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          alert("복사에 실패했습니다. 직접 드래그해서 복사해주세요.");
        }
      }}
    >
      {done ? "복사됨 ✓" : label}
    </button>
  );
}

export function maskName(name: string): string {
  const n = (name || "").trim();
  if (!n) return "손님";
  if (n.length <= 1) return n + "*";
  return n[0] + "*".repeat(Math.min(n.length - 1, 3));
}
