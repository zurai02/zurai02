#!/usr/bin/env node
/**
 * Restore drill - tests backup integrity by restoring to a temporary database.
 *
 * Usage:
 *   node scripts/restore-drill.js [--keep-db] [--retention-days=N] [--backup-dir=PATH] [--dry-run]
 */

import { spawnSync } from 'node:child_process';
import { mkdir, readdir, stat, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { Pool } = pg;

// Imported after dotenv.config so resolveSslConfig sees the loaded env vars.
const { resolveSslConfig } = await import('../src/config/database/postgres.js');

const CONNECT_TIMEOUT_MS = 10_000;

// ─── Argument Parsing ─────────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=');
    if (typeof inlineValue !== 'undefined') {
      args[rawKey] = inlineValue;
      continue;
    }

    const nextToken = argv[index + 1];
    if (!nextToken || nextToken.startsWith('--')) {
      args[rawKey] = true;
      continue;
    }

    args[rawKey] = nextToken;
    index += 1;
  }

  return args;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function ensureCommand(command) {
  const checkCmd = process.platform === 'win32' ? 'where' : 'which';
  const result = spawnSync(checkCmd, [command], {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} is required but was not found in PATH.`);
  }
}

function createTimestamp() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}-${String(now.getUTCMilliseconds()).padStart(3, '0')}`;
}

function parseDatabaseUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('POSTGRES_URL is not a valid URL');
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('POSTGRES_URL must use the postgresql:// protocol');
  }

  const database = decodeURIComponent(parsed.pathname.slice(1));
  if (!parsed.hostname || !database) {
    throw new Error('POSTGRES_URL must include host and database name');
  }

  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function buildPgEnv(credentials, databaseName = credentials.database) {
  return {
    ...process.env,
    PGHOST: credentials.host,
    PGPORT: credentials.port,
    PGUSER: credentials.user,
    PGPASSWORD: credentials.password,
    PGDATABASE: databaseName,
  };
}

