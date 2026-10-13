// 슬라이드 PNG 렌더 공용 코드 (리뷰 1개 · 묶음 라우트가 함께 사용). next/og(satori) 기반. 스타일 4종 지원
import { ImageResponse } from "next/og";
import { headlineFontSize, isAllowedPhotoUrl, SLIDE_SIZES, type SlideSize, type SlideSpec } from "./slides";
import { splitHighlight, STYLE_PRESETS, type FontFile, type StylePreset } from "./styles";
import type { StyleKey } from "./types";

/* ---------- 글꼴 (스타일별로 최초 1회 받아서 메모리에 보관) ---------- */
type Font = { name: string; data: ArrayBuffer; weight: 400 | 500 | 700 | 800; style: "normal" };
const g = globalThis as unknown as { __slideFontCache?: Map<string, Promise<Font>> };
function fontCache() {
  if (!g.__slideFontCache) g.__slideFontCache = new Map();
  return g.__slideFontCache;
}
async function loadFont(f: FontFile): Promise<Font> {
  const cache = fontCache();
  if (!cache.has(f.url)) {
    cache.set(
      f.url,
      (async () => {
        const res = await fetch(f.url, { cache: "force-cache" });
        if (!res.ok) throw new Error("글꼴을 받지 못했습니다: " + f.url);
        return { name: f.name, data: await res.arrayBuffer(), weight: f.weight, style: "normal" as const };
      })().catch((e) => {
        cache.delete(f.url);
        throw e;
      }),
    );
  }
  return cache.get(f.url)!;
}
export function loadFonts(style: StyleKey): Promise<Font[]> {
  return Promise.all(STYLE_PRESETS[style].fonts.map(loadFont));
}

