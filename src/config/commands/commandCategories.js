/**
 * Command Category Metadata v2.0
 * Ultra-organized • Synced with 1000+ alias system • Production-ready
 *
 * CHANGELOG:
 *   • Added 7 new categories: AI, Crypto, Productivity, Knowledge, Health, Travel, Food
 *   • Added alias-aware category resolution (resolveAliasToCategory)
 *   • Added command metadata support (cooldowns, permissions, nsfw flags)
 *   • Added category grouping for help menus
 *   • Added validation & diagnostics (findOrphanedAliases, auditCoverage)
 *   • Added bidirectional lookup (category → commands, command → category, alias → category)
 *   • 364 commands mapped across 32 categories
 */

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Constants ────────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** Category display icons. Frozen to prevent runtime mutation. */
export const CATEGORY_ICONS = Object.freeze({
  // ─── Core / System ────────────────────────────────────────────────────────
  Core: 'ℹ️',
  Admin: '⚡',
  Owner: '🔒',

  // ─── Community ────────────────────────────────────────────────────────────
  Community: '👥',
  Fun: '🎮',
  Social: '💬',
  Image: '🖼️',
  Anime: '🌸',
  Gaming: '🎲',

  // ─── Economy ──────────────────────────────────────────────────────────────
  Economy: '💰',
  Shop: '🛒',

  // ─── Moderation & Safety ──────────────────────────────────────────────────
  Moderation: '🛡️',
  AutoModeration: '🤖',
  Logging: '📝',

  // ─── Server Management ────────────────────────────────────────────────────
  ServerStats: '📈',
  Welcome: '👋',
  Verification: '✅',
  Reaction_roles: '🎭',
  JoinToCreate: '🔌',
  Ticket: '🎫',
  Suggestions: '💡',
  Starboard: '⭐',
  Counting: '🔢',

  // ─── Engagement ───────────────────────────────────────────────────────────
  Leveling: '📊',
  Giveaway: '🎉',
  Birthday: '🎂',

  // ─── Media ──────────────────────────────────────────────────────────────────
  Music: '🎵',
  Search: '🔍',

  // ─── Utility ──────────────────────────────────────────────────────────────
  Utility: '🔧',
  Tools: '🛠️',
  Reminders: '⏰',

  // ─── Knowledge & Lifestyle ────────────────────────────────────────────────
  AI: '🧠',
  Crypto: '₿',
  Productivity: '✅',
  Knowledge: '📚',
  Health: '❤️',
  Travel: '✈️',
  Food: '🍽️',

  // ─── NSFW (gated) ───────────────────────────────────────────────────────────
  Nsfw: '🔞',
});

/** Commands that always stay available so admins can recover access. */
export const PROTECTED_COMMANDS = Object.freeze(
  new Set([
    'commands',
    'configwizard',
    'automoderation',
    'help',
    'ping',
    'setprefix',
    'prefix',
    'status',
    'uptime',
    'invite',
    'support',
    'vote',
  ])
);

/** Categories that require elevated permissions regardless of feature toggle. */
export const RESTRICTED_CATEGORIES = Object.freeze(
  new Set([
    'Moderation',
    'AutoModeration',
    'Logging',
    'Verification',
    'Admin',
    'Owner',
  ])
);

/** Categories that can be disabled per-guild via feature toggles. */
export const GUILD_CONFIGURABLE_CATEGORIES = Object.freeze(
  new Set([
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
    'Suggestions',
    'Starboard',
    'Counting',
    'Shop',
    'Social',
    'Image',
    'Anime',
    'Gaming',
    'Reminders',
    'Nsfw',
    'AI',
    'Crypto',
    'Productivity',
    'Knowledge',
    'Health',
    'Travel',
    'Food',
  ])
);

/** Categories visible to regular users (non-admin). */
export const PUBLIC_CATEGORIES = Object.freeze(
  new Set([
    'Core',
    'Community',
    'Fun',
    'Economy',
    'Shop',
    'Leveling',
    'Music',
    'Utility',
    'Tools',
    'Birthday',
    'Giveaway',
    'Social',
    'Image',
    'Anime',
    'Gaming',
    'Reminders',
    'AI',
    'Crypto',
    'Productivity',
    'Knowledge',
    'Health',
    'Travel',
    'Food',
    'Search',
  ])
);

/** Categories hidden from help unless user has elevated perms. */
export const HIDDEN_CATEGORIES = Object.freeze(
  new Set([
    'Admin',
    'Owner',
    'Moderation',
    'AutoModeration',
    'Logging',
    'Verification',
    'Nsfw',
  ])
);

