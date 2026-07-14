import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const PING_TIMEOUT_MS = 10_000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the ping response embed.
 * @param {number} latency
 * @param {number} apiLatency
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildPingEmbed(latency, apiLatency) {
  const embed = createEmbed({
    title: '🏓 Pong!',
    description: null,
    color: latency < 100 ? 'success' : latency < 250 ? 'warning' : 'error',
  });

  embed.addFields(
    { name: 'Bot Latency', value: `${latency}ms`, inline: true },
    { name: 'API Latency', value: `${apiLatency}ms`, inline: true },
  );

  return embed;
}

/**
 * Determine latency quality label.
 * @param {number} latency
 * @returns {string}
 */
function getLatencyQuality(latency) {
  if (latency < 50) return 'Excellent';
  if (latency < 100) return 'Good';
  if (latency < 250) return 'Fair';
  if (latency < 500) return 'Poor';
  return 'Critical';
}

// ─── Prefix Execute ───────────────────────────────────────────────────────────

async function prefixExecute(interaction) {
  const startTime = Date.now();

  try {
    const pingingMessage = await interaction.reply({ content: 'Pinging...' });

    const latency = Date.now() - startTime;
    const apiLatency = Math.max(0, Math.round(interaction.client.ws.ping));

    const embed = buildPingEmbed(latency, apiLatency);

    await pingingMessage.edit({ content: null, embeds: [embed] });
  } catch (error) {
    logger.error('Ping prefix command failed', {
      event: 'ping.prefix.error',
      error: error.message,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
    });

    if (!interaction.replied && !interaction._replyMessage) {
      await interaction.channel.send({
        embeds: [
          createEmbed({
            title: 'System Error',
            description: 'Could not determine latency at this time.',
            color: 'error',
          }),
        ],
      }).catch(() => {});
    }
  }
}

// ─── Slash Execute ────────────────────────────────────────────────────────────

async function slashExecute(interaction) {
  const deferSuccess = await InteractionHelper.safeDefer(interaction);
  if (!deferSuccess) {
    logger.warn('Ping defer failed', {
      event: 'ping.defer.failed',
      userId: interaction.user.id,
      guildId: interaction.guildId,
      commandName: 'ping',
    });
    return;
  }

  try {
    await InteractionHelper.safeEditReply(interaction, { content: 'Pinging...' });

    const startTime = interaction._commandStartTime || interaction.createdTimestamp;
    const latency = Math.max(0, Date.now() - startTime);
    const apiLatency = Math.max(0, Math.round(interaction.client.ws.ping));

    logger.info('Ping measured', {
      event: 'ping.measured',
      latency,
      apiLatency,
      quality: getLatencyQuality(latency),
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    const embed = buildPingEmbed(latency, apiLatency);

    await InteractionHelper.safeEditReply(interaction, {
      content: null,
      embeds: [embed],
    });
  } catch (error) {
    logger.error('Ping slash command failed', {
      event: 'ping.slash.error',
      error: error.message,
      userId: interaction.user.id,
      guildId: interaction.guildId,
    });

    try {
      await InteractionHelper.safeReply(interaction, {
        embeds: [
          createEmbed({
            title: 'System Error',
            description: 'Could not determine latency at this time.',
            color: 'error',
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logger.error('Ping error reply failed', {
        event: 'ping.error_reply.failed',
        error: replyError.message,
      });
    }
  }
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Checks the bot's latency and API speed"),

  async prefixExecute(interaction) {
    return prefixExecute(interaction);
  },

  async execute(interaction) {
    return slashExecute(interaction);
  },
};
