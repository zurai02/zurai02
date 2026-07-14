import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
 * Build the uptime embed.
 * @param {string} uptimeStr
 * @param {number} rawMs
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildUptimeEmbed(uptimeStr, rawMs) {
  const embed = createEmbed({
    title: '⏱️ System Uptime',
    description: `\`\`\`${uptimeStr}\`\`\``,
    color: 'info',
  });

  // Add boot timestamp for reference
  const bootTime = new Date(Date.now() - rawMs);
  embed.addFields({
    name: '📅 Started',
    value: `<t:${Math.floor(bootTime.getTime() / 1000)}:R>`,
    inline: true,
  });

  return embed;
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Check how long the bot has been online'),

  async execute(interaction) {
    try {
      const deferSuccess = await InteractionHelper.safeDefer(interaction);
      if (!deferSuccess) {
        logger.warn('Uptime defer failed', {
          event: 'uptime.defer.failed',
          userId: interaction.user.id,
          guildId: interaction.guildId,
        });
        return;
      }

      const rawMs = interaction.client.uptime;
      const uptimeStr = formatUptime(rawMs);

      logger.info('Uptime checked', {
        event: 'uptime.checked',
        uptime: uptimeStr,
        rawMs,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      const embed = buildUptimeEmbed(uptimeStr, rawMs);

      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      logger.error('Uptime command failed', {
        event: 'uptime.error',
        error: error.message,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      try {
        await InteractionHelper.safeEditReply(interaction, {
          embeds: [
            createEmbed({
              title: 'System Error',
              description: 'Could not compute uptime. Please try again.',
              color: 'error',
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        logger.error('Uptime error reply failed', {
          event: 'uptime.error_reply.failed',
          error: replyError.message,
        });
      }
    }
  },
};
