/**
 * /commands — Command Access Manager
 * Ultra-organized • Alias-aware • Category-synced • Production-ready
 */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  Guild,
  Client,
} from 'discord.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { successEmbed, errorEmbed } from '../../utils/embeds.js';
import { logger } from '../../utils/logger.js';
import { replyUserError, ErrorTypes } from '../../utils/errorHandler.js';
import {
  disableCategory,
  enableCategory,
  disableCommand,
  enableCommand,
  resolveCategoryChoice,
  buildCommandRegistry,
  isProtectedCommand,
  getCommandStatus,
} from '../../services/commandAccessService.js';
import {
  buildDashboardView,
  handleDashboardComponent,
  createDashboardCollectorFilter,
  isCommandAccessCustomId,
} from './modules/commands_dashboard.js';
import { isFeatureEnabled } from '../../config/bot.js';

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Alias System Integration ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

import {
  resolveCommandAlias,
  resolveSubcommandAlias,
  getAliasesForCommand,
  getCommandCategory,
  getCategoryIcon,
  formatCategoryName,
  isRestrictedCategory,
  isGuildConfigurable,
  isProtectedCategory,
  getFeatureToggleKey,
} from '../../config/aliases.js'; // Adjust path to your alias/category config

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const DASHBOARD_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const AUTOCOMPLETE_MAX_RESULTS = 25;

/** Categories that require auto-moderation feature to be enabled. */
const AUTOMOD_DEPENDENT_CATEGORIES = new Set([
  'automoderation',
  'antiSpam',
  'antiRaid',
  'antiCaps',
  'antiInvite',
  'antiLink',
  'mentionSpam',
  'antiNsfw',
  'antiZalgo',
]);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Permission & Feature Guards ──────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Ensure the invoking member has Manage Guild permission.
 * @param {ChatInputCommandInteraction} interaction
 * @returns {Promise<boolean>}
 */
async function ensureManageGuild(interaction) {
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    await replyUserError(interaction, {
      type: ErrorTypes.PERMISSION,
      message: 'You need the **Manage Server** permission to manage commands.',
    });
    return false;
  }
  return true;
}

/**
 * Ensure a category's feature toggle is enabled before allowing access.
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} categoryKey
 * @returns {Promise<boolean>}
 */
async function ensureFeatureAvailable(interaction, categoryKey) {
  const toggleKey = getFeatureToggleKey(categoryKey);
  if (!toggleKey) return true; // No toggle required

  if (!isFeatureEnabled(toggleKey)) {
    await replyUserError(interaction, {
      type: ErrorTypes.FEATURE_DISABLED,
      message: `The **${formatCategoryName(categoryKey)}** module is not enabled on this bot instance.`,
    });
    return false;
  }
  return true;
}

/**
 * Ensure auto-moderation is available before allowing automod operations.
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} categoryKey
 * @returns {Promise<boolean>}
 */
async function ensureAutomodAvailable(interaction, categoryKey) {
  if (!AUTOMOD_DEPENDENT_CATEGORIES.has(categoryKey)) return true;
  if (!isFeatureEnabled('autoModeration')) {
    await replyUserError(interaction, {
      type: ErrorTypes.FEATURE_DISABLED,
      message: 'Auto-moderation is not enabled on this bot instance.',
    });
    return false;
  }
  return true;
}

/**
 * Check if a category is restricted from being toggled.
 * @param {ChatInputCommandInteraction} interaction
 * @param {string} categoryKey
 * @returns {Promise<boolean>}
 */
