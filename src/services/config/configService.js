import { pgDb } from '../postgresDatabase.js';
import { MemoryStorage } from '../memoryStorage.js';
import { logger } from '../logger.js';
import { validateGuildConfigOrThrow } from '../schemas.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const GUILD_CONFIG_KEY_PATTERN = /^guild:[^:]+:config$/;
const SCHEMA_MISMATCH_CODE = 'SCHEMA_VERSION_MISMATCH';
const DEGRADED_REASON = 'POSTGRES_UNAVAILABLE';

// ─── DatabaseWrapper ───────────────────────────────────────────────────────────

class DatabaseWrapper {
  constructor() {
    this.initialized = false;
    this.db = null;
    this.useFallback = false;
    this.connectionType = 'none';
    this.degradedModeWarningShown = false;
    this.degradedReason = null;
    this._operationQueue = [];
    this._queueDraining = false;
  }

  // ─── Initialization ───────────────────────────────────────────────────────────

  async initialize() {
    if (this.initialized) {
      logger.debug('Database already initialized, skipping');
      return;
    }

    try {
      logger.info('Connecting to PostgreSQL...', { event: 'db.init.start' });
      const pgConnected = await pgDb.connect();

      if (pgConnected) {
        this.db = pgDb;
        this.connectionType = 'postgresql';
        this.degradedReason = null;
        this.initialized = true;
        logger.info('PostgreSQL connected', { event: 'db.init.success', connectionType: 'postgresql' });
        return;
      }

      const pgFailure = pgDb.getLastFailure?.();
      if (pgFailure?.reason === SCHEMA_MISMATCH_CODE) {
        const schemaError = new Error(
          `Schema version mismatch (${pgFailure.message}). Run migrations: node scripts/migrate.js apply`
        );
        schemaError.code = SCHEMA_MISMATCH_CODE;
        throw schemaError;
      }
    } catch (error) {
      if (error.code === SCHEMA_MISMATCH_CODE) {
        throw error;
      }
      logger.warn('PostgreSQL connection failed', { event: 'db.init.pg_failed', error: error.message });
    }

    this._enableFallback();
  }

  _enableFallback() {
    this.db = new MemoryStorage();
    this.useFallback = true;
    this.connectionType = 'memory';
    this.degradedReason = DEGRADED_REASON;
    this.initialized = true;

    if (!this.degradedModeWarningShown) {
      logger.warn('Database degraded: using in-memory storage', {
        event: 'db.degraded',
        reason: DEGRADED_REASON,
        dataLossWarning: true,
      });
      this.degradedModeWarningShown = true;
    }
  }

  // ─── Core Operations ──────────────────────────────────────────────────────────

  async set(key, value, ttl = null) {
    this._ensureInitialized();

    if (this.useFallback) {
      logger.debug('Memory write', { event: 'db.degraded.write', key });
    }

    if (GUILD_CONFIG_KEY_PATTERN.test(key)) {
      const guildId = key.split(':')[1];
      validateGuildConfigOrThrow(value, { guildId, errorCode: 'VALIDATION_FAILED' });
    }

    return this.db.set(key, value, ttl);
  }

  async get(key, defaultValue = null) {
    this._ensureInitialized();
    return this.db.get(key, defaultValue);
  }

  async delete(key) {
    this._ensureInitialized();

    if (this.useFallback) {
      logger.debug('Memory delete', { event: 'db.degraded.delete', key });
    }

    return this.db.delete(key);
  }

  async list(prefix) {
    this._ensureInitialized();
    return this.db.list(prefix);
  }

  async exists(key) {
    this._ensureInitialized();

    if (this.db.exists) {
      return this.db.exists(key);
    }

    const value = await this.db.get(key);
    return value !== null;
  }

  async increment(key, amount = 1) {
    this._ensureInitialized();

    if (this.useFallback) {
      logger.debug('Memory increment', { event: 'db.degraded.increment', key, amount });
    }

    if (this.db.increment) {
      return this.db.increment(key, amount);
    }

    const current = await this.db.get(key, 0);
    const newValue = current + amount;
    await this.db.set(key, newValue);
    return newValue;
  }

