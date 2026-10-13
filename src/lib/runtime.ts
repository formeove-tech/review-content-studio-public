/** Vercel 등 인터넷 서버에서 실행 중인지 (크롬을 열 수 없는 환경) */
export function isCloudRuntime(): boolean {
  return process.env.VERCEL?.trim() === "1" || process.env.STUDIO_CLOUD?.trim() === "1";
}

/** 공개 데모 사이트인지 (가상 데이터만, 수집·AI 호출 없음). NEXT_PUBLIC_ 이라 화면 코드에서도 같은 값을 읽음 */
export function isDemoSite(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_SITE?.trim() === "1";
}
