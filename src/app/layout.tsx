import type { Metadata } from "next";
import "./globals.css";
import { DemoBanner } from "@/components/DemoBanner";
import { Nav } from "@/components/Nav";
import { isDemoSite } from "@/lib/runtime";

export const metadata: Metadata = {
  title: "리뷰 콘텐츠 스튜디오",
  description: "배달앱 리뷰를 모아 인스타·릴스·새소식 콘텐츠로 바꿔주는 도구",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 비밀번호 잠금이 켜져 있을 때만 상단에 '로그아웃' 버튼을 보여줍니다 (공용 폰에서 로그인 상태를 끊을 수 있게)
  const authEnabled = Boolean(process.env.APP_PASSWORD?.trim()) && process.env.APP_PASSWORD_DISABLED?.trim() !== "1";
  return (
    <html lang="ko">
      <body className="min-h-screen">
        {isDemoSite() ? <DemoBanner /> : null}
        <Nav authEnabled={authEnabled} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6">{children}</main>
      </body>
    </html>
  );
}
