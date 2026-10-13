// 리뷰 사진 프록시: 브라우저 캔버스(영상 만들기)가 다른 사이트 사진을 그대로 쓰면 "오염(tainted)"돼 파일로 못 뽑기 때문에
// 같은 주소(우리 서버)를 거쳐 전달합니다. 우리가 아는 공개 CDN 만 허용.
import { NextResponse, type NextRequest } from "next/server";
import { isAllowedPhotoUrl } from "@/lib/slides";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u") || "";
  if (!isAllowedPhotoUrl(u)) return NextResponse.json({ ok: false, message: "허용되지 않은 사진 주소예요." }, { status: 400 });
  try {
    const res = await fetch(u.startsWith("/") ? req.nextUrl.origin + u : u, { headers: { "user-agent": "Mozilla/5.0" }, cache: "force-cache" });
    if (!res.ok) return NextResponse.json({ ok: false, message: "사진을 받지 못했어요." }, { status: 502 });
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 12 * 1024 * 1024) return NextResponse.json({ ok: false, message: "사진이 너무 커요." }, { status: 413 });
    return new NextResponse(buf, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, message: "사진을 받지 못했어요." }, { status: 502 });
  }
}
