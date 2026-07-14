/**
 * /support — Support Server & Bug Reporting
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  MessageFlags,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
} from 'discord.js';
import { createEmbed, errorEmbed } from '../../utils/embeds.js';
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

/** Primary support server invite URL. */
const SUPPORT_SERVER_URL = 'https://discord.gg/QnWNz2dKCE';

/** Fallback support server URL (if invite fails). */
const SUPPORT_SERVER_FALLBACK = 'https://discord.gg/QnWNz2dKCE';

/** Bug report form URL (relative to support server). */
const BUG_REPORT_PATH = '/report-bug';

/** Feature request form URL. */
const FEATURE_REQUEST_PATH = '/feature-request';

/** Documentation URL. */
const DOCS_URL = 'https://docs.yourbot.com';

/** GitHub repository URL. */
const GITHUB_URL = 'https://github.com/yourbot/repo';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Type Definitions ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} SupportLinks
 * @property {string} supportUrl
 * @property {string} bugReportUrl
 * @property {string} featureRequestUrl
 * @property {string} docsUrl
 * @property {string} githubUrl
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Link Resolution ──────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve support links with environment overrides.
 * @returns {SupportLinks}
 */
function resolveSupportLinks() {
  // Allow environment overrides for self-hosted instances
  const baseUrl = process.env.SUPPORT_SERVER_URL || SUPPORT_SERVER_URL;
  const cleanBase = baseUrl.replace(/\/$/, '');

  return {
    supportUrl: cleanBase,
    bugReportUrl: `${cleanBase}${BUG_REPORT_PATH}`,
    featureRequestUrl: `${cleanBase}${FEATURE_REQUEST_PATH}`,
    docsUrl: process.env.BOT_DOCS_URL || DOCS_URL,
    githubUrl: process.env.BOT_GITHUB_URL || GITHUB_URL,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Embed Builders ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the support embed with configurable links.
 * @param {SupportLinks} links
 * @param {Client} [client]
 * @returns {EmbedBuilder}
 */
function buildSupportEmbed(links, client) {
  const botName = client?.user?.username || 'Bot';
  const avatarURL = client?.user?.displayAvatarURL?.({ size: 128, dynamic: true });

  const fields = [
    {
      name: '💬 Support Server',
      value: `Join our community for help, updates, and announcements.\n[Click here to join](${links.supportUrl})`,
      inline: false,
    },
    {
      name: '🐛 Bug Reports',
      value: `Found something broken? Let us know!\n[Report a bug](${links.bugReportUrl})`,
      inline: true,
    },
    {
      name: '💡 Feature Requests',
      value: `Have an idea? We'd love to hear it!\n[Request a feature](${links.featureRequestUrl})`,
      inline: true,
    },
  ];

  // Only show docs/github if configured
  if (links.docsUrl !== DOCS_URL || process.env.BOT_DOCS_URL) {
    fields.push({
      name: '📚 Documentation',
      value: `Read the docs for setup guides and command references.\n[View documentation](${links.docsUrl})`,
      inline: false,
    });
  }

  if (links.githubUrl !== GITHUB_URL || process.env.BOT_GITHUB_URL) {
    fields.push({
      name: '🔧 GitHub',
      value: `Open source contributions welcome!\n[View on GitHub](${links.githubUrl})`,
      inline: false,
    });
  }

  return createEmbed({
    title: `💜 ${botName} Support`,
    description: [
      'Need help? Here are all the ways to get support:',
      '',
      '• **Quick questions?** Ask in the support server',
      '• **Bug found?** Use the bug report button below',
      '• **Feature idea?** Submit a feature request',
      '• **Self-hosting?** Check the documentation',
    ].join('\n'),
    color: 'primary',
    thumbnail: avatarURL,
    fields,
    footer: 'Support team typically responds within 24 hours',
  }).setTimestamp();
}

/**
 * Build error embed for failed support command.
 * @returns {EmbedBuilder}
 */
function buildErrorEmbed() {
  return createEmbed({
    title: '❌ System Error',
    description: 'Could not display support information. Please try again later.',
    color: 'error',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Component Builders ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the support action row with primary buttons.
 * @param {SupportLinks} links
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildPrimaryRow(links) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('Join Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL(links.supportUrl)
      .setEmoji('💬'),
    new ButtonBuilder()
      .setLabel('Report Bug')
      .setStyle(ButtonStyle.Link)
      .setURL(links.bugReportUrl)
      .setEmoji('🐛'),
  );
}

/**
 * Build secondary action row with additional resources.
 * @param {SupportLinks} links
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildSecondaryRow(links) {
  const buttons = [];

  if (links.docsUrl !== DOCS_URL || process.env.BOT_DOCS_URL) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('Documentation')
        .setStyle(ButtonStyle.Link)
        .setURL(links.docsUrl)
        .setEmoji('📚'),
    );
  }

  if (links.githubUrl !== GITHUB_URL || process.env.BOT_GITHUB_URL) {
    buttons.push(
      new ButtonBuilder()
        .setLabel('GitHub')
        .setStyle(ButtonStyle.Link)
        .setURL(links.githubUrl)
        .setEmoji('🔧'),
    );
  }

  buttons.push(
    new ButtonBuilder()
      .setLabel('Feature Request')
      .setStyle(ButtonStyle.Link)
      .setURL(links.featureRequestUrl)
      .setEmoji('💡'),
  );

  return new ActionRowBuilder().addComponents(...buttons);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
// ─── Logging ────────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Log support command usage.
 * @param {ChatInputCommandInteraction} interaction
 */
function logSupportUsed(interaction) {
  logger.info('Support command used', {
    event: 'support.used',
    userId: interaction.user.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    supportUrl: resolveSupportLinks().supportUrl,
  });
}

/**
 * Log support command failure.
 * @param {Error} error
 * @param {ChatInputCommandInteraction} interaction
 */
function logSupportError(error, interaction) {
  logger.error('Support command failed', {
    event: 'support.error',
    error: error.message,
    stack: error.stack,
    userId: interaction.user.id,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
  });
}

/**
 * Log error reply failure.
 * @param {Error} error
 */
function logErrorReplyFailed(error) {
  logger.error('Support error reply failed', {
    event: 'support.error_reply_failed',
    error: error.message,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Execute Handlers ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Execute support command via slash interaction.
 * @param {ChatInputCommandInteraction} interaction
 */
async function slashExecute(interaction) {
  try {
    const links = resolveSupportLinks();
    const embed = buildSupportEmbed(links, interaction.client);
    const primaryRow = buildPrimaryRow(links);
    const secondaryRow = buildSecondaryRow(links);

    const components = [primaryRow];
    if (secondaryRow.components.length > 0) {
      components.push(secondaryRow);
    }

    await InteractionHelper.safeReply(interaction, {
      embeds: [embed],
      components,
      flags: MessageFlags.Ephemeral,
    });

    logSupportUsed(interaction);
  } catch (error) {
    logSupportError(error, interaction);

    try {
      await InteractionHelper.safeReply(interaction, {
        embeds: [buildErrorEmbed()],
        flags: MessageFlags.Ephemeral,
      });
    } catch (replyError) {
      logErrorReplyFailed(replyError);
    }
  }
}

/**
 * Execute support command via prefix message.
 * @param {import('discord.js').Message} message
 */
async function prefixExecute(message) {
  try {
    const links = resolveSupportLinks();
    const embed = buildSupportEmbed(links, message.client);
    const primaryRow = buildPrimaryRow(links);
    const secondaryRow = buildSecondaryRow(links);

    const components = [primaryRow];
    if (secondaryRow.components.length > 0) {
      components.push(secondaryRow);
    }

    await message.reply({
      embeds: [embed],
      components,
    });

    logger.info('Support prefix command used', {
      event: 'support.prefix.used',
      userId: message.author.id,
      guildId: message.guildId,
      channelId: message.channelId,
    });
  } catch (error) {
    logger.error('Support prefix command failed', {
      event: 'support.prefix.error',
      error: error.message,
      stack: error.stack,
      userId: message.author.id,
      guildId: message.guildId,
      channelId: message.channelId,
    });

    await message.reply({
      embeds: [buildErrorEmbed()],
    }).catch((replyError) => {
      logger.error('Support prefix error reply failed', {
        event: 'support.prefix.error_reply_failed',
        error: replyError.message,
      });
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Definition ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get links to the support server, bug reporting, and documentation')
    .setDMPermission(true),

  category: 'Core',

  // Aliases (synced with alias system)
  aliases: ['server', 'discord'],

  async prefixExecute(message) {
    return prefixExecute(message);
  },

  async execute(interaction) {
    return slashExecute(interaction);
  },
};
