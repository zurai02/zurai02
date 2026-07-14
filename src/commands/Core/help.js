/**
 * /help — Interactive Help Menu
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  MessageFlags,
  ComponentType,
  ChatInputCommandInteraction,
  Client,
  EmbedBuilder,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { createEmbed, infoEmbed, warningEmbed } from '../../utils/embeds.js';
import { isFeatureEnabled } from '../../config/bot.js';
import { logger } from '../../utils/logger.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Alias & Category System Integration ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

import {
  CATEGORY_ICONS,
  formatCategoryName,
  normalizeCategoryKey,
  isRestrictedCategory,
  isGuildConfigurable,
  isPublicCategory,
  isHiddenCategory,
  getCategoryList,
  getCommandCategory,
  getAliasesForCommand,
  getAvailableCommands,
  commandAliases,
} from '../../config/aliases.js'; // Adjust path to your alias/category config

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORY_SELECT_ID = 'help-category-select';
const ALL_COMMANDS_ID = 'help-all-commands';
const BUG_REPORT_BUTTON_ID = 'help-bug-report';
const SUPPORT_BUTTON_ID = 'help-support';
const CLOSE_BUTTON_ID = 'help-close';
const PREV_PAGE_ID = 'help-prev-page';
const NEXT_PAGE_ID = 'help-next-page';
const HELP_MENU_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const COMMANDS_PER_PAGE = 10;

/** Commands to exclude from help (hidden/internal). */
const HIDDEN_COMMANDS = Object.freeze(new Set([
  'eval',
  'exec',
  'shell',
  'reload',
  'restart',
  'reboot',
  'shutdown',
  'maintenance',
  'blacklistuser',
  'blacklistguild',
  'owner',
]));

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category Resolution ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve a directory name to canonical category metadata.
 * @param {string} dirName
 * @returns {{key: string, name: string, icon: string, hidden: boolean, configurable: boolean}}
 */
function resolveCategoryMetadata(dirName) {
  const normalized = normalizeCategoryKey(dirName);
  const formatted = formatCategoryName(dirName);
  const icon = getCategoryIcon(normalized) || getCategoryIcon(formatted) || CATEGORY_ICONS[formatted] || '📁';

  return {
    key: normalized,
    name: formatted,
    icon,
    hidden: isHiddenCategory(normalized) || isRestrictedCategory(normalized),
    configurable: isGuildConfigurable(normalized),
  };
}

/**
 * Get the icon for a category (fallback chain).
 * @param {string} category
 * @returns {string}
 */
