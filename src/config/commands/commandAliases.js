/**
 * Command Aliases Configuration
 * Maps shortened command names to their full command names
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_ALIAS_LENGTH = 32;

// ─── Command Aliases ──────────────────────────────────────────────────────────

export const commandAliases = {
  // ─── Economy ────────────────────────────────────────────────────────────────
  bal: 'balance',
  money: 'balance',
  cash: 'balance',
  dep: 'deposit',
  with: 'withdraw',
  work: 'work',
  daily: 'daily',
  gamble: 'gamble',
  bet: 'gamble',
  rob: 'rob',
  crime: 'crime',
  pay: 'pay',
  give: 'pay',
  send: 'pay',

  // ─── Core ───────────────────────────────────────────────────────────────────
  ping: 'ping',
  help: 'help',
  h: 'help',
  info: 'help',
  about: 'help',

  // ─── Moderation ─────────────────────────────────────────────────────────────
  ban: 'ban',
  kick: 'kick',
  mute: 'timeout',
  warn: 'warn',
  clear: 'purge',
  purge: 'purge',
  untimeout: 'untimeout',
  unmute: 'untimeout',

  // ─── Auto-Moderation ────────────────────────────────────────────────────────
  automod: 'automoderation',
  am: 'automoderation',
  automodconfig: 'automoderation',
  amconfig: 'automoderation',
  antispam: 'automoderation',
  antiraid: 'automoderation',
  caps: 'automoderation',
  invites: 'automoderation',
  links: 'automoderation',
  mentions: 'automoderation',
  'anti-spam': 'automoderation',
  'anti-raid': 'automoderation',
  'auto-mod': 'automoderation',

  // ─── Leveling ───────────────────────────────────────────────────────────────
  rank: 'rank',
  lvl: 'rank',
  xp: 'rank',
  leaderboard: 'leaderboard',
  lb: 'leaderboard',
  top: 'leaderboard',

  // ─── Shop ───────────────────────────────────────────────────────────────────
  shop: 'shop',
  buy: 'buy',
  inventory: 'inventory',
  inv: 'inventory',
  items: 'inventory',

  // ─── Utility ────────────────────────────────────────────────────────────────
  user: 'userinfo',
  avatar: 'avatar',
  pfp: 'avatar',
  icon: 'avatar',

  // ─── Birthday ───────────────────────────────────────────────────────────────
  bd: 'birthday',
  bday: 'birthday',
  b: 'birthday',

  // ─── Fun ────────────────────────────────────────────────────────────────────
  flip: 'flip',
  coin: 'flip',
  roll: 'roll',
  dice: 'roll',
  fight: 'fight',

  // ─── Giveaway ───────────────────────────────────────────────────────────────
  gcreate: 'gcreate',
  gstart: 'gcreate',
  gend: 'gend',
  gstop: 'gend',
  gdelete: 'gdelete',
  greroll: 'greroll',
  groll: 'greroll',

  // ─── Ticket ─────────────────────────────────────────────────────────────────
  ticket: 'ticket',
  t: 'ticket',
  new: 'ticket',

  // ─── Verification ───────────────────────────────────────────────────────────
  ver: 'verify',
  vadmin: 'verification',
  av: 'autoverify',

  // ─── Welcome ──────────────────────────────────────────────────────────────────
  welcome: 'welcome',
  greet: 'greet',
  goodbye: 'goodbye',
  autorole: 'autorole',

  // ─── Tools ──────────────────────────────────────────────────────────────────
  calc: 'calculate',
  math: 'calculate',
  weather: 'weather',
  todo: 'todo',
  report: 'report',
  userinfo: 'userinfo',
  whois: 'userinfo',
  ui: 'userinfo',

  // ─── Server Stats ───────────────────────────────────────────────────────────
  serverstats: 'serverstats',
  ss: 'serverstats',
  sstats: 'serverstats',

  // ─── Reaction Roles ─────────────────────────────────────────────────────────
  rr: 'reactroles',
  reactionroles: 'reactroles',

  // ─── Join To Create ─────────────────────────────────────────────────────────
  jtc: 'jointocreate',
  jointocreate: 'jointocreate',

  // ─── Music ────────────────────────────────────────────────────────────────────
  np: 'nowplaying',
  now: 'nowplaying',
  play: 'play',
  p: 'play',
  skip: 'skip',
  s: 'skip',
  queue: 'queue',
  q: 'queue',
  pause: 'pause',
  resume: 'resume',
  r: 'resume',
  stop: 'stop',
  disconnect: 'disconnect',
  dc: 'disconnect',
  volume: 'volume',
  vol: 'volume',
  loop: 'loop',
  shuffle: 'shuffle',
  lyrics: 'lyrics',
  search: 'search',
};

// ─── Subcommand Aliases ─────────────────────────────────────────────────────

export const subcommandAliases = {
  // ─── Generic ────────────────────────────────────────────────────────────────
  l: 'list',
  ls: 'list',
  s: 'set',
  i: 'info',
  r: 'remove',
  rm: 'remove',
  del: 'remove',
  n: 'next',
  sc: 'setchannel',

  // ─── Todo ───────────────────────────────────────────────────────────────────
  a: 'add',
  c: 'complete',
  done: 'complete',
  d: 'complete',

  // ─── Giveaway ───────────────────────────────────────────────────────────────
  start: 'create',
  stop: 'end',
  roll: 'reroll',

  // ─── Reaction Roles ─────────────────────────────────────────────────────────
  add: 'add',
  remove: 'remove',
  list: 'list',

  // ─── Auto-Moderation ────────────────────────────────────────────────────────
  enable: 'enable',
  disable: 'disable',
  config: 'configure',
  cfg: 'configure',
  settings: 'configure',
  logs: 'logs',
  whitelist: 'whitelist',
  wl: 'whitelist',
  blacklist: 'blacklist',
  bl: 'blacklist',
  threshold: 'threshold',
  limit: 'threshold',
  action: 'action',
  punish: 'action',
  exempt: 'exempt',
  ignore: 'exempt',
};

// ─── Auto-Moderation Rule Aliases ─────────────────────────────────────────────

export const automodRuleAliases = {
  // Spam detection
  spam: 'antiSpam',
  'anti-spam': 'antiSpam',
  flood: 'antiSpam',
  repetition: 'antiSpam',

  // Raid protection
  raid: 'antiRaid',
  'anti-raid': 'antiRaid',
  'mass-join': 'antiRaid',
  joinstorm: 'antiRaid',

  // Caps lock
  caps: 'antiCaps',
  'all-caps': 'antiCaps',
  uppercase: 'antiCaps',
  'caps-lock': 'antiCaps',

  // Invite links
  invites: 'antiInvite',
  'discord-invites': 'antiInvite',
  'server-ads': 'antiInvite',
  'guild-invites': 'antiInvite',

  // External links
  links: 'antiLink',
  urls: 'antiLink',
  'external-links': 'antiLink',
  phishing: 'antiLink',

  // Mentions
  mentions: 'mentionSpam',
  'mass-mentions': 'mentionSpam',
  'everyone-spam': 'mentionSpam',
  'here-spam': 'mentionSpam',

  // NSFW / inappropriate
  nsfw: 'antiNsfw',
  inappropriate: 'antiNsfw',
  lewd: 'antiNsfw',

  // Zalgo / unicode abuse
  zalgo: 'antiZalgo',
  unicode: 'antiZalgo',
  'special-chars': 'antiZalgo',
  diacritics: 'antiZalgo',
};

// ─── Auto-Moderation Action Aliases ─────────────────────────────────────────

export const automodActionAliases = {
  none: 'none',
  off: 'none',
  disable: 'none',

  log: 'logOnly',
  'log-only': 'logOnly',
  record: 'logOnly',

  warn: 'warnUser',
  'warn-user': 'warnUser',
  alert: 'warnUser',

  delete: 'deleteMessage',
  'delete-msg': 'deleteMessage',
  remove: 'deleteMessage',

  'warn-delete': 'warnAndDelete',
  'delete-warn': 'warnAndDelete',

  mute: 'timeoutUser',
  'timeout-user': 'timeoutUser',
  'temp-mute': 'timeoutUser',

  kick: 'kickUser',
  'kick-user': 'kickUser',
  remove: 'kickUser',

  ban: 'banUser',
  'ban-user': 'banUser',
};

// ─── Resolve Functions ───────────────────────────────────────────────────────

/**
 * Resolve a command alias to its full command name
 * @param {string} commandName - The command name (could be an alias)
 * @returns {string} - The full command name, or the original if not an alias
 */
