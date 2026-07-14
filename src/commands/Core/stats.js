/**
 * /stats — Bot Statistics & System Health Dashboard
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  version as discordJsVersion,
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

const BYTES_PER_MB = 1024 * 1024;
const BYTES_PER_GB = 1024 * 1024 * 1024;

/** CPU load thresholds for health indicators. */
const CPU_THRESHOLDS = Object.freeze({
  healthy: 50,
  warning: 75,
  critical: 90,
});

/** Memory usage thresholds for health indicators. */
const MEMORY_THRESHOLDS = Object.freeze({
  healthy: 60,
  warning: 80,
  critical: 95,
});

/** Uptime milestones for display badges. */
const UPTIME_MILESTONES = Object.freeze([
  { hours: 24 * 7, emoji: '💎', label: 'Week+' },
  { hours: 24, emoji: '🏆', label: 'Day+' },
  { hours: 12, emoji: '🥇', label: '12h+' },
  { hours: 6, emoji: '🥈', label: '6h+' },
  { hours: 1, emoji: '🥉', label: '1h+' },
  { hours: 0, emoji: '🆕', label: 'Fresh' },
]);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Type Definitions ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} SystemMetrics
 * @property {number} totalGuilds - Cached guild count
 * @property {number} totalMembers - Approximate total member count
 * @property {number} totalChannels - Cached channel count
 * @property {number} totalRoles - Cached role count
 * @property {number} totalEmojis - Cached emoji count
 * @property {string} nodeVersion - Node.js version
 * @property {string} djsVersion - Discord.js version
 * @property {number} memoryUsed - Heap used in bytes
 * @property {number} memoryTotal - Heap total in bytes
 * @property {number} memoryRSS - Resident set size in bytes
 * @property {number} memoryExternal - External memory in bytes
 * @property {number} uptime - Process uptime in seconds
 * @property {number} wsPing - WebSocket ping in ms
 * @property {number} cpuLoad - CPU load percentage (approx)
 * @property {number} shardCount - Total shard count
 * @property {number} currentShard - Current shard ID
 * @property {string} platform - Operating system platform
 * @property {string} arch - CPU architecture
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Formatting Helpers ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Format bytes to human-readable string (MB/GB).
 * @param {number} bytes
 * @returns {string}
 */
function formatMemory(bytes) {
  if (bytes >= BYTES_PER_GB) {
    return `${(bytes / BYTES_PER_GB).toFixed(2)} GB`;
  }
  return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
}

/**
 * Format uptime into human-readable string with milestone badge.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const hours = seconds / 3600;

  // Find milestone badge
  const milestone = UPTIME_MILESTONES.find((m) => hours >= m.hours) || UPTIME_MILESTONES[UPTIME_MILESTONES.length - 1];

  const days = Math.floor(seconds / 86400);
  const hrs = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  parts.push(`${secs}s`);

  return `${milestone.emoji} ${parts.join(' ')} · ${milestone.label}`;
}

/**
 * Format a number with locale and optional suffix.
 * @param {number} num
 * @param {string} [suffix]
 * @returns {string}
 */
function formatNumber(num, suffix = '') {
  return `${num.toLocaleString()}${suffix}`;
}

/**
 * Get health indicator based on metric vs threshold.
 * @param {number} value
 * @param {number} healthy
 * @param {number} warning
 * @param {number} critical
 * @returns {{emoji: string, color: string, status: string}}
 */
function getHealthIndicator(value, healthy, warning, critical) {
  if (value >= critical) return { emoji: '🔴', color: 'error', status: 'Critical' };
  if (value >= warning) return { emoji: '🟡', color: 'warning', status: 'Warning' };
  return { emoji: '🟢', color: 'success', status: 'Healthy' };
}

/**
 * Get memory health indicator.
 * @param {number} usedPercent
 * @returns {{emoji: string, color: string, status: string}}
 */
function getMemoryHealth(usedPercent) {
  return getHealthIndicator(usedPercent, MEMORY_THRESHOLDS.healthy, MEMORY_THRESHOLDS.warning, MEMORY_THRESHOLDS.critical);
}

/**
 * Get ping quality indicator.
 * @param {number} ping
 * @returns {{emoji: string, color: string, label: string}}
 */
