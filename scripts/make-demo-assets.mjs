// 데모 사이트용 가상 음식 그림 8장 + 가상 로고를 만듭니다 (손님 사진·실제 가게 로고는 공개하지 않기 위해)
// 실행: node scripts/make-demo-assets.mjs  →  public/demo/photo-1..8.jpg, public/demo/logo.png, src/lib/demo/logo-data.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "demo");
fs.mkdirSync(OUT, { recursive: true });

// 간단한 난수 (같은 그림이 항상 나오게)
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const W = 810, H = 1080;
const THEMES = [
  { name: "얼큰", soup: "#c2371d", soup2: "#e0562b", wood: ["#c9a37a", "#a97f55"], bowl: "#2a2523", meat: "#e9c9a0", garnish: "#3f8f3a" },
  { name: "맑은", soup: "#f1e7d3", soup2: "#fbf5e8", wood: ["#d7bd9a", "#b99870"], bowl: "#34302d", meat: "#e8d3b6", garnish: "#4c9a45" },
  { name: "순대", soup: "#e7d9bd", soup2: "#f4ead3", wood: ["#bf9a72", "#9c7650"], bowl: "#2b2724", meat: "#8c4a3b", garnish: "#3a8a3a" },
  { name: "수육", soup: "#f5efe4", soup2: "#fff8ec", wood: ["#cdb08b", "#a98960"], bowl: "#3b3631", meat: "#f0cfb0", garnish: "#5aa650" },
  { name: "뼈해장", soup: "#a8321a", soup2: "#cf4a24", wood: ["#bb946b", "#9a7249"], bowl: "#262120", meat: "#d9a77e", garnish: "#2f7d34" },
  { name: "내장", soup: "#d9c7a2", soup2: "#ecdfc2", wood: ["#c4a077", "#a37c52"], bowl: "#2d2926", meat: "#c88f6b", garnish: "#3b8b3b" },
  { name: "순두부", soup: "#d6391f", soup2: "#f06a3a", wood: ["#d2b08a", "#b08a62"], bowl: "#25201e", meat: "#f7ecd9", garnish: "#3c8c3a" },
  { name: "곰탕", soup: "#efe8dc", soup2: "#faf5ea", wood: ["#c8a883", "#a7845c"], bowl: "#38332f", meat: "#e6cdb0", garnish: "#58a24e" },
];

