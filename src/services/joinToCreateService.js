// joinToCreateService.js

import {
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import {
  getJoinToCreateConfig,
  saveJoinToCreateConfig,
  getTemporaryChannelInfo,
} from '../utils/database.js';
import { logger } from '../utils/logger.js';
import { TitanBotError, ErrorTypes } from '../utils/errorHandler.js';
import { logEvent, EVENT_TYPES } from './loggingService.js';
import { formatLogLine } from '../utils/logging/logEmbeds.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_NAME_MAX_LENGTH = 100;
const CHANNEL_VARIABLE_MAX_LENGTH = 32;
const CONTROL_AND_INVISIBLE_CHARS_REGEX = /[\x00-\x1F\x7F\u200B-\u200D\uFEFF]/g;
const FORBIDDEN_CHARS_REGEX = /[@#:`\n\r\t]/g;
const DEFAULT_CHANNEL_NAME = 'Voice Channel';

const ALLOWED_TEMPLATE_PLACEHOLDERS = new Set([
  '{username}',
  '{user_tag}',
  '{displayName}',
  '{display_name}',
  '{guildName}',
  '{guild_name}',
  '{channelName}',
  '{channel_name}',
]);

const PLACEHOLDER_MAP = Object.freeze({
  '{username}': 'username',
  '{user_tag}': 'userTag',
  '{displayName}': 'displayName',
  '{display_name}': 'displayName',
  '{guildName}': 'guildName',
  '{guild_name}': 'guildName',
  '{channelName}': 'channelName',
  '{channel_name}': 'channelName',
});

const DEFAULT_REPLACEMENTS = Object.freeze({
  username: 'User',
  userTag: 'User#0000',
  displayName: 'User',
  guildName: 'Server',
  channelName: 'Voice Channel',
});

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * Normalize a channel name template for safe use.
 * @param {string} template
 * @returns {string}
 */
function normalizeTemplate(template) {
  return template
    .normalize('NFKC')
    .replace(CONTROL_AND_INVISIBLE_CHARS_REGEX, '')
    .trim();
}

/**
 * Sanitize a variable value for channel name substitution.
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeVariable(value) {
  if (value === null || value === undefined) return 'Unknown';
  return String(value)
    .normalize('NFKC')
    .replace(CONTROL_AND_INVISIBLE_CHARS_REGEX, '')
    .replace(FORBIDDEN_CHARS_REGEX, '')
    .trim()
    .substring(0, CHANNEL_VARIABLE_MAX_LENGTH);
}

export function validateChannelNameTemplate(template) {
  if (!template || typeof template !== 'string') {
    throw new TitanBotError(
      'Invalid channel template: must be a non-empty string',
      ErrorTypes.VALIDATION,
      'Channel name template must be valid text.'
    );
  }

  const normalized = normalizeTemplate(template);

  if (normalized.length > CHANNEL_NAME_MAX_LENGTH) {
    throw new TitanBotError(
      'Channel template exceeds maximum length',
      ErrorTypes.VALIDATION,
      `Channel name template cannot exceed ${CHANNEL_NAME_MAX_LENGTH} characters.`
    );
  }

  if (FORBIDDEN_CHARS_REGEX.test(normalized)) {
    throw new TitanBotError(
      'Channel template contains forbidden characters',
      ErrorTypes.VALIDATION,
      'Channel template cannot contain @, #, :, backtick, or newline characters.'
    );
  }

  const placeholders = normalized.match(/\{[^}]+\}/g) || [];
  for (const placeholder of placeholders) {
    if (!ALLOWED_TEMPLATE_PLACEHOLDERS.has(placeholder)) {
      throw new TitanBotError(
        'Channel template contains unknown placeholders',
        ErrorTypes.VALIDATION,
        `Unknown placeholder: ${placeholder}. Allowed: ${Array.from(ALLOWED_TEMPLATE_PLACEHOLDERS).join(', ')}`
      );
    }
  }

  return true;
}

export function validateBitrate(bitrate) {
  const bitrateNum = Number(bitrate);
  if (!Number.isFinite(bitrateNum)) {
    throw new TitanBotError(
      'Bitrate must be a valid number',
      ErrorTypes.VALIDATION,
      'Please enter a valid number for bitrate.'
    );
  }

  if (bitrateNum < 8 || bitrateNum > 384) {
    throw new TitanBotError(
      'Bitrate out of valid range',
      ErrorTypes.VALIDATION,
      'Bitrate must be between 8 and 384 kbps.'
    );
  }

  return true;
}

export function validateUserLimit(limit) {
  const limitNum = Number(limit);
  if (!Number.isFinite(limitNum)) {
    throw new TitanBotError(
      'User limit must be a valid number',
      ErrorTypes.VALIDATION,
      'Please enter a valid number for user limit.'
    );
  }

  if (limitNum < 0 || limitNum > 99) {
    throw new TitanBotError(
      'User limit out of valid range',
      ErrorTypes.VALIDATION,
      'User limit must be between 0 (no limit) and 99.'
    );
  }

  return true;
}

// ─── Formatting ─────────────────────────────────────────────────────────────────

export function formatChannelName(template, variables) {
  try {
    const safeTemplate = normalizeTemplate(template);
    validateChannelNameTemplate(safeTemplate);

    if (!variables || typeof variables !== 'object') {
      throw new TitanBotError(
        'Invalid variables object for channel formatting',
        ErrorTypes.VALIDATION
      );
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(variables)) {
      sanitized[key] = sanitizeVariable(value);
    }

    const replacements = {};
    for (const [placeholder, varKey] of Object.entries(PLACEHOLDER_MAP)) {
      replacements[placeholder] = sanitized[varKey] || DEFAULT_REPLACEMENTS[varKey];
    }

    let formatted = safeTemplate;
    for (const [placeholder, value] of Object.entries(replacements)) {
      const escaped = placeholder.replace(/[{}]/g, '\\$&');
      formatted = formatted.replace(new RegExp(escaped, 'g'), value);
    }

    formatted = normalizeTemplate(formatted)
      .replace(FORBIDDEN_CHARS_REGEX, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (formatted.length === 0) {
      formatted = DEFAULT_CHANNEL_NAME;
    } else if (formatted.length > CHANNEL_NAME_MAX_LENGTH) {
      formatted = formatted.substring(0, CHANNEL_NAME_MAX_LENGTH);
    }

    logger.debug('Formatted channel name', {
      event: 'jtc.format',
      template,
      result: formatted,
    });

    return formatted;
  } catch (error) {
    logger.error('Channel name formatting failed', { event: 'jtc.format.error', error: error.message });
    throw error;
  }
}

// ─── Database Guard ─────────────────────────────────────────────────────────────

function assertDatabase(client) {
  if (!client?.db) {
    throw new TitanBotError(
      'Database service not available',
      ErrorTypes.DATABASE,
      'System error occurred. Please try again.'
    );
  }
}

function assertGuildAndChannel(guildId, channelId) {
  if (!guildId || !channelId) {
    throw new TitanBotError(
      'Missing required guild or channel ID',
      ErrorTypes.VALIDATION,
      'Invalid guild or channel information provided.'
    );
  }
}

// ─── CRUD Operations ───────────────────────────────────────────────────────────

export async function initializeJoinToCreate(client, guildId, channelId, options = {}) {
  assertDatabase(client);
  assertGuildAndChannel(guildId, channelId);

  if (options.nameTemplate) validateChannelNameTemplate(options.nameTemplate);
  if (options.bitrate) validateBitrate(options.bitrate / 1000);
  if (options.userLimit !== undefined) validateUserLimit(options.userLimit);

  const config = await getJoinToCreateConfig(client, guildId);

  if (config.triggerChannels.includes(channelId)) {
    throw new TitanBotError(
      'Channel already configured as Join to Create trigger',
      ErrorTypes.VALIDATION,
      'This channel is already set up as a Join to Create trigger.'
    );
  }

  if (Array.isArray(config.triggerChannels) && config.triggerChannels.length > 0) {
    throw new TitanBotError(
      'Guild already has a Join to Create trigger configured',
      ErrorTypes.VALIDATION,
      'This server already has a Join to Create channel configured. Use `/jointocreate dashboard` to modify it, or remove it before creating a new one.',
      {
        guildId,
        existingTriggerChannelId: config.triggerChannels[0],
        expected: true,
        suppressErrorLog: true,
      }
    );
  }

  config.triggerChannels.push(channelId);
  config.enabled = true;

  if (Object.keys(options).length > 0) {
    config.channelOptions ??= {};
    config.channelOptions[channelId] = {
      nameTemplate: options.nameTemplate || config.channelNameTemplate,
      userLimit: options.userLimit ?? config.userLimit,
      bitrate: options.bitrate || config.bitrate,
      categoryId: options.categoryId || null,
      createdAt: Date.now(),
    };
  }

  const saveResult = await saveJoinToCreateConfig(client, guildId, config);
  if (!saveResult) {
    throw new TitanBotError(
      'Failed to save Join to Create configuration',
      ErrorTypes.DATABASE,
      'Failed to set up Join to Create system. Please try again.'
    );
  }

  logger.info('Join to Create initialized', {
    event: 'jtc.init',
    guildId,
    channelId,
  });

  return config;
}

export async function updateChannelConfig(client, guildId, channelId, updates) {
  assertDatabase(client);

  const config = await getJoinToCreateConfig(client, guildId);

  if (!config.triggerChannels.includes(channelId)) {
    throw new TitanBotError(
      'Channel is not configured as a Join to Create trigger',
      ErrorTypes.VALIDATION,
      'This channel is not set up as a Join to Create trigger.'
    );
  }

  if (updates.nameTemplate) validateChannelNameTemplate(updates.nameTemplate);
  if (updates.bitrate !== undefined) validateBitrate(updates.bitrate / 1000);
  if (updates.userLimit !== undefined) validateUserLimit(updates.userLimit);

  config.channelOptions ??= {};
  config.channelOptions[channelId] = {
    ...config.channelOptions[channelId],
    ...updates,
    updatedAt: Date.now(),
  };

  await saveJoinToCreateConfig(client, guildId, config);

  logger.info('Join to Create config updated', {
    event: 'jtc.update',
    guildId,
    channelId,
    updates: Object.keys(updates),
  });

  return config.channelOptions[channelId];
}

export async function removeTriggerChannel(client, guildId, channelId) {
  assertDatabase(client);

  const config = await getJoinToCreateConfig(client, guildId);

  const index = config.triggerChannels.indexOf(channelId);
  if (index === -1) {
    throw new TitanBotError(
      'Channel not found in Join to Create triggers',
      ErrorTypes.VALIDATION,
      'This channel is not configured as a Join to Create trigger.'
    );
  }

  config.triggerChannels.splice(index, 1);
  config.enabled = config.triggerChannels.length > 0;

  if (config.channelOptions?.[channelId]) {
    delete config.channelOptions[channelId];
  }

  if (config.temporaryChannels) {
    for (const [tempChannelId, tempInfo] of Object.entries(config.temporaryChannels)) {
      if (tempInfo.triggerChannelId === channelId) {
        delete config.temporaryChannels[tempChannelId];
      }
    }
  }

  await saveJoinToCreateConfig(client, guildId, config);

  logger.info('Join to Create trigger removed', {
    event: 'jtc.remove',
    guildId,
    channelId,
  });

  return true;
}

export async function getConfiguration(client, guildId) {
  assertDatabase(client);
  return getJoinToCreateConfig(client, guildId);
}

export async function isTriggerChannel(client, guildId, channelId) {
  try {
    const config = await getConfiguration(client, guildId);
    return config.triggerChannels.includes(channelId);
  } catch (error) {
    logger.error('Trigger channel check failed', { event: 'jtc.check.error', error: error.message });
    return false;
  }
}

export async function getChannelConfiguration(client, guildId, channelId) {
  const config = await getConfiguration(client, guildId);

  if (!Array.isArray(config.triggerChannels) || !config.triggerChannels.includes(channelId)) {
    throw new TitanBotError(
      'Channel is not a valid Join to Create trigger',
      ErrorTypes.VALIDATION,
      'This channel is not set up as a Join to Create trigger.'
    );
  }

  return {
    ...config,
    channelConfig: config.channelOptions?.[channelId] ?? {},
  };
}

// ─── Permissions ────────────────────────────────────────────────────────────────

export function hasManageGuildPermission(member) {
  try {
    return member?.permissions?.has(PermissionFlagsBits.ManageGuild) ?? false;
  } catch (error) {
    logger.error('Permission check failed', { event: 'jtc.permission.error', error: error.message });
    return false;
  }
}

// ─── Logging ────────────────────────────────────────────────────────────────────

export async function logConfigurationChange(client, guildId, userId, action, details) {
  try {
    await logEvent({
      client,
      guildId,
      eventType: EVENT_TYPES.COUNTER_CONFIG,
      data: {
        title: 'Join to Create Updated',
        lines: [
          formatLogLine('Action', action),
          formatLogLine('Details', typeof details === 'string' ? details : JSON.stringify(details)),
        ],
        userId,
      },
    });
  } catch (error) {
    logger.warn('Failed to log JTC config change', { event: 'jtc.log.warn', error: error.message });
  }
}

// ─── Channel Creation ───────────────────────────────────────────────────────────

export async function createTemporaryChannel(guild, member, options = {}) {
  if (!guild || !member) {
    throw new TitanBotError(
      'Invalid guild or member',
      ErrorTypes.VALIDATION
    );
  }

  const {
    nameTemplate,
    userLimit,
    bitrate,
    parentId,
  } = options;

  if (nameTemplate) validateChannelNameTemplate(nameTemplate);
  if (userLimit !== undefined) validateUserLimit(userLimit);
  if (bitrate !== undefined) validateBitrate(bitrate / 1000);

  const channelName = formatChannelName(nameTemplate ?? '{username}\'s Room', {
    username: member.user.username,
    displayName: member.displayName,
    userTag: member.user.tag,
    guildName: guild.name,
  });

  const tempChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    parent: parentId,
    userLimit: userLimit === 0 ? undefined : userLimit,
    bitrate: bitrate || 64000,
    permissionOverwrites: [
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.Connect,
          PermissionFlagsBits.Speak,
          PermissionFlagsBits.PrioritySpeaker,
          PermissionFlagsBits.MoveMembers,
        ],
      },
      {
        id: guild.id,
        allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
      },
    ],
  });

  logger.info('Temporary channel created', {
    event: 'jtc.channel.created',
    channelId: tempChannel.id,
    channelName: tempChannel.name,
    ownerId: member.id,
  });

  return {
    id: tempChannel.id,
    name: tempChannel.name,
    ownerId: member.id,
  };
}

// ─── Default Export ───────────────────────────────────────────────────────────

export default {
  validateChannelNameTemplate,
  validateBitrate,
  validateUserLimit,
  formatChannelName,
  initializeJoinToCreate,
  updateChannelConfig,
  removeTriggerChannel,
  getConfiguration,
  isTriggerChannel,
  getChannelConfiguration,
  hasManageGuildPermission,
  logConfigurationChange,
  createTemporaryChannel,
};
