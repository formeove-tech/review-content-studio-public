// 브라우저에서 릴스 영상(MP4)을 그립니다: 캔버스에 장면을 그려 WebCodecs(H.264)로 인코딩 → mp4-muxer 로 파일 조립
// WebCodecs 가 없는 옛 기기는 MediaRecorder(WebM) 로 대신 만듭니다 (실시간 녹화라 영상 길이만큼 걸림)
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import { STYLE_PRESETS, type StylePreset } from "../styles";
import type { StyleKey } from "../types";
import { subtitleFontSize, VIDEO, wrapText, type ScenePlan, type VideoPlan } from "./plan";

export type Progress = (done: number, total: number, stage: string) => void;
export type VideoSupport = "webcodecs" | "mediarecorder" | "none";

export function videoSupport(): VideoSupport {
  if (typeof window === "undefined") return "none";
  if ("VideoEncoder" in window && "VideoFrame" in window) return "webcodecs";
  if ("MediaRecorder" in window && typeof HTMLCanvasElement.prototype.captureStream === "function") return "mediarecorder";
  return "none";
}

const fontLoads = new Map<string, Promise<void>>();
/** 스타일별 글꼴을 브라우저에 등록 (최초 1회) */
function loadFonts(preset: StylePreset): Promise<void> {
  return Promise.all(
    preset.fonts.map((f) => {
      if (!fontLoads.has(f.url)) {
        fontLoads.set(
          f.url,
          new FontFace(f.name, `url(${f.url})`, { weight: String(f.weight) })
            .load()
            .then((face) => { document.fonts.add(face); })
            .catch(() => { fontLoads.delete(f.url); /* 글꼴이 없으면 기본 글꼴로 그림 */ }),
        );
      }
      return fontLoads.get(f.url)!;
    }),
  ).then(() => undefined);
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

const proxied = (url: string) => (url.startsWith("/") ? url : `/api/photo?u=${encodeURIComponent(url)}`); // 같은 사이트 그림은 그대로
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Assets { photos: Map<string, HTMLImageElement>; logo: HTMLImageElement | null; platformLabel: string; preset: StylePreset }

const fontStr = (weight: number, px: number, family: string) => `${weight} ${px}px "${family}", Pretendard, sans-serif`;

/* ---------- 한 프레임 그리기 (스타일별 글꼴·색) ---------- */
function drawFrame(ctx: CanvasRenderingContext2D, plan: VideoPlan, scene: ScenePlan, frameInScene: number, assets: Assets) {
  const { width: W, height: H } = VIDEO;
  const p = assets.preset;
  const c = p.colors;
  const t = scene.frames > 1 ? frameInScene / (scene.frames - 1) : 1;
  const sec = frameInScene / VIDEO.fps;
  const remain = scene.durationSec - sec;
  ctx.save();
  ctx.clearRect(0, 0, W, H);

  // 배경: 사진(천천히 확대·이동) 또는 스타일 색
  const img = scene.photo ? assets.photos.get(scene.photo) || null : null;
  const lightBg = !img && p.key === "friendly";
  const ink = lightBg ? c.ink : "#fff";
  const muted = lightBg ? c.muted : "rgba(255,255,255,0.88)";
  if (img) {
    const cover = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const k = scene.kenBurns.from + (scene.kenBurns.to - scene.kenBurns.from) * easeInOut(t);
    const dw = img.naturalWidth * cover * k, dh = img.naturalHeight * cover * k;
    const px = (W - dw) / 2 + scene.kenBurns.dx * W * (t - 0.5), py = (H - dh) / 2 + scene.kenBurns.dy * H * (t - 0.5);
    ctx.drawImage(img, px, py, dw, dh);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    const [o1, o2, o3, o4] = p.photoOverlay;
    g.addColorStop(0, o1); g.addColorStop(0.35, o2); g.addColorStop(0.66, o3); g.addColorStop(1, o4);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, c.bg); g.addColorStop(1, c.bg2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = lightBg ? "rgba(31,29,26,0.08)" : "rgba(255,255,255,0.08)"; ctx.font = fontStr(p.headlineWeight, 420, p.headlineFont); ctx.textBaseline = "top"; ctx.fillText("“", 60, 240);
  }

  const isClosing = scene.phase === "closing";
  const fade = Math.min(1, sec / 0.35, remain / 0.35 + 0.2); // 자막 등장·퇴장 살짝 부드럽게
  ctx.textBaseline = "alphabetic";
  const strokeOn = !lightBg;

  // 상단: 플랫폼 라벨(왼쪽) · 로고(오른쪽)
  ctx.font = fontStr(500, 32, p.bodyFont);
  const label = assets.platformLabel ? `${assets.platformLabel} 손님 리뷰` : "손님 리뷰";
  const lw = ctx.measureText(label).width + 56;
  roundRect(ctx, 72, 120, lw, 66, 33); ctx.fillStyle = lightBg ? c.pill : "rgba(0,0,0,0.5)"; ctx.fill();
  ctx.fillStyle = ink; ctx.fillText(label, 100, 165);
  if (assets.logo && !isClosing) drawLogo(ctx, assets.logo, W - 72 - 128, 96, 128);

  // 자막
  if (isClosing) {
    // 마무리: 화면을 조금 더 어둡게 한 뒤 로고 크게 + 가게 이름 + CTA
    if (!lightBg) { ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(0, 0, W, H); }
    let y = H / 2 - 260;
    if (assets.logo) { drawLogo(ctx, assets.logo, W / 2 - 160, y, 320); y += 320 + 56; } else y = H / 2 - 120;
    ctx.globalAlpha = fade;
    ctx.textAlign = "center";
    ctx.fillStyle = ink; ctx.font = fontStr(p.headlineWeight, Math.round(76 * p.headlineScale), p.headlineFont);
    shadowText(ctx, plan.storeName || "우리 가게", W / 2, y + 60, 0, strokeOn);
    // 마무리 자막이 가게 이름을 또 쓰면 중복이라 CTA 문장으로 대체
    const sub = scene.subtitle.trim();
    const cta = sub && !(plan.storeName && sub.includes(plan.storeName)) ? sub : plan.cta;
    if (cta) {
      const size = 46; ctx.font = fontStr(p.key === "emotional" || p.key === "friendly" ? 400 : 500, size, p.bodyFont);
      const lines = wrapText(cta, Math.floor(900 / (size * 0.95)));
      lines.forEach((ln, i) => shadowText(ctx, ln, W / 2, y + 60 + 100 + i * size * 1.45, 0, strokeOn));
    }
    ctx.textAlign = "left";
    ctx.globalAlpha = 1;
  } else {
    const text = scene.subtitle;
    if (text) {
      const size = Math.round(subtitleFontSize(text) * p.headlineScale);
      ctx.font = fontStr(p.headlineWeight, size, p.headlineFont);
      const lines = wrapText(text, Math.floor(936 / (size * 0.92)));
      const lh = size * 1.28;
      const baseY = H - 420 - (lines.length - 1) * lh;
      ctx.globalAlpha = fade;
      // 자막 위 포인트 선 (첫 장면)
      if (scene.phase === "opening") { ctx.fillStyle = c.accent; ctx.fillRect(72, baseY - size - 40, 120, 10); }
      ctx.fillStyle = ink;
      lines.forEach((ln, i) => shadowText(ctx, ln, 72, baseY + i * lh, strokeOn ? 10 : 0, strokeOn));
      ctx.globalAlpha = 1;
    }
    // 하단 가게 이름
    ctx.font = fontStr(800, 34, "Pretendard"); ctx.fillStyle = c.accent;
    ctx.beginPath(); ctx.arc(80, H - 118, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink; shadowText(ctx, plan.storeName || "우리 가게", 104, H - 106, 0, strokeOn);
  }

  // 장면 전환: 처음·끝 0.25초 검게
  const edge = Math.min(sec, remain);
  if (edge < 0.25 && !(scene.order === 1 && sec < remain)) { ctx.fillStyle = `rgba(0,0,0,${1 - edge / 0.25})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function drawLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement, x: number, y: number, size: number) {
  ctx.save();
  roundRect(ctx, x, y, size, size, size * 0.18);
  ctx.fillStyle = "#fff"; ctx.fill();
  ctx.clip();
  ctx.drawImage(logo, x, y, size, size);
  ctx.restore();
  ctx.save(); roundRect(ctx, x, y, size, size, size * 0.18); ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = Math.max(3, size * 0.03); ctx.stroke(); ctx.restore();
}
function shadowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, stroke = 0, shadow = true) {
  ctx.save();
  if (shadow) { ctx.shadowColor = "rgba(0,0,0,0.55)"; ctx.shadowBlur = 24; ctx.shadowOffsetY = 4; }
  if (stroke) { ctx.lineJoin = "round"; ctx.lineWidth = stroke; ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.strokeText(text, x, y); }
  ctx.fillText(text, x, y);
  ctx.restore();
}

/* ---------- 렌더 ---------- */
export async function renderVideo(
  plan: VideoPlan,
  { logo, platformLabel, style = "plain", onProgress, signal }: { logo?: string; platformLabel: string; style?: StyleKey; onProgress?: Progress; signal?: AbortSignal },
): Promise<{ blob: Blob; ext: "mp4" | "webm" }> {
  const support = videoSupport();
  if (support === "none") throw new Error("이 기기의 브라우저는 영상 만들기를 지원하지 않아요. 최신 크롬(PC/안드로이드) 또는 아이폰 사파리에서 열어주세요.");

  const preset = STYLE_PRESETS[style] || STYLE_PRESETS.plain;
  onProgress?.(0, plan.totalFrames, "사진·글꼴 준비 중");
  await loadFonts(preset);
  const photos = new Map<string, HTMLImageElement>();
  await Promise.all(Array.from(new Set(plan.scenes.map((s) => s.photo).filter((p): p is string => Boolean(p)))).map(async (u) => {
    const img = await loadImage(proxied(u));
    if (img) photos.set(u, img);
  }));
  const logoImg = logo ? await loadImage(logo) : null;
  const assets: Assets = { photos, logo: logoImg, platformLabel, preset };

  const canvas = document.createElement("canvas");
  canvas.width = VIDEO.width; canvas.height = VIDEO.height;
  const ctx = canvas.getContext("2d", { alpha: false })!;

  if (support === "webcodecs") return { blob: await encodeWebCodecs(canvas, ctx, plan, assets, onProgress, signal), ext: "mp4" };
  return { blob: await recordMediaRecorder(canvas, ctx, plan, assets, onProgress, signal), ext: "webm" };
}

async function encodeWebCodecs(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, plan: VideoPlan, assets: Assets, onProgress?: Progress, signal?: AbortSignal): Promise<Blob> {
  const { width, height, fps } = VIDEO;
  let config: VideoEncoderConfig | null = null;
  for (const codec of ["avc1.640028", "avc1.4d0028", "avc1.42e028", "avc1.640032"]) {
    // 사진 슬라이드 영상은 5Mbps 면 충분 (30초 ≈ 19MB). 인스타가 올릴 때 다시 압축함
    const c: VideoEncoderConfig = { codec, width, height, bitrate: 5_000_000, framerate: fps, latencyMode: "quality" };
    const ok = await VideoEncoder.isConfigSupported(c).then((r) => r.supported).catch(() => false);
    if (ok) { config = c; break; }
  }
  if (!config) throw new Error("이 기기는 MP4(H.264) 인코딩을 지원하지 않아요. PC 크롬에서 다시 시도해주세요.");

  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: "avc", width, height }, fastStart: "in-memory", firstTimestampBehavior: "offset" });
  let encodeError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { encodeError = e instanceof Error ? e : new Error(String(e)); },
  });
  encoder.configure(config);

  const usPerFrame = Math.round(1_000_000 / fps);
  let frameNo = 0;
  for (const scene of plan.scenes) {
    for (let f = 0; f < scene.frames; f++) {
      if (signal?.aborted) { encoder.close(); throw new Error("취소했어요."); }
      if (encodeError) throw encodeError;
      drawFrame(ctx, plan, scene, f, assets);
      const frame = new VideoFrame(canvas, { timestamp: frameNo * usPerFrame, duration: usPerFrame });
      encoder.encode(frame, { keyFrame: frameNo % (fps * 2) === 0 });
      frame.close();
      frameNo++;
      if (frameNo % 5 === 0) {
        onProgress?.(frameNo, plan.totalFrames, "영상 만드는 중");
        while (encoder.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 4));
        // 화면 갱신 틈 주기 (requestAnimationFrame 은 탭이 가려지면 멈추므로 setTimeout 사용)
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  }
  await encoder.flush();
  if (encodeError) throw encodeError;
  encoder.close();
  muxer.finalize();
  onProgress?.(plan.totalFrames, plan.totalFrames, "완료");
  return new Blob([muxer.target.buffer], { type: "video/mp4" });
}

async function recordMediaRecorder(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, plan: VideoPlan, assets: Assets, onProgress?: Progress, signal?: AbortSignal): Promise<Blob> {
  const stream = canvas.captureStream(VIDEO.fps);
  const mime = ["video/mp4", "video/webm;codecs=vp9", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m)) || "";
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8_000_000 } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const done = new Promise<void>((resolve) => { rec.onstop = () => resolve(); });
  rec.start(250);
  const frameMs = 1000 / VIDEO.fps;
  let frameNo = 0;
  const t0 = performance.now();
  for (const scene of plan.scenes) {
    for (let f = 0; f < scene.frames; f++) {
      if (signal?.aborted) { rec.stop(); throw new Error("취소했어요."); }
      drawFrame(ctx, plan, scene, f, assets);
      frameNo++;
      if (frameNo % 5 === 0) onProgress?.(frameNo, plan.totalFrames, "녹화 중 (영상 길이만큼 걸려요)");
      const target = t0 + frameNo * frameMs;
      const wait = target - performance.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
  }
  rec.stop();
  await done;
  onProgress?.(plan.totalFrames, plan.totalFrames, "완료");
  return new Blob(chunks, { type: rec.mimeType || "video/webm" });
}