function getPingQuality(ping) {
  if (ping < 50) return { emoji: '✨', color: 'success', label: 'Excellent' };
  if (ping < 100) return { emoji: '✅', color: 'success', label: 'Good' };
  if (ping < 250) return { emoji: '⚠️', color: 'warning', label: 'Fair' };
  if (ping < 500) return { emoji: '🐢', color: 'warning', label: 'Poor' };
  return { emoji: '🔴', color: 'error', label: 'Critical' };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Metrics Collection ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Collect comprehensive system metrics.
 * @param {Client} client
 * @returns {SystemMetrics}
 */
function collectMetrics(client) {
  const memory = process.memoryUsage();
  const uptime = process.uptime();

  // Approximate CPU load (simple heuristic)
  const cpuLoad = process.cpuUsage();
  const cpuPercent = Math.min(100, Math.round((cpuLoad.user + cpuLoad.system) / 1000000 / uptime));

  return {
    totalGuilds: client.guilds.cache.size,
    totalMembers: client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0),
    totalChannels: client.channels.cache.size,
    totalRoles: client.guilds.cache.reduce((acc, guild) => acc + guild.roles.cache.size, 0),
    totalEmojis: client.guilds.cache.reduce((acc, guild) => acc + guild.emojis.cache.size, 0),
    nodeVersion: process.version,
    djsVersion: discordJsVersion,
    memoryUsed: memory.heapUsed,
    memoryTotal: memory.heapTotal,
    memoryRSS: memory.rss,
    memoryExternal: memory.external,
    uptime,
    wsPing: client.ws.ping,
    cpuLoad: cpuPercent,
    shardCount: client.shard?.count || 1,
    currentShard: client.shard?.ids?.[0] ?? 0,
    platform: process.platform,
    arch: process.arch,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Embed Builders ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the comprehensive stats embed.
 * @param {SystemMetrics} metrics
 * @returns {EmbedBuilder}
 */
function buildStatsEmbed(metrics) {
  const memoryUsedPercent = (metrics.memoryUsed / metrics.memoryTotal) * 100;
  const memoryHealth = getMemoryHealth(memoryUsedPercent);
  const pingQuality = getPingQuality(metrics.wsPing);

  const embed = createEmbed({
    title: '📊 System Statistics',
    description: [
      `Real-time performance metrics for **Shard ${metrics.currentShard + 1}/${metrics.shardCount}**`,
      `Platform: \`${metrics.platform} ${metrics.arch}\``,
    ].join('\n'),
    color: memoryHealth.color,
  });

  // ─── Server Stats ───────────────────────────────────────────────────────────
  embed.addFields({
    name: '🏠 Server Statistics',
    value: [
      `**Guilds:** ${formatNumber(metrics.totalGuilds)}`,
      `**Members:** ${formatNumber(metrics.totalMembers)}`,
      `**Channels:** ${formatNumber(metrics.totalChannels)}`,
      `**Roles:** ${formatNumber(metrics.totalRoles)}`,
      `**Emojis:** ${formatNumber(metrics.totalEmojis)}`,
    ].join('\n'),
    inline: false,
  });

  // ─── Performance ──────────────────────────────────────────────────────────────
  embed.addFields({
    name: '⚡ Performance',
    value: [
      `**WS Ping:** ${pingQuality.emoji} \`${Math.round(metrics.wsPing)}ms\` · ${pingQuality.label}`,
      `**Uptime:** ${formatUptime(metrics.uptime)}`,
      `**CPU Load:** ${getHealthIndicator(metrics.cpuLoad, CPU_THRESHOLDS.healthy, CPU_THRESHOLDS.warning, CPU_THRESHOLDS.critical).emoji} \`${metrics.cpuLoad}%\``,
    ].join('\n'),
    inline: false,
  });

  // ─── Memory ─────────────────────────────────────────────────────────────────
  embed.addFields({
    name: `${memoryHealth.emoji} Memory Usage`,
    value: [
      `**Heap Used:** ${formatMemory(metrics.memoryUsed)} / ${formatMemory(metrics.memoryTotal)} (\`${memoryUsedPercent.toFixed(1)}%\`)`,
      `**RSS:** ${formatMemory(metrics.memoryRSS)}`,
      `**External:** ${formatMemory(metrics.memoryExternal)}`,
    ].join('\n'),
    inline: false,
  });

  // ─── Environment ──────────────────────────────────────────────────────────────
  embed.addFields({
    name: '🔧 Environment',
    value: [
      `**Node.js:** ${metrics.nodeVersion}`,
      `**Discord.js:** v${metrics.djsVersion}`,
      `**Process ID:** \`${process.pid}\``,
    ].join('\n'),
    inline: false,
  });

  embed.setFooter({ text: `Shard ${metrics.currentShard + 1}/${metrics.shardCount} • ${metrics.platform} ${metrics.arch}` });
  embed.setTimestamp();

  return embed;
}

/**
 * Build a compact stats embed for prefix commands.
 * @param {SystemMetrics} metrics
 * @returns {EmbedBuilder}
 */
function buildCompactStatsEmbed(metrics) {
  const pingQuality = getPingQuality(metrics.wsPing);

  return createEmbed({
    title: '📊 Stats',
    description: [
      `**Guilds:** ${formatNumber(metrics.totalGuilds)}`,
      `**Members:** ${formatNumber(metrics.totalMembers)}`,
      `**Ping:** ${pingQuality.emoji} \`${Math.round(metrics.wsPing)}ms\``,
      `**Uptime:** ${formatUptime(metrics.uptime)}`,
      `**Memory:** ${formatMemory(metrics.memoryUsed)}`,
    ].join('\n'),
    color: pingQuality.color,
  });
}

/**
 * Build error embed for failed stats.
 * @param {string} [context]
 * @returns {EmbedBuilder}
 */
function buildErrorEmbed(context = 'unknown') {
  return createEmbed({
    title: '❌ System Error',
    description: `Could not fetch system statistics.\n-# Context: ${context}`,
    color: 'error',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Logging ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log stats request with structured data.
 * @param {SystemMetrics} metrics
 * @param {ChatInputCommandInteraction} interaction
 * @param {'slash' | 'prefix'} type
 */
function logStats(metrics, interaction, type) {
  logger.info('Stats requested', {
    event: `stats.${type}.requested`,
    totalGuilds: metrics.totalGuilds,
    totalMembers: metrics.totalMembers,
    memoryUsed: formatMemory(metrics.memoryUsed),
    wsPing: metrics.wsPing,
    uptime: metrics.uptime,
    shardId: metrics.currentShard,
    userId: interaction.user?.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

/**
 * Log stats failure.
 * @param {Error} error
 * @param {ChatInputCommandInteraction} interaction
 * @param {'slash' | 'prefix'} type
 */
function logStatsError(error, interaction, type) {
  logger.error(`Stats ${type} command failed`, {
    event: `stats.${type}.error`,
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
 * Execute stats via prefix command.
 * @param {import('discord.js').Message} message
 */
async function prefixExecute(message) {
  try {
    const metrics = collectMetrics(message.client);
    logStats(metrics, message, 'prefix');

    const embed = buildCompactStatsEmbed(metrics);
    await message.reply({ embeds: [embed] });
  } catch (error) {
    logStatsError(error, message, 'prefix');

    await message.reply({
      embeds: [buildErrorEmbed('prefix')],
    }).catch((replyError) => {
      logger.error('Stats prefix error reply failed', {
        event: 'stats.prefix.error_reply_failed',
        error: replyError.message,
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Slash Execute ──────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute stats via slash command.
 * @param {ChatInputCommandInteraction} interaction
 */
async function slashExecute(interaction) {
  const deferSuccess = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral,
  });

  if (!deferSuccess) {
    logger.warn('Stats defer failed', {
      event: 'stats.slash.defer_failed',
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    });
    return;
  }

  try {
    const metrics = collectMetrics(interaction.client);
    logStats(metrics, interaction, 'slash');

    const embed = buildStatsEmbed(metrics);

    await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
  } catch (error) {
    logStatsError(error, interaction, 'slash');

    try {
      await InteractionHelper.safeEditReply(interaction, {
        embeds: [buildErrorEmbed('slash')],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error('Stats slash error reply failed', {
        event: 'stats.slash.error_reply_failed',
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
    .setName('stats')
    .setDescription('View comprehensive bot statistics and system health')
    .setDMPermission(true),

  category: 'Core',

  // Aliases (synced with alias system)
  aliases: ['botinfo', 'status', 'info'],

  async prefixExecute(message) {
    return prefixExecute(message);
  },

  async execute(interaction) {
    return slashExecute(interaction);
  },
};
