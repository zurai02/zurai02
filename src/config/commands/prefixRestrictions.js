/**
 * Prefix Command Restrictions
 * Dashboard and advanced setup flows stay slash-only.
 * Ultra-organized • Synced with 300+ alias system • Production-ready
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** Top-level commands that cannot be invoked via prefix at all. */
export const SLASH_ONLY_COMMANDS = Object.freeze(
  new Set([
    'configwizard',
    'help',
    'embedbuilder',
    'wipedata',
    'apply',
    'automoderation',      // Structured config, prefix too error-prone
    'verification',        // Sensitive security flow
    'welcome',             // Complex embed configuration
    'goodbye',             // Complex embed configuration
    'ticketsetup',         // Channel/category setup wizard
    'suggestsetup',        // Channel setup wizard
    'starsetup',           // Channel setup wizard
    'countsetup',          // Channel setup wizard
    'jtcsetup',            // Voice category setup wizard
    'rrsetup',             // Complex reaction role configuration
    'logsetup',            // Webhook/channel configuration
    'serverstats',         // Channel creation wizard
    'automodconfig',       // Legacy alias, ensure blocked
    'amconfig',            // Legacy alias, ensure blocked
  ])
);

/** Subcommands blocked for EVERY command when invoked via prefix. */
export const GLOBAL_BLOCKED_SUBCOMMANDS = Object.freeze(
  new Set([
    'dashboard',
    'setup',
    'configure',
    'wizard',
    'config',
    'settings',
    'init',
    'import',
    'export',
    'backup',
    'restore',
    'resetall',
    'massban',
    'masskick',
    'massmute',
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
    'whitelist',
  ])
);

/** Subcommand groups blocked for EVERY command when invoked via prefix. */
export const GLOBAL_BLOCKED_SUBCOMMAND_GROUPS = Object.freeze(
  new Set([
    'config',
    'settings',
    'rules',
    'admin',
    'owner',
    'dev',
    'debug',
    'system',
    'danger',
    'bulk',
    'mass',
    'global',
  ])
);

