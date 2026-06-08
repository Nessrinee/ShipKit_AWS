/**
 * database.js — SQLite initialization, migrations, and seeding
 *
 * FIXES APPLIED (v2):
 *   [MEDIUM] Removed duplicate config2 import (was imported twice, named wrong)
 *   [PAYMENT] Added payment_events table for audit trail
 *   [LOW]    Added schema_migrations table for versioned migrations
 *   [LOW]    Admin seeding is idempotent (safe to run multiple times)
 */

'use strict';

const Database = require('better-sqlite3');
const path     = require('path');
const fs       = require('fs');
const bcrypt   = require('bcryptjs');
const config   = require('../config');   // FIX [MEDIUM]: single import at top — removed config2
const logger   = require('../utils/logger');

let db;

const getDb = () => {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
};

const initDb = () => {
  const dbPath = path.resolve(config.db.path);
  const dbDir  = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Performance + safety pragmas
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  db.pragma('synchronous = NORMAL');  // Safe with WAL, better performance

  runMigrations();
  seedAdminUser();

  logger.info('Database initialized', { path: dbPath });
  return db;
};

const runMigrations = () => {
  // Create migrations tracker first
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map((r) => r.version)
  );

  const migrations = [
    {
      version: 1,
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          email       TEXT UNIQUE NOT NULL COLLATE NOCASE,
          password    TEXT NOT NULL,
          role        TEXT NOT NULL DEFAULT 'admin',
          created_at  TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS licenses (
          id             TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          product_id     TEXT NOT NULL,
          email          TEXT NOT NULL COLLATE NOCASE,
          license_key    TEXT UNIQUE NOT NULL,
          order_id       TEXT,
          download_count INTEGER NOT NULL DEFAULT 0,
          max_downloads  INTEGER NOT NULL DEFAULT 5,
          expires_at     TEXT NOT NULL,
          created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_licenses_key   ON licenses(license_key);
        CREATE INDEX IF NOT EXISTS idx_licenses_email ON licenses(email);
        CREATE INDEX IF NOT EXISTS idx_licenses_order ON licenses(order_id);

        CREATE TABLE IF NOT EXISTS download_logs (
          id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          license_id    TEXT NOT NULL REFERENCES licenses(id),
          ip            TEXT,
          user_agent    TEXT,
          downloaded_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS contact_messages (
          id         TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          name       TEXT NOT NULL,
          email      TEXT NOT NULL,
          subject    TEXT NOT NULL,
          message    TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `,
    },
    {
      // FIX [PAYMENT]: Payment audit trail — added in v2
      version: 2,
      sql: `
        CREATE TABLE IF NOT EXISTS payment_events (
          id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          order_id    TEXT NOT NULL,
          product_id  TEXT NOT NULL,
          email       TEXT NOT NULL,
          event_type  TEXT NOT NULL,       -- 'sale', 'refund', 'dispute'
          raw_payload TEXT,                -- sanitized Gumroad payload for audit
          created_at  TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_events(order_id);
      `,
    },
    {
      // Enforce payment idempotency at DB level for non-null order IDs.
      version: 3,
      sql: `
        CREATE UNIQUE INDEX IF NOT EXISTS idx_licenses_order_unique
          ON licenses(order_id)
          WHERE order_id IS NOT NULL;
      `,
    },
  ];

  // Run each migration that hasn't been applied yet
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;

    db.transaction(() => {
      db.exec(migration.sql);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
    })();

    logger.info(`Migration ${migration.version} applied`);
  }
};

// FIX [MEDIUM]: Uses single config import (was config2 — a stale duplicate)
const seedAdminUser = () => {
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(config.admin.email);
  if (!exists) {
    const hash = bcrypt.hashSync(config.admin.password, 12);
    db.prepare('INSERT INTO users (email, password, role) VALUES (?, ?, ?)').run(
      config.admin.email, hash, 'admin'
    );
    logger.info('Admin user seeded', { email: config.admin.email });
  }
};

module.exports = { initDb, getDb };