  async decrement(key, amount = 1) {
    this._ensureInitialized();

    if (this.useFallback) {
      logger.debug('Memory decrement', { event: 'db.degraded.decrement', key, amount });
    }

    if (this.db.decrement) {
      return this.db.decrement(key, amount);
    }

    const current = await this.db.get(key, 0);
    const newValue = current - amount;
    await this.db.set(key, newValue);
    return newValue;
  }

  // ─── Batch Operations ─────────────────────────────────────────────────────────

  async mget(keys, defaultValue = null) {
    this._ensureInitialized();

    if (this.db.mget) {
      return this.db.mget(keys, defaultValue);
    }

    const results = await Promise.all(keys.map((key) => this.db.get(key, defaultValue)));
    return Object.fromEntries(keys.map((key, i) => [key, results[i]]));
  }

  async mset(entries, ttl = null) {
    this._ensureInitialized();

    if (this.db.mset) {
      return this.db.mset(entries, ttl);
    }

    await Promise.all(Object.entries(entries).map(([key, value]) => this.db.set(key, value, ttl)));
    return true;
  }

  async mdel(keys) {
    this._ensureInitialized();

    if (this.db.mdel) {
      return this.db.mdel(keys);
    }

    await Promise.all(keys.map((key) => this.db.delete(key)));
    return true;
  }

  // ─── Queue / Replay (for degraded → recovered transitions) ─────────────────────

  async enqueueOperation(type, key, value) {
    this._operationQueue.push({ type, key, value, timestamp: Date.now() });
    if (this._operationQueue.length > 1000) {
      this._operationQueue = this._operationQueue.slice(-500);
      logger.warn('Operation queue trimmed', { event: 'db.queue.trimmed', size: 500 });
    }
  }

  async drainQueue() {
    if (this._queueDraining || this._operationQueue.length === 0 || this.useFallback) {
      return;
    }

    this._queueDraining = true;
    logger.info('Draining operation queue to PostgreSQL', { event: 'db.queue.drain', count: this._operationQueue.length });

    try {
      for (const op of this._operationQueue) {
        if (op.type === 'set') {
          await this.db.set(op.key, op.value);
        } else if (op.type === 'delete') {
          await this.db.delete(op.key);
        }
      }
      this._operationQueue = [];
      logger.info('Queue drained successfully', { event: 'db.queue.drain.done' });
    } catch (error) {
      logger.error('Queue drain failed', { event: 'db.queue.drain.error', error: error.message });
    } finally {
      this._queueDraining = false;
    }
  }

  // ─── Status ───────────────────────────────────────────────────────────────────

  isDegraded() {
    return this.useFallback;
  }

  isAvailable() {
    return this.db !== null && !this.useFallback;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      connectionType: this.connectionType,
      isDegraded: this.useFallback,
      isAvailable: this.isAvailable(),
      degradedReason: this.degradedReason,
      queueSize: this._operationQueue.length,
    };
  }

  getConnectionType() {
    return this.connectionType;
  }

  // ─── Internal ─────────────────────────────────────────────────────────────────

  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
  }
}

// ─── Singleton Export ───────────────────────────────────────────────────────────

export const db = new DatabaseWrapper();

// ─── Initialization ─────────────────────────────────────────────────────────────