async function ensureCategoryConfigurable(interaction, categoryKey) {
  if (isRestrictedCategory(categoryKey)) {
    await replyUserError(interaction, {
      type: ErrorTypes.PERMISSION,
      message: `**${formatCategoryName(categoryKey)}** is a restricted category and cannot be toggled.`,
    });
    return false;
  }

  if (isProtectedCategory(categoryKey)) {
    await replyUserError(interaction, {
      type: ErrorTypes.PERMISSION,
      message: `**${formatCategoryName(categoryKey)}** is a core system category and cannot be disabled.`,
    });
    return false;
  }

  return true;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category Choice Builder ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build autocomplete choices for categories.
 * @param {Client} client
 * @returns {{name: string, value: string}[]}
 */
function buildCategoryChoices(client) {
  const registry = buildCommandRegistry(client);
  return [...registry.values()]
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .slice(0, AUTOCOMPLETE_MAX_RESULTS)
    .map((category) => ({
      name: `${getCategoryIcon(category.key) || category.icon || '📁'} ${category.displayName}`.slice(0, 100),
      value: category.key,
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Choice Builder (with Alias Support) ──────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build autocomplete choices for commands with alias awareness.
 * @param {Client} client
 * @param {string} query
 * @param {string|null} [categoryFilter]
 * @returns {{name: string, value: string}[]}
 */
function buildCommandChoices(client, query, categoryFilter = null) {
  const registry = buildCommandRegistry(client);
  const results = [];
  const seen = new Set();

  // Helper to add a command with its aliases in the name
  const addCommand = (cmd, category) => {
    if (seen.has(cmd.name)) return;
    if (isProtectedCommand(cmd.name)) return;

    seen.add(cmd.name);

    const aliases = getAliasesForCommand(cmd.name);
    const aliasStr = aliases.length > 0 ? ` (${aliases.slice(0, 3).join(', ')}${aliases.length > 3 ? '…' : ''})` : '';
    const icon = getCategoryIcon(category?.key || category) || category?.icon || '🔧';

    results.push({
      name: `${icon} /${cmd.name}${aliasStr}`.slice(0, 100),
      value: cmd.name,
      sortScore: 0,
    });
  };

  // If category filter is provided, only show commands from that category
  if (categoryFilter) {
    const matchedCategory = resolveCategoryChoice(client, categoryFilter);
    if (matchedCategory) {
      for (const command of matchedCategory.commands) {
        addCommand(command, matchedCategory);
      }
    }
  } else {
    // Show all commands across all categories
    for (const category of registry.values()) {
      for (const command of category.commands) {
        addCommand(command, category);
      }
    }
  }

  // Score and filter by query
  const normalizedQuery = query.toLowerCase().trim();

  const scored = results
    .map((choice) => {
      const nameLower = choice.name.toLowerCase();
      const valueLower = choice.value.toLowerCase();

      // Exact match = highest score
      if (valueLower === normalizedQuery) choice.sortScore = 100;
      // Starts with query
      else if (valueLower.startsWith(normalizedQuery)) choice.sortScore = 80;
      // Name includes query
      else if (nameLower.includes(normalizedQuery)) choice.sortScore = 60;
      // Alias match (alias is in the name string)
      else if (nameLower.includes(`(${normalizedQuery}`)) choice.sortScore = 50;
      // Value contains query
      else if (valueLower.includes(normalizedQuery)) choice.sortScore = 40;
      else choice.sortScore = 0;

      return choice;
    })
    .filter((c) => c.sortScore > 0)
    .sort((a, b) => b.sortScore - a.sortScore)
    .slice(0, AUTOCOMPLETE_MAX_RESULTS)
    .map(({ name, value }) => ({ name, value }));

  return scored;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Dashboard Flow ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle the dashboard subcommand flow.
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client
 */
async function handleDashboardFlow(interaction, client) {
  const deferred = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral,
  });
  if (!deferred) return;

  // Build initial dashboard view
  const view = await buildDashboardView(
    client,
    interaction.guildId,
    interaction.guild,
    'overview'
  );

  await InteractionHelper.safeEditReply(interaction, {
    embeds: [view.embed],
    components: view.components,
  });

  // Fetch reply for collector attachment
  const replyMessage = await interaction.fetchReply().catch((err) => {
    logger.error('Failed to fetch dashboard reply', {
      event: 'commands.dashboard.fetch_reply_error',
      error: err.message,
      guildId: interaction.guildId,
    });
    return null;
  });

  if (!replyMessage) return;

  // Create component collector
  const collector = replyMessage.createMessageComponentCollector({
    filter: createDashboardCollectorFilter(interaction.user.id, interaction.guildId),
    time: DASHBOARD_TIMEOUT_MS,
    idle: 5 * 60 * 1000, // 5 min idle timeout
  });

  // ─── Collector: Collect ─────────────────────────────────────────────────────
  collector.on('collect', async (componentInteraction) => {
    try {
      // Validate custom ID belongs to this system
      if (!isCommandAccessCustomId(componentInteraction.customId)) {
        return;
      }

      // Re-verify permissions on each interaction
      if (!componentInteraction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        await replyUserError(componentInteraction, {
          type: ErrorTypes.PERMISSION,
          message: 'You need the **Manage Server** permission to use the dashboard.',
        });
        return;
      }

      await handleDashboardComponent(componentInteraction, client);
    } catch (error) {
      logger.error('Command access dashboard interaction failed', {
        event: 'commands.dashboard.collect_error',
        error: error.message,
        stack: error.stack,
        customId: componentInteraction.customId,
        guildId: interaction.guildId,
        userId: interaction.user.id,
      });

      await replyUserError(componentInteraction, {
        type: ErrorTypes.UNKNOWN,
        message: error.message || 'Failed to update command access dashboard.',
      }).catch(() => {});
    }
  });

  // ─── Collector: End ───────────────────────────────────────────────────────────
  collector.on('end', async (_collected, reason) => {
    logger.debug('Dashboard collector ended', {
      event: 'commands.dashboard.collector_end',
      reason,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    try {
      const finalView = await buildDashboardView(
        client,
        interaction.guildId,
        interaction.guild,
        'overview'
      );

      // Disable all components
      const disabledComponents = finalView.components.map((row) => {
        const newRow = row.toJSON();
        newRow.components = newRow.components.map((component) => ({
          ...component,
          disabled: true,
        }));
        return newRow;
      });

      await replyMessage.edit({
        embeds: [finalView.embed],
        components: disabledComponents,
      });
    } catch (error) {
      logger.error('Failed to disable dashboard on collector end', {
        event: 'commands.dashboard.end_error',
        error: error.message,
        guildId: interaction.guildId,
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Enable / Disable Flow ──────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle category-level enable/disable.
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client
 * @param {string} target
 * @param {boolean} isDisable
 */
async function handleCategoryScope(interaction, client, target, isDisable) {
  const category = resolveCategoryChoice(client, target);

  if (!category) {
    return await replyUserError(interaction, {
      type: ErrorTypes.UNKNOWN,
      message: `No category matched \`${target}\`. Use \`/commands dashboard\` to browse categories.`,
    });
  }

  // Guard: restricted/protected categories
  if (!(await ensureCategoryConfigurable(interaction, category.key))) {
    return;
  }

  // Guard: feature toggles
  if (!(await ensureFeatureAvailable(interaction, category.key))) {
    return;
  }

  // Guard: auto-moderation dependency
  if (!(await ensureAutomodAvailable(interaction, category.key))) {
    return;
  }

  const action = isDisable ? 'Disabled' : 'Enabled';
  const verb = isDisable ? disableCategory : enableCategory;

  await verb(client, interaction.guildId, category.key);

  const embed = successEmbed(
    `Category ${action}`,
    isDisable
      ? `All **${category.displayName}** commands are now disabled.\nProtected commands remain available.`
      : `**${category.displayName}** commands are now enabled (except individually disabled commands).`
  );

  await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

/**
 * Handle command-level enable/disable.
 * @param {ChatInputCommandInteraction} interaction
 * @param {Client} client
 * @param {string} target
 * @param {boolean} isDisable
 */
async function handleCommandScope(interaction, client, target, isDisable) {
  // Resolve potential alias to canonical command name
  const commandName = resolveCommandAlias(target.toLowerCase());

  // Guard: protected commands
  if (isProtectedCommand(commandName)) {
    return await replyUserError(interaction, {
      type: ErrorTypes.PERMISSION,
      message: `\`/${commandName}\` is a protected command and cannot be ${isDisable ? 'disabled' : 'toggled'}.`,
    });
  }

  // Guard: auto-moderation dependency for automod commands
  const category = getCommandCategory(commandName);
  if (category && !(await ensureAutomodAvailable(interaction, category))) {
    return;
  }

  const action = isDisable ? 'Disabled' : 'Enabled';
  const verb = isDisable ? disableCommand : enableCommand;

  await verb(client, interaction.guildId, commandName);

  // Check current status for feedback
  const status = await getCommandStatus(client, interaction.guildId, commandName);
  const stateEmoji = isDisable ? '🔴' : '🟢';

  const embed = successEmbed(
    `Command ${action}`,
    `${stateEmoji} \`/${commandName}\` is now ${action.toLowerCase()} in this server.`
  );

  await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Autocomplete Handler ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Handle autocomplete interactions.
 * @param {AutocompleteInteraction} interaction
 */
async function handleAutocomplete(interaction) {
  const focused = interaction.options.getFocused(true);

  // Only handle the 'target' option
  if (focused.name !== 'target') {
    return interaction.respond([]);
  }

  const scope = interaction.options.getString('scope');
  const query = focused.value.toLowerCase().trim();

  // ─── Category Scope ───────────────────────────────────────────────────────
  if (scope === 'category') {
    const choices = buildCategoryChoices(interaction.client).filter(
      (choice) =>
        choice.name.toLowerCase().includes(query) ||
        choice.value.toLowerCase().includes(query)
    );
    return interaction.respond(choices.slice(0, AUTOCOMPLETE_MAX_RESULTS));
  }

  // ─── Command Scope ──────────────────────────────────────────────────────────
  // Check if query resolves to a category — if so, show commands from that category
  const matchedCategory = resolveCategoryChoice(interaction.client, query);
  const categoryFilter = matchedCategory ? matchedCategory.key : null;

  const choices = buildCommandChoices(interaction.client, query, categoryFilter);
  return interaction.respond(choices);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Execute Handler ────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Main execute handler.
 * @param {ChatInputCommandInteraction} interaction
 * @param {object} config
 * @param {Client} client
 */
async function execute(interaction, config, client) {
  // Permission guard
  if (!(await ensureManageGuild(interaction))) {
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  // ─── Dashboard Flow ─────────────────────────────────────────────────────────
  if (subcommand === 'dashboard') {
    return handleDashboardFlow(interaction, client);
  }

  // ─── Enable / Disable Flow ────────────────────────────────────────────────
  const scope = interaction.options.getString('scope', true);
  const target = interaction.options.getString('target', true);
  const isDisable = subcommand === 'disable';

  const deferred = await InteractionHelper.safeDefer(interaction, {
    flags: MessageFlags.Ephemeral,
  });
  if (!deferred) return;

  try {
    if (scope === 'category') {
      await handleCategoryScope(interaction, client, target, isDisable);
    } else {
      await handleCommandScope(interaction, client, target, isDisable);
    }
  } catch (error) {
    logger.error('Command access toggle failed', {
      event: 'commands.toggle_error',
      error: error.message,
      stack: error.stack,
      subcommand,
      scope,
      target,
      guildId: interaction.guildId,
      userId: interaction.user.id,
    });

    await replyUserError(interaction, {
      type: ErrorTypes.UNKNOWN,
      message: `Failed to ${isDisable ? 'disable' : 'enable'} \`${target}\`. Please try again later.`,
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Definition ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  data: new SlashCommandBuilder()
    .setName('commands')
    .setDescription('Enable or disable bot commands and categories for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('dashboard')
        .setDescription('Open the interactive command access dashboard')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('Disable a command or entire category')
        .addStringOption((option) =>
          option
            .setName('scope')
            .setDescription('Disable a single command or a whole category')
            .setRequired(true)
            .addChoices(
              { name: '📁 Category', value: 'category' },
              { name: '🔧 Command', value: 'command' }
            )
        )
        .addStringOption((option) =>
          option
            .setName('target')
            .setDescription('Category or command name (supports aliases)')
            .setRequired(true)
            .setAutocomplete(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('enable')
        .setDescription('Enable a command or entire category')
        .addStringOption((option) =>
          option
            .setName('scope')
            .setDescription('Enable a single command or a whole category')
            .setRequired(true)
            .addChoices(
              { name: '📁 Category', value: 'category' },
              { name: '🔧 Command', value: 'command' }
            )
        )
        .addStringOption((option) =>
          option
            .setName('target')
            .setDescription('Category or command name (supports aliases)')
            .setRequired(true)
            .setAutocomplete(true)
        )
    ),

  category: 'Core',

  autocomplete: handleAutocomplete,
  execute,
};
