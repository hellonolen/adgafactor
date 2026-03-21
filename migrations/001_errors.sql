-- Error groups: deduplicated by fingerprint
CREATE TABLE IF NOT EXISTS error_groups (
  id          TEXT PRIMARY KEY,
  fingerprint TEXT NOT NULL UNIQUE,
  type        TEXT NOT NULL DEFAULT 'error',
  message     TEXT NOT NULL,
  stack_top   TEXT,
  first_seen  INTEGER NOT NULL,
  last_seen   INTEGER NOT NULL,
  count       INTEGER NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'open'  -- open | resolved | ignored
);

CREATE INDEX IF NOT EXISTS idx_groups_status     ON error_groups(status);
CREATE INDEX IF NOT EXISTS idx_groups_last_seen  ON error_groups(last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_groups_count      ON error_groups(count DESC);

-- Individual error events
CREATE TABLE IF NOT EXISTS error_events (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL REFERENCES error_groups(id),
  session_id  TEXT NOT NULL,
  user_id     TEXT,
  url         TEXT,
  message     TEXT NOT NULL,
  stack       TEXT,
  type        TEXT,
  breadcrumbs TEXT,   -- JSON array
  context     TEXT,   -- JSON: browser, OS, viewport, etc.
  timestamp   INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_group_id   ON error_events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_session_id ON error_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_timestamp  ON error_events(timestamp DESC);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id             TEXT PRIMARY KEY,
  user_id        TEXT,
  user_agent     TEXT,
  url            TEXT,
  started_at     INTEGER NOT NULL,
  last_activity  INTEGER NOT NULL,
  has_replay     INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sessions_started ON sessions(started_at DESC);
