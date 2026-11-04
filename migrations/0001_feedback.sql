CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  message TEXT NOT NULL CHECK (length(message) <= 1000),
  category TEXT NOT NULL CHECK (category IN ('general','praise','bug','idea')),
  build_version TEXT NOT NULL,
  phase TEXT NOT NULL,
  play_mode TEXT NOT NULL,
  source_key TEXT NOT NULL,
  body_hash TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS feedback_newest ON feedback(created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS feedback_rate ON feedback(source_key, created_at);
