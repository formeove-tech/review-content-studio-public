import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

// 데모 모드: 가상 자료만 채워지고, 진짜 DB 설정은 무시되며, 인용문은 리뷰 원문 그대로여야 한다
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "studio-demo-test-"));
process.env.NEXT_PUBLIC_DEMO_SITE = "1";
process.env.TURSO_DATABASE_URL = "libsql://should-be-ignored.example.com"; // 데모가 이걸 쓰면 연결 오류로 테스트가 실패함
process.env.TMPDIR = tmp;
process.env.TEMP = tmp;
process.env.TMP = tmp;

const db = await import("@/lib/db");
const { DEMO_REVIEWS, DEMO_STORE } = await import("@/lib/demo/data");
const { demoBundleFor, sentences, breakLines, pickStyle, DEMO_TRENDS } = await import("@/lib/demo/generate");
const { isAllowedPhotoUrl } = await import("@/lib/slides");

describe("데모 사이트", () => {
  afterAll(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* windows lock */ } });

  it("처음 열면 가상 리뷰·가상 가게·콘텐츠·묶음이 채워진다 (진짜 클라우드 DB는 쓰지 않음)", async () => {
    expect(db.isCloudDb()).toBe(false);
    const all = await db.listReviews({ limit: 100 });
    expect(all.total).toBe(DEMO_REVIEWS.length);
    expect((await db.getSettings()).storeName).toBe(DEMO_STORE.storeName);
    expect((await db.getSettings()).storeLogo).toMatch(/^data:image\/png;base64,/);
    const bundles = await db.listBundles();
    expect(bundles.length).toBeGreaterThanOrEqual(1);
    for (const b of bundles) expect(b.content_count).toBe(3);
    expect(all.items.some((r) => r.content_count > 0)).toBe(true);
  });

  it("사진은 같은 사이트의 가상 그림 주소이고 서버가 가져와도 되는 주소다", async () => {
    const withPhotos = (await db.listReviews({ limit: 100 })).items.filter((r) => r.photo_urls.length);
    expect(withPhotos.length).toBeGreaterThan(10);
    for (const r of withPhotos) for (const u of r.photo_urls) { expect(u).toMatch(/^\/demo\/photo-\d+\.jpg$/); expect(isAllowedPhotoUrl(u)).toBe(true); }
    for (const n of fs.readdirSync(path.join(process.cwd(), "public", "demo"))) expect(n).toMatch(/^(photo-\d+\.jpg|logo\.png)$/);
  });

  it("두 번 불러도 중복으로 채우지 않고, 되돌리기는 처음 상태로 돌아간다", async () => {
    const before = (await db.listReviews({ limit: 100 })).total;
    await db.getDb();
    expect((await db.listReviews({ limit: 100 })).total).toBe(before);
    await db.saveSettings({ storeName: "바꿔 본 이름" });
    await db.resetDemoDb();
    expect((await db.getSettings()).storeName).toBe(DEMO_STORE.storeName);
    expect((await db.listReviews({ limit: 100 })).total).toBe(DEMO_REVIEWS.length);
  });

  it("미리 정한 틀로 만든 콘텐츠의 인용문은 모두 리뷰 원문 안에 있다 (지어내지 않음)", async () => {
    const withText = (await db.listReviews({ limit: 100 })).items.filter((r) => r.review_text.trim()).slice(0, 4);
    const b = demoBundleFor(withText, "가상국밥집");
    const corpus = withText.map((r) => r.review_text).join(" ");
    const quoted = [...b.carousel.slides.map((s) => s.body), ...b.reels.scenes.map((s) => s.script), b.key_quote]
      .flatMap((t) => [...t.matchAll(/"([^"]{6,})"/g)].map((m) => m[1]))
      .filter(Boolean);
    expect(quoted.length).toBeGreaterThan(0);
    for (const q of quoted) expect(corpus.replace(/\s+/g, " ")).toContain(q.replace(/\s+/g, " ").replace(/…$/, ""));
    expect(b.carousel.slides[0].role).toBe("cover");
    expect(b.carousel.slides.at(-1)!.role).toBe("closing");
    expect(b.reels.duration_sec).toBeGreaterThanOrEqual(15);
    expect(b.carousel.caption).not.toMatch(/@\w/); // 인스타 계정을 지어내지 않음
  });

  it("보조 함수: 문장 나누기·줄바꿈·스타일 고르기·예시 소재", () => {
    expect(sentences("국물이 진해요. 양도 많아요!")).toEqual(["국물이 진해요.", "양도 많아요!"]);
    expect(breakLines("손님들이 말하는 우리 가게", 9).split("\n").length).toBeGreaterThanOrEqual(2);
    expect(pickStyle(["야근하고 눈물 날 뻔"])).toBe("emotional");
    expect(pickStyle(["대박 ㅋㅋ"])).toBe("friendly");
    expect(pickStyle(["최고예요!!"])).toBe("impact");
    expect(pickStyle(["국물이 진해요"])).toBe("plain");
    expect(DEMO_TRENDS).toHaveLength(5);
  });
});

describe("데모 묶음 번호", () => {
  it("번호에 리뷰 번호를 담고 다시 꺼낼 수 있다", async () => {
    const { encodeDemoBundleId, decodeDemoBundleId } = await import("@/lib/demo/bundle-id");
    expect(decodeDemoBundleId(encodeDemoBundleId([24, 2, 1]))).toEqual([24, 2, 1]);
    expect(decodeDemoBundleId(encodeDemoBundleId([1, 2]))).toEqual([1, 2]);
    expect(decodeDemoBundleId(1)).toBeNull(); // 미리 만든 묶음 번호는 해당 없음
    expect(decodeDemoBundleId(2)).toBeNull();
  });
  it("다른 서버 함수에 없는 묶음도 번호만으로 다시 만들고, 콘텐츠도 바로 채운다", async () => {
    const { encodeDemoBundleId } = await import("@/lib/demo/bundle-id");
    const items = (await db.listReviews({ limit: 100 })).items.filter((r) => r.review_text.trim() && r.photo_urls.length).slice(0, 3);
    const id = encodeDemoBundleId(items.map((r) => r.id));
    expect((await db.getBundle(id))?.review_ids).toEqual(items.map((r) => r.id)); // 없던 번호도 만들어 줌
    const rows = await db.listBundleContents(id);
    expect(rows.map((r) => r.kind).sort()).toEqual(["carousel", "news", "reels"]);
    expect((await db.listBundleContents(id)).length).toBe(3); // 두 번 불러도 늘어나지 않음
    const created = await db.createBundle({ title: "t", review_ids: items.map((r) => r.id), source: "manual" });
    expect(created.id).toBe(id);
  });
});
