/**
 * /configwizard — Server Configuration Dashboard & Setup Wizard
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelType,
  ChatInputCommandInteraction,
  Guild,
  Client,
  DMChannel,
  TextChannel,
  Role,
  MessageComponentInteraction,
  ModalSubmitInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import {
  createEmbed,
  successEmbed,
  infoEmbed,
  warningEmbed,
  errorEmbed,
  buildUserErrorEmbed,
} from '../../utils/embeds.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import { getGuildConfig, setConfigValue } from '../../services/config/guildConfig.js';
import ConfigService from '../../services/config/configService.js';
import { logger } from '../../utils/logger.js';
import { botConfig, getCommandPrefix, isFeatureEnabled } from '../../config/bot.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Alias & Category System Integration ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

import {
  getCategoryIcon,
  formatCategoryName,
  normalizeCategoryKey,
  isRestrictedCategory,
  isGuildConfigurable,
  getFeatureToggleKey,
  getCategoryList,
} from '../../config/aliases.js'; // Adjust path to your category config

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const DASHBOARD_CUSTOM_ID = 'config_select';
const WIZARD_BUTTON_ID = 'config_wizard';
const DASHBOARD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const MODAL_TIMEOUT_MS = 120_000; // 2 minutes
const WIZARD_DM_TIMEOUT_MS = 180_000; // 3 minutes
const WIZARD_SESSION_TIMEOUT_MS = 600_000; // 10 minutes session max

/** Active wizard sessions to prevent duplicate DMs. Maps userId → {guildId, startTime} */
const activeWizardSessions = new Map();

/** Settings that can be configured via the dashboard select menu. */
const CONFIGURABLE_SETTINGS = Object.freeze([
  { key: 'prefix', label: 'Server Prefix', description: 'Change the text command prefix', emoji: '⌨️', type: 'text' },
  { key: 'modRole', label: 'Moderator Role', description: 'Role used for moderation commands', emoji: '🛡️', type: 'role' },
  { key: 'logChannelId', label: 'Log Channel', description: 'Channel for system log messages', emoji: '📋', type: 'channel' },
  { key: 'autoModeration', label: 'Auto-Moderation', description: 'Configure anti-spam, anti-raid, and other protections', emoji: '🤖', type: 'automod' },
  { key: 'welcomeChannel', label: 'Welcome Channel', description: 'Channel for welcome/goodbye messages', emoji: '👋', type: 'channel' },
  { key: 'muteRole', label: 'Mute Role', description: 'Role used for timeouts/mutes', emoji: '🔇', type: 'role' },
]);

/** DM enable help instructions. */
const DM_DISABLED_HELP = [
  '1. Right-click this server\'s name (mobile: tap the server name at the top).',
  '2. Open **Privacy Settings**.',
  '3. Turn on **Allow direct messages from server members**.',
  '4. Click **Start Setup Wizard** again.',
].join('\n');

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Wizard Session Management ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Start a wizard session for a user.
 * @param {string} userId
 * @param {string} guildId
 * @returns {boolean} - False if already active
 */
function startWizardSession(userId, guildId) {
  if (activeWizardSessions.has(userId)) {
    const session = activeWizardSessions.get(userId);
    // Allow override if session is stale (>10 min)
    if (Date.now() - session.startTime > WIZARD_SESSION_TIMEOUT_MS) {
      activeWizardSessions.set(userId, { guildId, startTime: Date.now() });
      return true;
    }
    return false;
  }
  activeWizardSessions.set(userId, { guildId, startTime: Date.now() });
  return true;
}

/**
 * End a wizard session for a user.
 * @param {string} userId
 */
function endWizardSession(userId) {
  activeWizardSessions.delete(userId);
}

/**
 * Check if a user has an active wizard session.
 * @param {string} userId
 * @returns {boolean}
 */