/* ---------- 사진 (공개 CDN 만, data URL 로 변환해 satori 에 전달) ---------- */
export async function fetchPhoto(url: string, origin = ""): Promise<string | null> {
  if (!isAllowedPhotoUrl(url)) return null;
  try {
    const res = await fetch(url.startsWith("/") ? origin + url : url, { headers: { "user-agent": "Mozilla/5.0" }, cache: "force-cache" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 8 * 1024 * 1024) return null;
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** 슬라이드 1장을 PNG 응답으로 */
export async function renderSlideResponse(slide: SlideSpec, size: SlideSize, storeLogo: string, origin = ""): Promise<ImageResponse> {
  const preset = STYLE_PRESETS[slide.style];
  const [fonts, photo] = await Promise.all([loadFonts(slide.style), slide.photo ? fetchPhoto(slide.photo, origin) : Promise.resolve(null)]);
  const logo = storeLogo && storeLogo.startsWith("data:image/") ? storeLogo : null;
  const { width, height } = SLIDE_SIZES[size];
  return new ImageResponse(<Slide slide={slide} preset={preset} photo={photo} logo={logo} size={size} width={width} height={height} />, {
    width,
    height,
    fonts,
    headers: { "Cache-Control": "private, max-age=300" },
  });
}

/* ---------- 디자인: 사진 위 그라데이션 + 스타일별 글꼴·색 + 강조 구절 + 가게 이름·로고 ---------- */
function Slide({ slide, preset, photo, logo, size, width, height }: { slide: SlideSpec; preset: StylePreset; photo: string | null; logo: string | null; size: SlideSize; width: number; height: number }) {
  const pad = 72;
  const c = preset.colors;
  const hSize = headlineFontSize(slide.headline, size, preset.headlineScale);
  const bSize = size === "threads" ? 34 : 38;
  const isCover = slide.role === "cover";
  const isClosing = slide.role === "closing";
  const lightBg = !photo && preset.key === "friendly"; // 사진 없는 친근 스타일은 밝은 배경
  const ink = lightBg ? c.ink : "#fff";
  const muted = lightBg ? c.muted : "rgba(255,255,255,0.88)";
  const pillBg = lightBg ? c.pill : "rgba(0,0,0,0.45)";
  const [o1, o2, o3, o4] = preset.photoOverlay;
  const lines = slide.headline.split("\n").map((l) => l.trim()).filter(Boolean);
  const shadow = lightBg ? "none" : "0 4px 24px rgba(0,0,0,0.45)";
  return (
    <div style={{ width, height, display: "flex", position: "relative", fontFamily: preset.bodyFont, color: ink, background: c.bg }}>
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" width={width} height={height} style={{ position: "absolute", top: 0, left: 0, width, height, objectFit: "cover" }} />
      ) : (
        <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex", background: `linear-gradient(160deg, ${c.bg} 0%, ${c.bg2} 100%)` }} />
      )}
      {/* 사진 위 어둡게: 위는 살짝, 아래는 진하게 → 글씨가 잘 읽힘 */}
      <div style={{ position: "absolute", top: 0, left: 0, width, height, display: "flex", background: photo ? `linear-gradient(180deg, ${o1} 0%, ${o2} 35%, ${o3} 72%, ${o4} 100%)` : "transparent" }} />
      {!photo ? <div style={{ position: "absolute", top: pad + 70, left: pad - 6, display: "flex", fontSize: 300, fontFamily: preset.headlineFont, fontWeight: preset.headlineWeight, color: lightBg ? "rgba(31,29,26,0.08)" : "rgba(255,255,255,0.10)", lineHeight: 1 }}>“</div> : null}

      {/* 상단: 플랫폼 라벨 · 페이지 번호 */}
      <div style={{ position: "absolute", top: pad - 16, left: pad, right: pad, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", background: pillBg, borderRadius: 999, padding: "10px 22px", fontSize: 26, fontWeight: 500, letterSpacing: 1, color: ink }}>
          {slide.platformLabel ? `${slide.platformLabel} 손님 리뷰` : "손님 리뷰"}
        </div>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: muted }}>{slide.index} / {slide.total}</div>
      </div>

      {/* 본문: 사진이 있으면 아래쪽, 없으면 세로 가운데 */}
      <div
        style={
          photo
            ? { position: "absolute", left: pad, right: pad, bottom: pad + 96, display: "flex", flexDirection: "column", alignItems: isClosing ? "center" : "flex-start", textAlign: isClosing ? "center" : "left" }
            : { position: "absolute", left: pad, right: pad, top: pad + 60, bottom: pad + 96, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: isClosing ? "center" : "flex-start", textAlign: isClosing ? "center" : "left" }
        }
      >
        {isCover ? <div style={{ display: "flex", width: 120, height: 10, background: c.accent, borderRadius: 6, marginBottom: 28 }} /> : null}
        {slide.role === "intro" ? <div style={{ display: "flex", fontSize: 28, fontWeight: 500, color: c.accent, marginBottom: 18, letterSpacing: 2 }}>INTRO</div> : null}
        <div style={{ display: "flex", flexDirection: "column", fontFamily: preset.headlineFont, fontSize: hSize, fontWeight: preset.headlineWeight, lineHeight: 1.16, letterSpacing: preset.letterSpacing, textShadow: shadow }}>
          {lines.map((line, i) => {
            const { before, hit, after } = splitHighlight(line, slide.highlight);
            return (
              <div key={i} style={{ display: "flex", flexWrap: "wrap", justifyContent: isClosing ? "center" : "flex-start" }}>
                {before ? <span style={{ whiteSpace: "pre" }}>{before}</span> : null}
                {hit ? <span style={{ whiteSpace: "pre", color: c.accent }}>{hit}</span> : null}
                {after ? <span style={{ whiteSpace: "pre" }}>{after}</span> : null}
              </div>
            );
          })}
        </div>
        {slide.body ? (
          <div style={{ display: "flex", marginTop: 26, fontSize: bSize, fontWeight: preset.key === "emotional" || preset.key === "friendly" ? 400 : 500, lineHeight: 1.5, color: muted, wordBreak: "keep-all", textShadow: lightBg ? "none" : "0 2px 12px rgba(0,0,0,0.5)" }}>{slide.body}</div>
        ) : null}
      </div>

      {/* 하단: 로고 · 가게 이름 */}
      <div style={{ position: "absolute", left: pad, right: pad, bottom: pad - 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800, color: ink }}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" width={64} height={64} style={{ width: 64, height: 64, borderRadius: 14, marginRight: 16, objectFit: "cover", border: "2px solid rgba(255,255,255,0.9)" }} />
          ) : (
            <div style={{ display: "flex", width: 14, height: 14, borderRadius: 7, background: c.accent, marginRight: 14 }} />
          )}
          {slide.storeName || "우리 가게"}
        </div>
        {slide.index < slide.total ? <div style={{ display: "flex", fontSize: 26, fontWeight: 500, color: muted }}>넘겨보기 →</div> : null}
      </div>
    </div>
  );
}
