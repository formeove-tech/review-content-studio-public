import Link from "next/link";
import { notFound } from "next/navigation";
import { BundleStudio } from "@/components/BundleStudio";
import { hasAnyProvider } from "@/lib/ai/client";
import { getBundle, getReviewsByIds, getSettings, listBundleContents } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function BundlePage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const bundle = await getBundle(id);
  if (!bundle) notFound();
  const [reviewsRaw, contents, settings] = await Promise.all([getReviewsByIds(bundle.review_ids), listBundleContents(id), getSettings()]);
  const byId = new Map(reviewsRaw.map((r) => [r.id, r]));
  const reviews = bundle.review_ids.map((rid) => byId.get(rid)).filter((r): r is NonNullable<typeof r> => Boolean(r));
  return (
    <div className="flex flex-col gap-4">
      <Link href="/bundles" className="text-sm text-[var(--muted)] hover:underline">← 묶음 콘텐츠 목록</Link>
      <BundleStudio bundle={bundle} reviews={reviews} initialContents={contents} aiReady={hasAnyProvider()} storeName={settings.storeName} storeLogo={settings.storeLogo} />
    </div>
  );
}