export function resolveCommandAlias(commandName) {
  if (!commandName || typeof commandName !== 'string') {
    return commandName;
  }
  const normalized = commandName.trim().toLowerCase().substring(0, MAX_ALIAS_LENGTH);
  return commandAliases[normalized] || normalized;
}

/**
 * Resolve a subcommand alias to its full subcommand name
 * @param {string} subcommandName - The subcommand name (could be an alias)
 * @returns {string} - The full subcommand name, or the original if not an alias
 */
export function resolveSubcommandAlias(subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') {
    return subcommandName;
  }
  const normalized = subcommandName.trim().toLowerCase().substring(0, MAX_ALIAS_LENGTH);
  return subcommandAliases[normalized] || normalized;
}

/**
 * Resolve an auto-moderation rule alias
 * @param {string} ruleName
 * @returns {string}
 */
export function resolveAutomodRule(ruleName) {
  if (!ruleName || typeof ruleName !== 'string') {
    return ruleName;
  }
  const normalized = ruleName.trim().toLowerCase();
  return automodRuleAliases[normalized] || normalized;
}

/**
 * Resolve an auto-moderation action alias
 * @param {string} actionName
 * @returns {string}
 */
export function resolveAutomodAction(actionName) {
  if (!actionName || typeof actionName !== 'string') {
    return actionName;
  }
  const normalized = actionName.trim().toLowerCase();
  return automodActionAliases[normalized] || normalized;
}