function runCommand(command, args, env) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
    env,
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || 'Unknown error'}`);
  }

  return result.stdout;
}

async function pruneBackups(backupDir, retentionDays) {
  if (!Number.isFinite(retentionDays) || retentionDays <= 0) {
    return;
  }

  let entries;
  try {
    entries = await readdir(backupDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return;
    }
    throw error;
  }

  const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
  let removed = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.dump')) {
      continue;
    }

    const fullPath = path.join(backupDir, entry.name);
    const fileStats = await stat(fullPath);
    if (fileStats.mtimeMs < cutoff) {
      await unlink(fullPath);
      removed += 1;
    }
  }

  if (removed > 0) {
    logger.info(`Pruned ${removed} old backup file(s)`, {
      event: 'restore_drill.prune.completed',
      removed,
      retentionDays,
    });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const args = parseArgs(process.argv.slice(2));

  const sourceDatabaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!sourceDatabaseUrl) {
    throw new Error('Missing required environment variable: POSTGRES_URL or DATABASE_URL');
  }

  const credentials = parseDatabaseUrl(sourceDatabaseUrl);
  const keepDrillDatabase = [true, 'true', '1'].includes(args['keep-db']);
  const retentionDays = Number.parseInt(
    args['retention-days'] ?? process.env.BACKUP_RETENTION_DAYS ?? '14',
    10
  );
  const backupDir = path.resolve(
    args['backup-dir'] ?? process.env.BACKUP_DIR ?? path.join(process.cwd(), 'backups')
  );
  const dryRun = args['dry-run'] === true || args['dry-run'] === 'true';

  ensureCommand('pg_dump');
  ensureCommand('pg_restore');

  await mkdir(backupDir, { recursive: true });

  const stamp = createTimestamp();
  const backupPath = path.join(backupDir, `restore-drill-${stamp}.dump`);
  const drillDatabaseName = `titanbot_restore_drill_${stamp}`;

  const maintenancePool = new Pool({
    host: credentials.host,
    port: credentials.port,
    user: credentials.user,
    password: credentials.password,
    database: 'postgres',
    ssl: resolveSslConfig(),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });

  let drillPool = null;
  let cleanupPerformed = false;

  const cleanupDrillDatabase = async (reason) => {
    if (cleanupPerformed || keepDrillDatabase) {
      return;
    }
    cleanupPerformed = true;

    logger.info(`Cleaning up drill database (${reason})...`, {
      event: 'restore_drill.cleanup',
      reason,
      drillDatabaseName,
    });

    const client = await maintenancePool.connect();
    try {
      // Terminate any lingering connections with a brief backoff
      for (let attempt = 0; attempt < 3; attempt += 1) {
        await client.query(
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
          [drillDatabaseName]
        );
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 200));
        }
      }

      await client.query(`DROP DATABASE IF EXISTS "${drillDatabaseName}"`);
      logger.info('Drill database cleaned up', {
        event: 'restore_drill.cleanup_done',
        drillDatabaseName,
      });
    } catch (error) {
      logger.error('Failed to cleanup drill database', {
        event: 'restore_drill.cleanup_failed',
        error: error.message,
        drillDatabaseName,
      });
    } finally {
      client.release();
    }
  };

  const shutdown = async (signal) => {
    logger.info(`Received ${signal}, shutting down...`, {
      event: 'restore_drill.shutdown',
      signal,
    });
    await cleanupDrillDatabase('signal');
    if (drillPool) await drillPool.end();
    await maintenancePool.end();
    process.exit(0);
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  try {
    if (dryRun) {
      logger.info('[DRY RUN] Would create backup and restore drill database', {
        event: 'restore_drill.dry_run',
        drillDatabaseName,
        backupPath,
        sourceDatabase: credentials.database,
      });
      return;
    }

    logger.info('Starting restore drill', {
      event: 'restore_drill.start',
      drillDatabaseName,
      sourceDatabase: credentials.database,
    });

    // Dump using env vars (password never appears in process list)
    runCommand(
      'pg_dump',
      ['--format=custom', '--no-owner', '--no-privileges', '--file', backupPath, credentials.database],
      buildPgEnv(credentials)
    );

    const { size } = await stat(backupPath);
    logger.info('Backup created', {
      event: 'restore_drill.backup_created',
      backupPath,
      sizeBytes: size,
      sizeMb: Number((size / 1024 / 1024).toFixed(2)),
    });

    // Create temporary drill database
    const createClient = await maintenancePool.connect();
    try {
      await createClient.query(`CREATE DATABASE "${drillDatabaseName}" TEMPLATE template0`);
    } finally {
      createClient.release();
    }

    // Restore into drill database
    runCommand(
      'pg_restore',
      [
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '--exit-on-error',
        '--dbname',
        drillDatabaseName,
        backupPath,
      ],
      buildPgEnv(credentials, drillDatabaseName)
    );

    // Verify restoration
    drillPool = new Pool({
      host: credentials.host,
      port: credentials.port,
      user: credentials.user,
      password: credentials.password,
      database: drillDatabaseName,
      ssl: resolveSslConfig(),
      connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
    });

    const tableCount = await drillPool.query(
      `SELECT COUNT(*)::int AS value FROM information_schema.tables WHERE table_schema = 'public'`
    );

    const migrationTableCount = await drillPool.query(
      `SELECT COUNT(*)::int AS value FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'schema_migrations'`
    );

    if (tableCount.rows[0]?.value <= 0) {
      throw new Error('Restore drill verification failed: no public tables restored.');
    }

    if (migrationTableCount.rows[0]?.value <= 0) {
      throw new Error('Restore drill verification failed: schema_migrations table missing.');
    }

    logger.info('Restore drill completed successfully', {
      event: 'restore_drill.completed',
      drillDatabaseName,
      backupPath,
      tableCount: tableCount.rows[0].value,
    });

    if (!keepDrillDatabase) {
      await cleanupDrillDatabase('success');
    } else {
      logger.info('Keeping drill database as requested', {
        event: 'restore_drill.kept',
        drillDatabaseName,
      });
    }
  } catch (error) {
    logger.error('Restore drill failed', {
      event: 'restore_drill.failed',
      error: error.message,
      stack: error.stack,
    });
    await cleanupDrillDatabase('failure');
    process.exit(1);
  } finally {
    if (drillPool) await drillPool.end();
    await maintenancePool.end();
    await pruneBackups(backupDir, retentionDays);
  }
}

run();
