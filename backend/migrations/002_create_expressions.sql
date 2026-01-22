CREATE TABLE IF NOT EXISTS expressions (
  id SERIAL PRIMARY KEY,
  expression TEXT NOT NULL,
  meaning TEXT NOT NULL,
  examples TEXT,
  audio_bytes BYTEA,
  audio_mime TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expressions_expression ON expressions (expression);
