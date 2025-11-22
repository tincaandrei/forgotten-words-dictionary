CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  examples TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