// ─── Introspection ───────────────────────────────────────────────────────────

/**
 * Check if a command name is a known alias
 * @param {string} commandName
 * @returns {boolean}
 */
export function isCommandAlias(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return commandName.trim().toLowerCase() in commandAliases;
}

/**
 * Check if a subcommand name is a known alias
 * @param {string} subcommandName
 * @returns {boolean}
 */
export function isSubcommandAlias(subcommandName) {
  if (!subcommandName || typeof subcommandName !== 'string') return false;
  return subcommandName.trim().toLowerCase() in subcommandAliases;
}

/**
 * Check if an auto-moderation rule name is a known alias
 * @param {string} ruleName
 * @returns {boolean}
 */
export function isAutomodRuleAlias(ruleName) {
  if (!ruleName || typeof ruleName !== 'string') return false;
  return ruleName.trim().toLowerCase() in automodRuleAliases;
}

/**
 * Get all aliases for a given command name
 * @param {string} fullCommandName
 * @returns {string[]} - Array of aliases (empty if none)
 */
export function getAliasesForCommand(fullCommandName) {
  const target = fullCommandName.toLowerCase();
  return Object.entries(commandAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all aliases for a given auto-moderation rule
 * @param {string} fullRuleName
 * @returns {string[]}
 */
export function getAliasesForAutomodRule(fullRuleName) {
  const target = fullRuleName.toLowerCase();
  return Object.entries(automodRuleAliases)
    .filter(([, full]) => full === target)
    .map(([alias]) => alias);
}

/**
 * Get all available auto-moderation rules
 * @returns {string[]}
 */
export function getAvailableAutomodRules() {
  return [...new Set(Object.values(automodRuleAliases))];
}

/**
 * Get all available auto-moderation actions
 * @returns {string[]}
 */
export function getAvailableAutomodActions() {
  return [...new Set(Object.values(automodActionAliases))];
}

// ─── Default Export ─────────────────────────────────────────────────────────

export default {
  commandAliases,
  subcommandAliases,
  automodRuleAliases,
  automodActionAliases,
  resolveCommandAlias,
  resolveSubcommandAlias,
  resolveAutomodRule,
  resolveAutomodAction,
  isCommandAlias,
  isSubcommandAlias,
  isAutomodRuleAlias,
  getAliasesForCommand,
  getAliasesForAutomodRule,
  getAvailableAutomodRules,
  getAvailableAutomodActions,
};
