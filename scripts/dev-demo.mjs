// 데모 모드 개발 서버 (3402): 가상 데이터만, 진짜 DB·AI 키를 쓰지 않음. 사용: npm run dev:demo
import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "dev", "-p", "3402"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_DEMO_SITE: "1", NEXT_DIST_DIR: ".next-demo", TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "", APP_PASSWORD: "", ANTHROPIC_API_KEY: "", OPENAI_API_KEY: "", INGEST_TOKEN: "", STUDIO_INGEST_URL: "" },
});
child.on("exit", (code) => process.exit(code ?? 0));
