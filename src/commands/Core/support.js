import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
} from 'discord.js';
import { createEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPORT_SERVER_URL = 'https://discord.gg/QnWNz2dKCE';
const SUPPORT_SERVER_INVITE = 'https://discord.gg/QnWNz2dKCE';

// ─── Embed Builder ────────────────────────────────────────────────────────────

/**
 * Build the support embed with configurable links.
 * @param {object} [options]
 * @param {string} [options.supportUrl]
 * @param {string} [options.inviteUrl]
 * @returns {import('discord.js').EmbedBuilder}
 */
function buildSupportEmbed(options = {}) {
  const supportUrl = options.supportUrl || SUPPORT_SERVER_URL;
  const inviteUrl = options.inviteUrl || SUPPORT_SERVER_INVITE;

  return createEmbed({
    title: '💜 Need Help?',
    description: [
      'Join our official support server for assistance, bug reports, or feature suggestions.',
      '',
      `[Click here to join](${supportUrl})`,
      '',
      `-# Customizing this bot? Update the support link in your environment variables.`,
    ].join('\n'),
    color: 'primary',
    thumbnail: null,
    footer: 'Support team typically responds within 24 hours',
  });
}

/**
 * Build the support action row with buttons.
 * @param {object} [options]
 * @param {string} [options.supportUrl]
 * @param {string} [options.inviteUrl]
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildSupportRow(options = {}) {
  const supportUrl = options.supportUrl || SUPPORT_SERVER_URL;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Join Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL(supportUrl)
      .setEmoji('💬'),
    new ButtonBuilder()
      .setLabel('Report Bug')
      .setStyle(ButtonStyle.Link)
      .setURL(`${supportUrl}/report-bug`)
      .setEmoji('🐛'),
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get link to the support server and bug reporting'),

  async execute(interaction) {
    try {
      const embed = buildSupportEmbed();
      const row = buildSupportRow();

      await InteractionHelper.safeReply(interaction, {
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral,
      });

      logger.info('Support command used', {
        event: 'support.used',
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });
    } catch (error) {
      logger.error('Support command failed', {
        event: 'support.error',
        error: error.message,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      });

      try {
        await InteractionHelper.safeReply(interaction, {
          embeds: [
            createEmbed({
              title: 'System Error',
              description: 'Could not display support information. Please try again later.',
              color: 'error',
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      } catch (replyError) {
        logger.error('Support error reply failed', {
          event: 'support.error_reply.failed',
          error: replyError.message,
        });
      }
    }
  },
};        logger.error('Failed to send error reply:', replyError);
      }
    }
  },
};