function bowlSvg(t, seed) {
  const r = rng(seed);
  const cx = 405 + (r() - 0.5) * 60, cy = 560 + (r() - 0.5) * 60;
  const R = 300;
  let bits = "";
  // 고기 조각
  for (let i = 0; i < 9; i++) {
    const a = r() * Math.PI * 2, d = r() * 190;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    bits += `<rect x="${x - 38}" y="${y - 16}" width="${60 + r() * 30}" height="${26 + r() * 10}" rx="12" fill="${t.meat}" opacity="0.92" transform="rotate(${r() * 180} ${x} ${y})"/>`;
  }
  // 파
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2, d = r() * 215;
    const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d;
    bits += `<ellipse cx="${x}" cy="${y}" rx="${9 + r() * 6}" ry="${5 + r() * 3}" fill="${t.garnish}" opacity="0.9" transform="rotate(${r() * 180} ${x} ${y})"/>`;
  }
  // 깨·고춧가루 점
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = r() * 230;
    bits += `<circle cx="${cx + Math.cos(a) * d}" cy="${cy + Math.sin(a) * d}" r="${2 + r() * 2.5}" fill="${r() > 0.5 ? "#f6e9c8" : "#7d1f10"}" opacity="0.8"/>`;
  }
  // 김 (위쪽 흐린 곡선)
  const steam = [0, 1, 2].map((k) => `<path d="M${cx - 80 + k * 80} ${cy - R - 10} q -30 -60 0 -110 q 30 -50 0 -100" stroke="#ffffff" stroke-opacity="0.35" stroke-width="16" fill="none" stroke-linecap="round" filter="url(#bl)"/>`).join("");
  // 반찬 접시 2개
  const side = (x, y, c1, c2) => `<circle cx="${x}" cy="${y}" r="92" fill="#ece7e0"/><circle cx="${x}" cy="${y}" r="78" fill="${c1}"/>` +
    Array.from({ length: 9 }, (_, i) => `<rect x="${x - 55 + (i % 3) * 38}" y="${y - 50 + Math.floor(i / 3) * 34}" width="28" height="22" rx="5" fill="${c2}" opacity="0.9" transform="rotate(${(i * 37) % 40} ${x} ${y})"/>`).join("");
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="wd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.wood[0]}"/><stop offset="1" stop-color="${t.wood[1]}"/></linearGradient>
    <radialGradient id="soup" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="${t.soup2}"/><stop offset="1" stop-color="${t.soup}"/></radialGradient>
    <filter id="bl"><feGaussianBlur stdDeviation="9"/></filter>
    <filter id="sh"><feGaussianBlur stdDeviation="22"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#wd)"/>
  ${Array.from({ length: 14 }, (_, i) => `<rect x="0" y="${i * 78 + 10}" width="${W}" height="3" fill="#000" opacity="0.07"/>`).join("")}
  <ellipse cx="${cx + 22}" cy="${cy + 36}" rx="${R + 12}" ry="${R + 4}" fill="#000" opacity="0.35" filter="url(#sh)"/>
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="${t.bowl}"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 26}" fill="#171413"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 36}" fill="url(#soup)"/>
  <circle cx="${cx}" cy="${cy}" r="${R - 36}" fill="none" stroke="#000" stroke-opacity="0.18" stroke-width="10"/>
  ${bits}
  ${steam}
  ${side(130, 190, "#f4eee3", "#c0371d")}
  ${side(690, 920, "#f4eee3", "#d9d3c6")}
  <rect x="610" y="150" width="14" height="330" rx="7" fill="#d9d2c8" transform="rotate(18 617 315)"/>
  <ellipse cx="560" cy="120" rx="40" ry="26" fill="#d9d2c8" transform="rotate(18 560 120)"/>
</svg>`;
}

for (let i = 0; i < THEMES.length; i++) {
  const svg = bowlSvg(THEMES[i], 11 + i * 7);
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(path.join(OUT, `photo-${i + 1}.jpg`));
}

// 가상 로고: 둥근 사각형 + "가상국밥" 글자 (글꼴 없이 단순 도형 + 텍스트)
const logoSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
  <rect width="320" height="320" fill="#ffd84a"/>
  <path d="M60 120 Q160 40 260 120" stroke="#1f1d1a" stroke-width="20" fill="none" stroke-linecap="round"/>
  <rect x="86" y="120" width="148" height="14" rx="7" fill="#1f1d1a"/>
  <text x="160" y="210" font-family="Malgun Gothic, Noto Sans CJK KR, sans-serif" font-size="68" font-weight="900" text-anchor="middle" fill="#1f1d1a">가상</text>
  <text x="160" y="282" font-family="Malgun Gothic, Noto Sans CJK KR, sans-serif" font-size="68" font-weight="900" text-anchor="middle" fill="#c8321f">국밥</text>
</svg>`;
const logoBuf = await sharp(Buffer.from(logoSvg)).resize(160, 160).png({ compressionLevel: 9, palette: true }).toBuffer();
fs.writeFileSync(path.join(OUT, "logo.png"), logoBuf);
const dataUrl = "data:image/png;base64," + logoBuf.toString("base64");
fs.mkdirSync(path.join(ROOT, "src", "lib", "demo"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "src", "lib", "demo", "logo-data.ts"), `// 가상 로고 (scripts/make-demo-assets.mjs 로 생성)\nexport const DEMO_LOGO = "${dataUrl}";\n`);
console.log("완료:", OUT, "로고", Math.round(logoBuf.length / 1024), "KB");
