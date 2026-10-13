import Link from "next/link";
import { AutoBundleCard } from "@/components/AutoBundleCard";
import { CrawlPanel } from "@/components/CrawlPanel";
import { hasAnyProvider } from "@/lib/ai/client";
import { ReviewBrowser } from "@/components/ReviewBrowser";
import { getSettings, getStats, isCloudDb } from "@/lib/db";
import { isCloudRuntime, isDemoSite } from "@/lib/runtime";
import { PLATFORM_LABEL, type Platform } from "@/lib/types";
import { weekRange } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const settings = await getSettings();
  const { start, end } = weekRange(new Date());
  const stats = await getStats(start, end);
  const port = process.env.PORT || "3400";
  const ingestUrl = `http://localhost:${port}/api/reviews/ingest`;

  return (
    <div className="flex flex-col gap-4">
      {!settings.storeName ? (
        <div className="rounded-xl border border-[#f1c9bb] bg-[var(--accent-soft)] px-4 py-3 text-sm">
          처음 오셨군요! <Link href="/settings" className="font-bold underline">설정</Link>에서 가게 이름·대표 메뉴를 넣어두면 콘텐츠 품질이 훨씬 좋아집니다.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="전체 리뷰" value={stats.total} sub={Object.entries(stats.byPlatform).map(([p, n]) => `${PLATFORM_LABEL[p as Platform] || p} ${n}`).join(" · ")} />
        <Stat label="이번 주 리뷰" value={stats.thisWeek} sub={`${start} ~ ${end}`} />
        <Stat label="리뷰 수집함" value={stats.bookmarked} sub="북마크한 리뷰" href="/bookmarks" />
        <Stat label="콘텐츠 만든 리뷰" value={stats.withContent} sub={stats.lastCollectedAt ? `마지막 수집 ${stats.lastCollectedAt.slice(0, 16).replace("T", " ")}` : "아직 수집 전"} />
      </div>

      {isDemoSite() ? <DemoGuide /> : <CrawlPanel hasNaver={Boolean(settings.naverPlaceUrl)} ingestUrl={ingestUrl} cloud={isCloudRuntime()} cloudDb={isCloudDb()} lastCollectedAt={stats.lastCollectedAt} />}

      <AutoBundleCard aiReady={hasAnyProvider()} />

      <ReviewBrowser title="리뷰" />
    </div>
  );
}

function DemoGuide() {
  const steps = [
    { n: 1, t: "리뷰를 골라 묶기", d: "아래 리뷰 카드에서 사진(📷)이 있는 리뷰 2~4개의 ‘묶기’를 체크 → 맨 아래 ‘선택한 리뷰로 콘텐츠 만들기’. 이미 만들어 둔 묶음은 위 메뉴 ‘묶음 콘텐츠’에서 바로 열 수 있어요." },
    { n: 2, t: "캐러셀 이미지로 바꾸기", d: "‘인스타 캐러셀’ 탭 → ‘이미지 만들기’ → 크기(인스타 4:5 / 스레드 1:1)와 스타일(임팩트·담백·감성·친근)을 바꿔 보세요." },
    { n: 3, t: "릴스 영상 만들기", d: "‘릴스/쇼츠 대본’ 탭 → ‘영상 만들기’ → 20초쯤 뒤 세로 영상이 완성돼요. ‘요즘 뜨는 소재’ 카드에서 소재를 골라 다시 만들 수도 있어요." },
  ];
  return (
    <div className="card flex flex-col gap-3 p-4">
      <p className="font-bold">▶ 여기부터 눌러 보세요 <span className="font-normal text-[var(--muted)]">(3단계 · 약 3분)</span></p>
      <div className="grid gap-2 md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="rounded-xl bg-[#f6f5f1] p-3 text-sm">
            <p className="font-bold"><span className="mr-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ink)] text-xs text-white">{s.n}</span>{s.t}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{s.d}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-[var(--muted)]">진짜 앱은 배민·쿠팡이츠·네이버 리뷰를 사장님 노트북에서 자동으로 모아 옵니다. 데모에는 수집 버튼이 없어요.</p>
    </div>
  );
}

function Stat({ label, value, sub, href }: { label: string; value: number; sub?: string; href?: string }) {
  const body = (
    <div className="card p-4">
      <p className="text-xs font-semibold text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
      {sub ? <p className="mt-1 truncate text-[11px] text-[var(--muted)]" title={sub}>{sub}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
