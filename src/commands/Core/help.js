import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed } from '../../utils/embeds.js';
import { createSelectMenu } from '../../utils/components.js';
import { isFeatureEnabled } from '../../config/bot.js';
import { logger } from '../../utils/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_SELECT_ID = 'help-category-select';
const ALL_COMMANDS_ID = 'help-all-commands';
const BUG_REPORT_BUTTON_ID = 'help-bug-report';
const HELP_MENU_TIMEOUT_MS = 5 * 60 * 1000;

const CATEGORY_ICONS = Object.freeze({
  Core: 'ℹ️',
  Moderation: '🛡️',
  Economy: '💰',
  Music: '🎵',
  Fun: '🎮',
  Leveling: '📊',
  Utility: '🔧',
  Ticket: '🎫',
  Welcome: '👋',
  Giveaway: '🎉',
  Counter: '🔢',
  Tools: '🛠️',
  Search: '🔍',
  'Reaction Roles': '🎭',
  Community: '👥',
  Birthday: '🎂',
  'Join To Create': '🔌',
  Verification: '✅',
  'Auto Moderation': '🤖',
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCategoryName(rawCategory) {
  return rawCategory
    .replace(/_/g, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Build category options for the select menu.
 * @param {string[]} categoryDirs
 * @returns {object[]}
 */
function buildCategoryOptions(categoryDirs) {
  const options = [
    {
      label: '📋 All Commands',
      description: 'Browse every available command in a single list',
      value: ALL_COMMANDS_ID,
    },
  ];

  for (const category of categoryDirs) {
    const categoryName = formatCategoryName(category);

    // Skip auto-moderation if feature is disabled
    if (categoryName === 'Auto Moderation' && !isFeatureEnabled('autoModeration')) {
      continue;
    }

    const icon = CATEGORY_ICONS[categoryName] || '🔍';
    options.push({
      label: `${icon} ${categoryName}`,
      description: `View commands in the ${categoryName} category`,
      value: category,
    });
  }

  return options;
}

/**
 * Build the getting-started field content.
 * @param {boolean} hasAutomod
 * @returns {string}
 */
function buildGettingStartedField(hasAutomod) {
  const lines = [
    '**1. Launch setup** — Run `/configwizard` to configure prefix, mod role, and logs.',
    '**2. Enable systems** — Use `/commands dashboard` to turn categories on or off.',
  ];

  if (hasAutomod) {
    lines.push('**2a. Auto-moderation** — Run `/automoderation dashboard` to configure anti-spam, anti-raid, etc.');
  }

  lines.push('**3. Browse commands** — Use the menu below to view categories and commands.');
  return lines.join('\n');
}

// ─── Menu Builder ─────────────────────────────────────────────────────────────

export async function createInitialHelpMenu(client) {
  const commandsPath = path.join(__dirname, '../../commands');
  const categoryDirs = (await fs.readdir(commandsPath, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)
    .sort();

  const hasAutomod = isFeatureEnabled('autoModeration');
  const options = buildCategoryOptions(categoryDirs);

  const botName = client?.user?.username || 'Bot';
  const embed = createEmbed({
    title: `📖 ${botName} Help`,
    description: 'Set up your server, pick what to enable, then browse commands below.',
    color: 'primary',
    thumbnail: client.user?.displayAvatarURL?.({ size: 1024 }),
    fields: [
      {
        name: '🚀 Getting Started',
        value: buildGettingStartedField(hasAutomod),
        inline: false,
      },
      {
        name: 'ℹ️ How It Works',
        value: [
          '• Dashboard commands manage each feature visually',
          '• Settings are saved per server',
          '• Slash commands and prefixes both work once enabled',
        ].join('\n'),
        inline: false,
      },
      {
        name: '\u200B',
        value: `-# ${botName} is [open source](https://youtu.be/1jCZX8s3bJE?si=NPOYx-vxVE1I5vJK)`,
        inline: false,
      },
    ],
  });

  embed.setFooter({ text: 'Made with ❤️' });
  embed.setTimestamp();

  const bugReportButton = new ButtonBuilder()
    .setCustomId(BUG_REPORT_BUTTON_ID)
    .setLabel('Report Bug')
    .setStyle(ButtonStyle.Danger);

  const supportButton = new ButtonBuilder()
    .setLabel('Support Server')
    .setURL('https://discord.gg/QnWNz2dKCE')
    .setStyle(ButtonStyle.Link);

  const selectRow = createSelectMenu(
    CATEGORY_SELECT_ID,
    'Select to view the commands',
    options,
  );

  const buttonRow = new ActionRowBuilder().addComponents(bugReportButton, supportButton);

  return {
    embeds: [embed],
    components: [buttonRow, selectRow],
  };
}

// ─── Main Export ───────────────────────────────────────────────────────────────

export default {
  slashOnly: true,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays the help menu with all available commands'),

  async execute(interaction, guildConfig, client) {
    await InteractionHelper.safeDefer(interaction);

    const { embeds, components } = await createInitialHelpMenu(client);

    await InteractionHelper.safeEditReply(interaction, { embeds, components });

    // Auto-close after timeout
    setTimeout(async () => {
      try {
        if (!InteractionHelper.isInteractionValid(interaction)) return;

        const closedEmbed = createEmbed({
          title: 'Help menu closed',
          description: 'Help menu has been closed, use /help again.',
          color: 'secondary',
        });

        await InteractionHelper.safeEditReply(interaction, {
          embeds: [closedEmbed],
          components: [],
        });
      } catch (error) {
        logger.debug('Help menu close edit failed', {
          event: 'help.menu.close_failed',
          error: error?.message,
        });
      }
    }, HELP_MENU_TIMEOUT_MS);
  },
};
