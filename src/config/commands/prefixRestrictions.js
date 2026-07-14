/**
 * Prefix command restrictions — dashboard and advanced setup flows stay slash-only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Top-level commands that cannot be invoked via prefix at all. */
export const SLASH_ONLY_COMMANDS = new Set([
  'configwizard',
  'help',
  'embedbuilder',
  'wipedata',
  'apply',
  'automoderation', // Auto-moderation requires structured config, prefix too error-prone
]);

/** Subcommands blocked for every command when invoked via prefix. */
export const GLOBAL_BLOCKED_SUBCOMMANDS = new Set([
  'dashboard',
  'setup',
  'configure',      // Auto-moderation config wizard
  'wizard',         // Any config wizard flow
]);

/** Subcommand groups blocked for every command when invoked via prefix. */
export const GLOBAL_BLOCKED_SUBCOMMAND_GROUPS = new Set([
  'config',
  'settings',       // Auto-moderation settings group
  'rules',          // Auto-moderation rules group
]);

/** Per-command subcommands that stay slash-only (beyond the global block list). */
export const COMMAND_BLOCKED_SUBCOMMANDS = {
  music: new Set([
    'shuffle',
    'loop',
    'seek',
    'remove',
    'move',
    'clear',
    '247',
  ]),
  birthday: new Set(['setchannel']),
  report: new Set(['setchannel']),
  automoderation: new Set([
    'enable',
    'disable',
    'configure',
    'threshold',
    'action',
    'whitelist',
    'blacklist',
    'exempt',
    'logs',
  ]),
};

/** Commands where prefix invocations are silently ignored (no error message). */
export const SILENTLY_BLOCKED_COMMANDS = new Set([
  'automoderation',
]);

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Collect all subcommand names from a command's JSON data.
 * @param {object} commandJson
 * @returns {string[]}
 */
function collectSubcommandNames(commandJson) {
  const subcommandGroup = commandJson.options?.find((opt) => opt.type === 2);

  if (subcommandGroup) {
    const names = [];
    for (const group of subcommandGroup.options || []) {
      names.push(...(group.options?.map((opt) => opt.name) || []));
    }
    return names;
  }

  return (commandJson.options?.filter((opt) => opt.type === 1) || []).map((sub) => sub.name);
}

/**
 * Check if a specific subcommand is blocked for a command.
 * @param {string} commandName
 * @param {string} subcommandName
 * @returns {boolean}
 */
function isSubcommandBlocked(commandName, subcommandName) {
  if (!subcommandName) {
    return false;
  }

  if (GLOBAL_BLOCKED_SUBCOMMANDS.has(subcommandName)) {
    return true;
  }

  const commandBlocked = COMMAND_BLOCKED_SUBCOMMANDS[commandName];
  return commandBlocked?.has(subcommandName) ?? false;
}

/**
 * Check if a subcommand group is globally blocked.
 * @param {string} groupName
 * @returns {boolean}
 */
function isSubcommandGroupBlocked(groupName) {
  if (!groupName) return false;
  return GLOBAL_BLOCKED_SUBCOMMAND_GROUPS.has(groupName);
}

// ─── Main Export ──────────────────────────────────────────────────────────────

/**
 * Returns whether a prefix invocation should be rejected.
 * @param {object} command - Loaded command module
 * @param {string[]} args - Parsed prefix arguments (after command name)
 * @param {(name: string) => string} resolveSubcommandAlias
 * @returns {{ blocked: boolean, reason?: string, silent?: boolean }}
 */
export function getPrefixRestriction(command, args, resolveSubcommandAlias) {
  if (!command?.data?.toJSON) {
    return { blocked: false };
  }

  const commandJson = command.data.toJSON();
  const commandName = commandJson.name?.toLowerCase();

  // Command-level flags
  if (command.prefixOnly === false || command.slashOnly === true) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
    };
  }

  // Global slash-only list
  if (SLASH_ONLY_COMMANDS.has(commandName)) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
    };
  }

  // Parse arguments
  const [firstArg, secondArg] = args.map((arg) => arg?.toLowerCase?.() || null);
  const resolvedFirstArg = firstArg ? resolveSubcommandAlias(firstArg) : null;
  const resolvedSecondArg = secondArg ? resolveSubcommandAlias(secondArg) : null;

  const subcommandGroup = commandJson.options?.find((opt) => opt.type === 2);

  // Check if all subcommands are blocked (command effectively slash-only)
  const allSubcommandNames = collectSubcommandNames(commandJson);
  const allSubcommandsBlocked =
    allSubcommandNames.length > 0 &&
    allSubcommandNames.every((name) => isSubcommandBlocked(commandName, name));

  if (allSubcommandsBlocked) {
    return {
      blocked: true,
      reason: 'This command is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
    };
  }

  // Blocked subcommand group (first arg)
  if (firstArg && isSubcommandGroupBlocked(firstArg)) {
    return {
      blocked: true,
      reason: 'This configuration flow is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
    };
  }

  // Blocked subcommand (first arg)
  if (resolvedFirstArg && isSubcommandBlocked(commandName, resolvedFirstArg)) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
    };
  }

  // Blocked subcommand within group (second arg)
  if (subcommandGroup && resolvedSecondArg && isSubcommandBlocked(commandName, resolvedSecondArg)) {
    return {
      blocked: true,
      reason: 'This subcommand is only available as a slash command.',
      silent: SILENTLY_BLOCKED_COMMANDS.has(commandName),
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

// ─── Auto-Moderation Specific ─────────────────────────────────────────────────

/**
 * Check if an auto-moderation subcommand is allowed via prefix.
 * @param {string} subcommandName
 * @returns {boolean}
 */
export function isAutomodPrefixAllowed(subcommandName) {
  if (!subcommandName) return false;
  const resolved = subcommandName.toLowerCase();
  return !isSubcommandBlocked('automoderation', resolved);
}

/**
 * Get allowed prefix subcommands for auto-moderation.
 * @returns {string[]}
 */
export function getAutomodPrefixAllowedSubcommands() {
  const allBlocked = COMMAND_BLOCKED_SUBCOMMANDS.automoderation || new Set();
  // These would be the "safe" read-only subcommands if any existed
  return [];
}

// ─── Default Export ───────────────────────────────────────────────────────────

export default {
  SLASH_ONLY_COMMANDS,
  GLOBAL_BLOCKED_SUBCOMMANDS,
  GLOBAL_BLOCKED_SUBCOMMAND_GROUPS,
  COMMAND_BLOCKED_SUBCOMMANDS,
  SILENTLY_BLOCKED_COMMANDS,
  getPrefixRestriction,
  isPrefixRestrictedCommand,
  isSilentPrefixRestriction,
  isAutomodPrefixAllowed,
  getAutomodPrefixAllowedSubcommands,
};
