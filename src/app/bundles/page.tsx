import Link from "next/link";
import { AutoBundleCard } from "@/components/AutoBundleCard";
import { hasAnyProvider } from "@/lib/ai/client";
import { listBundles } from "@/lib/db";
import { BUNDLE_SOURCE_LABEL } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const bundles = await listBundles();
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold">묶음 콘텐츠</h1>
        <p className="text-sm text-[var(--muted)]">
          리뷰 하나로는 소재가 얇을 때, 여러 리뷰를 묶어 캐러셀·릴스·새소식을 만듭니다. 리뷰 목록에서 체크해 고르거나, 주간 베스트 Top 5로, 또는 아래에서 주제를 골라 자동으로 묶으세요.
        </p>
      </div>
      <AutoBundleCard aiReady={hasAnyProvider()} />
      {bundles.length === 0 ? (
        <div className="card p-8 text-center text-sm text-[var(--muted)]">
          아직 만든 묶음이 없어요. <Link href="/" className="underline">리뷰 대시보드</Link>에서 리뷰를 2개 이상 체크하면 &quot;선택한 리뷰로 콘텐츠 만들기&quot; 막대가 나타납니다.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {bundles.map((b) => (
            <Link key={b.id} href={`/bundles/${b.id}`} className="card flex flex-col gap-1 p-4 hover:bg-white">
              <p className="text-xs text-[var(--muted)]">{BUNDLE_SOURCE_LABEL[b.source]}{b.theme ? ` · '${b.theme}'` : ""} · {b.created_at.slice(0, 10)}</p>
              <p className="font-bold">{b.title}</p>
              <p className="text-xs text-[var(--muted)]">리뷰 {b.review_ids.length}개 · 콘텐츠 {b.content_count ? `${Math.round(b.content_count / 3)}회 생성` : "아직 없음"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
