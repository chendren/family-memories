import type Database from 'better-sqlite3';

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS family_members (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, nickname TEXT, birth_date TEXT,
      death_date TEXT, bio TEXT, photo_path TEXT, gender TEXT, generation INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_fm_name ON family_members(name);

    CREATE TABLE IF NOT EXISTS relationships (
      id TEXT PRIMARY KEY, from_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
      to_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
      relationship_type TEXT NOT NULL, start_date TEXT, end_date TEXT, notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(from_member_id, to_member_id, relationship_type)
    );
    CREATE INDEX IF NOT EXISTS idx_rel_from ON relationships(from_member_id);
    CREATE INDEX IF NOT EXISTS idx_rel_to ON relationships(to_member_id);

    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT, summary TEXT,
      memory_type TEXT NOT NULL, memory_date TEXT, location TEXT, sentiment REAL,
      processing_status TEXT NOT NULL DEFAULT 'pending', processing_error TEXT, metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_mem_type ON memories(memory_type);
    CREATE INDEX IF NOT EXISTS idx_mem_date ON memories(memory_date);
    CREATE INDEX IF NOT EXISTS idx_mem_status ON memories(processing_status);
    CREATE INDEX IF NOT EXISTS idx_mem_created ON memories(created_at);

    CREATE TABLE IF NOT EXISTS media_assets (
      id TEXT PRIMARY KEY, memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL, thumbnail_path TEXT, mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL, width INTEGER, height INTEGER, duration REAL,
      original_name TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_media_mem ON media_assets(memory_id);

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, category TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memory_tags (
      memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      source TEXT NOT NULL DEFAULT 'user', confidence REAL DEFAULT 1.0,
      PRIMARY KEY (memory_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS memory_people (
      memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      family_member_id TEXT NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
      role TEXT, source TEXT NOT NULL DEFAULT 'user', confidence REAL DEFAULT 1.0,
      PRIMARY KEY (memory_id, family_member_id)
    );
    CREATE INDEX IF NOT EXISTS idx_mp_member ON memory_people(family_member_id);

    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY, memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL, value TEXT NOT NULL, context TEXT, confidence REAL DEFAULT 0.8,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_ent_mem ON entities(memory_id);
    CREATE INDEX IF NOT EXISTS idx_ent_type ON entities(entity_type);

    CREATE TABLE IF NOT EXISTS memory_connections (
      id TEXT PRIMARY KEY, source_memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      target_memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      connection_type TEXT NOT NULL, strength REAL NOT NULL, explanation TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(source_memory_id, target_memory_id, connection_type)
    );

    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY, job_type TEXT NOT NULL,
      memory_id TEXT NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 3, error TEXT, payload TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')), started_at TEXT, completed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_job_status ON job_queue(status);

    CREATE TABLE IF NOT EXISTS genealogy_services (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'disconnected',
      last_sync TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
`;

export function runMigrations(db: Database.Database): void {
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  const run = db['exec'].bind(db);
  run(SCHEMA);
}
