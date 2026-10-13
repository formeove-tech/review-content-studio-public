// 테이블 정의 (앱과 마이그레이션 스크립트가 함께 사용)
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  external_id TEXT NOT NULL,
  store_id TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  rating INTEGER,
  order_count INTEGER,
  review_date TEXT NOT NULL DEFAULT '',
  review_text TEXT NOT NULL DEFAULT '',
  order_menu TEXT NOT NULL DEFAULT '',
  delivery_review TEXT NOT NULL DEFAULT '',
  has_photo INTEGER NOT NULL DEFAULT 0,
  photo_urls TEXT NOT NULL DEFAULT '[]',
  owner_reply TEXT NOT NULL DEFAULT '',
  categories TEXT NOT NULL DEFAULT '[]',
  sentiment TEXT NOT NULL DEFAULT 'neutral',
  score INTEGER NOT NULL DEFAULT 0,
  bookmarked INTEGER NOT NULL DEFAULT 0,
  bookmark_note TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  raw_json TEXT NOT NULL DEFAULT '',
  collected_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(platform, external_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_date ON reviews(review_date);
CREATE INDEX IF NOT EXISTS idx_reviews_score ON reviews(score);
CREATE TABLE IF NOT EXISTS contents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  review_id INTEGER NOT NULL,
  bundle_id INTEGER,
  kind TEXT NOT NULL,
  payload TEXT NOT NULL,
  key_quote TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_contents_review ON contents(review_id);
CREATE TABLE IF NOT EXISTS weekly_best (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week_start TEXT NOT NULL UNIQUE,
  week_end TEXT NOT NULL,
  summary TEXT NOT NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  model TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS bundles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL DEFAULT '',
  review_ids TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'manual',
  theme TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS crawl_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stop_requested INTEGER NOT NULL DEFAULT 0,
  log TEXT NOT NULL DEFAULT '[]',
  result TEXT,
  requested_at TEXT NOT NULL,
  started_at TEXT,
  finished_at TEXT,
  updated_at TEXT NOT NULL
);
`;

export const TABLES = ["reviews", "contents", "weekly_best", "settings", "crawl_jobs", "bundles"];

// 기존 DB에 나중에 추가된 칸. 없으면 ALTER TABLE 로 붙입니다 (앱 시작 시 1회)
export const COLUMN_MIGRATIONS = [
  { table: "reviews", column: "photo_urls", sql: "ALTER TABLE reviews ADD COLUMN photo_urls TEXT NOT NULL DEFAULT '[]'" },
  { table: "contents", column: "bundle_id", sql: "ALTER TABLE contents ADD COLUMN bundle_id INTEGER" },
];
