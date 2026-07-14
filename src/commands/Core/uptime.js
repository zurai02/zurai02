/**
 * /uptime — Bot Uptime & System Health
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
} from 'discord.js';
import { createEmbed, successEmbed, warningEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Alias & Category System Integration ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

import {
  getAliasesForCommand,
  getCommandCategory,
  getCategoryIcon,
  formatCategoryName,
} from '../../config/aliases.js'; // Adjust path to your alias/category config

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const MS_PER_DAY = 86400000;

/** Uptime milestones for display badges. */
const UPTIME_MILESTONES = Object.freeze([
  { ms: MS_PER_DAY * 30, emoji: '💎', label: 'Month+', color: 'success' },
  { ms: MS_PER_DAY * 7, emoji: '🏆', label: 'Week+', color: 'success' },
  { ms: MS_PER_DAY, emoji: '🥇', label: 'Day+', color: 'success' },
  { ms: MS_PER_DAY / 2, emoji: '🥈', label: '12h+', color: 'success' },
  { ms: MS_PER_DAY / 4, emoji: '🥉', label: '6h+', color: 'warning' },
  { ms: MS_PER_HOUR, emoji: '⏳', label: '1h+', color: 'warning' },
  { ms: 0, emoji: '🆕', label: 'Fresh', color: 'warning' },
]);

