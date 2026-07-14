/**
 * Command category metadata for the command access manager.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORY_ICONS = Object.freeze({
  AutoModeration: '🤖',
  Birthday: '🎂',
  Community: '👥',
  Core: 'ℹ️',
  Economy: '💰',
  Fun: '🎮',
  Giveaway: '🎉',
  JoinToCreate: '🔌',
  Leveling: '📊',
  Logging: '📝',
  Moderation: '🛡️',
  Music: '🎵',
  Reaction_roles: '🎭',
  Search: '🔍',
  ServerStats: '📈',
  Ticket: '🎫',
  Tools: '🛠️',
  Utility: '🔧',
  Verification: '✅',
  Welcome: '👋',
});

/** Commands that always stay available so admins can recover access. */
export const PROTECTED_COMMANDS = new Set(['commands', 'configwizard', 'automoderation']);

/** Categories that require elevated permissions regardless of feature toggle. */
export const RESTRICTED_CATEGORIES = new Set([
  'Moderation',
  'AutoModeration',
  'Logging',
  'Verification',
]);

/** Categories that can be disabled per-guild via feature toggles. */
export const GUILD_CONFIGURABLE_CATEGORIES = new Set([
  'Birthday',
  'Economy',
  'Fun',
  'Giveaway',
  'JoinToCreate',
  'Leveling',
  'Music',
  'Reaction_roles',
  'ServerStats',
  'Ticket',
  'Welcome',
]);

// ─── Key Normalization ────────────────────────────────────────────────────────

/**
 * Normalize a category string to a consistent key format.
 * @param {string} category
 * @returns {string}
 */
export function normalizeCategoryKey(category) {
  return String(category ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/-/g, '_');
}

// ─── Display Formatting ───────────────────────────────────────────────────────

/**
 * Convert a category key to human-readable display name.
 * @param {string} rawCategory
 * @returns {string}
 */
export function formatCategoryName(rawCategory) {
  return String(rawCategory ?? '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Get the icon for a category.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryIcon(category) {
  if (!category) return '📁';
  return CATEGORY_ICONS[category] || CATEGORY_ICONS[formatCategoryName(category)] || '📁';
}

// ─── Category Classification ───────────────────────────────────────────────────

/**
 * Check if a category requires elevated permissions (mod/admin).
 * @param {string} category
 * @returns {boolean}
 */
export function isRestrictedCategory(category) {
  const normalized = normalizeCategoryKey(category);
  return RESTRICTED_CATEGORIES.has(normalized) ||
    RESTRICTED_CATEGORIES.has(formatCategoryName(normalized));
}

/**
 * Check if a category can be toggled per-guild.
 * @param {string} category
 * @returns {boolean}
 */
export function isGuildConfigurable(category) {
  const normalized = normalizeCategoryKey(category);
  return GUILD_CONFIGURABLE_CATEGORIES.has(normalized) ||
    GUILD_CONFIGURABLE_CATEGORIES.has(formatCategoryName(normalized));
}

/**
 * Check if a category is protected from disablement.
 * @param {string} category
 * @returns {boolean}
 */
export function isProtectedCategory(category) {
  return !isGuildConfigurable(category) && !isRestrictedCategory(category);
}

// ─── Command Protection ───────────────────────────────────────────────────────

/**
 * Check if a command is protected from disablement.
 * @param {string} commandName
 * @returns {boolean}
 */
export function isProtectedCommand(commandName) {
  if (!commandName) return false;
  return PROTECTED_COMMANDS.has(commandName.toLowerCase());
}

/**
 * Add a command to the protected set.
 * @param {string} commandName
 */
export function protectCommand(commandName) {
  PROTECTED_COMMANDS.add(commandName.toLowerCase());
}

/**
 * Remove a command from the protected set.
 * @param {string} commandName
 */
export function unprotectCommand(commandName) {
  PROTECTED_COMMANDS.delete(commandName.toLowerCase());
}

// ─── Auto-Moderation Specific ─────────────────────────────────────────────────

/**
 * Get auto-moderation rule categories mapped to their command category.
 * @returns {Record<string, string>}
 */
export const AUTOMOD_RULE_CATEGORIES = Object.freeze({
  antiSpam: 'AutoModeration',
  antiRaid: 'AutoModeration',
  antiCaps: 'AutoModeration',
  antiInvite: 'AutoModeration',
  antiLink: 'AutoModeration',
  mentionSpam: 'AutoModeration',
  antiNsfw: 'AutoModeration',
  antiZalgo: 'AutoModeration',
});

/**
 * Check if a rule ID belongs to auto-moderation.
 * @param {string} ruleId
 * @returns {boolean}
 */
export function isAutomodRule(ruleId) {
  if (!ruleId) return false;
  return ruleId in AUTOMOD_RULE_CATEGORIES;
}

/**
 * Get the category for an auto-moderation rule.
 * @param {string} ruleId
 * @returns {string|null}
 */
export function getAutomodRuleCategory(ruleId) {
  return AUTOMOD_RULE_CATEGORIES[ruleId] || null;
}

// ─── Feature Toggle Mapping ───────────────────────────────────────────────────

/**
 * Map a category to its feature toggle key in botConfig.features.
 * @param {string} category
 * @returns {string|null}
 */
export function getFeatureToggleKey(category) {
  const map = Object.freeze({
    birthday: 'birthday',
    economy: 'economy',
    fun: 'fun',
    giveaway: 'giveaways',
    jointocreate: 'joinToCreate',
    leveling: 'leveling',
    logging: 'logging',
    moderation: 'moderation',
    music: 'music',
    reaction_roles: 'reactionRoles',
    search: 'search',
    serverstats: 'counter',
    ticket: 'tickets',
    tools: 'tools',
    utility: 'utility',
    verification: 'verification',
    welcome: 'welcome',
    automoderation: 'autoModeration',
  });

  const normalized = normalizeCategoryKey(category);
  return map[normalized] || null;
}

// ─── Default Export ───────────────────────────────────────────────────────────

export default {
  CATEGORY_ICONS,
  PROTECTED_COMMANDS,
  RESTRICTED_CATEGORIES,
  GUILD_CONFIGURABLE_CATEGORIES,
  AUTOMOD_RULE_CATEGORIES,
  normalizeCategoryKey,
  formatCategoryName,
  getCategoryIcon,
  isRestrictedCategory,
  isGuildConfigurable,
  isProtectedCategory,
  isProtectedCommand,
  protectCommand,
  unprotectCommand,
  isAutomodRule,
  getAutomodRuleCategory,
  getFeatureToggleKey,
};
