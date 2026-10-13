"use client";

// 캐러셀 · 릴스 대본 · 새소식 화면 (리뷰 1개 콘텐츠와 묶음 콘텐츠가 함께 사용)
import { carouselCaption, carouselText, reelsText } from "@/lib/share-text";
import { carouselStyleKey, STYLE_PRESETS } from "@/lib/styles";
import type { Carousel, News, Reels } from "@/lib/types";
import { CopyButton } from "./ui";

/* ---------- 캐러셀 ---------- */

export function CarouselView({ data, quote }: { data: Carousel; quote: string }) {
  const captionAll = carouselCaption(data);
  return (
    <div className="flex flex-col gap-3">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">인스타그램 캐러셀 · {data.slides.length}장</h3>
          <span className="ml-auto flex gap-2">
            <CopyButton text={carouselText(data)} label="슬라이드 문구 복사" />
            <CopyButton text={data.slides.map((s) => `[${s.index}] ${s.image_prompt}`).join("\n")} label="이미지 프롬프트 복사" />
          </span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">컨셉: {data.concept}</p>
        <p className="mt-1 flex flex-wrap gap-1 text-xs">
          <span className="tag">스타일 · {STYLE_PRESETS[carouselStyleKey(data)].label}</span>
          {data.hook_archetype ? <span className="tag">훅 공식 · {data.hook_archetype}</span> : null}
        </p>
        {quote ? <p className="mt-1 text-sm">핵심 인용: “{quote}”</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.slides.map((s) => (
          <div key={s.index} className="card flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between text-xs text-[var(--muted)]">
              <span>슬라이드 {s.index}</span>
              <span className="tag">{s.role === "cover" ? "표지" : s.role === "closing" ? "마무리" : "본문"}</span>
            </div>
            <div className="rounded-xl bg-[#f6f5f1] p-4">
              <p className="text-lg font-extrabold leading-snug">{s.headline}</p>
              {s.body ? <p className="mt-2 text-sm leading-relaxed">{s.body}</p> : null}
            </div>
            <details className="text-xs text-[var(--muted)]">
              <summary className="cursor-pointer">이미지 프롬프트 · 디자인 메모</summary>
              <p className="mt-1 whitespace-pre-wrap font-mono">{s.image_prompt}</p>
              <p className="mt-1">{s.design_note}</p>
            </details>
          </div>
        ))}
      </div>

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold">캡션 + 해시태그</h4>
          <CopyButton text={captionAll} label="캡션 복사" />
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{data.caption}</p>
        <p className="mt-2 text-sm text-[#3b5bdb]">{data.hashtags.join(" ")}</p>
      </div>
    </div>
  );
}

/* ---------- 릴스 ---------- */

const PHASE: Record<string, string> = { opening: "오프닝", highlight: "하이라이트", closing: "클로징" };

export function ReelsView({ data }: { data: Reels }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold">{data.title}</h3>
          <span className="tag">{data.duration_sec}초</span>
          <span className="ml-auto"><CopyButton text={reelsText(data)} label="대본 전체 복사" /></span>
        </div>
        <p className="mt-2 text-sm"><b>훅(첫 2초):</b> {data.hook}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">BGM: {data.bgm_style} · 분위기: {data.mood}</p>
      </div>
      <div className="flex flex-col gap-2">
        {data.scenes.map((s) => (
          <div key={s.order} className="card grid gap-2 p-4 md:grid-cols-[110px_1fr]">
            <div className="text-xs text-[var(--muted)]">
              <p className="font-bold text-[var(--ink)]">#{s.order} {PHASE[s.phase] || s.phase}</p>
              <p>{s.duration_sec}초</p>
            </div>
            <div className="text-sm">
              <p><b>대사</b> {s.script}</p>
              <p className="mt-1"><b>자막</b> <span className="rounded bg-[#1f1d1a] px-1.5 py-0.5 text-white">{s.subtitle}</span></p>
              <p className="mt-1 text-[var(--muted)]"><b>장면</b> {s.visual}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="card p-4 text-sm"><b>CTA</b> {data.cta}</div>
    </div>
  );
}

/* ---------- 새소식 ---------- */

export function NewsView({ data }: { data: News }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#03875f]">네이버 플레이스 새소식</h3>
          <CopyButton text={`${data.naver.title}\n\n${data.naver.body}`} />
        </div>
        <p className="mt-3 font-bold">{data.naver.title}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{data.naver.body}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{data.naver.body.length}자</p>
      </div>
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[#ff6f0f]">당근 새소식</h3>
          <CopyButton text={`${data.daangn.title}\n\n${data.daangn.body}`} />
        </div>
        <p className="mt-3 font-bold">{data.daangn.title}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{data.daangn.body}</p>
        <p className="mt-2 text-xs text-[var(--muted)]">{data.daangn.body.length}자</p>
      </div>
    </div>
  );
}