function hasActiveWizardSession(userId) {
  if (!activeWizardSessions.has(userId)) return false;
  const session = activeWizardSessions.get(userId);
  if (Date.now() - session.startTime > WIZARD_SESSION_TIMEOUT_MS) {
    activeWizardSessions.delete(userId);
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Formatting Helpers ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format a channel ID into a mention or fallback.
 * @param {Guild} guild
 * @param {string|null} channelId
 * @returns {string}
 */
function formatChannelMention(guild, channelId) {
  if (!channelId) return '`Not set`';
  const channel = guild.channels.cache.get(channelId);
  return channel ? `<#${channelId}>` : `<#${channelId}> (deleted)`;
}

/**
 * Format a role ID into a mention or fallback.
 * @param {Guild} guild
 * @param {string|null} roleId
 * @returns {string}
 */
function formatRoleMention(guild, roleId) {
  if (!roleId) return '`Not set`';
  const role = guild.roles.cache.get(roleId);
  return role ? `<@&${roleId}>` : `<@&${roleId}> (deleted)`;
}

/**
 * Get bot presence display text.
 * @returns {string}
 */
function getBotPresenceText() {
  const activity = botConfig.presence?.activities?.[0];
  if (!activity?.name) return '`Not configured`';

  const typeLabels = ['Playing', 'Streaming', 'Listening to', 'Watching', '', 'Competing in'];
  const typeLabel = typeLabels[activity.type];
  if (!typeLabel) return activity.name;

  return `${typeLabel} **${activity.name}**`;
}

/**
 * Get theme color lines for display.
 * @returns {string}
 */
function getThemeColorLines() {
  const colors = botConfig.embeds.colors;
  return [
    `🎨 Primary \`${colors.primary}\` · Success \`${colors.success}\``,
    `⚠️ Warning \`${colors.warning}\` · Error \`${colors.error}\``,
  ].join('\n');
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Status Builder ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build auto-moderation status text for the dashboard.
 * @param {object} config
 * @returns {string}
 */
function getAutomodStatusText(config) {
  if (!isFeatureEnabled('autoModeration')) {
    return '🔒 Auto-moderation is not available on this bot instance.';
  }

  const automod = config.autoModeration;
  if (!automod?.enabled) {
    return '⚪ Auto-moderation is disabled. Use `/automoderation enable` to turn it on.';
  }

  const rules = [];
  const ruleMap = {
    antiSpam: 'Anti-Spam',
    antiRaid: 'Anti-Raid',
    antiCaps: 'Anti-Caps',
    antiInvite: 'Anti-Invite',
    antiLink: 'Anti-Link',
    mentionSpam: 'Mention-Spam',
    antiNsfw: 'Anti-NSFW',
    antiZalgo: 'Anti-Zalgo',
    antiProfanity: 'Anti-Profanity',
    antiSelfbot: 'Anti-Selfbot',
    antiGhostPing: 'Anti-Ghost Ping',
    antiDehoist: 'Anti-Dehoist',
    antiEmojiSpam: 'Anti-Emoji Spam',
    antiNewline: 'Anti-Newline',
    antiStickerSpam: 'Anti-Sticker Spam',
    antiGifSpam: 'Anti-GIF Spam',
    antiImageFlood: 'Anti-Image Flood',
    antiWebhookSpam: 'Anti-Webhook Spam',
    antiBotSpam: 'Anti-Bot Spam',
    antiTokenLeak: 'Anti-Token Leak',
    antiDoxxing: 'Anti-Doxxing',
  };

  for (const [key, label] of Object.entries(ruleMap)) {
    if (automod[key]?.enabled) rules.push(label);
  }

  if (rules.length === 0) {
    return '⚪ Auto-moderation is enabled but no rules are active.';
  }

  return `🛡️ Active rules: ${rules.join(', ')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Dashboard Embed Builder ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the main dashboard embed.
 * @param {object} config
 * @param {Guild} guild
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildDashboardEmbed(config, guild) {
  const setupDone = config.setupWizardCompleted;

  const fields = [
    {
      name: '⌨️ Server Prefix',
      value: `\`${config.prefix || getCommandPrefix()}\``,
      inline: true,
    },
    {
      name: '🛡️ Moderator Role',
      value: formatRoleMention(guild, config.modRole),
      inline: true,
    },
    {
      name: '📋 Log Channel',
      value: formatChannelMention(guild, config.logging?.channels?.audit),
      inline: true,
    },
    {
      name: '👋 Welcome Channel',
      value: formatChannelMention(guild, config.welcomeChannel),
      inline: true,
    },
    {
      name: '🔇 Mute Role',
      value: formatRoleMention(guild, config.muteRole),
      inline: true,
    },
    {
      name: '💚 Bot Status',
      value: getBotPresenceText(),
      inline: false,
    },
    {
      name: '🎨 Embed Theme',
      value: `${getThemeColorLines()}\n-# Colors are set in bot config and apply globally.`,
      inline: false,
    },
    {
      name: '⚡ Command Access',
      value: 'Use `/commands dashboard` to enable or disable commands and subcommands.',
      inline: false,
    },
    {
      name: '🤖 Auto-Moderation',
      value: getAutomodStatusText(config),
      inline: false,
    },
    {
      name: `${setupDone ? '✅' : '📝'} Setup`,
      value: setupDone
        ? 'Setup wizard completed — re-run anytime to update settings.'
        : 'Run the setup wizard to configure your server quickly.',
      inline: false,
    },
  ];

  return createEmbed({
    title: '⚙️ Server Configuration',
    description: `Core settings for **${guild.name}**. Pick an option below or run the setup wizard.`,
    color: 'info',
    fields,
    footer: 'Dashboard closes after 10 minutes of inactivity',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Component Builders ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the settings select menu.
 * @param {string} guildId
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function buildSettingsSelect(guildId) {
  const options = CONFIGURABLE_SETTINGS.filter((setting) => {
    // Filter out automod if feature disabled
    if (setting.key === 'autoModeration' && !isFeatureEnabled('autoModeration')) return false;
    return true;
  }).map((setting) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(setting.label)
      .setDescription(setting.description)
      .setValue(setting.key)
      .setEmoji(setting.emoji)
  );

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${DASHBOARD_CUSTOM_ID}:${guildId}`)
      .setPlaceholder('⚙️ Select a setting to edit...')
      .addOptions(options)
  );
}

/**
 * Build the wizard button row.
 * @param {object} config
 * @param {string} guildId
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildButtonRow(config, guildId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${WIZARD_BUTTON_ID}:${guildId}`)
      .setLabel(config.setupWizardCompleted ? 'Re-run Setup Wizard' : 'Start Setup Wizard')
      .setEmoji('📝')
      .setStyle(config.setupWizardCompleted ? ButtonStyle.Secondary : ButtonStyle.Success)
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── ID Extraction Helpers ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract a Discord ID from mention or raw ID string.
 * @param {string} value
 * @returns {string|null}
 */
function extractId(value) {
  if (!value || typeof value !== 'string') return null;

  const channelMention = value.match(/<#!?(\d{17,19})>/);
  if (channelMention) return channelMention[1];

  const roleMention = value.match(/<@&(\d{17,19})>/);
  if (roleMention) return roleMention[1];

  const userMention = value.match(/<@!?(\d{17,19})>/);
  if (userMention) return userMention[1];

  const digits = value.match(/^(\d{17,19})$/);
  if (digits) return digits[1];

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Validation Helpers ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate a guild channel ID exists and is text-based.
 * @param {Guild} guild
 * @param {string} channelId
 * @returns {Promise<string>}
 */
async function validateGuildChannelId(guild, channelId) {
  const channel = guild.channels.cache.get(channelId) ?? await guild.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) {
    throw new Error('That channel was not found in this server or is not a text channel.');
  }
  return channel.id;
}

/**
 * Validate a guild role ID exists.
 * @param {Guild} guild
 * @param {string} roleId
 * @returns {Promise<string>}
 */
async function validateGuildRoleId(guild, roleId) {
  const role = guild.roles.cache.get(roleId) ?? await guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    throw new Error('That role was not found in this server.');
  }
  return role.id;
}

/**
 * Validate a prefix string.
 * @param {string} prefix
 * @returns {string}
 */
function validatePrefix(prefix) {
  const normalized = prefix.trim();
  if (/\s/.test(normalized)) throw new Error('Prefix cannot contain spaces.');
  if (normalized.length < 1) throw new Error('Prefix must be at least 1 character.');
  if (normalized.length > 10) throw new Error('Prefix must be 10 characters or fewer.');
  return normalized;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Dashboard Refresh ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Refresh the dashboard message with current config.
 * @param {ChatInputCommandInteraction} rootInteraction
 * @param {object} config
 * @param {Guild} guild
 */
async function refreshDashboard(rootInteraction, config, guild) {
  try {
    const embed = buildDashboardEmbed(config, guild);
    const components = [buildButtonRow(config, guild.id), buildSettingsSelect(guild.id)];
    await InteractionHelper.safeEditReply(rootInteraction, { embeds: [embed], components });
  } catch (error) {
    logger.debug('Failed to refresh dashboard', {
      event: 'config.dashboard.refresh_error',
      error: error.message,
      guildId: guild.id,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Wizard DM Flow ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Send a wizard question and await DM response.
 * @param {DMChannel} dmChannel
 * @param {string} userId
 * @param {string} prompt
 * @param {number} stepNumber
 * @param {number} totalSteps
 * @returns {Promise<{answer?: string, cancelled?: boolean, timeout?: boolean}>}
 */
async function askQuestion(dmChannel, userId, prompt, stepNumber, totalSteps) {
  await dmChannel.send({
    embeds: [createEmbed({
      title: `Setup Question ${stepNumber}/${totalSteps}`,
      description: prompt,
      color: 'primary',
      footer: `Reply in this DM • Type "cancel" to stop • "skip" to keep current`,
    })],
  });

  const collected = await dmChannel.awaitMessages({
    filter: (message) => message.author.id === userId && !message.author.bot,
    max: 1,
    time: WIZARD_DM_TIMEOUT_MS,
  }).catch(() => null);

  if (!collected?.size) {
    await dmChannel.send({
      embeds: [buildUserErrorEmbed(
        ErrorTypes.RATE_LIMIT,
        'You did not answer in time. Run the setup wizard again when ready.'
      )],
    });
    return { timeout: true };
  }

  const answer = collected.first().content.trim();
  if (answer.toLowerCase() === 'cancel') {
    await dmChannel.send({
      embeds: [infoEmbed('Setup Cancelled', 'Setup wizard stopped. Your saved answers are still applied.')],
    });
    return { cancelled: true };
  }

  return { answer };
}

/**
 * Format a saved setting acknowledgement message.
 * @param {string} key
 * @param {any} value
 * @param {Guild} guild
 * @returns {string}
 */
function formatSavedAck(key, value, guild) {
  const setting = CONFIGURABLE_SETTINGS.find((s) => s.key === key);
  const label = setting?.label ?? key;

  if (value === null || value === undefined) return `${label} cleared.`;
  if (key === 'prefix') return `${label} saved as \`${value}\`.`;

  if (key === 'logChannelId' || key === 'welcomeChannel') {
    const channel = guild.channels.cache.get(value);
    return `${label} saved as ${channel ?? `<#${value}>`}.`;
  }

  if (key === 'modRole' || key === 'muteRole') {
    const role = guild.roles.cache.get(value);
    return `${label} saved as ${role ?? `<@&${value}>`}.`;
  }

  if (key === 'autoModeration') {
    return value.enabled ? `${label} enabled with default rules.` : `${label} disabled.`;
  }

  return `${label} saved.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Wizard Prompt Definitions ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build wizard prompts based on current config and enabled features.
 * @param {object} config
 * @param {Guild} guild
 * @returns {Array<{key: string, question: string, parse: Function}>}
 */
function buildWizardPrompts(config, guild) {
  const prompts = [
    {
      key: 'prefix',
      question: `What command prefix should this server use?\nCurrent: \`${config.prefix || getCommandPrefix()}\`\nReply \`skip\` to keep it, or \`cancel\` to stop.`,
      parse: async (answer) => {
        const normalized = answer.trim();
        if (normalized.toLowerCase() === 'skip') return undefined;
        return validatePrefix(normalized);
      },
    },
    {
      key: 'logChannelId',
      question: `Which channel should receive bot logs?\nCurrent: ${formatChannelMention(guild, config.logging?.channels?.audit)}\nSend a channel mention, channel ID, \`none\` to clear, \`skip\` to keep, or \`cancel\` to stop.`,
      parse: async (answer, guild) => {
        const normalized = answer.trim();
        if (normalized.toLowerCase() === 'skip') return undefined;
        if (normalized.toLowerCase() === 'none') return null;
        const id = extractId(normalized);
        if (!id) throw new Error('Provide a valid channel mention or ID from this server.');
        return validateGuildChannelId(guild, id);
      },
    },
    {
      key: 'modRole',
      question: `What role should moderators have?\nCurrent: ${formatRoleMention(guild, config.modRole)}\nSend a role mention, role ID, \`none\` to clear, \`skip\` to keep, or \`cancel\` to stop.`,
      parse: async (answer, guild) => {
        const normalized = answer.trim();
        if (normalized.toLowerCase() === 'skip') return undefined;
        if (normalized.toLowerCase() === 'none') return null;
        const id = extractId(normalized);
        if (!id) throw new Error('Provide a valid role mention or ID from this server.');
        return validateGuildRoleId(guild, id);
      },
    },
    {
      key: 'welcomeChannel',
      question: `Which channel should welcome/goodbye messages go to?\nCurrent: ${formatChannelMention(guild, config.welcomeChannel)}\nSend a channel mention, channel ID, \`none\` to clear, \`skip\` to keep, or \`cancel\` to stop.`,
      parse: async (answer, guild) => {
        const normalized = answer.trim();
        if (normalized.toLowerCase() === 'skip') return undefined;
        if (normalized.toLowerCase() === 'none') return null;
        const id = extractId(normalized);
        if (!id) throw new Error('Provide a valid channel mention or ID from this server.');
        return validateGuildChannelId(guild, id);
      },
    },
    {
      key: 'muteRole',
      question: `What role should be used for mutes/timeouts?\nCurrent: ${formatRoleMention(guild, config.muteRole)}\nSend a role mention, role ID, \`none\` to clear, \`skip\` to keep, or \`cancel\` to stop.`,
      parse: async (answer, guild) => {
        const normalized = answer.trim();
        if (normalized.toLowerCase() === 'skip') return undefined;
        if (normalized.toLowerCase() === 'none') return null;
        const id = extractId(normalized);
        if (!id) throw new Error('Provide a valid role mention or ID from this server.');
        return validateGuildRoleId(guild, id);
      },
    },
  ];

  // Auto-moderation prompt only if feature is enabled
  if (isFeatureEnabled('autoModeration')) {
    prompts.push({
      key: 'autoModeration',
      question: 'Enable auto-moderation? (anti-spam, anti-raid, etc.)\nReply `yes` to enable with defaults, `no` to disable, `skip` to keep current, or `cancel` to stop.',
      parse: async (answer) => {
        const normalized = answer.trim().toLowerCase();
        if (normalized === 'skip') return undefined;
        if (normalized === 'yes') return { enabled: true, rules: { antiSpam: { enabled: true }, antiRaid: { enabled: true } } };
        if (normalized === 'no') return { enabled: false };
        throw new Error('Reply `yes`, `no`, `skip`, or `cancel`.');
      },
    });
  }

  return prompts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Wizard Execution ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Run the full setup wizard in DM.
 * @param {ButtonInteraction} buttonInteraction
 * @param {object} config
 * @param {Guild} guild
 * @param {Client} client
 * @param {ChatInputCommandInteraction} rootInteraction
 */
async function runSetupWizard(buttonInteraction, config, guild, client, rootInteraction) {
  const user = buttonInteraction.user;

  // Session guard
  if (hasActiveWizardSession(user.id)) {
    await buttonInteraction.followUp({
      embeds: [warningEmbed(
        'Setup Already Running',
        'You already have a setup wizard open in your DMs. Reply there to continue, or type `cancel` to stop it.'
      )],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    return;
  }

  if (!startWizardSession(user.id, guild.id)) {
    await buttonInteraction.followUp({
      embeds: [warningEmbed('Setup Already Running', 'Wizard session could not be started. Please try again.')],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    return;
  }

  let dmChannel;
  try {
    dmChannel = await user.createDM();
  } catch (error) {
    logger.warn('Failed to create DM channel for setup wizard', {
      event: 'config.wizard.dm_failed',
      userId: user.id,
      error: error.message,
    });
    await buttonInteraction.followUp({
      embeds: [buildUserErrorEmbed(
        ErrorTypes.USER_INPUT,
        `I couldn't send you a DM. Enable DMs from this server, then try again.\n\n${DM_DISABLED_HELP}`
      )],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
    endWizardSession(user.id);
    return;
  }

  const prompts = buildWizardPrompts(config, guild);
  const changes = {};
  const errors = [];
  let wizardCancelled = false;

  try {
    // Initial DM
    try {
      await dmChannel.send({
        embeds: [createEmbed({
          title: '📝 Setup Wizard',
          description: [
            `Configuring **${guild.name}**.`,
            '',
            'Answer each question in this DM.',
            '• Type `skip` to keep the current value',
            '• Type `cancel` to stop the wizard',
            '• Type `none` to clear a setting (where applicable)',
          ].join('\n'),
          color: 'info',
          thumbnail: guild.iconURL({ size: 128 }) ?? undefined,
        })],
      });
    } catch (error) {
      logger.warn('Failed to send setup wizard DM', {
        event: 'config.wizard.dm_send_failed',
        userId: user.id,
        error: error.message,
      });
      await buttonInteraction.followUp({
        embeds: [buildUserErrorEmbed(
          ErrorTypes.USER_INPUT,
          `I couldn't send you a DM. Enable DMs from this server, then try again.\n\n${DM_DISABLED_HELP}`
        )],
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
      endWizardSession(user.id);
      return;
    }

    // Notify in channel
    await buttonInteraction.followUp({
      embeds: [infoEmbed('Setup Wizard Started', 'Check your DMs — I sent you the first setup question there.\n\nAnswer each question in that DM. Type `skip` to keep the current value.')],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});

    // Question loop
    for (let index = 0; index < prompts.length; index++) {
      const prompt = prompts[index];
      let answered = false;
      let retries = 0;
      const MAX_RETRIES = 3;

      while (!answered && retries < MAX_RETRIES) {
        const result = await askQuestion(dmChannel, user.id, prompt.question, index + 1, prompts.length);

        if (result.timeout) {
          wizardCancelled = true;
          answered = true;
          break;
        }

        if (result.cancelled) {
          wizardCancelled = true;
          answered = true;
          break;
        }

        try {
          const value = await prompt.parse(result.answer, guild);

          if (value === undefined) {
            await dmChannel.send({
              embeds: [infoEmbed('Skipped', `Keeping current ${CONFIGURABLE_SETTINGS.find(s => s.key === prompt.key)?.label ?? prompt.key}.`)],
            });
          } else {
            await ConfigService.updateSetting(client, guild.id, prompt.key, value, user.id);
            changes[prompt.key] = value;
            await dmChannel.send({
              embeds: [successEmbed('Saved', formatSavedAck(prompt.key, value, guild))],
            });

            // Live dashboard refresh
            try {
              const updatedConfig = await getGuildConfig(client, guild.id);
              await refreshDashboard(rootInteraction, updatedConfig, guild);
            } catch (refreshError) {
              logger.debug('Failed to refresh dashboard during wizard', {
                event: 'config.wizard.refresh_failed',
                error: refreshError.message,
              });
            }
          }

          answered = true;
        } catch (error) {
          retries++;
          errors.push(`• ${prompt.key}: ${error.message}`);
          await dmChannel.send({
            embeds: [buildUserErrorEmbed(
              ErrorTypes.VALIDATION,
              `${error.message}\n\nPlease reply again with a valid answer, \`skip\`, or \`cancel\`.`
            )],
          });
        }
      }

      if (!answered && retries >= MAX_RETRIES) {
        await dmChannel.send({
          embeds: [errorEmbed('Too Many Retries', 'Moving to next question. You can re-run the wizard later to fix this.')],
        });
      }

      if (wizardCancelled) break;
    }

    // Completion flag
    if (!wizardCancelled) {
      try {
        await setConfigValue(client, guild.id, 'setupWizardCompleted', true);
      } catch (error) {
        logger.warn('Failed to persist setupWizardCompleted flag', {
          event: 'config.wizard.flag_failed',
          guildId: guild.id,
          error: error.message,
        });
      }
    }

    // Summary
    const hasChanges = Object.keys(changes).length > 0;
    const summaryTitle = wizardCancelled
      ? (hasChanges ? 'Setup Stopped' : 'Setup Cancelled')
      : (errors.length > 0 ? 'Setup Complete (with issues)' : 'Setup Complete');

    const summaryBody = wizardCancelled
      ? (hasChanges
        ? `Setup stopped early. Saved **${Object.keys(changes).length}** setting(s) before stopping.`
        : 'Setup wizard stopped before any changes were saved.')
      : (hasChanges
        ? `Updated **${Object.keys(changes).length}** setting(s).${errors.length > 0 ? ' Some answers needed retries.' : ''}`
        : 'No changes were applied.');

    const summaryEmbed = createEmbed({
      title: wizardCancelled ? `⚠️ ${summaryTitle}` : `✅ ${summaryTitle}`,
      description: summaryBody,
      color: wizardCancelled ? 'warning' : (errors.length > 0 ? 'warning' : 'success'),
    });

    if (errors.length > 0) {
      const uniqueErrors = [...new Set(errors)].slice(0, 10);
      summaryEmbed.addFields({
        name: 'Issues',
        value: uniqueErrors.join('\n').slice(0, 1024) || 'None',
      });
    }

    // List changes
    if (hasChanges) {
      const changeLines = Object.entries(changes).map(([key, value]) => {
        const setting = CONFIGURABLE_SETTINGS.find((s) => s.key === key);
        return `• ${setting?.emoji ?? '🔧'} ${setting?.label ?? key}: ${formatSavedAck(key, value, guild)}`;
      });
      summaryEmbed.addFields({
        name: 'Changes Applied',
        value: changeLines.join('\n').slice(0, 1024),
      });
    }

    await dmChannel.send({ embeds: [summaryEmbed] });

    // Final dashboard refresh
    try {
      const updatedConfig = await getGuildConfig(client, guild.id);
      await refreshDashboard(rootInteraction, updatedConfig, guild);
    } catch (error) {
      logger.debug('Failed final dashboard refresh after wizard', {
        event: 'config.wizard.final_refresh_failed',
        error: error.message,
      });
    }
  } catch (error) {
    logger.error('Setup wizard fatal error', {
      event: 'config.wizard.fatal_error',
      error: error.message,
      stack: error.stack,
      userId: user.id,
      guildId: guild.id,
    });
    try {
      await dmChannel.send({
        embeds: [errorEmbed('Wizard Error', 'An unexpected error occurred. Your progress has been saved. Please run the wizard again.')],
      });
    } catch {
      // DM channel might be broken
    }
  } finally {
    endWizardSession(user.id);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Modal Handlers ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Show the appropriate modal for a setting.
 * @param {StringSelectMenuInteraction} selectInteraction
 * @param {string} guildId
 * @param {string} setting
 */
async function showSettingModal(selectInteraction, guildId, setting) {
  const modalCustomId = `config_wizard_modal:${setting}:${guildId}`;

  // Auto-moderation redirects to dedicated command
  if (setting === 'autoModeration') {
    await selectInteraction.reply({
      embeds: [infoEmbed(
        'Auto-Moderation',
        'Use `/automoderation dashboard` to configure anti-spam, anti-raid, and other protections with full granularity.'
      )],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Channel select modal
  if (setting === 'logChannelId' || setting === 'welcomeChannel') {
    const modal = new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle(`📋 Update ${CONFIGURABLE_SETTINGS.find(s => s.key === setting)?.label ?? 'Channel'}`);

    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId('channel_select')
      .setPlaceholder('Select a text channel...')
      .setMinValues(0)
      .setMaxValues(1)
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(channelSelect));
    await selectInteraction.showModal(modal);
    return;
  }

  // Role select modal
  if (setting === 'modRole' || setting === 'muteRole') {
    const modal = new ModalBuilder()
      .setCustomId(modalCustomId)
      .setTitle(`🛡️ Update ${CONFIGURABLE_SETTINGS.find(s => s.key === setting)?.label ?? 'Role'}`);

    const roleSelect = new RoleSelectMenuBuilder()
      .setCustomId('role_select')
      .setPlaceholder('Select a role...')
      .setMinValues(0)
      .setMaxValues(1)
      .setRequired(false);

    modal.addComponents(new ActionRowBuilder().addComponents(roleSelect));
    await selectInteraction.showModal(modal);
    return;
  }

  // Text input modal (prefix)
  const modal = new ModalBuilder()
    .setCustomId(modalCustomId)
    .setTitle('⌨️ Update Server Prefix');

  const textInput = new TextInputBuilder()
    .setCustomId('value')
    .setLabel('New prefix (1-10 characters, no spaces)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10)
    .setPlaceholder('!');

  modal.addComponents(new ActionRowBuilder().addComponents(textInput));
  await selectInteraction.showModal(modal);
}

/**
 * Resolve modal submission value based on setting type.
 * @param {string} setting
 * @param {ModalSubmitInteraction} submitted
 * @param {Guild} guild
 * @returns {Promise<any>}
 */
async function resolveSettingModalValue(setting, submitted, guild) {
  if (setting === 'logChannelId' || setting === 'welcomeChannel') {
    const channel = submitted.fields.getChannelSelectMenuValue?.('channel_select')?.[0];
    if (!channel) return null; // Cleared
    return validateGuildChannelId(guild, channel.id);
  }

  if (setting === 'modRole' || setting === 'muteRole') {
    const role = submitted.fields.getRoleSelectMenuValue?.('role_select')?.[0];
    if (!role) return null; // Cleared
    return validateGuildRoleId(guild, role.id);
  }

  const prefix = submitted.fields.getTextInputValue('value')?.trim();
  return validatePrefix(prefix);
}

/**
 * Build success message for a setting update.
 * @param {string} setting
 * @param {any} value
 * @param {Guild} guild
 * @returns {string}
 */
function buildSettingSuccessMessage(setting, value, guild) {
  return formatSavedAck(setting, value, guild);
}

/**
 * Handle modal submission and update config.
 * @param {StringSelectMenuInteraction} selectInteraction
 * @param {ChatInputCommandInteraction} rootInteraction
 * @param {string} setting
 * @param {string} guildId
 * @param {Client} client
 */
async function handleSettingModalSubmit(selectInteraction, rootInteraction, setting, guildId, client) {
  const modalCustomId = `config_wizard_modal:${setting}:${guildId}`;

  const submitted = await selectInteraction
    .awaitModalSubmit({
      filter: (modalInteraction) =>
        modalInteraction.customId === modalCustomId &&
        modalInteraction.user.id === selectInteraction.user.id,
      time: MODAL_TIMEOUT_MS,
    })
    .catch(() => null);

  if (!submitted) return;

  try {
    await submitted.deferReply({ flags: MessageFlags.Ephemeral });

    const value = await resolveSettingModalValue(setting, submitted, submitted.guild);
    await ConfigService.updateSetting(client, guildId, setting, value, submitted.user.id);

    await submitted.editReply({
      embeds: [successEmbed(
        'Configuration Updated',
        buildSettingSuccessMessage(setting, value, submitted.guild)
      )],
    });

    // Refresh dashboard
    const updatedConfig = await getGuildConfig(client, guildId);
    await refreshDashboard(rootInteraction, updatedConfig, submitted.guild);
  } catch (error) {
    logger.error('Config modal submit error', {
      event: 'config.modal.error',
      error: error.message,
      stack: error.stack,
      setting,
      guildId,
    });

    await replyUserError(submitted, {
      type: ErrorTypes.CONFIGURATION,
      message: error.message || 'Please try again.',
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Component Collector Handlers ───────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle button interactions in the dashboard.
 * @param {ButtonInteraction} componentInteraction
 * @param {ChatInputCommandInteraction} rootInteraction
 * @param {Client} client
 */
async function handleDashboardButton(componentInteraction, rootInteraction, client) {
  await componentInteraction.deferUpdate();

  if (componentInteraction.customId.startsWith(`${WIZARD_BUTTON_ID}:`)) {
    const latestConfig = await getGuildConfig(client, rootInteraction.guildId);
    await runSetupWizard(componentInteraction, latestConfig, rootInteraction.guild, client, rootInteraction);
  }
}

/**
 * Handle select menu interactions in the dashboard.
 * @param {StringSelectMenuInteraction} componentInteraction
 * @param {ChatInputCommandInteraction} rootInteraction
 * @param {Client} client
 */
async function handleDashboardSelect(componentInteraction, rootInteraction, client) {
  const selected = componentInteraction.values[0];

  await showSettingModal(componentInteraction, rootInteraction.guildId, selected);

  // Skip modal await for automod (already replied)
  if (selected !== 'autoModeration') {
    await handleSettingModalSubmit(
      componentInteraction,
      rootInteraction,
      selected,
      rootInteraction.guildId,
      client,
    );
  }
}

/**
 * Build collector filter for dashboard components.
 * @param {string} userId
 * @param {string} guildId
 * @returns {(interaction: MessageComponentInteraction) => boolean}
 */
function buildCollectorFilter(userId, guildId) {
  return (interaction) =>
    interaction.user.id === userId &&
    (interaction.customId.startsWith(`${DASHBOARD_CUSTOM_ID}:`) ||
     interaction.customId.startsWith(`${WIZARD_BUTTON_ID}:`)) &&
    interaction.customId.endsWith(`:${guildId}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Execute ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main command execute handler.
 * @param {ChatInputCommandInteraction} interaction
 */
async function execute(interaction) {
  try {
    // Permission guard
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return replyUserError(interaction, {
        type: ErrorTypes.PERMISSION,
        message: 'You need the **Manage Server** permission to use this command.',
      });
    }

    const deferSuccess = await InteractionHelper.safeDefer(interaction, {
      flags: MessageFlags.Ephemeral,
    });
    if (!deferSuccess) return;

    const guildConfig = await getGuildConfig(interaction.client, interaction.guildId);
    const embed = buildDashboardEmbed(guildConfig, interaction.guild);
    const components = [
      buildButtonRow(guildConfig, interaction.guildId),
      buildSettingsSelect(interaction.guildId),
    ];

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed], components });

    // Fetch reply for collector
    const replyMessage = await interaction.fetchReply().catch((err) => {
      logger.error('Failed to fetch dashboard reply', {
        event: 'config.dashboard.fetch_reply_error',
        error: err.message,
        guildId: interaction.guildId,
      });
      return null;
    });

    if (!replyMessage) return;

    // Component collector
    const collectorFilter = buildCollectorFilter(interaction.user.id, interaction.guildId);
    const componentCollector = replyMessage.createMessageComponentCollector({
      filter: collectorFilter,
      time: DASHBOARD_TIMEOUT_MS,
      idle: 5 * 60 * 1000, // 5 min idle
    });

    // ─── Collector: Collect ─────────────────────────────────────────────────────
    componentCollector.on('collect', async (componentInteraction) => {
      try {
        // Re-verify permissions on each interaction
        if (!componentInteraction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          await replyUserError(componentInteraction, {
            type: ErrorTypes.PERMISSION,
            message: 'You need the **Manage Server** permission to use the dashboard.',
          });
          return;
        }

        if (componentInteraction.isButton()) {
          await handleDashboardButton(componentInteraction, interaction, interaction.client);
          return;
        }

        if (componentInteraction.isStringSelectMenu()) {
          await handleDashboardSelect(componentInteraction, interaction, interaction.client);
          return;
        }
      } catch (error) {
        logger.error('Config dashboard component error', {
          event: 'config.dashboard.component_error',
          error: error.message,
          stack: error.stack,
          customId: componentInteraction.customId,
          guildId: interaction.guildId,
          userId: interaction.user.id,
        });

        await replyUserError(componentInteraction, {
          type: ErrorTypes.UNKNOWN,
          message: 'Failed to process your selection. Please try again.',
        }).catch(() => {});
      }
    });

    // ─── Collector: End ─────────────────────────────────────────────────────────
    componentCollector.on('end', async (_collected, reason) => {
      logger.debug('Dashboard collector ended', {
        event: 'config.dashboard.collector_end',
        reason,
        guildId: interaction.guildId,
        userId: interaction.user.id,
      });

      try {
        const finalConfig = await getGuildConfig(interaction.client, interaction.guildId);
        const finalView = buildDashboardEmbed(finalConfig, interaction.guild);

        // Disable all components
        const disabledComponents = [
          buildButtonRow(finalConfig, interaction.guildId),
          buildSettingsSelect(interaction.guildId),
        ].map((row) => {
          const json = row.toJSON();
          json.components = json.components.map((component) => ({
            ...component,
            disabled: true,
          }));
          return json;
        });

        await replyMessage.edit({
          embeds: [finalView],
          components: disabledComponents,
        });
      } catch (error) {
        logger.debug('Failed to disable dashboard on collector end', {
          event: 'config.dashboard.end_error',
          error: error.message,
          guildId: interaction.guildId,
        });
      }
    });
  } catch (error) {
    logger.error('Config command fatal error', {
      event: 'config.command.fatal_error',
      error: error.message,
      stack: error.stack,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await replyUserError(interaction, {
      type: ErrorTypes.CONFIGURATION,
      message: 'Failed to open configuration dashboard. Please try again.',
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Definition ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  slashOnly: true,
  data: new SlashCommandBuilder()
    .setName('configwizard')
    .setDescription('Open the server configuration dashboard and setup wizard')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),
  category: 'Core',

  execute,
};