/** Per-command subcommands that stay slash-only (beyond the global block list). */
export const COMMAND_BLOCKED_SUBCOMMANDS = Object.freeze({
  // ─── Music ──────────────────────────────────────────────────────────────────
  music: Object.freeze(new Set([
    'shuffle',
    'loop',
    'seek',
    'remove',
    'move',
    'clear',
    '247',
    'savequeue',
    'loadqueue',
    'playlist',
    'autoplay',
    'radio',
    'bassboost',
    'nightcore',
    'vaporwave',
    'speed',
    'pitch',
    'filter',
    'eq',
    'equalizer',
    'karaoke',
    'tremolo',
    'vibrato',
    'earrape',
    'superslow',
    'superspeed',
    'reverse',
    '8d',
    '3d',
  ])),

  // ─── Birthday ─────────────────────────────────────────────────────────────────
  birthday: Object.freeze(new Set([
    'setchannel',
    'setmessage',
    'setimage',
    'setcolor',
    'setdm',
    'reset',
  ])),

  // ─── Report ─────────────────────────────────────────────────────────────────
  report: Object.freeze(new Set([
    'setchannel',
    'setup',
    'config',
  ])),

  // ─── Auto-Moderation ────────────────────────────────────────────────────────
  automoderation: Object.freeze(new Set([
    'enable',
    'disable',
    'configure',
    'threshold',
    'action',
    'whitelist',
    'blacklist',
    'exempt',
    'logs',
    'config',
    'settings',
    'setup',
    'init',
    'import',
    'export',
    'reset',
    'notify',
    'dm',
    'message',
    'custommsg',
    'duration',
    'time',
    'cooldown',
    'cd',
    'exemptrole',
    'exemptchannel',
  ])),

  // ─── Verification ───────────────────────────────────────────────────────────
  verification: Object.freeze(new Set([
    'setup',
    'config',
    'setchannel',
    'setrole',
    'setmessage',
    'setimage',
    'setcolor',
    'setdm',
    'reset',
    'test',
    'preview',
  ])),

  // ─── Welcome ──────────────────────────────────────────────────────────────────
  welcome: Object.freeze(new Set([
    'setchannel',
    'setmessage',
    'setimage',
    'setcolor',
    'setfooter',
    'setdm',
    'reset',
    'test',
    'preview',
  ])),

  // ─── Goodbye ──────────────────────────────────────────────────────────────────
  goodbye: Object.freeze(new Set([
    'setchannel',
    'setmessage',
    'setimage',
    'setcolor',
    'setfooter',
    'setdm',
    'reset',
    'test',
    'preview',
  ])),

  // ─── Leveling ───────────────────────────────────────────────────────────────
  leveling: Object.freeze(new Set([
    'setchannel',
    'setmessage',
    'setimage',
    'setcolor',
    'setbg',
    'resetuser',
    'resetall',
    'import',
    'export',
    'doublexp',
    'weekendxp',
    'noxprole',
  ])),

  // ─── Giveaway ─────────────────────────────────────────────────────────────────
  giveaway: Object.freeze(new Set([
    'create',
    'start',
    'edit',
    'delete',
    'requirements',
    'prize',
    'winners',
  ])),

  // ─── Ticket ─────────────────────────────────────────────────────────────────
  ticket: Object.freeze(new Set([
    'setup',
    'config',
    'panel',
    'button',
    'modal',
    'category',
    'archive',
    'transcript',
  ])),

  // ─── Reaction Roles ───────────────────────────────────────────────────────────
  reactroles: Object.freeze(new Set([
    'setup',
    'config',
    'panel',
    'type',
    'style',
    'unique',
    'max',
    'min',
    'clear',
  ])),

  // ─── Join To Create ─────────────────────────────────────────────────────────
  jointocreate: Object.freeze(new Set([
    'setup',
    'config',
    'category',
    'bitrate',
    'region',
    'defaultlimit',
    'defaultname',
  ])),

  // ─── Economy ──────────────────────────────────────────────────────────────────
  economy: Object.freeze(new Set([
    'admin',
    'config',
    'setmultiplier',
    'resetall',
    'wipe',
    'prestige',
    'rebirth',
  ])),

  // ─── Suggestions ────────────────────────────────────────────────────────────
  suggestions: Object.freeze(new Set([
    'setup',
    'config',
    'setchannel',
    'approve',
    'deny',
    'consider',
    'implement',
  ])),

  // ─── Starboard ──────────────────────────────────────────────────────────────
  starboard: Object.freeze(new Set([
    'setup',
    'config',
    'setchannel',
    'setemoji',
    'setthreshold',
    'reset',
  ])),

  // ─── Counting ─────────────────────────────────────────────────────────────────
  counting: Object.freeze(new Set([
    'setup',
    'config',
    'setchannel',
    'setgoal',
    'reset',
  ])),

  // ─── Server Stats ───────────────────────────────────────────────────────────
  serverstats: Object.freeze(new Set([
    'setup',
    'config',
    'create',
    'delete',
    'refresh',
  ])),

  // ─── Logging ──────────────────────────────────────────────────────────────────
  logging: Object.freeze(new Set([
    'setup',
    'config',
    'setchannel',
    'setwebhook',
    'events',
    'toggle',
  ])),

  // ─── Custom Commands / Tags ───────────────────────────────────────────────────
  customcommand: Object.freeze(new Set([
    'add',
    'edit',
    'delete',
    'import',
    'export',
    'reset',
  ])),

  // ─── Reminders ──────────────────────────────────────────────────────────────
  reminders: Object.freeze(new Set([
    'admin',
    'config',
    'clearall',
    'wipe',
  ])),

  // ─── Moderation ───────────────────────────────────────────────────────────────
  moderation: Object.freeze(new Set([
    'history',
    'modstats',
    'duration',
    'extend',
    'reduce',
    'reason',
    'edit',
    'appeal',
    'revoke',
    'softban',
    'tempban',
    'massban',
    'masskick',
    'massmute',
    'voicemute',
    'voicekick',
    'move',
    'drag',
    'deafen',
    'undeafen',
    'disconnect',
  ])),
});

/** Commands where prefix invocations are silently ignored (no error message). */
export const SILENTLY_BLOCKED_COMMANDS = Object.freeze(
  new Set([
    'automoderation',
    'automodconfig',
    'amconfig',
    'verification',
    'configwizard',
    'wipedata',
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
  ])
);