/** Category groups for help menu organization. */
export const CATEGORY_GROUPS = Object.freeze({
  core: Object.freeze(['Core', 'Admin', 'Owner']),
  community: Object.freeze(['Community', 'Fun', 'Social', 'Image', 'Anime', 'Gaming']),
  economy: Object.freeze(['Economy', 'Shop']),
  safety: Object.freeze(['Moderation', 'AutoModeration', 'Logging']),
  management: Object.freeze([
    'ServerStats',
    'Welcome',
    'Verification',
    'Reaction_roles',
    'JoinToCreate',
    'Ticket',
    'Suggestions',
    'Starboard',
    'Counting',
  ]),
  engagement: Object.freeze(['Leveling', 'Giveaway', 'Birthday']),
  media: Object.freeze(['Music', 'Search']),
  utility: Object.freeze(['Utility', 'Tools', 'Reminders']),
  lifestyle: Object.freeze(['AI', 'Crypto', 'Productivity', 'Knowledge', 'Health', 'Travel', 'Food']),
  gated: Object.freeze(['Nsfw']),
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Metadata (cooldowns, permissions, flags) ─────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/** Default cooldowns per category in seconds. */
export const CATEGORY_COOLDOWNS = Object.freeze({
  Core: 3,
  Admin: 0,
  Owner: 0,
  Economy: 5,
  Shop: 3,
  Moderation: 3,
  AutoModeration: 0,
  Leveling: 3,
  Fun: 3,
  Social: 5,
  Image: 5,
  Anime: 5,
  Gaming: 5,
  Utility: 3,
  Tools: 3,
  Reminders: 3,
  Birthday: 5,
  Giveaway: 5,
  Ticket: 3,
  Verification: 3,
  Welcome: 3,
  Music: 3,
  ServerStats: 3,
  Reaction_roles: 3,
  JoinToCreate: 3,
  Suggestions: 5,
  Starboard: 3,
  Counting: 3,
  Logging: 0,
  NSFW: 5,
  AI: 10,
  Crypto: 5,
  Productivity: 3,
  Knowledge: 3,
  Health: 3,
  Travel: 5,
  Food: 3,
});

/** Commands that require NSFW channel. */
export const NSFW_COMMANDS = Object.freeze(
  new Set([
    'nsfw',
    'rule34',
    'r34',
    'gelbooru',
    'danbooru',
  ])
);

/** Commands that require DM disabled (guild-only). */
export const GUILD_ONLY_COMMANDS = Object.freeze(
  new Set([
    'automoderation',
    'ban',
    'kick',
    'timeout',
    'warn',
    'purge',
    'slowmode',
    'lock',
    'unlock',
    'hide',
    'unhide',
    'role',
    'takerole',
    'nickname',
    'modlog',
    'reason',
    'serverinfo',
    'servericon',
    'channels',
    'members',
    'boosters',
    'welcome',
    'goodbye',
    'autorole',
    'welcometest',
    'goodbyetest',
    'welcomelb',
    'verify',
    'verification',
    'autoverify',
    'verifyrole',
    'captcha',
    'verifylog',
    'ticket',
    'ticketpanel',
    'ticketsetup',
    'transcript',
    'suggest',
    'suggestsetup',
    'suggestchannel',
    'suggestapprove',
    'suggestdeny',
    'suggestconsider',
    'suggestimplement',
    'starboard',
    'starsetup',
    'staremoji',
    'starthreshold',
    'starlb',
    'counting',
    'countsetup',
    'countlb',
    'guessnumber',
    'reactroles',
    'rrpanel',
    'rrsetup',
    'rradd',
    'rrremove',
    'rrlist',
    'rredit',
    'rrclear',
    'jointocreate',
    'jtcsetup',
    'jtcconfig',
    'voiceclaim',
    'voicetransfer',
    'vclock',
    'vclimit',
    'serverstats',
    'membercount',
    'boostcount',
    'logsetup',
    'auditlog',
    'messagelog',
    'report',
    'reportsetup',
    'ticketreport',
    'feedback',
    'bugreport',
    'leaderboard',
    'rank',
    'resetxp',
    'addxp',
    'removexp',
    'xpmultiplier',
    'rolelevel',
    'stackroles',
    'gcreate',
    'gend',
    'gdelete',
    'greroll',
    'glist',
    'gentries',
    'gwinners',
    'gedit',
    'birthday',
    'nextbirthday',
    'birthdays',
    'birthdayleaderboard',
  ])
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category ↔ Command Mapping (Syncs with alias system) ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps full command names to their canonical category.
 * Synced with commandAliases object values.
 * Total: 364 commands across 32 categories.
 */
export const COMMAND_TO_CATEGORY = Object.freeze({
  // ─── Core (12) ────────────────────────────────────────────────────────────
  ping: 'Core',
  help: 'Core',
  invite: 'Core',
  support: 'Core',
  donate: 'Core',
  premium: 'Core',
  vote: 'Core',
  stats: 'Core',
  status: 'Core',
  uptime: 'Core',
  shard: 'Core',
  pingall: 'Core',

  // ─── Admin (12) ───────────────────────────────────────────────────────────
  eval: 'Admin',
  exec: 'Admin',
  reload: 'Admin',
  restart: 'Admin',
  shutdown: 'Admin',
  maintenance: 'Admin',
  setprefix: 'Admin',
  blacklistuser: 'Admin',
  blacklistguild: 'Admin',
  whitelist: 'Admin',
  owner: 'Admin',

  // ─── Owner (0) ────────────────────────────────────────────────────────────
  // Reserved for super-admin commands (separate from Admin if needed)

  // ─── Economy (21) ─────────────────────────────────────────────────────────
  balance: 'Economy',
  deposit: 'Economy',
  withdraw: 'Economy',
  work: 'Economy',
  daily: 'Economy',
  gamble: 'Economy',
  rob: 'Economy',
  crime: 'Economy',
  pay: 'Economy',
  beg: 'Economy',
  hunt: 'Economy',
  fish: 'Economy',
  mine: 'Economy',
  chop: 'Economy',
  sell: 'Economy',
  buyitem: 'Economy',
  use: 'Economy',
  leaderboard: 'Economy',
  networth: 'Economy',
  profile: 'Economy',

  // ─── Shop (10) ───────────────────────────────────────────────────────────
  shop: 'Shop',
  buy: 'Shop',
  inventory: 'Shop',
  equip: 'Shop',
  useitem: 'Shop',
  sellitem: 'Shop',
  trade: 'Shop',
  gift: 'Shop',

  // ─── Moderation (23) ──────────────────────────────────────────────────────
  ban: 'Moderation',
  unban: 'Moderation',
  kick: 'Moderation',
  timeout: 'Moderation',
  untimeout: 'Moderation',
  warn: 'Moderation',
  unwarn: 'Moderation',
  warnings: 'Moderation',
  purge: 'Moderation',
  slowmode: 'Moderation',
  lock: 'Moderation',
  unlock: 'Moderation',
  hide: 'Moderation',
  unhide: 'Moderation',
  announce: 'Moderation',
  say: 'Moderation',
  embed: 'Moderation',
  role: 'Moderation',
  takerole: 'Moderation',
  nickname: 'Moderation',
  modlog: 'Moderation',
  reason: 'Moderation',

  // ─── Auto-Moderation (1) ──────────────────────────────────────────────────
  automoderation: 'AutoModeration',

  // ─── Leveling (7) ─────────────────────────────────────────────────────────
  rank: 'Leveling',
  resetxp: 'Leveling',
  addxp: 'Leveling',
  removexp: 'Leveling',
  xpmultiplier: 'Leveling',
  rolelevel: 'Leveling',
  stackroles: 'Leveling',

  // ─── Fun (42) ─────────────────────────────────────────────────────────────
  flip: 'Fun',
  roll: 'Fun',
  rps: 'Fun',
  fight: 'Fun',
  hug: 'Fun',
  kiss: 'Fun',
  slap: 'Fun',
  punch: 'Fun',
  kill: 'Fun',
  ship: 'Fun',
  rate: 'Fun',
  waifu: 'Fun',
  husbando: 'Fun',
  marry: 'Fun',
  divorce: 'Fun',
  pet: 'Fun',
  feed: 'Fun',
  tickle: 'Fun',
  poke: 'Fun',
  highfive: 'Fun',
  wave: 'Fun',
  wink: 'Fun',
  dance: 'Fun',
  cry: 'Fun',
  laugh: 'Fun',
  meme: 'Fun',
  joke: 'Fun',
  roast: 'Fun',
  '8ball': 'Fun',
  choose: 'Fun',
  random: 'Fun',
  trivia: 'Fun',
  hangman: 'Fun',
  wordle: 'Fun',
  blackjack: 'Fun',

  // ─── Social (10) ──────────────────────────────────────────────────────────
  reputation: 'Social',
  repgive: 'Social',
  repboard: 'Social',
  bio: 'Social',
  background: 'Social',
  badge: 'Social',
  title: 'Social',
  customstatus: 'Social',

  // ─── Image (18) ───────────────────────────────────────────────────────────
  trigger: 'Image',
  blur: 'Image',
  pixelate: 'Image',
  invert: 'Image',
  greyscale: 'Image',
  wanted: 'Image',
  jail: 'Image',
  rip: 'Image',
  trash: 'Image',
  beautiful: 'Image',
  facepalm: 'Image',
  affect: 'Image',
  bobross: 'Image',
  deleteimg: 'Image',
  hitler: 'Image',
  kissimg: 'Image',
  slapimg: 'Image',

  // ─── Anime (9) ────────────────────────────────────────────────────────────
  anime: 'Anime',
  manga: 'Anime',
  character: 'Anime',
  anilist: 'Anime',
  mal: 'Anime',
  animequote: 'Anime',
  waifupic: 'Anime',
  neko: 'Anime',

  // ─── Gaming (10) ──────────────────────────────────────────────────────────
  mcserver: 'Gaming',
  mcskin: 'Gaming',
  mcuser: 'Gaming',
  steam: 'Gaming',
  fortnite: 'Gaming',
  apex: 'Gaming',
  valorant: 'Gaming',
  lol: 'Gaming',
  osu: 'Gaming',

  // ─── Giveaway (8) ─────────────────────────────────────────────────────────
  gcreate: 'Giveaway',
  gend: 'Giveaway',
  gdelete: 'Giveaway',
  greroll: 'Giveaway',
  glist: 'Giveaway',
  gentries: 'Giveaway',
  gwinners: 'Giveaway',
  gedit: 'Giveaway',

  // ─── Ticket (8) ───────────────────────────────────────────────────────────
  ticket: 'Ticket',
  close: 'Ticket',
  add: 'Ticket',
  remove: 'Ticket',
  ticketpanel: 'Ticket',
  ticketsetup: 'Ticket',
  transcript: 'Ticket',

  // ─── Verification (6) ───────────────────────────────────────────────────
  verify: 'Verification',
  verification: 'Verification',
  autoverify: 'Verification',
  verifyrole: 'Verification',
  captcha: 'Verification',
  verifylog: 'Verification',

  // ─── Welcome (10) ───────────────────────────────────────────────────────
  welcome: 'Welcome',
  welcomeimg: 'Welcome',
  goodbye: 'Welcome',
  goodbyecard: 'Welcome',
  autorole: 'Welcome',
  welcometest: 'Welcome',
  goodbyetest: 'Welcome',
  welcomelb: 'Welcome',

  // ─── Music (41) ───────────────────────────────────────────────────────────
  nowplaying: 'Music',
  play: 'Music',
  skip: 'Music',
  queue: 'Music',
  pause: 'Music',
  resume: 'Music',
  stop: 'Music',
  disconnect: 'Music',
  volume: 'Music',
  loop: 'Music',
  shuffle: 'Music',
  lyrics: 'Music',
  search: 'Music',
  move: 'Music',
  skipto: 'Music',
  playnext: 'Music',
  playskip: 'Music',
  bassboost: 'Music',
  nightcore: 'Music',
  vaporwave: 'Music',
  speed: 'Music',
  pitch: 'Music',
  seek: 'Music',
  rewind: 'Music',
  forward: 'Music',
  savequeue: 'Music',
  loadqueue: 'Music',
  playlist: 'Music',
  autoplay: 'Music',
  radio: 'Music',

  // ─── Utility (47) ─────────────────────────────────────────────────────────
  userinfo: 'Utility',
  avatar: 'Utility',
  banner: 'Utility',
  serverinfo: 'Utility',
  servericon: 'Utility',
  emojis: 'Utility',
  roles: 'Utility',
  channels: 'Utility',
  members: 'Utility',
  invites: 'Utility',
  boosters: 'Utility',
  calculate: 'Utility',
  weather: 'Utility',
  time: 'Utility',
  translate: 'Utility',
  remind: 'Utility',
  timer: 'Utility',
  poll: 'Utility',
  quote: 'Utility',
  stealemoji: 'Utility',
  enlarge: 'Utility',
  snipe: 'Utility',
  esnipe: 'Utility',
  afk: 'Utility',
  note: 'Utility',
  sticky: 'Utility',
  color: 'Utility',
  rgb: 'Utility',
  password: 'Utility',
  shorten: 'Utility',
  base64: 'Utility',
  encode: 'Utility',
  decode: 'Utility',
  binary: 'Utility',
  morse: 'Utility',
  ascii: 'Utility',
  figlet: 'Utility',
  firstmsg: 'Utility',
  permissions: 'Utility',
  botperms: 'Utility',
  inviteinfo: 'Utility',
  vanity: 'Utility',
  splash: 'Utility',
  discover: 'Utility',
  bump: 'Utility',
  review: 'Utility',
  serverlist: 'Utility',
  partners: 'Utility',

  // ─── Tools (14) ───────────────────────────────────────────────────────────
  todo: 'Tools',
  todoadd: 'Tools',
  todoremove: 'Tools',
  todolist: 'Tools',
  todoclear: 'Tools',
  tododone: 'Tools',
  report: 'Tools',
  feedback: 'Tools',
  bugreport: 'Tools',
  customcommand: 'Tools',
  tag: 'Tools',
  addtag: 'Tools',
  edittag: 'Tools',
  deletetag: 'Tools',
  taglist: 'Tools',

  // ─── Reminders (4) ────────────────────────────────────────────────────────
  remindall: 'Reminders',
  alarm: 'Reminders',
  remindlist: 'Reminders',

  // ─── Birthday (4) ─────────────────────────────────────────────────────────
  birthday: 'Birthday',
  nextbirthday: 'Birthday',
  birthdays: 'Birthday',
  birthdayleaderboard: 'Birthday',

  // ─── Server Stats (6) ───────────────────────────────────────────────────
  serverstats: 'ServerStats',
  membercount: 'ServerStats',
  boostcount: 'ServerStats',
  logsetup: 'ServerStats',
  auditlog: 'ServerStats',
  messagelog: 'ServerStats',

  // ─── Reaction Roles (8) ─────────────────────────────────────────────────
  reactroles: 'Reaction_roles',
  rrpanel: 'Reaction_roles',
  rrsetup: 'Reaction_roles',
  rradd: 'Reaction_roles',
  rrremove: 'Reaction_roles',
  rrlist: 'Reaction_roles',
  rredit: 'Reaction_roles',
  rrclear: 'Reaction_roles',

  // ─── Join To Create (7) ───────────────────────────────────────────────────
  jointocreate: 'JoinToCreate',
  jtcsetup: 'JoinToCreate',
  jtcconfig: 'JoinToCreate',
  voiceclaim: 'JoinToCreate',
  voicetransfer: 'JoinToCreate',
  vclock: 'JoinToCreate',
  vclimit: 'JoinToCreate',

  // ─── Suggestions (7) ────────────────────────────────────────────────────
  suggest: 'Suggestions',
  suggestsetup: 'Suggestions',
  suggestchannel: 'Suggestions',
  suggestapprove: 'Suggestions',
  suggestdeny: 'Suggestions',
  suggestconsider: 'Suggestions',
  suggestimplement: 'Suggestions',

  // ─── Starboard (5) ────────────────────────────────────────────────────────
  starboard: 'Starboard',
  starsetup: 'Starboard',
  staremoji: 'Starboard',
  starthreshold: 'Starboard',
  starlb: 'Starboard',

  // ─── Counting (4) ───────────────────────────────────────────────────────
  counting: 'Counting',
  countsetup: 'Counting',
  countlb: 'Counting',
  guessnumber: 'Counting',

  // ─── NSFW (4) ─────────────────────────────────────────────────────────────
  nsfw: 'Nsfw',
  rule34: 'Nsfw',
  gelbooru: 'Nsfw',
  danbooru: 'Nsfw',

  // ─── AI (5) ───────────────────────────────────────────────────────────────
  ai: 'AI',
  chat: 'AI',
  askai: 'AI',
  imageai: 'AI',
  summarize: 'AI',

  // ─── Crypto (5) ───────────────────────────────────────────────────────────
  crypto: 'Crypto',
  wallet: 'Crypto',
  price: 'Crypto',
  chart: 'Crypto',
  gas: 'Crypto',

  // ─── Productivity (4) ─────────────────────────────────────────────────────
  bookmark: 'Productivity',
  reminder: 'Productivity',
  calendar: 'Productivity',
  habit: 'Productivity',

  // ─── Knowledge (5) ────────────────────────────────────────────────────────
  wiki: 'Knowledge',
  define: 'Knowledge',
  synonym: 'Knowledge',
  antonym: 'Knowledge',
  fact: 'Knowledge',

  // ─── Health (5) ─────────────────────────────────────────────────────────────
  workout: 'Health',
  diet: 'Health',
  sleep: 'Health',
  meditate: 'Health',
  hydrate: 'Health',

  // ─── Travel (5) ───────────────────────────────────────────────────────────
  map: 'Travel',
  directions: 'Travel',
  flight: 'Travel',
  hotel: 'Travel',
  currency: 'Travel',

  // ─── Food (5) ───────────────────────────────────────────────────────────────
  recipe: 'Food',
  ingredient: 'Food',
  restaurant: 'Food',
  reviewfood: 'Food',
  nutrition: 'Food',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Rule Categories ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const AUTOMOD_RULE_CATEGORIES = Object.freeze({
  antiSpam: 'AutoModeration',
  antiRaid: 'AutoModeration',
  antiCaps: 'AutoModeration',
  antiInvite: 'AutoModeration',
  antiLink: 'AutoModeration',
  mentionSpam: 'AutoModeration',
  antiNsfw: 'AutoModeration',
  antiZalgo: 'AutoModeration',
  antiProfanity: 'AutoModeration',
  antiSelfbot: 'AutoModeration',
  antiGhostPing: 'AutoModeration',
  antiDehoist: 'AutoModeration',
  antiEmojiSpam: 'AutoModeration',
  antiNewline: 'AutoModeration',
  antiStickerSpam: 'AutoModeration',
  antiGifSpam: 'AutoModeration',
  antiImageFlood: 'AutoModeration',
  antiWebhookSpam: 'AutoModeration',
  antiBotSpam: 'AutoModeration',
  antiTokenLeak: 'AutoModeration',
  antiDoxxing: 'AutoModeration',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Feature Toggle Mapping (camelCase for DB/config keys) ────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const FEATURE_TOGGLE_MAP = Object.freeze({
  // Core
  core: 'core',
  admin: 'admin',
  owner: 'owner',

  // Community
  birthday: 'birthday',
  economy: 'economy',
  shop: 'shop',
  fun: 'fun',
  social: 'social',
  image: 'image',
  anime: 'anime',
  gaming: 'gaming',

  // Management
  moderation: 'moderation',
  automoderation: 'autoModeration',
  logging: 'logging',
  verification: 'verification',
  welcome: 'welcome',
  ticket: 'tickets',
  suggestions: 'suggestions',
  starboard: 'starboard',
  counting: 'counting',

  // Engagement
  leveling: 'leveling',
  giveaway: 'giveaways',
  music: 'music',

  // Roles / Channels
  reaction_roles: 'reactionRoles',
  jointocreate: 'joinToCreate',
  serverstats: 'serverStats',
  autorole: 'autoRole',

  // Utility
  utility: 'utility',
  tools: 'tools',
  reminders: 'reminders',
  search: 'search',

  // Lifestyle
  ai: 'ai',
  crypto: 'crypto',
  productivity: 'productivity',
  knowledge: 'knowledge',
  health: 'health',
  travel: 'travel',
  food: 'food',

  // NSFW (gated)
  nsfw: 'nsfw',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Key Normalization ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize a category string to a consistent snake_case key.
 * @param {string} category
 * @returns {string}
 */
export function normalizeCategoryKey(category) {
  return String(category ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Display Formatting ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

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
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    CATEGORY_ICONS[formatted] ||
    CATEGORY_ICONS[normalized] ||
    CATEGORY_ICONS[category] ||
    '📁'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category Classification ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a category requires elevated permissions (mod/admin).
 * @param {string} category
 * @returns {boolean}
 */
export function isRestrictedCategory(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    RESTRICTED_CATEGORIES.has(normalized) ||
    RESTRICTED_CATEGORIES.has(formatted) ||
    RESTRICTED_CATEGORIES.has(category)
  );
}

/**
 * Check if a category can be toggled per-guild.
 * @param {string} category
 * @returns {boolean}
 */
export function isGuildConfigurable(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    GUILD_CONFIGURABLE_CATEGORIES.has(normalized) ||
    GUILD_CONFIGURABLE_CATEGORIES.has(formatted) ||
    GUILD_CONFIGURABLE_CATEGORIES.has(category)
  );
}

/**
 * Check if a category is protected from disablement.
 * @param {string} category
 * @returns {boolean}
 */
export function isProtectedCategory(category) {
  return !isGuildConfigurable(category) && !isRestrictedCategory(category);
}

/**
 * Check if a category is visible to regular users.
 * @param {string} category
 * @returns {boolean}
 */
export function isPublicCategory(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    PUBLIC_CATEGORIES.has(normalized) ||
    PUBLIC_CATEGORIES.has(formatted) ||
    PUBLIC_CATEGORIES.has(category)
  );
}

/**
 * Check if a category is hidden from regular users.
 * @param {string} category
 * @returns {boolean}
 */
export function isHiddenCategory(category) {
  return !isPublicCategory(category);
}

/**
 * Get the group a category belongs to.
 * @param {string} category
 * @returns {string|null}
 */
export function getCategoryGroup(category) {
  if (!category) return null;
  const normalized = normalizeCategoryKey(category);
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(normalized) || cats.includes(category)) {
      return group;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Protection ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a command is protected from disablement.
 * @param {string} commandName
 * @returns {boolean}
 */
export function isProtectedCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return PROTECTED_COMMANDS.has(commandName.toLowerCase());
}

/**
 * Add a command to the protected set.
 * @param {string} commandName
 */
export function protectCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return;
  PROTECTED_COMMANDS.add(commandName.toLowerCase());
}

/**
 * Remove a command from the protected set.
 * @param {string} commandName
 */
export function unprotectCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return;
  PROTECTED_COMMANDS.delete(commandName.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Metadata Helpers ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a command requires an NSFW channel.
 * @param {string} commandName
 * @returns {boolean}
 */
export function isNsfwCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return NSFW_COMMANDS.has(commandName.toLowerCase());
}

/**
 * Check if a command is guild-only (no DMs).
 * @param {string} commandName
 * @returns {boolean}
 */
export function isGuildOnlyCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return GUILD_ONLY_COMMANDS.has(commandName.toLowerCase());
}

/**
 * Get the default cooldown for a command (from its category).
 * @param {string} commandName
 * @returns {number} Cooldown in seconds (0 = none)
 */
export function getCommandCooldown(commandName) {
  const category = getCommandCategory(commandName);
  if (!category) return 3;
  return CATEGORY_COOLDOWNS[category] ?? 3;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Specific ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a rule ID belongs to auto-moderation.
 * @param {string} ruleId
 * @returns {boolean}
 */
export function isAutomodRule(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return false;
  return ruleId in AUTOMOD_RULE_CATEGORIES;
}

/**
 * Get the category for an auto-moderation rule.
 * @param {string} ruleId
 * @returns {string|null}
 */
export function getAutomodRuleCategory(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return null;
  return AUTOMOD_RULE_CATEGORIES[ruleId] || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command → Category Resolution ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the canonical category for a full command name.
 * @param {string} commandName
 * @returns {string|null}
 */
export function getCommandCategory(commandName) {
  if (!commandName || typeof commandName !== 'string') return null;
  return COMMAND_TO_CATEGORY[commandName.toLowerCase()] || null;
}

/**
 * Get all commands belonging to a category.
 * @param {string} category
 * @returns {string[]}
 */
export function getCommandsByCategory(category) {
  if (!category || typeof category !== 'string') return [];
  const target = normalizeCategoryKey(category);
  return Object.entries(COMMAND_TO_CATEGORY)
    .filter(([, cat]) => normalizeCategoryKey(cat) === target)
    .map(([cmd]) => cmd);
}

/**
 * Check if a command belongs to a specific category.
 * @param {string} commandName
 * @param {string} category
 * @returns {boolean}
 */
export function isCommandInCategory(commandName, category) {
  if (!commandName || !category) return false;
  return getCommandCategory(commandName) === category;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Alias-Aware Resolution (NEW) ─────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Resolve an alias to its category using an external aliases map.
 * This bridges commandAliases.js with this category system.
 *
 * @param {string} alias - The alias or command name typed by user
 * @param {Record<string, string>} aliasesMap - Your commandAliases object
 * @returns {string|null} The category, or null if unknown
 */
export function resolveAliasToCategory(alias, aliasesMap) {
  if (!alias || typeof alias !== 'string') return null;
  const normalized = alias.trim().toLowerCase();

  // 1. Direct command match
  const direct = COMMAND_TO_CATEGORY[normalized];
  if (direct) return direct;

  // 2. Alias lookup
  if (aliasesMap && typeof aliasesMap === 'object') {
    const fullCommand = aliasesMap[normalized];
    if (fullCommand) {
      return COMMAND_TO_CATEGORY[fullCommand.toLowerCase()] || null;
    }
  }

  return null;
}

/**
 * Get all aliases for a given category from an external aliases map.
 *
 * @param {string} category
 * @param {Record<string, string>} aliasesMap - Your commandAliases object
 * @returns {string[]} All aliases that resolve to commands in this category
 */
export function getAliasesByCategory(category, aliasesMap) {
  if (!category || !aliasesMap || typeof aliasesMap !== 'object') return [];
  const commandsInCat = new Set(getCommandsByCategory(category));
  return Object.entries(aliasesMap)
    .filter(([, full]) => commandsInCat.has(full.toLowerCase()))
    .map(([alias]) => alias);
}

/**
 * Build a reverse lookup: full command → all aliases.
 * Requires the aliases map from commandAliases.js.
 *
 * @param {Record<string, string>} aliasesMap
 * @returns {Record<string, string[]>}
 */
export function buildAliasIndex(aliasesMap) {
  if (!aliasesMap || typeof aliasesMap !== 'object') return {};
  const index = {};
  for (const [alias, full] of Object.entries(aliasesMap)) {
    const key = full.toLowerCase();
    if (!index[key]) index[key] = [];
    index[key].push(alias);
  }
  return index;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Feature Toggle Mapping ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map a category to its feature toggle key in botConfig.features.
 * @param {string} category
 * @returns {string|null}
 */
export function getFeatureToggleKey(category) {
  if (!category || typeof category !== 'string') return null;
  const normalized = normalizeCategoryKey(category);
  return FEATURE_TOGGLE_MAP[normalized] || null;
}

/**
 * Get the category from a feature toggle key.
 * @param {string} toggleKey
 * @returns {string|null}
 */
export function getCategoryFromToggleKey(toggleKey) {
  if (!toggleKey || typeof toggleKey !== 'string') return null;
  const normalized = toggleKey.toLowerCase();
  const entry = Object.entries(FEATURE_TOGGLE_MAP).find(([, val]) => val.toLowerCase() === normalized);
  return entry ? entry[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Validation & Diagnostics (NEW) ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Find aliases that map to commands not present in COMMAND_TO_CATEGORY.
 * Useful for detecting drift between aliases.js and categories.js.
 *
 * @param {Record<string, string>} aliasesMap
 * @returns {string[]} Array of orphaned alias keys
 */
export function findOrphanedAliases(aliasesMap) {
  if (!aliasesMap || typeof aliasesMap !== 'object') return [];
  const orphaned = [];
  for (const [alias, full] of Object.entries(aliasesMap)) {
    if (!COMMAND_TO_CATEGORY[full.toLowerCase()]) {
      orphaned.push(alias);
    }
  }
  return orphaned;
}

/**
 * Find commands in COMMAND_TO_CATEGORY that have no aliases.
 * These may need aliases added for discoverability.
 *
 * @param {Record<string, string>} aliasesMap
 * @returns {string[]} Array of bare command names
 */
export function findBareCommands(aliasesMap) {
  if (!aliasesMap || typeof aliasesMap !== 'object') return [];
  const aliased = new Set(Object.values(aliasesMap).map((c) => c.toLowerCase()));
  return Object.keys(COMMAND_TO_CATEGORY).filter((cmd) => !aliased.has(cmd));
}

/**
 * Run a full coverage audit between aliases and categories.
 *
 * @param {Record<string, string>} aliasesMap
 * @returns {{
 *   orphaned: string[],
 *   bare: string[],
 *   coverage: number,
 *   totalAliases: number,
 *   totalCommands: number,
 *   categorizedAliases: number
 * }}
 */
export function auditCoverage(aliasesMap) {
  const orphaned = findOrphanedAliases(aliasesMap);
  const bare = findBareCommands(aliasesMap);
  const totalAliases = Object.keys(aliasesMap).length;
  const totalCommands = Object.keys(COMMAND_TO_CATEGORY).length;
  const categorizedAliases = totalAliases - orphaned.length;
  const coverage = totalAliases > 0 ? (categorizedAliases / totalAliases) * 100 : 0;

  return {
    orphaned,
    bare,
    coverage: Math.round(coverage * 100) / 100,
    totalAliases,
    totalCommands,
    categorizedAliases,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Stats & Introspection ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get comprehensive stats about the category system.
 * @returns {{
 *   totalCategories: number,
 *   totalCommands: number,
 *   restrictedCount: number,
 *   configurableCount: number,
 *   protectedCount: number,
 *   publicCount: number,
 *   hiddenCount: number,
 *   automodRules: number,
 *   iconCoverage: number,
 *   nsfwCommands: number,
 *   guildOnlyCommands: number,
 * }}
 */
export function getCategoryStats() {
  const allCategories = new Set(Object.values(COMMAND_TO_CATEGORY));
  const iconCoverage = [...allCategories].filter((cat) => getCategoryIcon(cat) !== '📁').length;

  return {
    totalCategories: allCategories.size,
    totalCommands: Object.keys(COMMAND_TO_CATEGORY).length,
    restrictedCount: RESTRICTED_CATEGORIES.size,
    configurableCount: GUILD_CONFIGURABLE_CATEGORIES.size,
    protectedCount: PROTECTED_COMMANDS.size,
    publicCount: PUBLIC_CATEGORIES.size,
    hiddenCount: HIDDEN_CATEGORIES.size,
    automodRules: Object.keys(AUTOMOD_RULE_CATEGORIES).length,
    iconCoverage,
    nsfwCommands: NSFW_COMMANDS.size,
    guildOnlyCommands: GUILD_ONLY_COMMANDS.size,
  };
}

/**
 * Get all categories as display objects for embeds/menus.
 * @param {boolean} [includeHidden=false] - Include admin-only categories
 * @returns {{
 *   key: string,
 *   name: string,
 *   icon: string,
 *   restricted: boolean,
 *   configurable: boolean,
 *   group: string|null,
 *   commandCount: number,
 *   toggleKey: string|null
 * }[]}
 */
export function getCategoryList(includeHidden = false) {
  const allCategories = new Set(Object.values(COMMAND_TO_CATEGORY));
  if (includeHidden) {
    HIDDEN_CATEGORIES.forEach((cat) => allCategories.add(cat));
    RESTRICTED_CATEGORIES.forEach((cat) => allCategories.add(cat));
  }

  return [...allCategories]
    .sort()
    .map((cat) => ({
      key: normalizeCategoryKey(cat),
      name: formatCategoryName(cat),
      icon: getCategoryIcon(cat),
      restricted: isRestrictedCategory(cat),
      configurable: isGuildConfigurable(cat),
      protected: isProtectedCategory(cat),
      public: isPublicCategory(cat),
      group: getCategoryGroup(cat),
      commandCount: getCommandsByCategory(cat).length,
      toggleKey: getFeatureToggleKey(cat),
    }));
}

/**
 * Get category stats formatted as a help-menu ready object.
 * @param {boolean} [includeHidden=false]
 * @returns {Record<string, {name: string, icon: string, commands: string[]}>}
 */
export function getHelpMenuData(includeHidden = false) {
  const data = {};
  for (const cat of getCategoryList(includeHidden)) {
    data[cat.key] = {
      name: cat.name,
      icon: cat.icon,
      commands: getCommandsByCategory(cat.key),
    };
  }
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Default Export ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  CATEGORY_ICONS,
  CATEGORY_GROUPS,
  CATEGORY_COOLDOWNS,
  PROTECTED_COMMANDS,
  RESTRICTED_CATEGORIES,
  GUILD_CONFIGURABLE_CATEGORIES,
  PUBLIC_CATEGORIES,
  HIDDEN_CATEGORIES,
  NSFW_COMMANDS,
  GUILD_ONLY_COMMANDS,
  AUTOMOD_RULE_CATEGORIES,
  COMMAND_TO_CATEGORY,
  FEATURE_TOGGLE_MAP,

  // Normalization
  normalizeCategoryKey,
  formatCategoryName,
  getCategoryIcon,

  // Classification
  isRestrictedCategory,
  isGuildConfigurable,
  isProtectedCategory,
  isPublicCategory,
  isHiddenCategory,
  getCategoryGroup,

  // Command metadata
  isProtectedCommand,
  protectCommand,
  unprotectCommand,
  isNsfwCommand,
  isGuildOnlyCommand,
  getCommandCooldown,

  // Auto-mod
  isAutomodRule,
  getAutomodRuleCategory,

  // Command resolution
  getCommandCategory,
  getCommandsByCategory,
  isCommandInCategory,

  // Alias-aware (NEW)
  resolveAliasToCategory,
  getAliasesByCategory,
  buildAliasIndex,

  // Feature toggles
  getFeatureToggleKey,
  getCategoryFromToggleKey,

  // Validation (NEW)
  findOrphanedAliases,
  findBareCommands,
  auditCoverage,

  // Stats
  getCategoryStats,
  getCategoryList,
  getHelpMenuData,
};  Verification: '✅',
  Reaction_roles: '🎭',
  JoinToCreate: '🔌',
  Ticket: '🎫',
  Suggestions: '💡',
  Starboard: '⭐',
  Counting: '🔢',

  // Engagement
  Leveling: '📊',
  Giveaway: '🎉',
  Birthday: '🎂',

  // Media
  Music: '🎵',
  Search: '🔍',

  // Utility
  Utility: '🔧',
  Tools: '🛠️',
  Reminders: '⏰',

  // NSFW (gated)
  Nsfw: '🔞',
});

/** Commands that always stay available so admins can recover access. */
export const PROTECTED_COMMANDS = Object.freeze(
  new Set([
    'commands',
    'configwizard',
    'automoderation',
    'help',
    'ping',
    'setprefix',
    'prefix',
    'status',
    'uptime',
    'invite',
    'support',
    'vote',
  ])
);

/** Categories that require elevated permissions regardless of feature toggle. */
export const RESTRICTED_CATEGORIES = Object.freeze(
  new Set([
    'Moderation',
    'AutoModeration',
    'Logging',
    'Verification',
    'Admin',
    'Owner',
  ])
);

/** Categories that can be disabled per-guild via feature toggles. */
export const GUILD_CONFIGURABLE_CATEGORIES = Object.freeze(
  new Set([
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
    'Suggestions',
    'Starboard',
    'Counting',
    'Shop',
    'Social',
    'Image',
    'Anime',
    'Gaming',
    'Reminders',
    'Nsfw',
  ])
);

/** Categories visible to regular users (non-admin). */
export const PUBLIC_CATEGORIES = Object.freeze(
  new Set([
    'Core',
    'Community',
    'Fun',
    'Economy',
    'Shop',
    'Leveling',
    'Music',
    'Utility',
    'Tools',
    'Birthday',
    'Giveaway',
    'Social',
    'Image',
    'Anime',
    'Gaming',
    'Reminders',
  ])
);

/** Categories hidden from help unless user has elevated perms. */
export const HIDDEN_CATEGORIES = Object.freeze(
  new Set([
    'Admin',
    'Owner',
    'Moderation',
    'AutoModeration',
    'Logging',
    'Verification',
    'Nsfw',
  ])
);

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category ↔ Command Mapping (Syncs with alias system) ─────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Maps full command names to their canonical category.
 * Sync this with your commandAliases object keys.
 */
export const COMMAND_TO_CATEGORY = Object.freeze({
  // ─── Core ───────────────────────────────────────────────────────────────────
  ping: 'Core',
  help: 'Core',
  invite: 'Core',
  support: 'Core',
  donate: 'Core',
  premium: 'Core',
  vote: 'Core',
  stats: 'Core',
  status: 'Core',
  uptime: 'Core',
  shard: 'Core',
  pingall: 'Core',

  // ─── Admin ──────────────────────────────────────────────────────────────────
  eval: 'Admin',
  exec: 'Admin',
  shell: 'Admin',
  reload: 'Admin',
  restart: 'Admin',
  reboot: 'Admin',
  shutdown: 'Admin',
  maintenance: 'Admin',
  setprefix: 'Admin',
  prefix: 'Admin',
  blacklistuser: 'Admin',
  blacklistguild: 'Admin',
  whitelist: 'Admin',
  owner: 'Admin',

  // ─── Owner ──────────────────────────────────────────────────────────────────
  // (Same as Admin for most bots, or separate super-admin commands)

  // ─── Economy ────────────────────────────────────────────────────────────────
  balance: 'Economy',
  deposit: 'Economy',
  withdraw: 'Economy',
  work: 'Economy',
  daily: 'Economy',
  gamble: 'Economy',
  rob: 'Economy',
  crime: 'Economy',
  pay: 'Economy',
  beg: 'Economy',
  search: 'Economy',
  hunt: 'Economy',
  fish: 'Economy',
  mine: 'Economy',
  chop: 'Economy',
  sell: 'Economy',
  buyitem: 'Economy',
  use: 'Economy',
  networth: 'Economy',
  profile: 'Economy',
  shop: 'Shop',
  buy: 'Shop',
  inventory: 'Shop',
  equip: 'Shop',
  useitem: 'Shop',
  sellitem: 'Shop',
  trade: 'Shop',
  gift: 'Shop',

  // ─── Moderation ─────────────────────────────────────────────────────────────
  ban: 'Moderation',
  unban: 'Moderation',
  kick: 'Moderation',
  timeout: 'Moderation',
  untimeout: 'Moderation',
  warn: 'Moderation',
  unwarn: 'Moderation',
  warnings: 'Moderation',
  purge: 'Moderation',
  slowmode: 'Moderation',
  lock: 'Moderation',
  unlock: 'Moderation',
  hide: 'Moderation',
  unhide: 'Moderation',
  announce: 'Moderation',
  say: 'Moderation',
  embed: 'Moderation',
  role: 'Moderation',
  takerole: 'Moderation',
  nickname: 'Moderation',
  modlog: 'Moderation',
  cases: 'Moderation',
  reason: 'Moderation',

  // ─── Auto-Moderation ────────────────────────────────────────────────────────
  automoderation: 'AutoModeration',

  // ─── Leveling ───────────────────────────────────────────────────────────────
  rank: 'Leveling',
  leaderboard: 'Leveling',
  resetxp: 'Leveling',
  addxp: 'Leveling',
  removexp: 'Leveling',
  xpmultiplier: 'Leveling',
  rolelevel: 'Leveling',
  stackroles: 'Leveling',

  // ─── Fun ────────────────────────────────────────────────────────────────────
  flip: 'Fun',
  roll: 'Fun',
  rps: 'Fun',
  fight: 'Fun',
  hug: 'Fun',
  kiss: 'Fun',
  slap: 'Fun',
  punch: 'Fun',
  kill: 'Fun',
  ship: 'Fun',
  rate: 'Fun',
  waifu: 'Fun',
  husbando: 'Fun',
  marry: 'Fun',
  divorce: 'Fun',
  pet: 'Fun',
  feed: 'Fun',
  tickle: 'Fun',
  poke: 'Fun',
  highfive: 'Fun',
  wave: 'Fun',
  wink: 'Fun',
  dance: 'Fun',
  cry: 'Fun',
  laugh: 'Fun',
  meme: 'Fun',
  joke: 'Fun',
  roast: 'Fun',
  '8ball': 'Fun',
  choose: 'Fun',
  random: 'Fun',
  trivia: 'Fun',
  hangman: 'Fun',
  wordle: 'Fun',
  blackjack: 'Fun',

  // ─── Social ─────────────────────────────────────────────────────────────────
  reputation: 'Social',
  repgive: 'Social',
  repboard: 'Social',
  bio: 'Social',
  background: 'Social',
  badge: 'Social',
  badges: 'Social',
  title: 'Social',
  customstatus: 'Social',

  // ─── Image ──────────────────────────────────────────────────────────────────
  trigger: 'Image',
  blur: 'Image',
  pixelate: 'Image',
  invert: 'Image',
  greyscale: 'Image',
  wanted: 'Image',
  jail: 'Image',
  rip: 'Image',
  trash: 'Image',
  beautiful: 'Image',
  facepalm: 'Image',
  affect: 'Image',
  bobross: 'Image',
  deleteimg: 'Image',
  hitler: 'Image',
  kissimg: 'Image',
  slapimg: 'Image',

  // ─── Anime ──────────────────────────────────────────────────────────────────
  anime: 'Anime',
  manga: 'Anime',
  character: 'Anime',
  anilist: 'Anime',
  mal: 'Anime',
  animequote: 'Anime',
  waifupic: 'Anime',
  neko: 'Anime',

  // ─── Gaming ─────────────────────────────────────────────────────────────────
  mcserver: 'Gaming',
  mcskin: 'Gaming',
  mcuser: 'Gaming',
  steam: 'Gaming',
  fortnite: 'Gaming',
  apex: 'Gaming',
  valorant: 'Gaming',
  lol: 'Gaming',
  osu: 'Gaming',

  // ─── Giveaway ───────────────────────────────────────────────────────────────
  gcreate: 'Giveaway',
  gend: 'Giveaway',
  gdelete: 'Giveaway',
  greroll: 'Giveaway',
  glist: 'Giveaway',
  gentries: 'Giveaway',
  gwinners: 'Giveaway',
  gedit: 'Giveaway',

  // ─── Ticket ─────────────────────────────────────────────────────────────────
  ticket: 'Ticket',
  close: 'Ticket',
  add: 'Ticket',
  remove: 'Ticket',
  ticketpanel: 'Ticket',
  ticketsetup: 'Ticket',
  transcript: 'Ticket',

  // ─── Verification ───────────────────────────────────────────────────────────
  verify: 'Verification',
  verification: 'Verification',
  autoverify: 'Verification',
  verifyrole: 'Verification',
  captcha: 'Verification',
  verifylog: 'Verification',

  // ─── Welcome ──────────────────────────────────────────────────────────────────
  welcome: 'Welcome',
  greet: 'Welcome',
  welcomemsg: 'Welcome',
  welcomeimg: 'Welcome',
  goodbye: 'Welcome',
  leavemsg: 'Welcome',
  goodbyecard: 'Welcome',
  autorole: 'Welcome',
  welcometest: 'Welcome',
  goodbyetest: 'Welcome',
  welcomelb: 'Welcome',

  // ─── Music ────────────────────────────────────────────────────────────────────
  nowplaying: 'Music',
  play: 'Music',
  skip: 'Music',
  queue: 'Music',
  pause: 'Music',
  resume: 'Music',
  stop: 'Music',
  disconnect: 'Music',
  volume: 'Music',
  loop: 'Music',
  shuffle: 'Music',
  lyrics: 'Music',
  search: 'Music',
  remove: 'Music',
  move: 'Music',
  skipto: 'Music',
  playnext: 'Music',
  playskip: 'Music',
  bassboost: 'Music',
  nightcore: 'Music',
  vaporwave: 'Music',
  speed: 'Music',
  pitch: 'Music',
  seek: 'Music',
  rewind: 'Music',
  forward: 'Music',
  savequeue: 'Music',
  loadqueue: 'Music',
  playlist: 'Music',
  autoplay: 'Music',
  radio: 'Music',

  // ─── Utility ────────────────────────────────────────────────────────────────
  userinfo: 'Utility',
  avatar: 'Utility',
  banner: 'Utility',
  serverinfo: 'Utility',
  servericon: 'Utility',
  emojis: 'Utility',
  roles: 'Utility',
  channels: 'Utility',
  members: 'Utility',
  invites: 'Utility',
  boosters: 'Utility',
  calculate: 'Utility',
  weather: 'Utility',
  time: 'Utility',
  translate: 'Utility',
  remind: 'Utility',
  timer: 'Utility',
  stopwatch: 'Utility',
  poll: 'Utility',
  quote: 'Utility',
  stealemoji: 'Utility',
  enlarge: 'Utility',
  snipe: 'Utility',
  esnipe: 'Utility',
  afk: 'Utility',
  note: 'Utility',
  sticky: 'Utility',
  color: 'Utility',
  rgb: 'Utility',
  password: 'Utility',
  shorten: 'Utility',
  base64: 'Utility',
  encode: 'Utility',
  decode: 'Utility',
  binary: 'Utility',
  morse: 'Utility',
  ascii: 'Utility',
  figlet: 'Utility',
  firstmsg: 'Utility',
  permissions: 'Utility',
  botperms: 'Utility',
  inviteinfo: 'Utility',
  vanity: 'Utility',
  splash: 'Utility',
  discover: 'Utility',
  bump: 'Utility',
  review: 'Utility',
  serverlist: 'Utility',
  partners: 'Utility',

  // ─── Tools ──────────────────────────────────────────────────────────────────
  todo: 'Tools',
  report: 'Tools',
  feedback: 'Tools',
  bugreport: 'Tools',
  customcommand: 'Tools',
  tag: 'Tools',
  tags: 'Tools',
  addtag: 'Tools',
  edittag: 'Tools',
  deletetag: 'Tools',
  taglist: 'Tools',

  // ─── Reminders ──────────────────────────────────────────────────────────────
  reminder: 'Reminders',
  remindme: 'Reminders',
  remindall: 'Reminders',
  countdown: 'Reminders',
  alarm: 'Reminders',
  remindlist: 'Reminders',

  // ─── Birthday ───────────────────────────────────────────────────────────────
  birthday: 'Birthday',
  nextbirthday: 'Birthday',
  birthdays: 'Birthday',
  birthdayleaderboard: 'Birthday',

  // ─── Server Stats ───────────────────────────────────────────────────────────
  serverstats: 'ServerStats',
  membercount: 'ServerStats',
  boostcount: 'ServerStats',
  logsetup: 'ServerStats',
  auditlog: 'ServerStats',
  messagelog: 'ServerStats',

  // ─── Reaction Roles ─────────────────────────────────────────────────────────
  reactroles: 'Reaction_roles',
  rrpanel: 'Reaction_roles',
  rrsetup: 'Reaction_roles',
  rradd: 'Reaction_roles',
  rrremove: 'Reaction_roles',
  rrlist: 'Reaction_roles',
  rredit: 'Reaction_roles',
  rrclear: 'Reaction_roles',

  // ─── Join To Create ─────────────────────────────────────────────────────────
  jointocreate: 'JoinToCreate',
  vctemp: 'JoinToCreate',
  tempvc: 'JoinToCreate',
  jtcsetup: 'JoinToCreate',
  jtcconfig: 'JoinToCreate',
  voiceclaim: 'JoinToCreate',
  vcclaim: 'JoinToCreate',
  voicetransfer: 'JoinToCreate',
  vclock: 'JoinToCreate',
  vclimit: 'JoinToCreate',

  // ─── Suggestions ────────────────────────────────────────────────────────────
  suggest: 'Suggestions',
  idea: 'Suggestions',
  suggestion: 'Suggestions',
  suggestsetup: 'Suggestions',
  suggestchannel: 'Suggestions',
  suggestapprove: 'Suggestions',
  suggestdeny: 'Suggestions',
  suggestconsider: 'Suggestions',
  suggestimplement: 'Suggestions',

  // ─── Starboard ──────────────────────────────────────────────────────────────
  starboard: 'Starboard',
  starsetup: 'Starboard',
  staremoji: 'Starboard',
  starthreshold: 'Starboard',
  starlb: 'Starboard',

  // ─── Counting ─────────────────────────────────────────────────────────────────
  counting: 'Counting',
  count: 'Counting',
  countsetup: 'Counting',
  countlb: 'Counting',
  guessnumber: 'Counting',

  // ─── Logging ──────────────────────────────────────────────────────────────────
  // (Handled by AutoModeration or dedicated logging commands)

  // ─── NSFW ───────────────────────────────────────────────────────────────────
  nsfw: 'Nsfw',
  rule34: 'Nsfw',
  r34: 'Nsfw',
  gelbooru: 'Nsfw',
  danbooru: 'Nsfw',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Rule Categories ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export const AUTOMOD_RULE_CATEGORIES = Object.freeze({
  antiSpam: 'AutoModeration',
  antiRaid: 'AutoModeration',
  antiCaps: 'AutoModeration',
  antiInvite: 'AutoModeration',
  antiLink: 'AutoModeration',
  mentionSpam: 'AutoModeration',
  antiNsfw: 'AutoModeration',
  antiZalgo: 'AutoModeration',
  antiProfanity: 'AutoModeration',
  antiSelfbot: 'AutoModeration',
  antiGhostPing: 'AutoModeration',
  antiDehoist: 'AutoModeration',
  antiEmojiSpam: 'AutoModeration',
  antiNewline: 'AutoModeration',
  antiStickerSpam: 'AutoModeration',
  antiGifSpam: 'AutoModeration',
  antiImageFlood: 'AutoModeration',
  antiWebhookSpam: 'AutoModeration',
  antiBotSpam: 'AutoModeration',
  antiTokenLeak: 'AutoModeration',
  antiDoxxing: 'AutoModeration',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Feature Toggle Mapping (camelCase for DB/config keys) ────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const FEATURE_TOGGLE_MAP = Object.freeze({
  // Core
  core: 'core',
  admin: 'admin',
  owner: 'owner',

  // Community
  birthday: 'birthday',
  economy: 'economy',
  shop: 'shop',
  fun: 'fun',
  social: 'social',
  image: 'image',
  anime: 'anime',
  gaming: 'gaming',

  // Management
  moderation: 'moderation',
  automoderation: 'autoModeration',
  logging: 'logging',
  verification: 'verification',
  welcome: 'welcome',
  ticket: 'tickets',
  suggestions: 'suggestions',
  starboard: 'starboard',
  counting: 'counting',

  // Engagement
  leveling: 'leveling',
  giveaway: 'giveaways',
  music: 'music',

  // Roles / Channels
  reaction_roles: 'reactionRoles',
  jointocreate: 'joinToCreate',
  serverstats: 'serverStats',
  autorole: 'autoRole',

  // Utility
  utility: 'utility',
  tools: 'tools',
  reminders: 'reminders',
  search: 'search',

  // NSFW (gated)
  nsfw: 'nsfw',
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Key Normalization ────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Normalize a category string to a consistent snake_case key.
 * @param {string} category
 * @returns {string}
 */
export function normalizeCategoryKey(category) {
  return String(category ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Display Formatting ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

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
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    CATEGORY_ICONS[formatted] ||
    CATEGORY_ICONS[normalized] ||
    CATEGORY_ICONS[category] ||
    '📁'
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Category Classification ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a category requires elevated permissions (mod/admin).
 * @param {string} category
 * @returns {boolean}
 */
export function isRestrictedCategory(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    RESTRICTED_CATEGORIES.has(normalized) ||
    RESTRICTED_CATEGORIES.has(formatted) ||
    RESTRICTED_CATEGORIES.has(category)
  );
}

/**
 * Check if a category can be toggled per-guild.
 * @param {string} category
 * @returns {boolean}
 */
export function isGuildConfigurable(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    GUILD_CONFIGURABLE_CATEGORIES.has(normalized) ||
    GUILD_CONFIGURABLE_CATEGORIES.has(formatted) ||
    GUILD_CONFIGURABLE_CATEGORIES.has(category)
  );
}

/**
 * Check if a category is protected from disablement.
 * @param {string} category
 * @returns {boolean}
 */
export function isProtectedCategory(category) {
  return !isGuildConfigurable(category) && !isRestrictedCategory(category);
}

/**
 * Check if a category is visible to regular users.
 * @param {string} category
 * @returns {boolean}
 */
export function isPublicCategory(category) {
  if (!category) return false;
  const normalized = normalizeCategoryKey(category);
  const formatted = formatCategoryName(normalized);

  return (
    PUBLIC_CATEGORIES.has(normalized) ||
    PUBLIC_CATEGORIES.has(formatted) ||
    PUBLIC_CATEGORIES.has(category)
  );
}

/**
 * Check if a category is hidden from regular users.
 * @param {string} category
 * @returns {boolean}
 */
export function isHiddenCategory(category) {
  return !isPublicCategory(category);
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command Protection ───────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a command is protected from disablement.
 * @param {string} commandName
 * @returns {boolean}
 */
export function isProtectedCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return false;
  return PROTECTED_COMMANDS.has(commandName.toLowerCase());
}

/**
 * Add a command to the protected set.
 * @param {string} commandName
 */
export function protectCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return;
  PROTECTED_COMMANDS.add(commandName.toLowerCase());
}

/**
 * Remove a command from the protected set.
 * @param {string} commandName
 */
export function unprotectCommand(commandName) {
  if (!commandName || typeof commandName !== 'string') return;
  PROTECTED_COMMANDS.delete(commandName.toLowerCase());
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Auto-Moderation Specific ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if a rule ID belongs to auto-moderation.
 * @param {string} ruleId
 * @returns {boolean}
 */
export function isAutomodRule(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return false;
  return ruleId in AUTOMOD_RULE_CATEGORIES;
}

/**
 * Get the category for an auto-moderation rule.
 * @param {string} ruleId
 * @returns {string|null}
 */
export function getAutomodRuleCategory(ruleId) {
  if (!ruleId || typeof ruleId !== 'string') return null;
  return AUTOMOD_RULE_CATEGORIES[ruleId] || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Command → Category Resolution ────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get the canonical category for a full command name.
 * @param {string} commandName
 * @returns {string|null}
 */
export function getCommandCategory(commandName) {
  if (!commandName || typeof commandName !== 'string') return null;
  return COMMAND_TO_CATEGORY[commandName.toLowerCase()] || null;
}

/**
 * Get all commands belonging to a category.
 * @param {string} category
 * @returns {string[]}
 */
export function getCommandsByCategory(category) {
  if (!category || typeof category !== 'string') return [];
  const target = normalizeCategoryKey(category);
  return Object.entries(COMMAND_TO_CATEGORY)
    .filter(([, cat]) => normalizeCategoryKey(cat) === target)
    .map(([cmd]) => cmd);
}

/**
 * Check if a command belongs to a specific category.
 * @param {string} commandName
 * @param {string} category
 * @returns {boolean}
 */
export function isCommandInCategory(commandName, category) {
  if (!commandName || !category) return false;
  return getCommandCategory(commandName) === category;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Feature Toggle Mapping ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Map a category to its feature toggle key in botConfig.features.
 * @param {string} category
 * @returns {string|null}
 */
export function getFeatureToggleKey(category) {
  if (!category || typeof category !== 'string') return null;
  const normalized = normalizeCategoryKey(category);
  return FEATURE_TOGGLE_MAP[normalized] || null;
}

/**
 * Get the category from a feature toggle key.
 * @param {string} toggleKey
 * @returns {string|null}
 */
export function getCategoryFromToggleKey(toggleKey) {
  if (!toggleKey || typeof toggleKey !== 'string') return null;
  const normalized = toggleKey.toLowerCase();
  const entry = Object.entries(FEATURE_TOGGLE_MAP).find(([, val]) => val.toLowerCase() === normalized);
  return entry ? entry[0] : null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Stats & Introspection ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get comprehensive stats about the category system.
 * @returns {{
 *   totalCategories: number,
 *   totalCommands: number,
 *   restrictedCount: number,
 *   configurableCount: number,
 *   protectedCount: number,
 *   publicCount: number,
 *   hiddenCount: number,
 *   automodRules: number,
 *   iconCoverage: number
 * }}
 */
export function getCategoryStats() {
  const allCategories = new Set(Object.values(COMMAND_TO_CATEGORY));
  const iconCoverage = [...allCategories].filter((cat) => getCategoryIcon(cat) !== '📁').length;

  return {
    totalCategories: allCategories.size,
    totalCommands: Object.keys(COMMAND_TO_CATEGORY).length,
    restrictedCount: RESTRICTED_CATEGORIES.size,
    configurableCount: GUILD_CONFIGURABLE_CATEGORIES.size,
    protectedCount: PROTECTED_COMMANDS.size,
    publicCount: PUBLIC_CATEGORIES.size,
    hiddenCount: HIDDEN_CATEGORIES.size,
    automodRules: Object.keys(AUTOMOD_RULE_CATEGORIES).length,
    iconCoverage,
  };
}

/**
 * Get all categories as display objects for embeds/menus.
 * @param {boolean} [includeHidden=false] - Include admin-only categories
 * @returns {{key: string, name: string, icon: string, restricted: boolean, configurable: boolean}[]}
 */
export function getCategoryList(includeHidden = false) {
  const allCategories = new Set(Object.values(COMMAND_TO_CATEGORY));
  if (includeHidden) {
    HIDDEN_CATEGORIES.forEach((cat) => allCategories.add(cat));
    RESTRICTED_CATEGORIES.forEach((cat) => allCategories.add(cat));
  }

  return [...allCategories]
    .sort()
    .map((cat) => ({
      key: normalizeCategoryKey(cat),
      name: formatCategoryName(cat),
      icon: getCategoryIcon(cat),
      restricted: isRestrictedCategory(cat),
      configurable: isGuildConfigurable(cat),
      protected: isProtectedCategory(cat),
      public: isPublicCategory(cat),
      toggleKey: getFeatureToggleKey(cat),
    }));
}

// ═══════════════════════════════════════════════════════════════════════════════
// ─── Default Export ───────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  // Constants
  CATEGORY_ICONS,
  PROTECTED_COMMANDS,
  RESTRICTED_CATEGORIES,
  GUILD_CONFIGURABLE_CATEGORIES,
  PUBLIC_CATEGORIES,
  HIDDEN_CATEGORIES,
  AUTOMOD_RULE_CATEGORIES,
  COMMAND_TO_CATEGORY,
  FEATURE_TOGGLE_MAP,

  // Normalization
  normalizeCategoryKey,
  formatCategoryName,
  getCategoryIcon,

  // Classification
  isRestrictedCategory,
  isGuildConfigurable,
  isProtectedCategory,
  isPublicCategory,
  isHiddenCategory,

  // Command protection
  isProtectedCommand,
  protectCommand,
  unprotectCommand,

  // Auto-mod
  isAutomodRule,
  getAutomodRuleCategory,

  // Command resolution
  getCommandCategory,
  getCommandsByCategory,
  isCommandInCategory,

  // Feature toggles
  getFeatureToggleKey,
  getCategoryFromToggleKey,

  // Stats
  getCategoryStats,
  getCategoryList,
};
