// 쿠팡이츠 사장님 포털(store.coupangeats.com) 리뷰 수집
// 사용: node scripts/crawl-coupang.mjs [--ingest ...] [--url 리뷰페이지주소] [--quick] [--all] [--period 3개월]
// 화면은 기본이 '오늘' 이라 하루치만 보이므로, 기간을 '3개월'(기본)로 바꾼 뒤 페이지를 넘기며 수집합니다.
import { clickReviewMenu, deliver, fetchKnownIds, log, openBrowser, parseArgs, sleep, waitForPage } from "./lib/common.mjs";

const args = parseArgs();
const START_URL = args.url || "https://store.coupangeats.com/merchant/management/reviews";
const PERIODS = ["오늘", "최근 1주일", "1개월", "3개월", "6개월", "1년"];
const periodIdx = process.argv.indexOf("--period");
const PERIOD = periodIdx >= 0 && PERIODS.includes(process.argv[periodIdx + 1]) ? process.argv[periodIdx + 1] : "3개월";

const SCRAPE = `
  () => {
    const collected = new Map();
    function parseCard(card) {
      const text = card.innerText || "";
      const om = text.match(/주문번호\\s*([A-Z0-9]{4,})/);
      if (!om) return null;
      const bs = card.querySelectorAll("b");
      const customer_name = bs[0] ? (bs[0].innerText || "").trim() : "";
      const ocm = text.match(/(\\d+)\\s*회\\s*주문/);
      // 별점: 노란 별(svg #FFC400) 개수. 같은 별 묶음이 PC/모바일용으로 두 번 들어있어 묶음별로 세고 최댓값을 씁니다
      let rating = 0;
      for (const group of card.querySelectorAll("div")) {
        let n = 0;
        for (const svg of group.children) {
          if (svg.tagName.toLowerCase() !== "svg") continue;
          const p = svg.querySelector("path");
          if (p && (p.getAttribute("fill") || "").toUpperCase() === "#FFC400") n++;
        }
        if (n > rating) rating = n;
      }
      if (rating > 5) rating = 5;
      let review_date = "";
      const dre = /(\\d{4}-\\d{2}-\\d{2})(\\(주문일\\))?/g; let mm;
      while ((mm = dre.exec(text))) { if (!mm[2]) { review_date = mm[1]; break; } }
      let review_text = "";
      if (review_date) {
        const a = text.indexOf(review_date) + review_date.length;
        let b = text.indexOf("주문메뉴"); if (b < 0) b = text.indexOf("주문번호");
        if (b > a) review_text = text.slice(a, b).trim();
      }
      let order_menu = "";
      const mi = text.indexOf("주문메뉴"), oi = text.indexOf("주문번호");
      if (mi >= 0 && oi > mi) order_menu = text.slice(mi + 4, oi).replace(/\\s*ㆍ\\s*/g, " / ").trim();
      // 사장님 답글은 리뷰 줄 바로 다음 줄(tr)에 "사장님 / 날짜 / 수정삭제 / 본문" 순서로 들어있습니다
      let owner_reply = "";
      const nxt = card.nextElementSibling;
      const replySrc = nxt && /사장님/.test(nxt.innerText || "") && !/주문번호/.test(nxt.innerText || "") ? nxt.innerText : (/사장님/.test(text) ? text : "");
      if (replySrc) {
        const lines = replySrc.split("\\n").map(s => s.trim()).filter(Boolean);
        const oi2 = lines.findIndex(l => /^사장님$|사장님 댓글$/.test(l));
        if (oi2 >= 0) owner_reply = lines.slice(oi2 + 1)
          .filter(l => !/^\\d{4}-\\d{2}-\\d{2}$/.test(l) && !/^(수정|삭제|수정삭제|등록하기|등록|취소)$/.test(l))
          .join(" ").trim();
      }
      return {
        external_review_id: "coupangeats_" + om[1], customer_name, rating: rating || null,
        order_count: ocm ? Number(ocm[1]) : null, review_date, review_text, order_menu,
        has_photo: card.querySelectorAll("img").length >= 1, owner_reply,
        // 리뷰 사진 주소 (coupangcdn.com/image/eats_review_api, 로그인 없이 열림)
        photo_urls: Array.from(card.querySelectorAll("img")).map(img => img.currentSrc || img.getAttribute("src") || "").filter(src => /^https?:\\/\\//.test(src)),
        raw_payload: { source: "coupangeats_portal", platform: "coupangeats", crawler: "playwright" },
      };
    }
    // 리뷰 1개 = 표의 한 줄(tr). 주문번호가 정확히 1개 들어있는 tr 만 카드로 봅니다
    for (const tr of document.querySelectorAll("tr")) {
      const t = tr.innerText || "";
      if (((t.match(/주문번호/g) || []).length) !== 1) continue;
      const r = parseCard(tr); if (r) collected.set(r.external_review_id, r);
    }
    return [...collected.values()];
  }
`;

