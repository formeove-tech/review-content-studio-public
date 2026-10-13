// 데모 사이트가 처음 켜질 때(또는 "데모 데이터 다시 채우기") 가상 리뷰·콘텐츠·묶음을 DB 에 넣습니다.
// db.ts 의 getDb() 가 부르므로, 여기서는 getDb() 를 다시 부르지 않고 받은 client 로 직접 씁니다.
import type { Client, InStatement } from "@libsql/client";
import { toUpsertInput } from "../ingest";
import { rowToReview } from "../db";
import type { Review } from "../types";
import { DEMO_REVIEWS, DEMO_STORE } from "./data";
import { demoBundleFor } from "./generate";
import { DEMO_LOGO } from "./logo-data";

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export async function resetDemo(client: Client): Promise<void> {
  await client.batch(["DELETE FROM contents", "DELETE FROM bundles", "DELETE FROM reviews", "DELETE FROM weekly_best", "DELETE FROM settings"].map((sql) => ({ sql, args: [] })), "write");
  await seedDemo(client);
}

export async function seedDemo(client: Client): Promise<void> {
  const count = Number((await client.execute("SELECT COUNT(*) AS n FROM reviews")).rows[0]?.n ?? 0);
  if (count > 0) return;
  const now = new Date();
  const nowIso = now.toISOString();

  // 1) 리뷰 (진짜 수집과 같은 분류 규칙을 거침)
  const stmts: InStatement[] = DEMO_REVIEWS.map((r, i) => {
    const date = new Date(now.getTime() - r.ago * 86400000);
    const it = toUpsertInput(r.p, {
      external_review_id: `demo_${r.p}_${i + 1}`, customer_name: r.name, rating: r.rating, order_count: r.orders ?? null,
      review_date: ymd(date), review_text: r.text, order_menu: r.menu ?? "", delivery_review: r.delivery ?? "", owner_only: false,
      has_photo: Boolean(r.photos?.length), photo_urls: (r.photos || []).map((n) => `/demo/photo-${n}.jpg`), owner_reply: r.reply ?? "",
    }, { store_id: "demo", source_url: "", collected_at: nowIso });
    return {
      sql: `INSERT INTO reviews (platform, external_id, store_id, customer_name, rating, order_count, review_date, review_text, order_menu, delivery_review,
        has_photo, photo_urls, owner_reply, categories, sentiment, score, source_url, raw_json, collected_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [it.platform, it.external_id, it.store_id, it.customer_name, it.rating, it.order_count, it.review_date, it.review_text, it.order_menu, it.delivery_review,
        it.has_photo ? 1 : 0, JSON.stringify(it.photo_urls), it.owner_reply, JSON.stringify(it.categories), it.sentiment, it.score, it.source_url, it.raw_json, it.collected_at, nowIso],
    };
  });
  await client.batch(stmts, "write");

  // 2) 설정 (가상 가게 + 가상 로고)
  await client.execute({ sql: "INSERT INTO settings (key, value) VALUES ('store', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value", args: [JSON.stringify({ ...DEMO_STORE, storeLogo: DEMO_LOGO })] });

  // 3) 미리 만들어 둔 콘텐츠: 리뷰 1개짜리 3개 + 묶음 2개
  const rows = (await client.execute("SELECT r.*, 0 AS content_count FROM reviews r")).rows.map((r) => rowToReview(r as unknown as Record<string, unknown>));
  const withText = rows.filter((r) => r.review_text.trim());
  const best = [...withText].filter((r) => r.photo_urls.length).sort((a, b) => b.score - a.score);
  const singles: Review[] = [];
  const wanted = [/눈물|엄마|야근/, /ㅋㅋ|!!/, /진하고|얼큰/];
  for (const re of wanted) { const hit = best.find((r) => re.test(r.review_text) && !singles.includes(r)); if (hit) singles.push(hit); }

  const insertContents = async (target: { reviewId?: number; bundleId?: number }, reviews: Review[], title?: string) => {
    const b = demoBundleFor(reviews, DEMO_STORE.storeName);
    const model = "demo-template";
    const quote = b.key_quote;
    const items: [string, unknown][] = [["carousel", b.carousel], ["reels", b.reels], ["news", b.news]];
    await client.batch(items.map(([kind, payload]) => ({
      sql: "INSERT INTO contents (review_id, bundle_id, kind, payload, key_quote, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [target.reviewId || 0, target.bundleId ?? null, kind, JSON.stringify(payload), quote, model, nowIso],
    })), "write");
    void title;
  };
  for (const r of singles) await insertContents({ reviewId: r.id }, [r]);

  const bundleDefs: { title: string; source: string; theme: string; pick: Review[] }[] = [
    { title: "국물 칭찬 모음", source: "auto", theme: "맛", pick: best.filter((r) => r.categories.includes("맛")).slice(0, 4) },
    { title: "해장·든든함 모음", source: "manual", theme: "", pick: withText.filter((r) => /해장|든든|푸짐|양/.test(r.review_text) && r.photo_urls.length).slice(0, 4) },
  ];
  for (const d of bundleDefs) {
    if (d.pick.length < 2) continue;
    const res = await client.execute({ sql: "INSERT INTO bundles (title, review_ids, source, theme, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id", args: [d.title, JSON.stringify(d.pick.map((r) => r.id)), d.source, d.theme, nowIso] });
    await insertContents({ bundleId: Number(res.rows[0].id) }, d.pick, d.title);
  }
}
