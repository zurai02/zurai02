#!/usr/bin/env node
/**
 * Manually migrate legacy database keys to canonical form.
 *
 * NOTE: This also runs automatically on bot startup (see runStartupKeyMigration
 * in src/utils/postgresDatabase.js), which is the recommended path for hosts
 * like Railway where one-off scripts are inconvenient. Use this script only for
 * a dry-run preview or to force a re-run.
 *
 * Usage:
 *   node scripts/migrate-keys.js [--dry-run] [--force]
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveSslConfig } from '../src/config/database/postgres.js';
import { runKeyMigration } from '../src/utils/database/keyMigration.js';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;
const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const CONNECT_TIMEOUT_MS = 10_000;
const MIGRATION_TIMEOUT_MS = 120_000;

function assertConnectionString() {
  const value = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!value) {
    throw new Error('Missing required environment variable: POSTGRES_URL or DATABASE_URL');
  }
  return value;
}

function withTimeout(promise, ms, context) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${context} timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeout]);
}

async function run() {
  const connectionString = assertConnectionString();

  const pool = new Pool({
    connectionString,
    ssl: resolveSslConfig(),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });

  let exiting = false;
  const shutdown = async (signal) => {
    if (exiting) return;
    exiting = true;
    logger.info(`Received ${signal}, closing pool...`, { event: 'migration.shutdown', signal });
    await pool.end().catch(() => {});
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  try {
    // Fast-fail if DB is unreachable
    await withTimeout(pool.query('SELECT 1'), CONNECT_TIMEOUT_MS, 'Database connection');

    const summary = await withTimeout(
      runKeyMigration({ pool, dryRun, force, logger }),
      MIGRATION_TIMEOUT_MS,
      'Key migration'
    );

    if (summary?.alreadyDone) {
      logger.info('Key migration already applied. Use --force to re-run.', {
        event: 'migration.already_done',
        force,
      });
    } else {
      logger.info('Key migration completed', {
        event: 'migration.completed',
        dryRun,
        summary,
      });
    }
  } catch (error) {
    logger.error('Key migration failed', {
      event: 'migration.failed',
      error: error.message,
      stack: error.stack,
      dryRun,
      force,
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
