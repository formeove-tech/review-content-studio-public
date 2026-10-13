import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "studio-bundle-test-"));
process.env.STUDIO_DATA_DIR = tmp;
delete process.env.TURSO_DATABASE_URL;

const { ingestPayload } = await import("@/lib/ingest");
const db = await import("@/lib/db");
const { bundleUserPrompt, BUNDLE_SYSTEM } = await import("@/lib/ai/prompts/content");
const { bundlePhotos, bundlePlatformLabel } = await import("@/lib/bundles");
const { SettingsSchema } = await import("@/lib/types");

const today = new Date().toISOString().slice(0, 10);
const old = new Date(Date.now() - 100 * 86400000).toISOString().slice(0, 10);

describe("묶음(리뷰 여러 개)", () => {
  beforeAll(async () => {
    await ingestPayload({
      platform_code: "baemin",
      reviews: [
        { external_review_id: "b1", customer_name: "홍길동", review_date: today, review_text: "국물이 진하고 양도 많아요", rating: 5, photo_urls: ["https://bmreview.cdn.baemin.com/1.jpg"] },
        { external_review_id: "b2", customer_name: "김", review_date: today, review_text: "국물 맛이 깊어요 재주문 각", rating: 5, photo_urls: ["https://bmreview.cdn.baemin.com/2.jpg", "https://bmreview.cdn.baemin.com/1.jpg"] },
        { external_review_id: "b3", customer_name: "이", review_date: today, review_text: "배달이 늦고 국물이 샜어요 아쉽네요", rating: 2, delivery_review: "아쉬워요" },
        { external_review_id: "b4", customer_name: "박", review_date: old, review_text: "국물이 끝내줘요", rating: 5 },
        { external_review_id: "b5", customer_name: "최", review_date: today, review_text: "", rating: 5 },
      ],
    });
    await ingestPayload({ platform_code: "naver", reviews: [{ external_review_id: "n1", customer_name: "네이버손님", review_date: today, review_text: "양이 정말 많아요", rating: 5 }] });
  });
  afterAll(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* windows lock */ } });

  it("주제 자동 고르기: 최근 기간·본문 있음·긍정/혼합·주제 태그 순으로 점수 높은 리뷰", async () => {
    const picked = await db.pickReviewsByTheme("맛", 30, 5);
    const ids = picked.map((r) => r.external_id);
    expect(ids).toContain("b1");
    expect(ids).toContain("b2");
    expect(ids).not.toContain("b3"); // 부정
    expect(ids).not.toContain("b4"); // 100일 전
    expect(ids).not.toContain("b5"); // 본문 없음
    for (let i = 1; i < picked.length; i++) expect(picked[i - 1].score).toBeGreaterThanOrEqual(picked[i].score);
    const any = await db.pickReviewsByTheme("", 30, 10);
    expect(any.map((r) => r.external_id)).toContain("n1");
  });

  it("묶음 만들기·조회·콘텐츠 저장", async () => {
    const all = (await db.listReviews({ limit: 100 })).items;
    const ids = all.filter((r) => ["b1", "b2", "n1"].includes(r.external_id)).map((r) => r.id);
    const b = await db.createBundle({ title: "국물 모음", review_ids: [...ids, ids[0], 999999], source: "manual", theme: "맛" });
    expect(b.review_ids).toEqual([...ids, 999999]); // 중복 제거, 존재 여부는 생성 단계에서 확인
    expect(b.content_count).toBe(0);
    const rows = await db.saveContents({ bundleId: b.id }, [{ kind: "news", payload: { naver: { title: "t", body: "b" }, daangn: { title: "t", body: "b" } }, key_quote: "국물", model: "test" }]);
    expect(rows[0].bundle_id).toBe(b.id);
    expect(rows[0].review_id).toBe(0);
    expect((await db.listBundleContents(b.id)).length).toBe(1);
    expect((await db.getBundle(b.id))!.content_count).toBe(1);
    expect((await db.listBundles())[0].id).toBe(b.id);
    // 리뷰 1개 콘텐츠 목록에는 묶음 콘텐츠가 섞이지 않음
    expect((await db.listContents(ids[0])).length).toBe(0);
  });

  it("프롬프트: 리뷰마다 번호를 붙이고 닉네임은 가리며 종합 규칙이 들어간다", async () => {
    const all = (await db.listReviews({ limit: 100 })).items.filter((r) => ["b1", "b2"].includes(r.external_id));
    const p = bundleUserPrompt(all, SettingsSchema.parse({ storeName: "테스트 가게" }), "국물 모음");
    expect(p).toContain("[리뷰 1]");
    expect(p).toContain("[리뷰 2]");
    expect(p).toContain("국물이 진하고 양도 많아요");
    expect(p).not.toContain("홍길동");
    expect(p).toContain("[묶음 제목]\n국물 모음");
    expect(BUNDLE_SYSTEM).toContain("여러 개를 종합");
    expect(BUNDLE_SYSTEM).toContain("서로 다른 리뷰");
    expect(BUNDLE_SYSTEM).not.toContain("리뷰 한 개를 재료로");
  });

  it("사진 모으기·플랫폼 라벨", async () => {
    const all = (await db.listReviews({ limit: 100 })).items.filter((r) => ["b1", "b2", "n1"].includes(r.external_id));
    expect([...bundlePhotos(all)].sort()).toEqual(["https://bmreview.cdn.baemin.com/1.jpg", "https://bmreview.cdn.baemin.com/2.jpg"]); // 중복 제거
    expect(bundlePlatformLabel(all)).toBe("배민·네이버");
  });
});
