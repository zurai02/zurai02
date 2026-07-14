// loggingUi.js — Discord UI component builders for the logging dashboard

import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { EVENT_TYPES } from '../../services/loggingService.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_BUTTONS_PER_ROW = 5;
const MAX_SELECT_OPTIONS = 25;

const DASHBOARD_CATEGORIES = Object.freeze([
  'moderation',
  'message',
  'role',
  'member',
  'leveling',
  'reactionrole',
  'giveaway',
  'counter',
  'application',
  'report',
]);

const DASHBOARD_CATEGORY_EMOJIS = Object.freeze({
  moderation: '🔨',
  message: '✉️',
  role: '🏷️',
  member: '👥',
  leveling: '📈',
  reactionrole: '🎭',
  giveaway: '🎁',
  counter: '📊',
  application: '📝',
  report: '🚨',
});

const DASHBOARD_CATEGORY_LABELS = Object.freeze({
  moderation: 'Moderation',
  message: 'Messages',
  role: 'Roles',
  member: 'Members',
  leveling: 'Leveling',
  reactionrole: 'Reaction Roles',
  giveaway: 'Giveaways',
  counter: 'Counters',
  application: 'Applications',
  report: 'Reports',
});

// ─── Derived: Event Types by Category ─────────────────────────────────────────

const EVENT_TYPES_BY_CATEGORY = Object.freeze(
  Object.values(EVENT_TYPES).reduce((accumulator, eventType) => {
    const [category] = eventType.split('.');
    if (!accumulator[category]) {
      accumulator[category] = [];
    }
    accumulator[category].push(eventType);
    return accumulator;
  }, {})
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Chunk an array into groups of a specified size.
 * @template T
 * @param {T[]} array
 * @param {number} size
 * @returns {T[][]}
 */
function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

/**
 * Determine if a category is fully enabled.
 * @param {string} category
 * @param {Record<string, boolean>} enabledEvents
 * @param {boolean} loggingEnabled
 * @returns {boolean}
 */
function isCategoryEnabled(category, enabledEvents, loggingEnabled) {
  if (!loggingEnabled) return false;

  const wildcardKey = `${category}.*`;
  if (enabledEvents[wildcardKey] === false) return false;

  const categoryEvents = EVENT_TYPES_BY_CATEGORY[category] || [];
  if (categoryEvents.length === 0) return true;

  return categoryEvents.every((eventType) => enabledEvents[eventType] !== false);
}

// ─── Component Builders ─────────────────────────────────────────────────────────

/**
 * Create a "Back to Dashboard" button.
 * @returns {ButtonBuilder}
 */
function createBackButton() {
  return new ButtonBuilder()
    .setCustomId('log_dash_back')
    .setLabel('Back to Dashboard')
    .setStyle(ButtonStyle.Secondary);
}

/**
 * Create category toggle button rows.
 * @param {Record<string, boolean>} [enabledEvents={}]
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder<ButtonBuilder>[]}
 */
function createCategoryToggleButtons(enabledEvents = {}, loggingEnabled = false) {
  const buttons = DASHBOARD_CATEGORIES.map((category) => {
    const isEnabled = isCategoryEnabled(category, enabledEvents, loggingEnabled);
    const emoji = DASHBOARD_CATEGORY_EMOJIS[category] || '📌';
    const label = DASHBOARD_CATEGORY_LABELS[category] || category;

    return new ButtonBuilder()
      .setCustomId(`log_dash_toggle:${category}.*`)
      .setLabel(`${emoji} ${label}`)
      .setStyle(isEnabled ? ButtonStyle.Success : ButtonStyle.Danger);
  });

  return chunk(buttons, MAX_BUTTONS_PER_ROW).map(
    (group) => new ActionRowBuilder().addComponents(group)
  );
}

/**
 * Create the main logging configuration select menu.
 * @returns {ActionRowBuilder<StringSelectMenuBuilder>}
 */
export function createLoggingMainMenuSelect() {
  const options = [
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Audit Log Channel')
      .setDescription('Moderation, messages, members, roles, etc.')
      .setValue('set:audit')
      .setEmoji('🧾'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Applications Channel')
      .setDescription('New applications and review updates')
      .setValue('set:applications')
      .setEmoji('📝'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Set Reports Channel')
      .setDescription('User reports filed via /report')
      .setValue('set:reports')
      .setEmoji('🚨'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Audit Channel')
      .setValue('clear:audit')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Applications Channel')
      .setValue('clear:applications')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Clear Reports Channel')
      .setValue('clear:reports')
      .setEmoji('🗑️'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Event Categories')
      .setDescription('Toggle which log types are sent')
      .setValue('view:categories')
      .setEmoji('📋'),
    new StringSelectMenuOptionBuilder()
      .setLabel('Manage Ignore Filters')
      .setDescription('Skip logs from specific users or channels')
      .setValue('view:filters')
      .setEmoji('🔇'),
  ];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('log_dash_menu')
      .setPlaceholder('Choose a setting to configure…')
      .addOptions(options.slice(0, MAX_SELECT_OPTIONS))
  );
}

/**
 * Create the main action row with audit toggle and refresh buttons.
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder<ButtonBuilder>}
 */
export function createLoggingMainActionRow(loggingEnabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('log_dash_toggle:audit_enabled')
      .setLabel('Audit Logging')
      .setStyle(loggingEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('log_dash_refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary)
  );
}

/**
 * Create the full logging dashboard component set.
 * @param {Record<string, boolean>} [_enabledEvents]
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder[]}
 */
export function createLoggingDashboardComponents(_enabledEvents, loggingEnabled = false) {
  return [
    createLoggingMainMenuSelect(),
    createLoggingMainActionRow(loggingEnabled),
  ];
}

/**
 * Create the category view with toggle buttons and action row.
 * @param {Record<string, boolean>} enabledEvents
 * @param {boolean} [loggingEnabled=false]
 * @returns {ActionRowBuilder[]}
 */
export function createLoggingCategoryViewComponents(enabledEvents, loggingEnabled = false) {
  const categoryRows = createCategoryToggleButtons(enabledEvents, loggingEnabled);

  const actionRow = new ActionRowBuilder().addComponents(
    createBackButton(),
    new ButtonBuilder()
      .setCustomId('log_dash_toggle:all')
      .setLabel('Toggle All Categories')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('log_dash_refresh')
      .setLabel('Refresh')
      .setStyle(ButtonStyle.Primary)
  );

  return [...categoryRows, actionRow];
}

/**
 * Create the filter management component set.
 * @returns {ActionRowBuilder<ButtonBuilder>[]}
 */
export function createLoggingFilterComponents() {
  return [
    new ActionRowBuilder().addComponents(
      createBackButton(),
      new ButtonBuilder()
        .setCustomId('log_dash_add_filter:user')
        .setLabel('Add User Filter')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('log_dash_add_filter:channel')
        .setLabel('Add Channel Filter')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('log_dash_remove_filter')
        .setLabel('Remove Filter')
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { DASHBOARD_CATEGORIES, DASHBOARD_CATEGORY_EMOJIS, DASHBOARD_CATEGORY_LABELS, EVENT_TYPES_BY_CATEGORY };
