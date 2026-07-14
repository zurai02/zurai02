import { logger } from '../logger.js';
import { GUILD_CONFIG_DEFAULTS } from '../../config/guild/guildConfigDefaults.js';
import { normalizeGuildConfig, validateGuildConfigOrThrow } from '../schemas.js';
import { createError, ErrorTypes } from '../errorHandler.js';
import { getGuildConfigKey } from './keys.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_UNWRAP_DEPTH = 5;
const REPLIT_WRAPPER_KEYS = new Set(['ok', 'value']);

/**
 * Unwrap Replit DB nested wrapper objects.
 * Replit's key-value store wraps responses as { ok: true, value: <data> }.
 * This recursively unwraps them up to a safe depth limit.
 *
 * @param {unknown} data
 * @param {number} [depth=0]
 * @returns {unknown}
 */
export function unwrapReplitData(data, depth = 0) {
  if (depth >= MAX_UNWRAP_DEPTH) {
    logger.warn('Replit data unwrap reached max depth, returning as-is', {
      event: 'db.unwrap.max_depth',
      depth: MAX_UNWRAP_DEPTH,
    });
    return data;
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    !Array.isArray(data) &&
    Object.keys(data).length === 2 &&
    REPLIT_WRAPPER_KEYS.has('ok') &&
    REPLIT_WRAPPER_KEYS.has('value') &&
    typeof data.ok === 'boolean' &&
    'value' in data
  ) {
    return unwrapReplitData(data.value, depth + 1);
  }

  return data;
}

// ─── Read ───────────────────────────────────────────────────────────────────

/**
 * Low-level guild config read. Returns normalized config with defaults;
 * never throws — callers use the guild config service for typed errors.
 *
 * @param {object} client - Bot client with db accessor
 * @param {string} guildId - Discord guild ID
 * @param {object} [context={}] - Request context for tracing
 * @returns {Promise<object>} Normalized guild config
 */
export async function readGuildConfig(client, guildId, context = {}) {
  const trace = {
    event: 'guild.config.read',
    guildId,
    traceId: context.traceId,
    userId: context.userId,
    command: context.command,
  };

  try {
    // Validate database availability
    if (!client?.db || typeof client.db.get !== 'function') {
      logger.warn('Database unavailable for guild config read', {
        ...trace,
        reason: 'db_missing',
      });
      return normalizeGuildConfig({}, GUILD_CONFIG_DEFAULTS);
    }

    if (typeof client.db.isAvailable === 'function' && !client.db.isAvailable()) {
      logger.warn('PostgreSQL unavailable for guild config read', {
        ...trace,
        reason: 'postgres_unavailable',
      });
      return normalizeGuildConfig({}, GUILD_CONFIG_DEFAULTS);
    }

    // Fetch raw config
    const rawConfig = await client.db.get(getGuildConfigKey(guildId), null);

    // No config stored yet — return pure defaults
    if (rawConfig === null) {
      logger.debug('No guild config found, returning defaults', trace);
      return normalizeGuildConfig({}, GUILD_CONFIG_DEFAULTS);
    }

    // Unwrap Replit wrapper and normalize
    const cleanedConfig = unwrapReplitData(rawConfig);
    const normalized = normalizeGuildConfig(cleanedConfig, GUILD_CONFIG_DEFAULTS);

    logger.debug('Guild config read successfully', {
      ...trace,
      hasCustomConfig: true,
    });

    return normalized;
  } catch (error) {
    logger.error('Error fetching guild config', {
      ...trace,
      error: error.message,
      stack: error.stack,
    });
    return normalizeGuildConfig({}, GUILD_CONFIG_DEFAULTS);
  }
}

// ─── Write ──────────────────────────────────────────────────────────────────

/**
 * Low-level guild config write. Validates payload and throws on failure.
 *
 * @param {object} client - Bot client with db accessor
 * @param {string} guildId - Discord guild ID
 * @param {object} config - Config payload to write
 * @param {object} [context={}] - Request context for tracing
 * @returns {Promise<object>} Validated config that was written
 * @throws {Error} On validation failure or database write failure
 */
export async function writeGuildConfig(client, guildId, config, context = {}) {
  const trace = {
    event: 'guild.config.write',
    guildId,
    traceId: context.traceId,
    userId: context.userId,
    command: context.command,
  };

  // Validate database availability
  if (!client?.db || typeof client.db.set !== 'function') {
    throw createError(
      'Database client unavailable for guild config write',
      ErrorTypes.DATABASE,
      'Failed to save server configuration. The database is unavailable.',
      { ...trace, reason: 'db_missing' },
    );
  }

  // Validate and normalize payload
  let validated;
  try {
    validated = validateGuildConfigOrThrow(config, { ...trace });
  } catch (validationError) {
    logger.warn('Guild config validation failed', {
      ...trace,
      error: validationError.message,
    });
    throw validationError;
  }

  // Persist to database
  let saved;
  try {
    saved = await client.db.set(getGuildConfigKey(guildId), validated);
  } catch (dbError) {
    logger.error('Database write failed for guild config', {
      ...trace,
      error: dbError.message,
    });
    throw createError(
      'Guild config write failed at database layer',
      ErrorTypes.DATABASE,
      'Failed to save server configuration. Please try again.',
      { ...trace, error: dbError.message },
    );
  }

  if (!saved) {
    logger.error('Guild config write rejected by database layer', {
      ...trace,
      reason: 'write_rejected',
    });
    throw createError(
      'Guild config write rejected by database layer',
      ErrorTypes.DATABASE,
      'Failed to save server configuration. Please try again.',
      { ...trace, reason: 'write_rejected' },
    );
  }

  logger.info('Guild config written successfully', {
    ...trace,
    keysWritten: Object.keys(validated).length,
  });

  return validated;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

/**
 * Delete a guild's config from the database. Returns to defaults on next read.
 *
 * @param {object} client - Bot client with db accessor
 * @param {string} guildId - Discord guild ID
 * @param {object} [context={}] - Request context for tracing
 * @returns {Promise<boolean>} True if deleted, false if not found or unavailable
 */
export async function deleteGuildConfig(client, guildId, context = {}) {
  const trace = {
    event: 'guild.config.delete',
    guildId,
    traceId: context.traceId,
  };

  if (!client?.db || typeof client.db.del !== 'function') {
    logger.warn('Database unavailable for guild config delete', {
      ...trace,
      reason: 'db_missing',
    });
    return false;
  }

  try {
    const deleted = await client.db.del(getGuildConfigKey(guildId));
    logger.info('Guild config deleted', {
      ...trace,
      existed: deleted,
    });
    return deleted;
  } catch (error) {
    logger.error('Error deleting guild config', {
      ...trace,
      error: error.message,
    });
    return false;
  }
}

// ─── Patch (Partial Update) ───────────────────────────────────────────────────

/**
 * Partially update guild config. Merges with existing config.
 *
 * @param {object} client - Bot client with db accessor
 * @param {string} guildId - Discord guild ID
 * @param {object} partial - Partial config to merge
 * @param {object} [context={}] - Request context for tracing
 * @returns {Promise<object>} Merged and validated config
 */
export async function patchGuildConfig(client, guildId, partial, context = {}) {
  const existing = await readGuildConfig(client, guildId, context);
  const merged = { ...existing, ...partial };
  return writeGuildConfig(client, guildId, merged, context);
}
