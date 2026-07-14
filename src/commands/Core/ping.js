/**
 * /ping — Latency & Health Check Command
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  Message,
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

const PING_TIMEOUT_MS = 10_000;

/** Latency thresholds for quality indicators. */
const LATENCY_THRESHOLDS = Object.freeze({
  excellent: { max: 50, color: 'success', label: 'Excellent', emoji: '✨' },
  good: { max: 100, color: 'success', label: 'Good', emoji: '✅' },
  fair: { max: 250, color: 'warning', label: 'Fair', emoji: '⚠️' },
  poor: { max: 500, color: 'warning', label: 'Poor', emoji: '🐢' },
  critical: { max: Infinity, color: 'error', label: 'Critical', emoji: '🔴' },
});

/** WebSocket shard status indicators. */
const SHARD_STATUS = Object.freeze({
  0: { label: 'Ready', emoji: '🟢' },
  1: { label: 'Connecting', emoji: '🟡' },
  2: { label: 'Reconnecting', emoji: '🟠' },
  3: { label: 'Idle', emoji: '⚪' },
  4: { label: 'Nearly', emoji: '🔵' },
  5: { label: 'Disconnected', emoji: '🔴' },
  6: { label: 'Waiting for Guilds', emoji: '⏳' },
  7: { label: 'Identifying', emoji: '🔍' },
  8: { label: 'Resuming', emoji: '🔄' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Type Definitions ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} PingMetrics
 * @property {number} latency - Round-trip message latency (ms)
 * @property {number} apiLatency - Discord API WebSocket ping (ms)
 * @property {number} uptime - Bot uptime in milliseconds
 * @property {number} memoryUsage - Heap memory usage in MB
 * @property {string} shardStatus - Current shard status
 * @property {number} shardId - Current shard ID
 * @property {number} guildCount - Cached guild count
 * @property {string} quality - Latency quality label
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Metrics Collection ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Collect comprehensive ping metrics.
 * @param {number} startTime - Command start timestamp
 * @param {ChatInputCommandInteraction | Message} interaction
 * @returns {PingMetrics}
 */
function collectMetrics(startTime, interaction) {
  const client = interaction.client;
  const latency = Math.max(0, Date.now() - startTime);
  const apiLatency = Math.max(0, Math.round(client.ws.ping));
  const uptime = client.uptime || 0;
  const memoryUsage = Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100;
  const shardId = client.shard?.ids?.[0] ?? 0;
  const shardStatus = client.ws.status;
  const guildCount = client.guilds.cache.size;

  const quality = getLatencyQuality(latency);

  return {
    latency,
    apiLatency,
    uptime,
    memoryUsage,
    shardStatus: SHARD_STATUS[shardStatus]?.label || 'Unknown',
    shardId,
    guildCount,
    quality,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Quality Analysis ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Determine latency quality label and styling.
 * @param {number} latency
 * @returns {{color: string, label: string, emoji: string}}
 */
function getLatencyQuality(latency) {
  if (latency < LATENCY_THRESHOLDS.excellent.max) return LATENCY_THRESHOLDS.excellent;
  if (latency < LATENCY_THRESHOLDS.good.max) return LATENCY_THRESHOLDS.good;
  if (latency < LATENCY_THRESHOLDS.fair.max) return LATENCY_THRESHOLDS.fair;
  if (latency < LATENCY_THRESHOLDS.poor.max) return LATENCY_THRESHOLDS.poor;
  return LATENCY_THRESHOLDS.critical;
}

/**
 * Format uptime into human-readable string.
 * @param {number} ms
 * @returns {string}
 */
function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Get health indicator based on metrics.
 * @param {PingMetrics} metrics
 * @returns {{emoji: string, label: string, color: string}}
 */
function getHealthIndicator(metrics) {
  if (metrics.latency > LATENCY_THRESHOLDS.poor.max || metrics.apiLatency > 500) {
    return { emoji: '🔴', label: 'Degraded', color: 'error' };
  }
  if (metrics.latency > LATENCY_THRESHOLDS.fair.max || metrics.apiLatency > 250) {
    return { emoji: '🟡', label: 'Fair', color: 'warning' };
  }
  return { emoji: '🟢', label: 'Healthy', color: 'success' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Embed Builders ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the detailed ping response embed.
 * @param {PingMetrics} metrics
 * @returns {EmbedBuilder}
 */
function buildPingEmbed(metrics) {
  const health = getHealthIndicator(metrics);
  const quality = getLatencyQuality(metrics.latency);

  const embed = createEmbed({
    title: `${health.emoji} ${health.label} — ${quality.emoji} ${quality.label}`,
    description: [
      `**Bot Latency:** \`${metrics.latency}ms\` ${quality.emoji}`,
      `**API Latency:** \`${metrics.apiLatency}ms\``,
      `**Shard:** #${metrics.shardId} — ${SHARD_STATUS[metrics.shardStatus]?.emoji || '❓'} ${metrics.shardStatus}`,
      `**Uptime:** ${formatUptime(metrics.uptime)}`,
      `**Memory:** ${metrics.memoryUsage} MB`,
      `**Guilds:** ${metrics.guildCount.toLocaleString()}`,
    ].join('\n'),
    color: health.color,
  });

  embed.setFooter({ text: 'Measured just now' });
  embed.setTimestamp();

  return embed;
}

/**
 * Build a compact ping embed for prefix commands.
 * @param {PingMetrics} metrics
 * @returns {EmbedBuilder}
 */
function buildCompactPingEmbed(metrics) {
  const quality = getLatencyQuality(metrics.latency);

  return createEmbed({
    title: `🏓 Pong! ${quality.emoji}`,
    description: `**Latency:** \`${metrics.latency}ms\` · **API:** \`${metrics.apiLatency}ms\``,
    color: quality.color,
  });
}

/**
 * Build error embed for failed ping.
 * @param {string} [context]
 * @returns {EmbedBuilder}
 */
function buildErrorEmbed(context = 'unknown') {
  return createEmbed({
    title: '❌ System Error',
    description: `Could not determine latency at this time.\n-# Context: ${context}`,
    color: 'error',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Logging ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log ping metrics with structured data.
 * @param {PingMetrics} metrics
 * @param {ChatInputCommandInteraction | Message} interaction
 * @param {'slash' | 'prefix'} type
 */
function logPing(metrics, interaction, type) {
  const logLevel = metrics.latency > LATENCY_THRESHOLDS.poor.max ? 'warn' : 'info';

  logger[logLevel]('Ping measured', {
    event: `ping.${type}.measured`,
    latency: metrics.latency,
    apiLatency: metrics.apiLatency,
    quality: metrics.quality.label,
    shardId: metrics.shardId,
    shardStatus: metrics.shardStatus,
    guildCount: metrics.guildCount,
    memoryUsage: metrics.memoryUsage,
    userId: interaction.user?.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

/**
 * Log ping failure.
 * @param {Error} error
 * @param {ChatInputCommandInteraction | Message} interaction
 * @param {'slash' | 'prefix'} type
 */
function logPingError(error, interaction, type) {
  logger.error(`Ping ${type} command failed`, {
    event: `ping.${type}.error`,
    error: error.message,
    stack: error.stack,
    userId: interaction.user?.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Prefix Execute ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute ping via prefix command.
 * @param {Message} message
 */
async function prefixExecute(message) {
  const startTime = Date.now();

  try {
    const pingingMessage = await message.reply({ content: '🏓 Pinging...' });

    const metrics = collectMetrics(startTime, message);
    logPing(metrics, message, 'prefix');

    const embed = buildCompactPingEmbed(metrics);

    await pingingMessage.edit({ content: null, embeds: [embed] });
  } catch (error) {
    logPingError(error, message, 'prefix');

    if (!message.channel) return;

    await message.channel.send({
      embeds: [buildErrorEmbed('prefix')],
    }).catch((sendError) => {
      logger.error('Ping prefix error reply failed', {
        event: 'ping.prefix.error_reply_failed',
        error: sendError.message,
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Slash Execute ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute ping via slash command.
 * @param {ChatInputCommandInteraction} interaction
 */
async function slashExecute(interaction) {
  const startTime = interaction._commandStartTime || interaction.createdTimestamp;

  // Defer with timeout guard
  const deferSuccess = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral,
  });

  if (!deferSuccess) {
    logger.warn('Ping defer failed', {
      event: 'ping.slash.defer_failed',
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });
    return;
  }

  try {
    // Show loading state
    await InteractionHelper.safeEditReply(interaction, {
      content: '🏓 Measuring latency...',
    });

    // Collect metrics
    const metrics = collectMetrics(startTime, interaction);
    logPing(metrics, interaction, 'slash');

    // Build and send response
    const embed = buildPingEmbed(metrics);

    await InteractionHelper.safeEditReply(interaction, {
      content: null,
      embeds: [embed],
    });
  } catch (error) {
    logPingError(error, interaction, 'slash');

    try {
      await InteractionHelper.safeReply(interaction, {
        embeds: [buildErrorEmbed('slash')],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error('Ping slash error reply failed', {
        event: 'ping.slash.error_reply_failed',
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
    .setName('ping')
    .setDescription("Checks the bot's latency, API speed, and system health")
    .setDMPermission(true),

  category: 'Core',

  // Aliases (synced with alias system)
  aliases: ['latency', 'pong'],

  async prefixExecute(message) {
    return prefixExecute(message);
  },

  async execute(interaction) {
    return slashExecute(interaction);
  },
};