/** Commands where prefix invocations show a "use slash instead" hint. */
export const HINT_BLOCKED_COMMANDS = Object.freeze(
  new Set([
    'help',
    'embedbuilder',
    'apply',
    'welcome',
    'goodbye',
    'ticketsetup',
    'suggestsetup',
    'starsetup',
    'countsetup',
    'jtcsetup',
    'rrsetup',
    'logsetup',
    'serverstats',
  ])
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Restriction Result Types ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} RestrictionResult
 * @property {boolean} blocked - Whether the invocation is blocked
 * @property {string} [reason] - Human-readable reason for blocking
 * @property {boolean} [silent] - Whether to suppress error messages
 * @property {string} [hint] - Optional hint to show user
 * @property {string} [suggestedCommand] - Suggested slash command to use instead
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Internal Helpers ─────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Collect all subcommand names from a command's JSON data.
 * @param {object} commandJson
 * @returns {string[]}
 */
function collectSubcommandNames(commandJson) {
  if (!commandJson?.options) return [];

  const subcommandGroup = commandJson.options.find((opt) => opt.type === 2);

  if (subcommandGroup) {
    const names = [];
    for (const group of subcommandGroup.options || []) {
      names.push(...(group.options?.map((opt) => opt.name) || []));
    }
    return names;
  }

  return commandJson.options
    .filter((opt) => opt.type === 1)
    .map((sub) => sub.name);
}

/**
 * Check if a specific subcommand is blocked for a command.
 * @param {string} commandName
 * @param {string} subcommandName
 * @returns {boolean}
 */
function isSubcommandBlocked(commandName, subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') {
    return false;
  }

  const normalized = subcommandName.toLowerCase().trim();

  // Global block list always wins
  if (GLOBAL_BLOCKED_SUBCOMMANDS.has(normalized)) {
    return true;
  }

  // Per-command block list
  const commandBlocked = COMMAND_BLOCKED_SUBCOMMANDS[commandName?.toLowerCase()];
  return commandBlocked?.has(normalized) ?? false;
}

/**
 * Check if a subcommand group is globally blocked.
 * @param {string} groupName
 * @returns {boolean}
 */
function isSubcommandGroupBlocked(groupName) {
  if (!groupName || typeof groupName !== 'string') return false;
  return GLOBAL_BLOCKED_SUBCOMMAND_GROUPS.has(groupName.toLowerCase().trim());
}

/**
 * Check if a command has module-level prefix restrictions.
 * @param {object} command
 * @returns {boolean}
 */
function hasModuleLevelRestriction(command) {
  return command?.prefixOnly === false || command?.slashOnly === true;
}

/**
 * Build a suggested slash command string.
 * @param {string} commandName
 * @param {string} [subcommandName]
 * @param {string} [subcommandGroup]
 * @returns {string}
 */
function buildSuggestedCommand(commandName, subcommandName, subcommandGroup) {
  if (!commandName) return '';
  let result = `/${commandName}`;
  if (subcommandGroup) result += ` ${subcommandGroup}`;
  if (subcommandName) result += ` ${subcommandName}`;
  return result;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main Export: Prefix Restriction Engine ───────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns whether a prefix invocation should be rejected.
 * @param {object} command - Loaded command module
 * @param {string[]} args - Parsed prefix arguments (after command name)
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {RestrictionResult}
 */
export function getPrefixRestriction(command, args, resolveSubcommandAlias) {
  // ─── Validation ───────────────────────────────────────────────────────────
  if (!command?.data?.toJSON) {
    return { blocked: false };
  }

  const commandJson = command.data.toJSON();
  const commandName = commandJson.name?.toLowerCase();

  if (!commandName) {
    return { blocked: false };
  }

  // ─── Module-level flags ───────────────────────────────────────────────────
  if (hasModuleLevelRestriction(command)) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      hint: HINT_BLOCKED_COMMANDS.has(commandName)
        ? 'Use the slash command version for the best experience.'
        : undefined,
      suggestedCommand: buildSuggestedCommand(commandName),
    };
  }

  // ─── Global slash-only list ─────────────────────────────────────────────────
  if (SLASH_ONLY_COMMANDS.has(commandName)) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      hint: HINT_BLOCKED_COMMANDS.has(commandName)
        ? 'Use the slash command version for the best experience.'
        : undefined,
      suggestedCommand: buildSuggestedCommand(commandName),
    };
  }

  // ─── Parse arguments ────────────────────────────────────────────────────────
  const [firstArg, secondArg] = (args || []).map((arg) =>
    arg?.toLowerCase?.() || null
  );
  const resolvedFirstArg = firstArg ? resolveSubcommandAlias(firstArg) : null;
  const resolvedSecondArg = secondArg ? resolveSubcommandAlias(secondArg) : null;

  const subcommandGroup = commandJson.options?.find((opt) => opt.type === 2);

  // ─── All subcommands blocked check ──────────────────────────────────────────
  const allSubcommandNames = collectSubcommandNames(commandJson);
  const allSubcommandsBlocked =
    allSubcommandNames.length > 0 &&
    allSubcommandNames.every((name) => isSubcommandBlocked(commandName, name));

  if (allSubcommandsBlocked) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      hint: HINT_BLOCKED_COMMANDS.has(commandName)
        ? 'Use the slash command version for the best experience.'
        : undefined,
      suggestedCommand: buildSuggestedCommand(commandName),
    };
  }

  // ─── Blocked subcommand group (first arg) ───────────────────────────────────
  if (firstArg && isSubcommandGroupBlocked(firstArg)) {
    return {
      blocked: true,
      reason: 'This configuration flow is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      suggestedCommand: buildSuggestedCommand(commandName, null, firstArg),
    };
  }

  // ─── Blocked subcommand (first arg) ─────────────────────────────────────────
  if (resolvedFirstArg && isSubcommandBlocked(commandName, resolvedFirstArg)) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      suggestedCommand: buildSuggestedCommand(commandName, resolvedFirstArg),
    };
  }

  // ─── Blocked subcommand within group (second arg) ───────────────────────────
  if (subcommandGroup && resolvedSecondArg && isSubcommandBlocked(commandName, resolvedSecondArg)) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
      suggestedCommand: buildSuggestedCommand(commandName, resolvedSecondArg, firstArg),
    };
  }

  return { blocked: false };
}

