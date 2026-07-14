import { SlashCommandBuilder, version as discordJsVersion, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const BYTES_PER_MB = 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format memory usage for display.
 * @param {number} bytes
 * @returns {string}
 */
function formatMemory(bytes) {
  return `${(bytes / BYTES_PER_MB).toFixed(2)} MB`;
}

/**
 * Format uptime into human-readable string.
 * @param {number} seconds
 * @returns {string}
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Build the stats embed with all metrics.
 * @param {object} options
 * @param {number} options.totalGuilds
 * @param {number} options.totalMembers
 * @param {string} options.nodeVersion
 * @param {string} options.djsVersion
 * @param {number} options.memoryUsed
 * @param {number} options.memoryTotal
 * @param {number} options.uptime
 * @param {number} options.wsPing
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildStatsEmbed({
  totalGuilds,
  totalMembers,
  nodeVersion,
  djsVersion,
  memoryUsed,
  memoryTotal,
  uptime,
  wsPing,
}) {
  const embed = createEmbed({
    title: '📊 System Statistics',
    description: 'Real-time performance metrics and bot health.',
    color: 'info',
  });

  embed.addFields(
    { name: '🏠 Servers', value: `${totalGuilds.toLocaleString()}`, inline: true },
    { name: '👥 Users', value: `${totalMembers.toLocaleString()}`, inline: true },
    { name: '⏱️ Uptime', value: formatUptime(uptime), inline: true },
    { name: '📡 WS Ping', value: `${Math.round(wsPing)}ms`, inline: true },
    { name: '💾 Memory Used', value: formatMemory(memoryUsed), inline: true },
    { name: '💾 Memory Total', value: formatMemory(memoryTotal), inline: true },
    { name: '⚡ Node.js', value: nodeVersion, inline: true },
    { name: '🔧 Discord.js', value: `v${djsVersion}`, inline: true },
  );

  return embed;
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View bot statistics and system health'),

  async execute(interaction) {
    try {
      const deferSuccess = await InteractionHelper.safeDefer(interaction);
      if (!deferSuccess) {
        logger.warn('Stats defer failed', {
          event: 'stats.defer.failed',
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });
        return;
      }

      const client = interaction.client;
      const memory = process.memoryUsage();

      const metrics = {
        totalGuilds: client.guilds.cache.size,
        totalMembers: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        nodeVersion: process.version,
        djsVersion: discordJsVersion,
        memoryUsed: memory.heapUsed,
        memoryTotal: memory.heapTotal,
        uptime: process.uptime(),
        wsPing: client.ws.ping,
      };

      logger.info('Stats requested', {
        event: 'stats.requested',
        ...metrics,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      const embed = buildStatsEmbed(metrics);

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      logger.error('Stats command failed', {
        event: 'stats.error',
        error: error.message,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [
          createEmbed({
            title: 'System Error',
            description: 'Could not fetch system statistics. Please try again.',
            color: 'error',
          }),
        ],
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  },
};      return InteractionHelper.safeEditReply(interaction, {
        embeds: [createEmbed({ title: 'System Error', description: 'Could not fetch system statistics.', color: 'error' })],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