/** 기간 필터를 PERIOD 로 바꾸고 조회. 화면 기본값 '오늘' 은 하루치만 보여줍니다 */
async function selectPeriod(page, period) {
  const trigger = page.getByText(new RegExp("^(" + PERIODS.join("|") + ")$")).first();
  if (!(await trigger.count())) { log("기간 메뉴를 찾지 못해 화면 기본 기간으로 진행합니다"); return false; }
  const current = ((await trigger.innerText().catch(() => "")) || "").trim();
  await trigger.click();
  await sleep(800);
  const option = page.locator("label", { hasText: new RegExp("^" + period + "$") }).first();
  if (!(await option.count())) { log(`'${period}' 항목이 없어 기본 기간(${current})으로 진행합니다`); await page.keyboard.press("Escape").catch(() => {}); return false; }
  await option.click();
  await sleep(400);
  const search = page.locator('button:has-text("조회")').first();
  if (await search.count()) await search.click();
  await sleep(2500);
  log(`기간: ${current} → ${period} 로 조회`);
  return true;
}

const activePage = (page) => page.evaluate(() => (document.querySelector(".merchant-pagination .active")?.textContent || "").trim());

/** 다음 페이지로. 마지막이면 false */
async function goNext(page, before) {
  const next = page.locator(".merchant-pagination button.next-btn").first();
  if (!(await next.count())) {
    // 예전 형태 대비: '다음' 글자 버튼
    const alt = page.locator('button:has-text("다음"), a:has-text("다음"), [aria-label*="다음"], [aria-label*="next" i]').first();
    if (!(await alt.count()) || !(await alt.isEnabled().catch(() => false))) return false;
    await alt.click().catch(() => {});
  } else {
    const cls = (await next.getAttribute("class")) || "";
    if (/hide-btn|disabled/.test(cls) || !(await next.isEnabled().catch(() => false))) return false;
    await next.click().catch(() => {});
  }
  for (let i = 0; i < 20; i++) {
    await sleep(400);
    const now = await activePage(page);
    if (now && now !== before) return true;
  }
  return true; // 페이지 표시가 없어도 일단 진행
}

async function main() {
  const ctx = await openBrowser("coupangeats");
  try {
    const page = ctx.pages()[0] || (await ctx.newPage());
    log(`이동: ${START_URL}`);
    await page.goto(START_URL, { waitUntil: "domcontentloaded", timeout: 60000 }).catch((e) => log("페이지 로딩 지연:", e.message.split("\n")[0]));
    const ready = await waitForPage(page, () => /주문번호|리뷰 작성일/.test(document.body?.innerText || ""), {
      message: "▶ 리뷰 화면을 기다리는 중… 로그인이 필요하면 열린 크롬 창에서 로그인해주세요. 로그인 뒤에는 리뷰 메뉴를 자동으로 찾아갑니다. (최대 10분 대기)",
      assist: clickReviewMenu,
    });
    if (!ready) throw new Error("리뷰 화면을 확인하지 못했습니다.");
    console.log(`REVIEW_URL ${page.url()}`);
    await sleep(1500);

    await selectPeriod(page, args.quick ? "최근 1주일" : PERIOD);

    const all = new Map();
    const known = args.all ? new Set() : await fetchKnownIds(args.ingest, args.token, "coupangeats");
    if (known.size) log(`이미 저장된 리뷰 ${known.size}개 — 새 리뷰만 수집합니다`);
    const maxPages = args.quick ? 1 : 400;
    const scrapeFn = new Function("return (" + SCRAPE + ")")();
    for (let p = 1; p <= maxPages; p++) {
      await sleep(600);
      const items = (await page.evaluate(scrapeFn)) || [];
      let fresh = 0, alreadySaved = 0;
      for (const r of items) {
        if (all.has(r.external_review_id)) continue;
        if (known.has(r.external_review_id)) { alreadySaved++; continue; }
        all.set(r.external_review_id, r); fresh++;
      }
      const shown = await activePage(page);
      log(`${shown || p}페이지: ${items.length}개 (새로 ${fresh}개, 이미 저장됨 ${alreadySaved}개, 누적 ${all.size}개)`);
      if (items.length === 0) { log("리뷰가 없어 종료"); break; }
      if (p === maxPages) break;
      if (!args.all && alreadySaved > 0 && fresh === 0) { log("저장된 리뷰만 나와 중단 (전부 다시 받으려면 --all)"); break; }
      if (!(await goNext(page, shown))) { log("마지막 페이지"); break; }
    }
    await deliver([...all.values()], { platform: "coupangeats", ingest: args.ingest, token: args.token, sourceUrl: page.url() });
  } finally {
    await ctx.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error("오류:", e.message);
  process.exit(1);
});
