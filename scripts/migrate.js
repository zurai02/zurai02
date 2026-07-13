#!/usr/bin/env node
/**
 * Database schema migration script.
 *
 * Usage:
 *   node scripts/migrate.js [apply|check|status] [--dry-run] [--force]
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../src/utils/logger.js';
import { EXPECTED_SCHEMA_LABEL, EXPECTED_SCHEMA_VERSION } from '../src/config/database/schemaVersion.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const { resolveSslConfig } = await import('../src/config/database/postgres.js');
const {
  tableStatements,
  indexStatements,
  UPDATE_TIMESTAMP_FUNCTION,
  triggerDefinitions,
} = await import('../src/utils/database/schema.js');
const { assertAllowlistedIdentifier, quoteIdentifier } = await import('../src/utils/sqlIdentifiers.js');

const { Pool } = pg;

// ─── Configuration & Validation ─────────────────────────────────────────────

const CONNECT_TIMEOUT_MS = 10_000;

function assertConnectionString() {
  const value = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!value) {
    throw new Error('Missing required environment variable: POSTGRES_URL or DATABASE_URL');
  }
  return value;
}

function parseArgs(argv) {
  const args = { command: null, dryRun: false, force: false };
  for (const token of argv) {
    if (token === '--dry-run') {
      args.dryRun = true;
    } else if (token === '--force') {
      args.force = true;
    } else if (token === '--help' || token === '-h') {
      args.help = true;
    } else if (!token.startsWith('-') && !args.command) {
      args.command = token;
    }
  }
  return args;
}

function printHelp() {
  console.log(`
Database schema migration script.

Usage:
  node scripts/migrate.js [command] [options]

Commands:
  apply   (default) Run migrations to bring schema to current version
  check   Verify schema version matches expected
  status  Show current schema version

Options:
  --dry-run  Print what would be executed without modifying the database
  --force    Run migration even if schema version already matches
  --help     Show this message
`);
}

// ─── Pool ─────────────────────────────────────────────────────────────────────

function createPool() {
  return new Pool({
    connectionString: assertConnectionString(),
    ssl: resolveSslConfig(),
    connectionTimeoutMillis: CONNECT_TIMEOUT_MS,
  });
}

// ─── Migration Table Safety ─────────────────────────────────────────────────

const rawMigrationTable = process.env.POSTGRES_MIGRATION_TABLE || 'schema_migrations';
const migrationTablePattern = /^[a-z_][a-z0-9_]*$/;

if (!migrationTablePattern.test(rawMigrationTable)) {
  throw new Error(`Invalid migration table name: ${rawMigrationTable}`);
}

const safeMigrationTable = quoteIdentifier(rawMigrationTable);

// ─── Core Logic ─────────────────────────────────────────────────────────────

async function ensureMigrationLedger(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${safeMigrationTable} (
      version INTEGER PRIMARY KEY,
      label VARCHAR(255) NOT NULL,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function recordSchemaVersion(client) {
  await ensureMigrationLedger(client);
  await client.query(
    `INSERT INTO ${safeMigrationTable} (version, label)
     VALUES ($1, $2)
     ON CONFLICT (version)
     DO UPDATE SET label = EXCLUDED.label, applied_at = CURRENT_TIMESTAMP`,
    [EXPECTED_SCHEMA_VERSION, EXPECTED_SCHEMA_LABEL]
  );
}

async function getCurrentSchemaVersion(client) {
  await ensureMigrationLedger(client);
  const result = await client.query(
    `SELECT version, label, applied_at FROM ${safeMigrationTable} ORDER BY version DESC LIMIT 1`
  );
  return result.rows[0] || null;
}

async function createTables(client, dryRun) {
  logger.info('Creating database tables...', { event: 'migration.tables.start' });
  for (const statement of tableStatements) {
    if (dryRun) {
      logger.info('[DRY RUN] Would execute table statement', {
        event: 'migration.tables.dry_run',
        statement: statement.slice(0, 200),
      });
      continue;
    }
    try {
      await client.query(statement);
    } catch (error) {
      logger.error('Error creating table', {
        event: 'migration.tables.failed',
        error: error.message,
        statement: statement.slice(0, 200),
      });
      throw error;
    }
  }
  logger.info('All tables created successfully', { event: 'migration.tables.completed' });
}

async function createIndexes(client, dryRun) {
  logger.info('Creating indexes...', { event: 'migration.indexes.start' });
  for (const statement of indexStatements) {
    if (dryRun) {
      logger.info('[DRY RUN] Would execute index statement', {
        event: 'migration.indexes.dry_run',
        statement: statement.slice(0, 200),
      });
      continue;
    }
    try {
      await client.query(statement);
    } catch (error) {
      logger.error('Error creating index', {
        event: 'migration.indexes.failed',
        error: error.message,
        statement: statement.slice(0, 200),
      });
      throw error;
    }
  }
  logger.info('All indexes created successfully', { event: 'migration.indexes.completed' });
}

async function createTriggers(client, dryRun) {
  logger.info('Setting up automatic timestamps...', { event: 'migration.triggers.start' });

  if (!dryRun) {
    await client.query(UPDATE_TIMESTAMP_FUNCTION);
  } else {
    logger.info('[DRY RUN] Would create/update timestamp function', { event: 'migration.triggers.dry_run' });
  }

  const allowedTriggerIdentifiers = new Set(triggerDefinitions.map((t) => t.name));
  const allowedTableIdentifiers = new Set(triggerDefinitions.map((t) => t.table));

  for (const { name, table } of triggerDefinitions) {
    const safeTrigger = quoteIdentifier(
      assertAllowlistedIdentifier(name, allowedTriggerIdentifiers, 'Trigger identifier')
    );
    const safeTable = quoteIdentifier(
      assertAllowlistedIdentifier(table, allowedTableIdentifiers, 'Trigger table identifier')
    );

    if (dryRun) {
      logger.info(`[DRY RUN] Would create trigger ${name} on ${table}`, {
        event: 'migration.trigger.dry_run',
        trigger: name,
        table,
      });
      continue;
    }

    try {
      await client.query(`DROP TRIGGER IF EXISTS ${safeTrigger} ON ${safeTable};`);
      await client.query(
        `CREATE TRIGGER ${safeTrigger}
         BEFORE UPDATE ON ${safeTable}
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
      );
    } catch (error) {
      logger.error('Error creating trigger', {
        event: 'migration.trigger.failed',
        error: error.message,
        trigger: name,
        table,
      });
      throw error;
    }
  }

  logger.info('All triggers created successfully', { event: 'migration.triggers.completed' });
}

async function applyMigration(pool, dryRun, force) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const current = await getCurrentSchemaVersion(client);
    if (current && Number(current.version) === EXPECTED_SCHEMA_VERSION && !force) {
      logger.info('Schema already at expected version. Use --force to re-run.', {
        event: 'migration.already_done',
        version: EXPECTED_SCHEMA_VERSION,
      });
      await client.query('ROLLBACK');
      return { alreadyDone: true };
    }

    logger.info('Starting database migration...', {
      event: 'migration.start',
      expectedVersion: EXPECTED_SCHEMA_VERSION,
      currentVersion: current?.version ?? null,
      dryRun,
      force,
    });

    await createTables(client, dryRun);
    await createIndexes(client, dryRun);
    await createTriggers(client, dryRun);

    if (!dryRun) {
      await recordSchemaVersion(client);
    } else {
      logger.info('[DRY RUN] Would record schema version', {
        event: 'migration.version.dry_run',
        version: EXPECTED_SCHEMA_VERSION,
        label: EXPECTED_SCHEMA_LABEL,
      });
    }

    await client.query('COMMIT');

    logger.info('Migration completed successfully', {
      event: 'migration.completed',
      version: EXPECTED_SCHEMA_VERSION,
      label: EXPECTED_SCHEMA_LABEL,
      dryRun,
    });

    return { alreadyDone: false };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

async function checkMigrationVersion(pool) {
  const client = await pool.connect();
  try {
    const current = await getCurrentSchemaVersion(client);

    if (!current) {
      logger.error('No schema version found', {
        event: 'migration.check.failed',
        expectedVersion: EXPECTED_SCHEMA_VERSION,
        reason: 'no_version',
      });
      throw new Error(`No schema version found in ${rawMigrationTable}. Expected v${EXPECTED_SCHEMA_VERSION}.`);
    }

    const currentVersion = Number(current.version);
    if (currentVersion !== EXPECTED_SCHEMA_VERSION) {
      logger.error('Schema drift detected', {
        event: 'migration.check.failed',
        expectedVersion: EXPECTED_SCHEMA_VERSION,
        currentVersion,
        reason: 'drift',
      });
      throw new Error(`Schema drift detected. Expected v${EXPECTED_SCHEMA_VERSION}, found v${currentVersion}.`);
    }

    logger.info('Schema version check passed', {
      event: 'migration.check.passed',
      version: currentVersion,
      label: current.label,
    });
  } finally {
    client.release();
  }
}

async function printMigrationStatus(pool) {
  const client = await pool.connect();
  try {
    const current = await getCurrentSchemaVersion(client);
    if (!current) {
      logger.info('No schema version recorded yet', {
        event: 'migration.status',
        expectedVersion: EXPECTED_SCHEMA_VERSION,
        expectedLabel: EXPECTED_SCHEMA_LABEL,
      });
      return;
    }

    logger.info('Migration status', {
      event: 'migration.status',
      currentVersion: current.version,
      label: current.label,
      appliedAt: current.applied_at,
      expectedVersion: EXPECTED_SCHEMA_VERSION,
      expectedLabel: EXPECTED_SCHEMA_LABEL,
    });
  } finally {
    client.release();
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function run() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const command = args.command || 'apply';
  const { dryRun, force } = args;

  if (!Number.isInteger(EXPECTED_SCHEMA_VERSION)) {
    throw new Error(`EXPECTED_SCHEMA_VERSION must be an integer, got: ${EXPECTED_SCHEMA_VERSION}`);
  }

  const pool = createPool();

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
    await pool.query('SELECT 1');

    if (command === 'apply') {
      await applyMigration(pool, dryRun, force);
    } else if (command === 'check') {
      await checkMigrationVersion(pool);
    } else if (command === 'status') {
      await printMigrationStatus(pool);
    } else {
      logger.error('Unknown command', { event: 'migration.unknown_command', command });
      printHelp();
      process.exit(1);
    }
  } catch (error) {
    logger.error('Migration script failed', {
      event: 'migration.failed',
      error: error.message,
      stack: error.stack,
      command,
      dryRun,
    });
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
