// guildConfig.js — the only module that should read/write guild configuration.

import { GUILD_CONFIG_DEFAULTS } from '../../config/guild/guildConfigDefaults.js';
import { readGuildConfig, writeGuildConfig, deleteGuildConfig } from '../../utils/database/guildConfigStorage.js';
import { normalizeGuildConfig, validateGuildConfigOrThrow } from '../../utils/schemas.js';
import { createError, ErrorTypes, wrapServiceBoundary } from '../../utils/errorHandler.js';
import { logger } from '../../utils/logger.js';

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { GUILD_CONFIG_DEFAULTS };

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_NAME = 'guildConfigService';
const MAX_PATCH_DEPTH = 3;

// ─── Read ─────────────────────────────────────────────────────────────────────

export const getGuildConfig = wrapServiceBoundary(
  async function getGuildConfig(client, guildId, context = {}) {
    const config = await readGuildConfig(client, guildId, context);
    return normalizeGuildConfig(config, GUILD_CONFIG_DEFAULTS);
  },
  {
    service: SERVICE_NAME,
    operation: 'getGuildConfig',
    message: 'Failed to fetch guild configuration',
    userMessage: 'Failed to load server configuration. Please try again.',
  }
);

// ─── Write ────────────────────────────────────────────────────────────────────

export const setGuildConfig = wrapServiceBoundary(
  async function setGuildConfig(client, guildId, config, context = {}) {
    const normalized = normalizeGuildConfig(config, GUILD_CONFIG_DEFAULTS);
    return await writeGuildConfig(client, guildId, normalized, context);
  },
  {
    service: SERVICE_NAME,
    operation: 'setGuildConfig',
    message: 'Failed to save guild configuration',
    userMessage: 'Failed to save server configuration. Please try again.',
  }
);

// ─── Partial Update ───────────────────────────────────────────────────────────

export const updateGuildConfig = wrapServiceBoundary(
  async function updateGuildConfig(client, guildId, updates, context = {}) {
    const currentConfig = await readGuildConfig(client, guildId, context);
    const merged = { ...currentConfig, ...updates };
    const normalized = normalizeGuildConfig(merged, GUILD_CONFIG_DEFAULTS);
    return await writeGuildConfig(client, guildId, normalized, context);
  },
  {
    service: SERVICE_NAME,
    operation: 'updateGuildConfig',
    message: 'Failed to update guild configuration',
    userMessage: 'Failed to update server configuration. Please try again.',
  }
);

// ─── Key-level Access ─────────────────────────────────────────────────────────

export const getConfigValue = wrapServiceBoundary(
  async function getConfigValue(client, guildId, key, defaultValue = null, context = {}) {
    const config = await getGuildConfig(client, guildId, context);
    return config[key] !== undefined ? config[key] : defaultValue;
  },
  {
    service: SERVICE_NAME,
    operation: 'getConfigValue',
    message: 'Failed to read guild configuration value',
    userMessage: 'Failed to read a server setting. Please try again.',
  }
);

export const setConfigValue = wrapServiceBoundary(
  async function setConfigValue(client, guildId, key, value, context = {}) {
    return await updateGuildConfig(client, guildId, { [key]: value }, context);
  },
  {
    service: SERVICE_NAME,
    operation: 'setConfigValue',
    message: 'Failed to update guild configuration value',
    userMessage: 'Failed to update a server setting. Please try again.',
  }
);

// ─── Nested Patch ─────────────────────────────────────────────────────────────

/**
 * Merge partial updates into a nested config object (e.g. verification, logging).
 * Supports deep merging up to MAX_PATCH_DEPTH levels.
 */
export const patchGuildConfig = wrapServiceBoundary(
  async function patchGuildConfig(client, guildId, patch, context = {}) {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw createError(
        'Invalid guild config patch: must be a plain object',
        ErrorTypes.VALIDATION,
        'Invalid configuration update.',
        { guildId, ...context }
      );
    }

    const currentConfig = await readGuildConfig(client, guildId, context);
    const merged = deepMergeGuildConfig(currentConfig, patch, 0);
    const normalized = normalizeGuildConfig(merged, GUILD_CONFIG_DEFAULTS);

    validateGuildConfigOrThrow(normalized, { guildId, ...context });
    return await writeGuildConfig(client, guildId, normalized, context);
  },
  {
    service: SERVICE_NAME,
    operation: 'patchGuildConfig',
    message: 'Failed to patch guild configuration',
    userMessage: 'Failed to update server configuration. Please try again.',
  }
);

// ─── Delete / Reset ───────────────────────────────────────────────────────────

/**
 * Delete a guild's configuration, resetting to defaults on next read.
 * @param {object} client
 * @param {string} guildId
 * @param {object} [context={}]
 * @returns {Promise<boolean>}
 */
export const resetGuildConfig = wrapServiceBoundary(
  async function resetGuildConfig(client, guildId, context = {}) {
    const deleted = await deleteGuildConfig(client, guildId, context);
    logger.info('Guild config reset', { event: 'guild.config.reset', guildId, deleted });
    return deleted;
  },
  {
    service: SERVICE_NAME,
    operation: 'resetGuildConfig',
    message: 'Failed to reset guild configuration',
    userMessage: 'Failed to reset server configuration. Please try again.',
  }
);

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Validate a guild config without writing it.
 * @param {object} config
 * @param {string} guildId
 * @param {object} [context={}]
 * @returns {object} Validated config
 */
export const validateGuildConfig = wrapServiceBoundary(
  async function validateGuildConfig(config, guildId, context = {}) {
    const normalized = normalizeGuildConfig(config, GUILD_CONFIG_DEFAULTS);
    return validateGuildConfigOrThrow(normalized, { guildId, ...context });
  },
  {
    service: SERVICE_NAME,
    operation: 'validateGuildConfig',
    message: 'Guild configuration validation failed',
    userMessage: 'Server configuration is invalid. Please check your settings.',
  }
);

// ─── Deep Merge Helper ────────────────────────────────────────────────────────

/**
 * Recursively merge patch into base up to MAX_PATCH_DEPTH.
 * @param {object} base
 * @param {object} patch
 * @param {number} depth
 * @returns {object}
 */
function deepMergeGuildConfig(base, patch, depth = 0) {
  if (depth >= MAX_PATCH_DEPTH) {
    logger.warn('Deep merge hit max depth, shallow merging remaining keys', {
      event: 'config.merge.max_depth',
      depth: MAX_PATCH_DEPTH,
    });
    return { ...base, ...patch };
  }

  const result = { ...base };

  for (const [key, value] of Object.entries(patch)) {
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      base[key] !== null &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMergeGuildConfig(base[key], value, depth + 1);
    } else {
      result[key] = value;
    }
  }

  return result;
        }
