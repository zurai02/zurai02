#!/usr/bin/env node
/**
 * Database restore script.
 *
 * WARNING: This is a destructive operation. Use with caution.
 *
 * Usage:
 *   node scripts/restore.js [--input=PATH] [--backup-dir=PATH] [--target-url=URL] [--drop-schema] [--confirm] [--dry-run]
 */

import { spawnSync } from 'node:child_process';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Imported after dotenv.config so resolveSslConfig sees the loaded env vars.
const { resolveSslConfig } = await import('../src/config/database/postgres.js');

// ─── Configuration ────────────────────────────────────────────────────────────

const MAX_BUFFER = 10 * 1024 * 1024;

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

function parseDatabaseUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Target database URL is not a valid URL');
  }

  if (parsed.protocol !== 'postgresql:' && parsed.protocol !== 'postgres:') {
    throw new Error('Target database URL must use the postgresql:// protocol');
  }

  const database = decodeURIComponent(parsed.pathname.slice(1));
  if (!parsed.hostname || !database) {
    throw new Error('Target database URL must include host and database name');
  }

  return {
    host: parsed.hostname,
    port: parsed.port || '5432',
    database,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

function buildPgEnv(credentials) {
  return {
    ...process.env,
    PGHOST: credentials.host,
    PGPORT: credentials.port,
    PGUSER: credentials.user,
    PGPASSWORD: credentials.password,
    PGDATABASE: credentials.database,
    PGSSLMODE: resolveSslConfig()?.ssl ? 'require' : 'prefer',
  };
}

function runCommand(command, args, env) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'ignore', 'pipe'],
    maxBuffer: MAX_BUFFER,
    env,
    shell: process.platform === 'win32',
  });

  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || 'Unknown error'}`);
  }

  return result.stdout;
}

async function resolveLatestBackup(backupDir) {
  let entries;
  try {
    entries = await readdir(backupDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Backup directory not found: ${backupDir}`);
    }
    throw error;
  }

  const dumpFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.dump'))
    .map((entry) => entry.name)
    .sort((left, right) => right.localeCompare(left));

  if (dumpFiles.length === 0) {
    throw new Error(`No .dump backup files found in ${backupDir}`);
  }

  return path.join(backupDir, dumpFiles[0]);
}

async function validateBackupFile(inputPath) {
  try {
    const stats = await stat(inputPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${inputPath}`);
    }
    if (stats.size === 0) {
      throw new Error(`Backup file is empty: ${inputPath}`);
    }
    return stats.size;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Backup file not found: ${inputPath}`);
    }
    throw error;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  const args = parseArgs(process.argv.slice(2));

  const targetUrl = args['target-url'] || process.env.POSTGRES_RESTORE_URL || process.env.POSTGRES_URL;
  if (!targetUrl) {
    throw new Error('Missing target database URL. Set POSTGRES_RESTORE_URL or POSTGRES_URL, or pass --target-url.');
  }

  const credentials = parseDatabaseUrl(targetUrl);
  const backupDir = path.resolve(
    args['backup-dir'] ?? process.env.BACKUP_DIR ?? path.join(process.cwd(), 'backups')
  );
  const inputPath = args.input ? path.resolve(args.input) : await resolveLatestBackup(backupDir);
  const dropSchema = [true, 'true', '1'].includes(args['drop-schema']);
  const dryRun = [true, 'true', '1'].includes(args['dry-run']);

  if (!args.confirm) {
    throw new Error('Restore requires explicit confirmation. Re-run with --confirm.');
  }

  ensureCommand('pg_restore');
  ensureCommand('psql');

  const fileSize = await validateBackupFile(inputPath);

  logger.warn('Starting database restore', {
    event: 'restore.start',
    inputPath,
    targetDatabase: credentials.database,
    targetHost: credentials.host,
    dropSchema,
    dryRun,
    fileSizeBytes: fileSize,
    fileSizeMb: Number((fileSize / 1024 / 1024).toFixed(2)),
  });

  if (dryRun) {
    logger.info('[DRY RUN] Would execute restore operations', {
      event: 'restore.dry_run',
      inputPath,
      targetDatabase: credentials.database,
      dropSchema,
    });
    return;
  }

  if (dropSchema) {
    logger.warn('Dropping public schema', {
      event: 'restore.drop_schema',
      targetDatabase: credentials.database,
    });

    runCommand(
      'psql',
      ['-v', 'ON_ERROR_STOP=1', '-c', 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'],
      buildPgEnv(credentials)
    );
  }

  runCommand(
    'pg_restore',
    [
      '--clean',
      '--if-exists',
      '--no-owner',
      '--no-privileges',
      '--exit-on-error',
      '--dbname',
      credentials.database,
      inputPath,
    ],
    buildPgEnv(credentials)
  );

  logger.info('Database restore completed', {
    event: 'restore.completed',
    inputPath,
    targetDatabase: credentials.database,
    targetHost: credentials.host,
  });
}

run().catch((error) => {
  logger.error('Restore command failed', {
    event: 'restore.failed',
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