function getCategoryIcon(category) {
  if (!category) return '📁';
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(category);

  return (
    CATEGORY_ICONS[formatted] ||
    CATEGORY_ICONS[normalized] ||
    '📁'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Discovery ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Discover command categories from filesystem.
 * @returns {Promise<string[]>}
 */
async function discoverCategories() {
  const commandsPath = path.join(__dirname, '../../commands');
  try {
    const entries = await fs.readdir(commandsPath, { withFileTypes: true });
    return entries
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    logger.error('Failed to discover command categories', {
      event: 'help.discover_categories_failed',
      error: error.message,
    });
    return [];
  }
}

/**
 * Discover commands in a category directory.
 * @param {string} categoryDir
 * @returns {Promise<Array<{name: string, description: string, aliases: string[], category: string}>>}
 */
async function discoverCommandsInCategory(categoryDir) {
  const categoryPath = path.join(__dirname, '../../commands', categoryDir);
  try {
    const files = await fs.readdir(categoryPath);
    const commands = [];

    for (const file of files) {
      if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

      try {
        const modulePath = path.join(categoryPath, file);
        const module = await import(modulePath);
        const cmd = module.default || module;

        if (!cmd?.data?.name) continue;
        if (HIDDEN_COMMANDS.has(cmd.data.name.toLowerCase())) continue;

        const categoryMeta = resolveCategoryMetadata(categoryDir);
        const aliases = getAliasesForCommand(cmd.data.name);

        commands.push({
          name: cmd.data.name,
          description: cmd.data.description || 'No description available.',
          aliases: aliases.length > 0 ? aliases : [],
          category: categoryMeta.name,
          categoryKey: categoryMeta.key,
          slashOnly: cmd.slashOnly === true || cmd.prefixOnly === false,
          categoryIcon: categoryMeta.icon,
        });
      } catch (error) {
        logger.debug('Failed to load command for help', {
          event: 'help.load_command_failed',
          file,
          error: error.message,
        });
      }
    }

    return commands.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    logger.debug('Failed to read category directory', {
      event: 'help.read_category_failed',
      category: categoryDir,
      error: error.message,
    });
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Embed Builders ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

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

  lines.push(
    '**3. Browse commands** — Use the menu below to view categories and commands.',
    '',
    '💡 *Tip: You can also use prefix commands once configured!*'
  );

  return lines.join('\n');
}

/**
 * Build the initial help menu embed.
 * @param {Client} client
 * @param {boolean} hasAutomod
 * @returns {EmbedBuilder}
 */
function buildInitialEmbed(client, hasAutomod) {
  const botName = client?.user?.username || 'Bot';
  const avatarURL = client?.user?.displayAvatarURL?.({ size: 1024, dynamic: true });

  return createEmbed({
    title: `📖 ${botName} Help Center`,
    description: [
      `Welcome to **${botName}**! Here's how to get your server set up:`,
      '',
      buildGettingStartedField(hasAutomod),
    ].join('\n'),
    color: 'primary',
    thumbnail: avatarURL,
    fields: [
      {
        name: '🔍 Quick Tips',
        value: [
          '• Use the dropdown below to browse commands by category',
          '• Type `/` to see all slash commands with auto-complete',
          '• Prefix commands work too: `!help`, `!ping`, etc.',
          '• Use `/commands` to enable/disable specific commands',
        ].join('\n'),
        inline: false,
      },
      {
        name: '⚡ Support',
        value: [
          '• [Join our Support Server](https://discord.gg/QnWNz2dKCE)',
          '• Click **Report Bug** below if something breaks',
          '• Check `/status` for bot health info',
        ].join('\n'),
        inline: false,
      },
      {
        name: '\u200B',
        value: `-# ${botName} is built with ❤️`,
        inline: false,
      },
    ],
  }).setFooter({ text: 'Menu closes after 5 minutes of inactivity' }).setTimestamp();
}

/**
 * Build category embed with command list.
 * @param {string} categoryName
 * @param {string} categoryIcon
 * @param {Array<{name: string, description: string, aliases: string[]}>} commands
 * @param {number} page
 * @param {number} totalPages
 * @returns {EmbedBuilder}
 */
function buildCategoryEmbed(categoryName, categoryIcon, commands, page = 1, totalPages = 1) {
  const start = (page - 1) * COMMANDS_PER_PAGE;
  const pageCommands = commands.slice(start, start + COMMANDS_PER_PAGE);

  const description = pageCommands.map((cmd) => {
    const aliasStr = cmd.aliases.length > 0
      ? ` *(aliases: ${cmd.aliases.slice(0, 3).join(', ')}${cmd.aliases.length > 3 ? '…' : ''})*`
      : '';
    const slashIndicator = cmd.slashOnly ? ' ⭐' : '';
    return `• \`/${cmd.name}\`${slashIndicator}${aliasStr}\n  └ ${cmd.description}`;
  }).join('\n\n') || '*No commands in this category.*';

  const embed = createEmbed({
    title: `${categoryIcon} ${categoryName} Commands`,
    description,
    color: 'primary',
    footer: totalPages > 1 ? `Page ${page}/${totalPages} • Use buttons to navigate` : `Page ${page}/${totalPages}`,
  });

  return embed;
}

/**
 * Build "all commands" embed with pagination.
 * @param {Array<{name: string, description: string, category: string, categoryIcon: string}>} commands
 * @param {number} page
 * @param {number} totalPages
 * @returns {EmbedBuilder}
 */
function buildAllCommandsEmbed(commands, page = 1, totalPages = 1) {
  const start = (page - 1) * COMMANDS_PER_PAGE;
  const pageCommands = commands.slice(start, start + COMMANDS_PER_PAGE);

  const description = pageCommands.map((cmd) => {
    return `• \`/${cmd.name}\` ${cmd.categoryIcon} *${cmd.category}*\n  └ ${cmd.description}`;
  }).join('\n\n') || '*No commands available.*';

  return createEmbed({
    title: '📋 All Commands',
    description,
    color: 'primary',
    footer: `Page ${page}/${totalPages} • ${commands.length} total commands`,
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Component Builders ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build category select menu options.
 * @param {string[]} categoryDirs
 * @returns {StringSelectMenuOptionBuilder[]}
 */
function buildCategoryOptions(categoryDirs) {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel('📋 All Commands')
      .setDescription('Browse every available command in a single list')
      .setValue(ALL_COMMANDS_ID)
      .setEmoji('📋'),
  ];

  for (const category of categoryDirs) {
    const meta = resolveCategoryMetadata(category);

    // Skip auto-moderation if feature disabled
    if (meta.key === 'automoderation' && !isFeatureEnabled('autoModeration')) {
      continue;
    }

    // Skip hidden/restricted categories from public help
    if (meta.hidden) continue;

    options.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${meta.icon} ${meta.name}`)
        .setDescription(`View ${meta.name} commands`)
        .setValue(category)
        .setEmoji(meta.icon),
    );
  }

  return options;
}

/**
 * Build the category select menu component.
 * @param {string[]} categoryDirs
 * @param {string} guildId
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
function buildCategorySelect(categoryDirs, guildId) {
  const options = buildCategoryOptions(categoryDirs);

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`${CATEGORY_SELECT_ID}:${guildId}`)
      .setPlaceholder('🔍 Select a category to view commands...')
      .addOptions(options.slice(0, 25)), // Discord max
  );
}

/**
 * Build navigation button row for pagination.
 * @param {string} guildId
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {boolean} hasPrev
 * @param {boolean} hasNext
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildNavButtons(guildId, currentPage, totalPages, hasPrev, hasNext) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${PREV_PAGE_ID}:${guildId}:${currentPage}`)
      .setLabel('◀ Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!hasPrev),
    new ButtonBuilder()
      .setCustomId(`${NEXT_PAGE_ID}:${guildId}:${currentPage}`)
      .setLabel('Next ▶')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!hasNext),
    new ButtonBuilder()
      .setCustomId(`${CLOSE_BUTTON_ID}:${guildId}`)
      .setLabel('❌ Close')
      .setStyle(ButtonStyle.Danger),
  );
}

/**
 * Build initial button row (bug report + support).
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
function buildInitialButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(BUG_REPORT_BUTTON_ID)
      .setLabel('🐛 Report Bug')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setLabel('💬 Support Server')
      .setURL('https://discord.gg/QnWNz2dKCE')
      .setStyle(ButtonStyle.Link),
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Cache & State Management ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** In-memory cache for help menu data. */
const helpCache = new Map();

/**
 * Get cached commands for a category or build cache.
 * @param {string} categoryDir
 * @returns {Promise<Array>}
 */
async function getCachedCategoryCommands(categoryDir) {
  const cacheKey = `cat:${categoryDir}`;
  if (helpCache.has(cacheKey)) {
    return helpCache.get(cacheKey);
  }

  const commands = await discoverCommandsInCategory(categoryDir);
  helpCache.set(cacheKey, commands);
  return commands;
}

/**
 * Get all cached commands across categories.
 * @param {string[]} categoryDirs
 * @returns {Promise<Array>}
 */
async function getCachedAllCommands(categoryDirs) {
  const cacheKey = 'all:commands';
  if (helpCache.has(cacheKey)) {
    return helpCache.get(cacheKey);
  }

  const allCommands = [];
  for (const dir of categoryDirs) {
    const commands = await getCachedCategoryCommands(dir);
    allCommands.push(...commands);
  }

  const sorted = allCommands.sort((a, b) => a.name.localeCompare(b.name));
  helpCache.set(cacheKey, sorted);
  return sorted;
}

/**
 * Clear help cache (call when commands reload).
 */
export function clearHelpCache() {
  helpCache.clear();
  logger.info('Help cache cleared', { event: 'help.cache_cleared' });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Menu Builder ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build the initial help menu message payload.
 * @param {Client} client
 * @param {string} guildId
 * @returns {Promise<{embeds: EmbedBuilder[], components: ActionRowBuilder[]}>}
 */
export async function createInitialHelpMenu(client, guildId) {
  const categoryDirs = await discoverCategories();
  const hasAutomod = isFeatureEnabled('autoModeration');

  const embed = buildInitialEmbed(client, hasAutomod);
  const selectRow = buildCategorySelect(categoryDirs, guildId);
  const buttonRow = buildInitialButtons();

  return {
    embeds: [embed],
    components: [buttonRow, selectRow],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Interaction Handlers ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle category select menu interaction.
 * @param {StringSelectMenuInteraction} interaction
 * @param {Client} client
 */
async function handleCategorySelect(interaction, client) {
  const selected = interaction.values[0];
  const guildId = interaction.guildId;

  await interaction.deferUpdate();

  if (selected === ALL_COMMANDS_ID) {
    const categoryDirs = await discoverCategories();
    const allCommands = await getCachedAllCommands(categoryDirs);
    const totalPages = Math.ceil(allCommands.length / COMMANDS_PER_PAGE) || 1;

    const embed = buildAllCommandsEmbed(allCommands, 1, totalPages);
    const navRow = buildNavButtons(guildId, 1, totalPages, false, totalPages > 1);
    const selectRow = buildCategorySelect(categoryDirs, guildId);

    await interaction.editReply({
      embeds: [embed],
      components: [navRow, selectRow],
    });
    return;
  }

  const commands = await getCachedCategoryCommands(selected);
  const meta = resolveCategoryMetadata(selected);
  const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE) || 1;

  const embed = buildCategoryEmbed(meta.name, meta.icon, commands, 1, totalPages);
  const navRow = buildNavButtons(guildId, 1, totalPages, false, totalPages > 1);
  const categoryDirs = await discoverCategories();
  const selectRow = buildCategorySelect(categoryDirs, guildId);

  await interaction.editReply({
    embeds: [embed],
    components: [navRow, selectRow],
  });
}

/**
 * Handle pagination button interaction.
 * @param {ButtonInteraction} interaction
 * @param {Client} client
 * @param {'prev' | 'next'} direction
 */
async function handlePageButton(interaction, client, direction) {
  const [_, guildId, currentPageStr] = interaction.customId.split(':');
  const currentPage = parseInt(currentPageStr, 10);
  const categoryDirs = await discoverCategories();

  // Determine current view (all or category)
  const message = interaction.message;
  const isAllCommands = message.embeds[0]?.title?.includes('All Commands');

  let commands;
  let meta = null;

  if (isAllCommands) {
    commands = await getCachedAllCommands(categoryDirs);
  } else {
    // Extract category from embed title
    const title = message.embeds[0]?.title || '';
    const categoryName = title.replace(/^.+?\s/, '').replace(' Commands', '');
    const categoryDir = categoryDirs.find((d) => resolveCategoryMetadata(d).name === categoryName);
    if (categoryDir) {
      commands = await getCachedCategoryCommands(categoryDir);
      meta = resolveCategoryMetadata(categoryDir);
    }
  }

  if (!commands) {
    await interaction.reply({
      embeds: [warningEmbed('Error', 'Could not determine command list.')],
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE) || 1;
  const newPage = direction === 'next'
    ? Math.min(currentPage + 1, totalPages)
    : Math.max(currentPage - 1, 1);

  await interaction.deferUpdate();

  const embed = meta
    ? buildCategoryEmbed(meta.name, meta.icon, commands, newPage, totalPages)
    : buildAllCommandsEmbed(commands, newPage, totalPages);

  const navRow = buildNavButtons(guildId, newPage, totalPages, newPage > 1, newPage < totalPages);
  const selectRow = buildCategorySelect(categoryDirs, guildId);

  await interaction.editReply({
    embeds: [embed],
    components: [navRow, selectRow],
  });
}

/**
 * Handle bug report button interaction.
 * @param {ButtonInteraction} interaction
 */
async function handleBugReport(interaction) {
  await interaction.reply({
    embeds: [infoEmbed(
      '🐛 Report a Bug',
      [
        'Please describe the bug in detail:',
        '• What command were you using?',
        '• What did you expect to happen?',
        '• What actually happened?',
        '',
        'Join our [Support Server](https://discord.gg/QnWNz2dKCE) for faster response!',
      ].join('\n'),
    )],
    flags: MessageFlags.Ephemeral,
  });
}

/**
 * Handle close button interaction.
 * @param {ButtonInteraction} interaction
 */
async function handleClose(interaction) {
  await interaction.deferUpdate();

  const closedEmbed = createEmbed({
    title: '✅ Help Menu Closed',
    description: 'The help menu has been closed. Use `/help` to open it again.',
    color: 'secondary',
  });

  await interaction.editReply({
    embeds: [closedEmbed],
    components: [],
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Component Collector Setup ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Setup component collector for the help menu.
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client
 */
function setupHelpCollector(interaction, client) {
  const message = interaction.fetchReply().catch(() => null);

  message.then((replyMessage) => {
    if (!replyMessage) return;

    const collector = replyMessage.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: HELP_MENU_TIMEOUT_MS,
      idle: 2 * 60 * 1000, // 2 min idle
      componentType: ComponentType.ActionRow,
    });

    collector.on('collect', async (componentInteraction) => {
      try {
        const customId = componentInteraction.customId;

        if (customId.startsWith(`${CATEGORY_SELECT_ID}:`)) {
          await handleCategorySelect(componentInteraction, client);
          return;
        }

        if (customId.startsWith(`${PREV_PAGE_ID}:`)) {
          await handlePageButton(componentInteraction, client, 'prev');
          return;
        }

        if (customId.startsWith(`${NEXT_PAGE_ID}:`)) {
          await handlePageButton(componentInteraction, client, 'next');
          return;
        }

        if (customId === BUG_REPORT_BUTTON_ID) {
          await handleBugReport(componentInteraction);
          return;
        }

        if (customId.startsWith(`${CLOSE_BUTTON_ID}:`)) {
          await handleClose(componentInteraction);
          collector.stop('user_closed');
          return;
        }
      } catch (error) {
        logger.error('Help menu component error', {
          event: 'help.component_error',
          error: error.message,
          customId: componentInteraction.customId,
          userId: interaction.user.id,
        });

        await componentInteraction.reply({
          embeds: [warningEmbed('Error', 'Something went wrong. Please try again.')],
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    });

    collector.on('end', async (_collected, reason) => {
      if (reason === 'user_closed') return;

      try {
        const finalEmbed = createEmbed({
          title: '⏰ Help Menu Timed Out',
          description: 'The help menu has closed due to inactivity. Use `/help` to reopen it.',
          color: 'secondary',
        });

        await replyMessage.edit({
          embeds: [finalEmbed],
          components: [],
        });
      } catch (error) {
        logger.debug('Help menu timeout edit failed', {
          event: 'help.timeout_edit_failed',
          error: error?.message,
        });
      }
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Execute ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main command execute handler.
 * @param {ChatInputCommandInteraction} interaction
 * @param {object} guildConfig
 * @param {Client} client
 */
async function execute(interaction, guildConfig, client) {
  try {
    await InteractionHelper.safeDefer(interaction);

    const { embeds, components } = await createInitialHelpMenu(client, interaction.guildId);

    await InteractionHelper.safeEditReply(interaction, { embeds, components });

    // Setup interactive collector
    setupHelpCollector(interaction, client);
  } catch (error) {
    logger.error('Help command failed', {
      event: 'help.execute_error',
      error: error.message,
      stack: error.stack,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await interaction.followUp({
      embeds: [warningEmbed('Error', 'Failed to load help menu. Please try again.')],
      flags: MessageFlags.Ephemeral,
    }).catch(() => {});
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Definition ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  slashOnly: true,
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays the interactive help menu with all available commands')
    .setDMPermission(false),
  category: 'Core',

  execute,
};