/**
 * Simple boolean check for prefix restriction.
 * @param {object} command
 * @param {string[]} args
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {boolean}
 */
export function isPrefixRestrictedCommand(command, args, resolveSubcommandAlias) {
  return getPrefixRestriction(command, args, resolveSubcommandAlias).blocked;
}

/**
 * Check if a prefix restriction should be silent (no error message to user).
 * @param {object} command
 * @param {string[]} args
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {boolean}
 */
export function isSilentPrefixRestriction(command, args, resolveSubcommandAlias) {
  return getPrefixRestriction(command, args, resolveSubcommandAlias).silent ?? false;
}

/**
 * Get the full restriction result for a prefix invocation.
 * @param {object} command
 * @param {string[]} args
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {RestrictionResult}
 */
export function getPrefixRestrictionDetails(command, args, resolveSubcommandAlias) {
  return getPrefixRestriction(command, args, resolveSubcommandAlias);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Bulk / Introspection Utilities ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get all slash-only commands.
 * @returns {string[]}
 */
export function getSlashOnlyCommands() {
  return [...SLASH_ONLY_COMMANDS];
}

/**
 * Get all silently blocked commands.
 * @returns {string[]}
 */
export function getSilentBlockedCommands() {
  return [...SILENTLY_BLOCKED_COMMANDS];
}

/**
 * Get all commands that show a hint instead of error.
 * @returns {string[]}
 */
export function getHintBlockedCommands() {
  return [...HINT_BLOCKED_COMMANDS];
}

/**
 * Get blocked subcommands for a specific command.
 * @param {string} commandName
 * @returns {string[]}
 */
export function getBlockedSubcommandsForCommand(commandName) {
  if (!commandName) return [];
  const normalized = commandName.toLowerCase();
  const blocked = COMMAND_BLOCKED_SUBCOMMANDS[normalized];
  return blocked ? [...blocked] : [];
}

/**
 * Check if a command has any blocked subcommands.
 * @param {string} commandName
 * @returns {boolean}
 */
export function hasBlockedSubcommands(commandName) {
  return getBlockedSubcommandsForCommand(commandName).length > 0;
}

/**
 * Get all commands that are effectively slash-only (all subcommands blocked).
 * @returns {string[]}
 */
export function getEffectivelySlashOnlyCommands() {
  return Object.keys(COMMAND_BLOCKED_SUBCOMMANDS).filter((cmd) => {
    const blocked = COMMAND_BLOCKED_SUBCOMMANDS[cmd];
    // A command is effectively slash-only if it has blocked subcommands
    // and no known safe subcommands (this is a heuristic)
    return blocked && blocked.size > 3; // Arbitrary threshold for "complex config command"
  });
}

/**
 * Get restriction statistics.
 * @returns {{
 *   slashOnlyCommands: number,
 *   globalBlockedSubcommands: number,
 *   globalBlockedGroups: number,
 *   perCommandBlocked: number,
 *   silentBlocked: number,
 *   hintBlocked: number,
 *   totalProtectedFlows: number
 * }}
 */
export function getRestrictionStats() {
  const perCommandBlocked = Object.values(COMMAND_BLOCKED_SUBCOMMANDS).reduce(
    (sum, set) => sum + set.size,
    0
  );

  return {
    slashOnlyCommands: SLASH_ONLY_COMMANDS.size,
    globalBlockedSubcommands: GLOBAL_BLOCKED_SUBCOMMANDS.size,
    globalBlockedGroups: GLOBAL_BLOCKED_SUBCOMMAND_GROUPS.size,
    perCommandBlocked,
    silentBlocked: SILENTLY_BLOCKED_COMMANDS.size,
    hintBlocked: HINT_BLOCKED_COMMANDS.size,
    totalProtectedFlows:
      SLASH_ONLY_COMMANDS.size +
      GLOBAL_BLOCKED_SUBCOMMANDS.size +
      GLOBAL_BLOCKED_SUBCOMMAND_GROUPS.size +
      perCommandBlocked,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Specific ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if an auto-moderation subcommand is allowed via prefix.
 * @param {string} subcommandName
 * @returns {boolean}
 */
export function isAutomodPrefixAllowed(subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') return false;
  const resolved = subcommandName.toLowerCase().trim();
  return !isSubcommandBlocked('automoderation', resolved);
}

/**
 * Get allowed prefix subcommands for auto-moderation.
 * @returns {string[]}
 */
export function getAutomodPrefixAllowedSubcommands() {
  const blocked = COMMAND_BLOCKED_SUBCOMMANDS.automoderation || new Set();
  // Safe read-only subcommands that could work via prefix
  const safeCommands = ['status', 'info', 'view', 'show', 'list', 'check'];
  return safeCommands.filter((cmd) => !blocked.has(cmd));
}

/**
 * Get blocked prefix subcommands for auto-moderation.
 * @returns {string[]}
 */
export function getAutomodPrefixBlockedSubcommands() {
  const blocked = COMMAND_BLOCKED_SUBCOMMANDS.automoderation;
  return blocked ? [...blocked] : [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Per-Category Restriction Helpers ─────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a category is restricted to slash-only.
 * @param {string} category
 * @returns {boolean}
 */
export function isCategorySlashOnly(category) {
  if (!category) return false;
  const restrictedCategories = Object.freeze(
    new Set([
      'Admin',
      'Owner',
      'AutoModeration',
      'Logging',
      'Verification',
    ])
  );
  return restrictedCategories.has(category);
}

/**
 * Get restriction severity level for a command.
 * @param {string} commandName
 * @returns {'none' | 'hint' | 'silent' | 'block'}
 */
export function getRestrictionSeverity(commandName) {
  if (!commandName) return 'none';
  const normalized = commandName.toLowerCase();

  if (SILENTLY_BLOCKED_COMMANDS.has(normalized)) return 'silent';
  if (HINT_BLOCKED_COMMANDS.has(normalized)) return 'hint';
  if (SLASH_ONLY_COMMANDS.has(normalized)) return 'block';

  return 'none';
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Default Export ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  SLASH_ONLY_COMMANDS,
  GLOBAL_BLOCKED_SUBCOMMANDS,
  GLOBAL_BLOCKED_SUBCOMMAND_GROUPS,
  COMMAND_BLOCKED_SUBCOMMANDS,
  SILENTLY_BLOCKED_COMMANDS,
  HINT_BLOCKED_COMMANDS,

  // Core engine
  getPrefixRestriction,
  isPrefixRestrictedCommand,
  isSilentPrefixRestriction,
  getPrefixRestrictionDetails,

  // Bulk / introspection
  getSlashOnlyCommands,
  getSilentBlockedCommands,
  getHintBlockedCommands,
  getBlockedSubcommandsForCommand,
  hasBlockedSubcommands,
  getEffectivelySlashOnlyCommands,
  getRestrictionStats,

  // Auto-mod specific
  isAutomodPrefixAllowed,
  getAutomodPrefixAllowedSubcommands,
  getAutomodPrefixBlockedSubcommands,

  // Category / severity
  isCategorySlashOnly,
  getRestrictionSeverity,
};