export async function initializeDatabase() {
  try {
    logger.info('Initializing database...', { event: 'db.init' });
    await db.initialize();
    logger.info('Database ready', { event: 'db.init.done', connectionType: db.getConnectionType() });
    return { db };
  } catch (error) {
    if (error.code === SCHEMA_MISMATCH_CODE) {
      logger.error('Schema mismatch — migration required', { event: 'db.init.schema_mismatch', error: error.message });
      throw error;
    }

    logger.error('Database initialization failed', { event: 'db.init.failed', error: error.message });
    return { db };
  }
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

export async function getFromDb(key, defaultValue = null) {
  try {
    const value = await db.get(key);
    return value === null ? defaultValue : value;
  } catch (error) {
    logger.error('DB get failed', { event: 'db.get.error', key, error: error.message });
    return defaultValue;
  }
}

export async function setInDb(key, value, ttl = null) {
  try {
    await db.set(key, value, ttl);
    return true;
  } catch (error) {
    logger.error('DB set failed', { event: 'db.set.error', key, error: error.message });
    return false;
  }
}

export async function deleteFromDb(key) {
  try {
    await db.delete(key);
    return true;
  } catch (error) {
    logger.error('DB delete failed', { event: 'db.delete.error', key, error: error.message });
    return false;
  }
}

// ─── Batch Convenience ──────────────────────────────────────────────────────────

export async function mgetFromDb(keys, defaultValue = null) {
  try {
    return await db.mget(keys, defaultValue);
  } catch (error) {
    logger.error('DB mget failed', { event: 'db.mget.error', keys: keys.length, error: error.message });
    return Object.fromEntries(keys.map((k) => [k, defaultValue]));
  }
}

export async function msetInDb(entries, ttl = null) {
  try {
    return await db.mset(entries, ttl);
  } catch (error) {
    logger.error('DB mset failed', { event: 'db.mset.error', count: Object.keys(entries).length, error: error.message });
    return false;
  }
  }// loggingUi.js — Discord UI component builders for the logging dashboard

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { EVENT_TYPES } from '../../services/loggingService.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BUTTONS_PER_ROW = 5;
const MAX_SELECT_OPTIONS = 25;

const DASHBOARD_CATEGORIES = Object.freeze([
  'moderation',
  'message',
  'role',
  'member',
  'leveling',
  'reactionrole',
  'giveaway',
  'counter',
  'application',
  'report',
]);

const DASHBOARD_CATEGORY_EMOJIS = Object.freeze({
  moderation: '🔨',
  message: '✉️',
  role: '🏷️',
  member: '👥',
  leveling: '📈',
  reactionrole: '🎭',
  giveaway: '🎁',
  counter: '📊',
  application: '📝',
  report: '🚨',
});

const DASHBOARD_CATEGORY_LABELS = Object.freeze({
  moderation: 'Moderation',
  message: 'Messages',
  role: 'Roles',
  member: 'Members',
  leveling: 'Leveling',
  reactionrole: 'Reaction Roles',
  giveaway: 'Giveaways',
  counter: 'Counters',
  application: 'Applications',
  report: 'Reports',
});

// ─── Derived: Event Types by Category ─────────────────────────────────────────

const EVENT_TYPES_BY_CATEGORY = Object.freeze(
  Object.values(EVENT_TYPES).reduce((accumulator, eventType) => {
    const [category] = eventType.split('.');
    if (!accumulator[category]) {
      accumulator[category] = [];
    }
    accumulator[category].push(eventType);
    return accumulator;
  }, {})
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Chunk an array into groups of a specified size.
 * @template T
 * @param {T[]} array
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Determine if a category is fully enabled.
 * @param {string} category
 * @param {Record<string, boolean>} enabledEvents
 * @param {boolean} loggingEnabled
 * @returns {boolean}
 */
function isCategoryEnabled(category, enabledEvents, loggingEnabled) {
  if (!loggingEnabled) return false;

  const wildcardKey = `${category}.*`;
  if (enabledEvents[wildcardKey] === false) return false;

  const categoryEvents = EVENT_TYPES_BY_CATEGORY[category] || [];
  if (categoryEvents.length === 0) return true;

  return categoryEvents.every((eventType) => enabledEvents[eventType] !== false);
}

// ─── Component Builders ─────────────────────────────────────────────────────────

/**
 * Create a "Back to Dashboard" button.
 * @returns {ButtonBuilder}
 */
function createBackButton() {
  return new ButtonBuilder()
    .setCustomId('log_dash_back')
    .setLabel('Back to Dashboard')
    .setStyle(ButtonStyle.Secondary);
}

/**
 * Create category toggle button rows.
 * @param {Record<string, boolean>} [enabledEvents={}]
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder<ButtonBuilder>[]}
 */
function createCategoryToggleButtons(enabledEvents = {}, loggingEnabled = false) {
  const buttons = DASHBOARD_CATEGORIES.map((category) => {
    const isEnabled = isCategoryEnabled(category, enabledEvents, loggingEnabled);
    const emoji = DASHBOARD_CATEGORY_EMOJIS[category] || '📌';
    const label = DASHBOARD_CATEGORY_LABELS[category] || category;

    return new ButtonBuilder()
      .setCustomId(`log_dash_toggle:${category}.*`)
      .setLabel(`${emoji} ${label}`)
      .setStyle(isEnabled ? ButtonStyle.Success : ButtonStyle.Danger);
  });

  return chunk(buttons, MAX_BUTTONS_PER_ROW).map(
    (group) => new ActionRowBuilder().addComponents(group)
  );
}

/**
 * Create the main logging configuration select menu.
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
export function createLoggingMainMenuSelect() {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Audit Log Channel')
      .setDescription('Moderation, messages, members, roles, etc.')
      .setValue('set:audit')
      .setEmoji('🧾'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Applications Channel')
      .setDescription('New applications and review updates')
      .setValue('set:applications')
      .setEmoji('📝'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Reports Channel')
      .setDescription('User reports filed via /report')
      .setValue('set:reports')
      .setEmoji('🚨'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Audit Channel')
      .setValue('clear:audit')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Applications Channel')
      .setValue('clear:applications')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Reports Channel')
      .setValue('clear:reports')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Event Categories')
      .setDescription('Toggle which log types are sent')
      .setValue('view:categories')
      .setEmoji('📋'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Manage Ignore Filters')
      .setDescription('Skip logs from specific users or channels')
      .setValue('view:filters')
      .setEmoji('🔇'),
  ];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('log_dash_menu')
      .setPlaceholder('Choose a setting to configure…')
      .addOptions(options.slice(0, MAX_SELECT_OPTIONS))
  );
}

/**
 * Create the main action row with audit toggle and refresh buttons.
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
export function createLoggingMainActionRow(loggingEnabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('log_dash_toggle:audit_enabled')
      .setLabel('Audit Logging')
      .setStyle(loggingEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('log_dash_refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary)
  );
}

/**
 * Create the full logging dashboard component set.
 * @param {Record<string, boolean>} [_enabledEvents]
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder[]}
 */
export function createLoggingDashboardComponents(_enabledEvents, loggingEnabled = false) {
  return [
    createLoggingMainMenuSelect(),
    createLoggingMainActionRow(loggingEnabled),
  ];
}

/**
 * Create the category view with toggle buttons and action row.
 * @param {Record<string, boolean>} enabledEvents
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder[]}
 */
export function createLoggingCategoryViewComponents(enabledEvents, loggingEnabled = false) {
  const categoryRows = createCategoryToggleButtons(enabledEvents, loggingEnabled);

  const actionRow = new ActionRowBuilder().addComponents(
    createBackButton(),
    new ButtonBuilder()
      .setCustomId('log_dash_toggle:all')
      .setLabel('Toggle All Categories')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('log_dash_refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary)
  );

  return [...categoryRows, actionRow];
}

/**
 * Create the filter management component set.
 * @returns {ActionRowBuilder<ButtonBuilder>[]}
 */
export function createLoggingFilterComponents() {
  return [
    new ActionRowBuilder().addComponents(
      createBackButton(),
      new ButtonBuilder()
        .setCustomId('log_dash_add_filter:user')
        .setLabel('Add User Filter')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('log_dash_add_filter:channel')
        .setLabel('Add Channel Filter')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('log_dash_remove_filter')
        .setLabel('Remove Filter')
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { DASHBOARD_CATEGORIES, DASHBOARD_CATEGORY_EMOJIS, DASHBOARD_CATEGORY_LABELS, EVENT_TYPES_BY_CATEGORY };const SETTING_CONFLICTS = {
    'birthdayChannelId': [],
    'logging': [],
};

const LEGACY_LOGGING_KEY_MAP = {
    logChannelId: 'audit',
    reportChannelId: 'reports',
};

const ConfigValueSchemas = Object.freeze({
    logChannelId: z.union([z.string().min(1), z.object({ id: z.string().min(1) }), z.null()]),
    reportChannelId: z.union([z.string().min(1), z.object({ id: z.string().min(1) }), z.null()]),
    premiumRoleId: z.union([z.string().min(1), z.object({ id: z.string().min(1) })]),
    autoRole: z.union([z.string().min(1), z.object({ id: z.string().min(1) })]),
    modRole: z.union([z.string().min(1), z.object({ id: z.string().min(1) })]),
    adminRole: z.union([z.string().min(1), z.object({ id: z.string().min(1) })]),
    prefix: z.string().min(1).max(10),
    dmOnClose: z.boolean(),
    maxTicketsPerUser: z.number().int().min(1).max(50),
    birthdayChannelId: z.union([z.string().min(1), z.object({ id: z.string().min(1) })]),
    logIgnore: LogIgnoreSchema,
    logging: LoggingConfigSchema,
});

class ConfigService {

    static MAX_CHANNEL_IDS = 10;
    static MAX_ROLE_IDS = 20;
    static MAX_PREFIX_LENGTH = 10;
    static PROTECTED_SETTINGS = ['_id', 'guildId', 'createdAt']; 
    static UNSAFE_KEYS = ['__proto__', 'prototype', 'constructor'];

    static applyLoggingLegacyKey(config, key, value, previousConfig = {}) {
        if (key === 'logIgnore') {
            const logging = {
                ...(previousConfig.logging || config.logging || {}),
                ignore: value,
            };
            const next = { ...config, logging };
            delete next.logIgnore;
            return next;
        }

        const destination = LEGACY_LOGGING_KEY_MAP[key];
        if (!destination) {
            return config;
        }

        const channelId = value && typeof value === 'object' ? value.id : value;
        const logging = {
            ...(previousConfig.logging || config.logging || {}),
            channels: {
                ...((previousConfig.logging || config.logging || {}).channels || {}),
                [destination]: channelId ?? null,
            },
            enabled: channelId ? true : (previousConfig.logging?.enabled ?? config.logging?.enabled ?? false),
        };

        const next = { ...config, logging };
        delete next[key];
        if (key === 'logChannelId') {
            delete next.enableLogging;
        }
        if (key === 'reportChannelId') {
            delete next.reportChannelId;
        }
        return next;
    }

    static validateConfigKeySafety(key) {
        if (typeof key !== 'string' || key.trim().length === 0) {
            throw createError(
                'Invalid setting key',
                ErrorTypes.VALIDATION,
                'Setting key must be a non-empty string.',
                { key }
            );
        }

        if (this.UNSAFE_KEYS.includes(key)) {
            throw createError(
                'Unsafe setting key',
                ErrorTypes.VALIDATION,
                'This setting key is not allowed for security reasons.',
                { key }
            );
        }
    }

    static async validateConfigValue(key, value, guild) {
        logger.debug(`[CONFIG_SERVICE] Validating config value`, { key, type: typeof value });

        const rule = CONFIG_VALIDATION_RULES[key];
        
        if (!rule) {
            logger.warn(`[CONFIG_SERVICE] No validation rule for key: ${key}`);
            return true; 
        }

        if (rule.required === false && (value === null || value === undefined)) {
            return true;
        }

        const zodSchema = ConfigValueSchemas[key];
        if (zodSchema) {
            const parsed = zodSchema.safeParse(value);
            if (!parsed.success) {
                throw createError(
                    'Invalid configuration value',
                    ErrorTypes.VALIDATION,
                    'Provided configuration value is invalid.',
                    {
                        key,
                        errorCode: 'VALIDATION_FAILED',
                        issues: parsed.error.issues.map((issue) => ({
                            path: issue.path.join('.'),
                            message: issue.message,
                            code: issue.code
                        }))
                    }
                );
            }
        }

        if (rule.type === 'channel') {
            if (typeof value !== 'string' && typeof value !== 'object') {
                throw createError(
                    'Invalid channel',
                    ErrorTypes.VALIDATION,
                    'Channel ID must be a string.',
                    { key, provided: typeof value }
                );
            }

            const channelId = typeof value === 'string' ? value : value.id;
            const channel = guild.channels.cache.get(channelId);

            if (!channel) {
                throw createError(
                    'Channel not found',
                    ErrorTypes.VALIDATION,
                    'The specified channel does not exist.',
                    { key, channelId }
                );
            }

            if (!channel.isTextBased?.()) {
                throw createError(
                    'Invalid channel type',
                    ErrorTypes.VALIDATION,
                    'Only text channels are allowed.',
                    { key, channelId, channelType: channel.type }
                );
            }

            return true;
        }

        if (rule.type === 'role') {
            if (typeof value !== 'string' && typeof value !== 'object') {
                throw createError(
                    'Invalid role',
                    ErrorTypes.VALIDATION,
                    'Role ID must be a string.',
                    { key, provided: typeof value }
                );
            }

            const roleId = typeof value === 'string' ? value : value.id;
            const role = guild.roles.cache.get(roleId);

            if (!role) {
                throw createError(
                    'Role not found',
                    ErrorTypes.VALIDATION,
                    'The specified role does not exist.',
                    { key, roleId }
                );
            }

            const botHighestRole = guild.members.me?.roles.highest;
            if (role.position >= botHighestRole?.position) {
                throw createError(
                    'Role too high',
                    ErrorTypes.VALIDATION,
                    "Can't set roles higher than my highest role.",
                    { key, roleId, rolePosition: role.position }
                );
            }

            return true;
        }

        if (rule.type === 'string') {
            if (typeof value !== 'string') {
                throw createError(
                    'Invalid value type',
                    ErrorTypes.VALIDATION,
                    'Value must be a string.',
                    { key, provided: typeof value }
                );
            }

            const length = value.length;
            if (rule.maxLength && length > rule.maxLength) {
                throw createError(
                    'Value too long',
                    ErrorTypes.VALIDATION,
                    `Value cannot exceed **${rule.maxLength}** characters.`,
                    { key, current: length, max: rule.maxLength }
                );
            }

            if (rule.minLength && length < rule.minLength) {
                throw createError(
                    'Value too short',
                    ErrorTypes.VALIDATION,
                    `Value must be at least **${rule.minLength}** character(s).`,
                    { key, current: length, min: rule.minLength }
                );
            }

            return true;
        }

        if (rule.type === 'number') {
            if (typeof value !== 'number') {
                throw createError(
                    'Invalid value type',
                    ErrorTypes.VALIDATION,
                    'Value must be a number.',
                    { key, provided: typeof value }
                );
            }

            if (rule.min !== undefined && value < rule.min) {
                throw createError(
                    'Value too low',
                    ErrorTypes.VALIDATION,
                    `Value must be at least **${rule.min}**.`,
                    { key, value, min: rule.min }
                );
            }

            if (rule.max !== undefined && value > rule.max) {
                throw createError(
                    'Value too high',
                    ErrorTypes.VALIDATION,
                    `Value cannot exceed **${rule.max}**.`,
                    { key, value, max: rule.max }
                );
            }

            return true;
        }

        if (rule.type === 'boolean') {
            if (typeof value !== 'boolean') {
                throw createError(
                    'Invalid value type',
                    ErrorTypes.VALIDATION,
                    'Value must be true or false.',
                    { key, provided: typeof value }
                );
            }

            return true;
        }

        if (rule.type === 'object') {
            if (typeof value !== 'object' || value === null) {
                throw createError(
                    'Invalid value type',
                    ErrorTypes.VALIDATION,
                    'Value must be an object.',
                    { key, provided: typeof value }
                );
            }

            return true;
        }

        return true;
    }

    static detectConflicts(currentConfig, key, value) {
        logger.debug(`[CONFIG_SERVICE] Checking for config conflicts`, { key });

        const conflicts = [];
        const relatedSettings = SETTING_CONFLICTS[key] || [];

        for (const related of relatedSettings) {
            if (related === 'logging' && value === null) {
                
                if (currentConfig.logging?.enabled) {
                    conflicts.push(
                        `Disabling log channel but logging system is still enabled. Consider disabling logging first.`
                    );
                }
            }
        }

        return conflicts;
    }

    static async updateSetting(client, guildId, key, value, adminId) {
        logger.info(`[CONFIG_SERVICE] Updating setting`, {
            guildId,
            key,
            adminId,
            valueType: typeof value
        });

        this.validateConfigKeySafety(key);

        if (this.PROTECTED_SETTINGS.includes(key)) {
            logger.warn(`[CONFIG_SERVICE] Attempted to modify protected setting`, {
                key,
                guildId,
                adminId
            });
            throw createError(
                'Protected setting',
                ErrorTypes.VALIDATION,
                `The setting **${key}** cannot be modified.`,
                { key }
            );
        }

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            throw createError(
                'Guild not found',
                ErrorTypes.VALIDATION,
                'Guild does not exist.',
                { guildId }
            );
        }

        await this.validateConfigValue(key, value, guild);

        const currentConfig = await getGuildConfig(client, guildId);

        const conflicts = this.detectConflicts(currentConfig, key, value);
        if (conflicts.length > 0) {
            logger.warn(`[CONFIG_SERVICE] Config conflicts detected`, {
                guildId,
                key,
                conflicts
            });
            
        }

        const oldValue = currentConfig[key];

        let updatedConfig = { ...currentConfig, [key]: value };
        updatedConfig = this.applyLoggingLegacyKey(updatedConfig, key, value, currentConfig);

        await setGuildConfig(client, guildId, updatedConfig);

        this.recordChange(guildId, {
            key,
            oldValue,
            newValue: value,
            changedBy: adminId,
            timestamp: new Date().toISOString(),
            conflicts
        });

        logger.info(`[CONFIG_SERVICE] Setting updated successfully`, {
            guildId,
            key,
            adminId,
            oldValue: typeof oldValue === 'string' ? oldValue.substring(0, 50) : oldValue,
            newValue: typeof value === 'string' ? value.substring(0, 50) : value,
            hasConflicts: conflicts.length > 0,
            timestamp: new Date().toISOString()
        });

        return {
            key,
            oldValue,
            newValue: value,
            conflicts
        };
    }

    static async bulkUpdate(client, guildId, updates, adminId) {
        logger.info(`[CONFIG_SERVICE] Bulk updating settings`, {
            guildId,
            updateCount: Object.keys(updates).length,
            adminId
        });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            throw createError(
                'Guild not found',
                ErrorTypes.VALIDATION,
                'Guild does not exist.',
                { guildId }
            );
        }

        const validatedUpdates = {};
        const validationErrors = [];

        for (const [key, value] of Object.entries(updates)) {
            try {
                this.validateConfigKeySafety(key);

                if (this.PROTECTED_SETTINGS.includes(key)) {
                    validationErrors.push(`${key}: Protected setting cannot be modified`);
                    continue;
                }

                await this.validateConfigValue(key, value, guild);
                validatedUpdates[key] = value;
            } catch (error) {
                validationErrors.push(`${key}: ${error.details?.message || error.message}`);
            }
        }

        if (validationErrors.length > 0) {
            logger.warn(`[CONFIG_SERVICE] Bulk update validation failed`, {
                guildId,
                errors: validationErrors
            });
            throw createError(
                'Validation failed',
                ErrorTypes.VALIDATION,
                `Some settings failed validation:\n• ${validationErrors.join('\n• ')}`,
                { errors: validationErrors }
            );
        }

        const currentConfig = await getGuildConfig(client, guildId);

        const updatedConfig = { ...currentConfig, ...validatedUpdates };
        await setGuildConfig(client, guildId, updatedConfig);

        for (const [key, value] of Object.entries(validatedUpdates)) {
            this.recordChange(guildId, {
                key,
                oldValue: currentConfig[key],
                newValue: value,
                changedBy: adminId,
                isBulkUpdate: true,
                timestamp: new Date().toISOString()
            });
        }

        logger.info(`[CONFIG_SERVICE] Bulk update completed`, {
            guildId,
            adminId,
            appliedCount: Object.keys(validatedUpdates).length,
            failedCount: validationErrors.length,
            timestamp: new Date().toISOString()
        });

        return {
            applied: Object.keys(validatedUpdates),
            failed: validationErrors,
            appliedCount: Object.keys(validatedUpdates).length,
            failedCount: validationErrors.length
        };
    }

    static recordChange(guildId, changeData) {
        if (!configChangeHistory.has(guildId)) {
            configChangeHistory.set(guildId, []);
        }

        const history = configChangeHistory.get(guildId);
        history.push(changeData);

        if (history.length > CONFIG_HISTORY_LIMIT) {
            history.shift();
        }

        logger.debug(`[CONFIG_SERVICE] Change recorded for audit trail`, {
            guildId,
            key: changeData.key,
            historySize: history.length
        });
    }

    static getChangeHistory(guildId, limit = 20) {
        const history = configChangeHistory.get(guildId) || [];
        return history.slice(-limit).reverse();
    }

    static async resetSetting(client, guildId, key, adminId) {
        logger.info(`[CONFIG_SERVICE] Resetting setting`, {
            guildId,
            key,
            adminId
        });

        const currentConfig = await getGuildConfig(client, guildId);
        const oldValue = currentConfig[key];

        const defaultValue = null;

        const updatedConfig = { ...currentConfig, [key]: defaultValue };
        await setGuildConfig(client, guildId, updatedConfig);

        this.recordChange(guildId, {
            key,
            oldValue,
            newValue: defaultValue,
            changedBy: adminId,
            isReset: true,
            timestamp: new Date().toISOString()
        });

        logger.info(`[CONFIG_SERVICE] Setting reset successfully`, {
            guildId,
            key,
            adminId,
            oldValue,
            timestamp: new Date().toISOString()
        });

        return {
            key,
            oldValue,
            newValue: defaultValue
        };
    }

    static async getConfigSummary(client, guildId) {
        logger.debug(`[CONFIG_SERVICE] Fetching config summary`, { guildId });

        const config = await getGuildConfig(client, guildId);
        const guild = client.guilds.cache.get(guildId);

        if (!guild) {
            throw createError(
                'Guild not found',
                ErrorTypes.VALIDATION,
                'Guild does not exist.',
                { guildId }
            );
        }

        const summary = {};

        for (const [key, value] of Object.entries(config)) {
            if (this.PROTECTED_SETTINGS.includes(key)) continue;

            const rule = CONFIG_VALIDATION_RULES[key];
            if (!rule) continue;

            if (rule.type === 'channel' && value) {
                const channel = guild.channels.cache.get(value);
                summary[key] = {
                    id: value,
                    name: channel?.name || 'Unknown',
                    status: channel ? 'Valid' : 'Missing'
                };
            } else if (rule.type === 'role' && value) {
                const role = guild.roles.cache.get(value);
                summary[key] = {
                    id: value,
                    name: role?.name || 'Unknown',
                    status: role ? 'Valid' : 'Missing'
                };
            } else {
                summary[key] = value;
            }
        }

        return {
            guildId,
            settings: summary,
            recordedAt: new Date().toISOString()
        };
    }

    static verifyPermission(member) {
        return member.permissions.has([
            PermissionFlagsBits.Administrator,
            PermissionFlagsBits.ManageGuild
        ]);
    }
}

wrapServiceClassMethods(ConfigService, (methodName) => ({
    service: 'ConfigService',
    operation: methodName,
    message: `Configuration service operation failed: ${methodName}`,
    userMessage: 'A configuration operation failed. Please try again in a moment.'
}));

export default ConfigService;