/** Uptime quality thresholds for health indicators. */
const UPTIME_THRESHOLDS = Object.freeze({
  stable: MS_PER_DAY, // 1 day = stable
  warning: MS_PER_HOUR, // 1 hour = warning (recent restart)
  critical: 0, // 0 = just started
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Type Definitions ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} UptimeMetrics
 * @property {number} rawMs - Raw uptime in milliseconds
 * @property {string} formatted - Human-readable uptime string
 * @property {Date} bootTime - When the bot started
 * @property {string} milestoneEmoji - Achievement emoji
 * @property {string} milestoneLabel - Achievement label
 * @property {string} healthStatus - Health indicator
 * @property {string} healthColor - Embed color for health
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Formatting Helpers ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format milliseconds into human-readable uptime string.
 * @param {number} ms
 * @returns {string}
 */
function formatUptime(ms) {
  let totalSeconds = Math.floor(ms / MS_PER_SECOND);

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  totalSeconds %= SECONDS_PER_DAY;

  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  totalSeconds %= SECONDS_PER_HOUR;

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Format milliseconds into detailed uptime string (always shows all units).
 * @param {number} ms
 * @returns {string}
 */
function formatUptimeDetailed(ms) {
  let totalSeconds = Math.floor(ms / MS_PER_SECOND);

  const days = Math.floor(totalSeconds / SECONDS_PER_DAY);
  totalSeconds %= SECONDS_PER_DAY;

  const hours = Math.floor(totalSeconds / SECONDS_PER_HOUR);
  totalSeconds %= SECONDS_PER_HOUR;

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  const parts = [];
  if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  parts.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return parts.join(', ');
}

/**
 * Get uptime milestone badge.
 * @param {number} ms
 * @returns {{emoji: string, label: string, color: string}}
 */
function getUptimeMilestone(ms) {
  return UPTIME_MILESTONES.find((m) => ms >= m.ms) || UPTIME_MILESTONES[UPTIME_MILESTONES.length - 1];
}

/**
 * Get health status based on uptime.
 * @param {number} ms
 * @returns {{emoji: string, label: string, color: string}}
 */
function getHealthStatus(ms) {
  if (ms >= UPTIME_THRESHOLDS.stable) {
    return { emoji: '🟢', label: 'Stable', color: 'success' };
  }
  if (ms >= UPTIME_THRESHOLDS.warning) {
    return { emoji: '🟡', label: 'Recent Restart', color: 'warning' };
  }
  return { emoji: '🔴', label: 'Just Started', color: 'error' };
}

/**
 * Format boot time as Discord timestamp.
 * @param {Date} bootTime
 * @returns {string}
 */
function formatBootTimestamp(bootTime) {
  const unix = Math.floor(bootTime.getTime() / MS_PER_SECOND);
  return `<t:${unix}:F> (<t:${unix}:R>)`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Metrics Collection ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Collect comprehensive uptime metrics.
 * @param {Client} client
 * @returns {UptimeMetrics}
 */
function collectUptimeMetrics(client) {
  const rawMs = client.uptime || 0;
  const bootTime = new Date(Date.now() - rawMs);
  const milestone = getUptimeMilestone(rawMs);
  const health = getHealthStatus(rawMs);

  return {
    rawMs,
    formatted: formatUptime(rawMs),
    detailed: formatUptimeDetailed(rawMs),
    bootTime,
    milestoneEmoji: milestone.emoji,
    milestoneLabel: milestone.label,
    healthStatus: health.label,
    healthColor: health.color,
    healthEmoji: health.emoji,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Embed Builders ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the detailed uptime embed.
 * @param {UptimeMetrics} metrics
 * @param {Client} [client]
 * @returns {EmbedBuilder}
 */
function buildUptimeEmbed(metrics, client) {
  const botName = client?.user?.username || 'Bot';

  return createEmbed({
    title: `${metrics.milestoneEmoji} ${botName} Uptime`,
    description: [
      `**Current Uptime:** \`${metrics.formatted}\``,
      `**Detailed:** ${metrics.detailed}`,
      '',
      `${metrics.healthEmoji} **Status:** ${metrics.healthStatus}`,
      `${metrics.milestoneEmoji} **Milestone:** ${metrics.milestoneLabel}`,
    ].join('\n'),
    color: metrics.healthColor,
    fields: [
      {
        name: '📅 Started',
        value: formatBootTimestamp(metrics.bootTime),
        inline: false,
      },
      {
        name: '⏱️ Raw Milliseconds',
        value: `\`${metrics.rawMs.toLocaleString()}ms\``,
        inline: true,
      },
      {
        name: '📊 Seconds',
        value: `\`${Math.floor(metrics.rawMs / MS_PER_SECOND).toLocaleString()}\``,
        inline: true,
      },
    ],
    footer: 'Uptime is measured from the last bot restart',
  }).setTimestamp();
}

/**
 * Build compact uptime embed for prefix commands.
 * @param {UptimeMetrics} metrics
 * @param {Client} [client]
 * @returns {EmbedBuilder}
 */
function buildCompactUptimeEmbed(metrics, client) {
  const botName = client?.user?.username || 'Bot';

  return createEmbed({
    title: `${metrics.milestoneEmoji} ${botName} Uptime`,
    description: `**${metrics.formatted}** · ${metrics.healthEmoji} ${metrics.healthStatus}`,
    color: metrics.healthColor,
    footer: `Started ${formatBootTimestamp(metrics.bootTime)}`,
  }).setTimestamp();
}

/**
 * Build error embed for failed uptime.
 * @returns {EmbedBuilder}
 */
function buildErrorEmbed() {
  return createEmbed({
    title: '❌ System Error',
    description: 'Could not compute uptime. The bot may have just restarted.',
    color: 'error',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Logging ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log uptime check with structured data.
 * @param {UptimeMetrics} metrics
 * @param {ChatInputCommandInteraction | import('discord.js').Message} interaction
 * @param {'slash' | 'prefix'} type
 */
function logUptime(metrics, interaction, type) {
  logger.info('Uptime checked', {
    event: `uptime.${type}.checked`,
    uptime: metrics.formatted,
    rawMs: metrics.rawMs,
    milestone: metrics.milestoneLabel,
    health: metrics.healthStatus,
    userId: interaction.user?.id || interaction.author?.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

/**
 * Log uptime failure.
 * @param {Error} error
 * @param {ChatInputCommandInteraction | import('discord.js').Message} interaction
 * @param {'slash' | 'prefix'} type
 */
function logUptimeError(error, interaction, type) {
  logger.error(`Uptime ${type} command failed`, {
    event: `uptime.${type}.error`,
    error: error.message,
    stack: error.stack,
    userId: interaction.user?.id || interaction.author?.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Prefix Execute ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute uptime via prefix command.
 * @param {import('discord.js').Message} message
 */
async function prefixExecute(message) {
  try {
    const metrics = collectUptimeMetrics(message.client);
    logUptime(metrics, message, 'prefix');

    const embed = buildCompactUptimeEmbed(metrics, message.client);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    logUptimeError(error, message, 'prefix');

    await message.reply({
      embeds: [buildErrorEmbed()],
    }).catch((replyError) => {
      logger.error('Uptime prefix error reply failed', {
        event: 'uptime.prefix.error_reply_failed',
        error: replyError.message,
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Slash Execute ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute uptime via slash command.
 * @param {ChatInputCommandInteraction} interaction
 */
async function slashExecute(interaction) {
  const deferSuccess = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral,
  });

  if (!deferSuccess) {
    logger.warn('Uptime defer failed', {
      event: 'uptime.slash.defer_failed',
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });
    return;
  }

  try {
    const metrics = collectUptimeMetrics(interaction.client);
    logUptime(metrics, interaction, 'slash');

    const embed = buildUptimeEmbed(metrics, interaction.client);

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  } catch (error) {
    logUptimeError(error, interaction, 'slash');

    try {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [buildErrorEmbed()],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error('Uptime slash error reply failed', {
        event: 'uptime.slash.error_reply_failed',
        error: replyError.message,
        userId: interaction.user.id,
      });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Definition ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Check how long the bot has been online and view system health')
    .setDMPermission(true),

  category: 'Core',

  // Aliases (synced with alias system)
  aliases: ['up', 'online', 'status'],

  async prefixExecute(message) {
    return prefixExecute(message);
  },

  async execute(interaction) {
    return slashExecute(interaction);
  },
};
