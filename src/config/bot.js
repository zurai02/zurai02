import { logger } from '../utils/logger.js';

// ─── Constants ────────────────────────────────────────────────────────────────

const HEX_PREFIX = '#';
const HEX_RADIX = 16;
const DISCORD_INTENTS = Object.freeze({
  GUILDS: 1 << 0,
  GUILD_MEMBERS: 1 << 1,
  GUILD_BANS: 1 << 2,
  GUILD_EMOJIS_AND_STICKERS: 1 << 3,
  GUILD_INTEGRATIONS: 1 << 4,
  GUILD_WEBHOOKS: 1 << 5,
  GUILD_INVITES: 1 << 6,
  GUILD_VOICE_STATES: 1 << 7,
  GUILD_PRESENCES: 1 << 8,
  GUILD_MESSAGES: 1 << 9,
  GUILD_MESSAGE_REACTIONS: 1 << 10,
  GUILD_MESSAGE_TYPING: 1 << 11,
  DIRECT_MESSAGES: 1 << 12,
  DIRECT_MESSAGE_REACTIONS: 1 << 13,
  DIRECT_MESSAGE_TYPING: 1 << 14,
  MESSAGE_CONTENT: 1 << 15,
  GUILD_SCHEDULED_EVENTS: 1 << 16,
  AUTO_MODERATION_CONFIGURATION: 1 << 20,
  AUTO_MODERATION_EXECUTION: 1 << 21,
});

const ACTIVITY_TYPES = Object.freeze({
  PLAYING: 0,
  STREAMING: 1,
  LISTENING: 2,
  WATCHING: 3,
  CUSTOM: 4,
  COMPETING: 5,
});

const COMMAND_CATEGORY_FEATURE_MAP = Object.freeze({
  birthday: 'birthday',
  community: 'community',
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
});

const TIME = Object.freeze({
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseHex(color) {
  if (typeof color !== 'string') return null;
  const clean = color.trim();
  if (!clean.startsWith(HEX_PREFIX)) return null;
  const parsed = Number.parseInt(clean.slice(1), HEX_RADIX);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeCategoryKey(category) {
  return String(category ?? '').trim().toLowerCase().replace(/\s+/g, '_');
}

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const props = Object.getOwnPropertyNames(obj);
  for (const name of props) {
    const value = obj[name];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}

// ─── Configuration ────────────────────────────────────────────────────────────

export const botConfig = deepFreeze({
  // =========================
  // BOT PRESENCE
  // =========================
  presence: {
    status: 'online',
    activities: [
      {
        name: 'Custom Status',
        state: 'stalking',
        type: ACTIVITY_TYPES.CUSTOM,
      },
    ],
  },

  // =========================
  // COMMAND BEHAVIOR
  // =========================
  commands: {
    owners: process.env.OWNER_IDS?.split(',').map((id) => id.trim()).filter(Boolean) ?? [],
    defaultCooldown: 3,
    deleteCommands: false,
    testGuildId: process.env.TEST_GUILD_ID,
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    prefix: process.env.PREFIX || '!',
  },

  // =========================
  // APPLICATIONS SYSTEM
  // =========================
  applications: {
    defaultQuestions: [
      { question: 'What is your name?', required: true },
      { question: 'How old are you?', required: true },
      { question: 'Why do you want to join?', required: true },
    ],
    statusColors: {
      pending: '#FFA500',
      approved: '#00FF00',
      denied: '#FF0000',
    },
    applicationCooldown: 24,
    deleteDeniedAfter: 7,
    deleteApprovedAfter: 30,
    managerRoles: [],
  },

  // =========================
  // EMBED COLORS & BRANDING
  // =========================
  embeds: {
    colors: {
      primary: '#336699',
      secondary: '#2F3136',
      success: '#57F287',
      error: '#ED4245',
      warning: '#FEE75C',
      info: '#3498DB',
      light: '#FFFFFF',
      dark: '#202225',
      gray: '#99AAB5',
      blurple: '#5865F2',
      green: '#57F287',
      yellow: '#FEE75C',
      fuchsia: '#EB459E',
      red: '#ED4245',
      black: '#000000',
      giveaway: {
        active: '#57F287',
        ended: '#ED4245',
      },
      ticket: {
        open: '#57F287',
        claimed: '#FAA61A',
        closed: '#ED4245',
        pending: '#99AAB5',
      },
      economy: '#F1C40F',
      birthday: '#E91E63',
      moderation: '#9B59B6',
      priority: {
        none: '#95A5A6',
        low: '#3498db',
        medium: '#2ecc71',
        high: '#f1c40f',
        urgent: '#e74c3c',
      },
    },
    footer: {
      text: 'Titan Bot',
      icon: null,
    },
    thumbnail: null,
    author: {
      name: null,
      icon: null,
      url: null,
    },
  },

  // =========================
  // ECONOMY SETTINGS
  // =========================
  economy: {
    currency: {
      name: 'coins',
      namePlural: 'coins',
      symbol: '$',
    },
    startingBalance: 0,
    baseBankCapacity: 100000,
    dailyAmount: 100,
    workMin: 10,
    workMax: 100,
    begMin: 5,
    begMax: 50,
    cooldowns: {
      daily: TIME.DAY,
      work: TIME.HOUR,
      crime: 2 * TIME.HOUR,
      rob: 4 * TIME.HOUR,
    },
    robSuccessRate: 0.4,
    robFailJailTime: TIME.HOUR,
  },

  // =========================
  // SHOP SETTINGS
  // =========================
  shop: {},

  // =========================
  // TICKET SYSTEM
  // =========================
  tickets: {
    defaultCategory: null,
    supportRoles: [],
    priorities: {
      none: { emoji: '⚪', color: '#95A5A6', label: 'None' },
      low: { emoji: '🟢', color: '#2ECC71', label: 'Low' },
      medium: { emoji: '🟡', color: '#F1C40F', label: 'Medium' },
      high: { emoji: '🔴', color: '#E74C3C', label: 'High' },
      urgent: { emoji: '🚨', color: '#E91E63', label: 'Urgent' },
    },
    defaultPriority: 'none',
    archiveCategory: null,
    logChannel: null,
  },

  // =========================
  // GIVEAWAY SETTINGS
  // =========================
  giveaways: {
    defaultDuration: TIME.DAY,
    minimumWinners: 1,
    maximumWinners: 10,
    minimumDuration: 5 * TIME.MINUTE,
    maximumDuration: 30 * TIME.DAY,
    allowedRoles: [],
    bypassRoles: [],
  },

  // =========================
  // BIRTHDAY SETTINGS
  // =========================
  birthday: {
    defaultRole: null,
    announcementChannel: null,
    timezone: 'UTC',
  },

  // =========================
  // VERIFICATION SETTINGS
  // =========================
  verification: {
    defaultMessage: 'Click the button below to verify yourself and gain access to the server!',
    defaultButtonText: 'Verify',
    autoVerify: {
      defaultCriteria: 'none',
      defaultAccountAgeDays: 7,
      serverSizeThreshold: 1000,
      minAccountAge: 1,
      maxAccountAge: 365,
      sendDMNotification: true,
      criteria: {
        account_age: 'Account must be older than specified days',
        server_size: 'All users if server has less than 1000 members',
        none: 'All users immediately',
      },
    },
    verificationCooldown: 5 * TIME.SECOND,
    maxVerificationAttempts: 3,
    attemptWindow: TIME.MINUTE,
    maxCooldownEntries: 10000,
    maxAttemptEntries: 10000,
    cooldownCleanupInterval: 5 * TIME.MINUTE,
    maxAuditMetadataBytes: 4096,
    maxInMemoryAuditEntries: 1000,
    logAllVerifications: true,
    keepAuditTrail: true,
  },

  // =========================
  // WELCOME / GOODBYE
  // =========================
  welcome: {
    defaultWelcomeMessage: 'Welcome {user} to {server}! We now have {memberCount} members!',
    defaultGoodbyeMessage: '{user} has left the server. We now have {memberCount} members.',
    defaultWelcomeChannel: null,
    defaultGoodbyeChannel: null,
  },

  // =========================
  // COUNTER CHANNELS
  // =========================
  counters: {
    defaults: {
      name: '{name} Counter',
      description: 'Server {name} counter',
      type: 'voice',
      channelName: '{name}-{count}',
    },
    permissions: {
      deny: ['VIEW_CHANNEL'],
      allow: ['VIEW_CHANNEL', 'CONNECT', 'SPEAK'],
    },
    messages: {
      created: '✅ Created counter **{name}**',
      deleted: '🗑️ Deleted counter **{name}**',
      updated: '🔄 Updated counter **{name}**',
    },
    types: {
      members: {
        name: '👥 Members',
        description: 'Total members in the server',
        getCount: (guild) => guild.memberCount.toString(),
      },
      bots: {
        name: '🤖 Bots',
        description: 'Total bot accounts in the server',
        getCount: (guild) => guild.members.cache.filter((m) => m.user.bot).size.toString(),
      },
      members_only: {
        name: '👤 Humans',
        description: 'Total human members (non-bots)',
        getCount: (guild) => guild.members.cache.filter((m) => !m.user.bot).size.toString(),
      },
    },
  },

  // =========================
  // GENERIC MESSAGES
  // =========================
  messages: {
    noPermission: 'You do not have permission to use this command.',
    cooldownActive: 'Please wait {time} before using this command again.',
    errorOccurred: 'An error occurred while executing this command.',
    missingPermissions: 'I am missing required permissions to perform this action.',
    commandDisabled: 'This command has been disabled.',
    maintenanceMode: 'The bot is currently in maintenance mode.',
  },

  // =========================
  // FEATURE TOGGLES
  // =========================
  features: {
    economy: true,
    leveling: true,
    moderation: true,
    logging: true,
    welcome: true,
    tickets: true,
    giveaways: true,
    birthday: true,
    counter: true,
    verification: true,
    reactionRoles: true,
    joinToCreate: true,
    voice: true,
    search: true,
    tools: true,
    utility: true,
    community: true,
    fun: true,
    music: true,
  },
});

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateConfig() {
  const errors = [];

  const hasToken = Boolean(process.env.DISCORD_TOKEN || process.env.TOKEN);
  const hasClientId = Boolean(process.env.CLIENT_ID);
  const hasConnectionUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  const isProduction = process.env.NODE_ENV === 'production';

  if (process.env.NODE_ENV !== 'production') {
    logger.debug('Environment check', {
      event: 'config.env.debug',
      hasDiscordToken: !!process.env.DISCORD_TOKEN,
      hasToken: !!process.env.TOKEN,
      hasClientId: !!process.env.CLIENT_ID,
      hasGuildId: !!process.env.GUILD_ID,
      hasPostgresHost: !!process.env.POSTGRES_HOST,
      nodeEnv: process.env.NODE_ENV,
    });
  }

  if (!hasToken) {
    errors.push('Bot token is required (DISCORD_TOKEN or TOKEN environment variable)');
  }
  if (!hasClientId) {
    errors.push('Client ID is required (CLIENT_ID environment variable)');
  }
  if (isProduction && !hasConnectionUrl && !process.env.POSTGRES_HOST) {
    errors.push('PostgreSQL connection is required in production (set DATABASE_URL/POSTGRES_URL, or POSTGRES_HOST)');
  }

  return errors;
}

const configErrors = validateConfig();
if (configErrors.length > 0) {
  logger.error('Configuration errors', { event: 'config.invalid', errors: configErrors });
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export { ACTIVITY_TYPES, DISCORD_INTENTS, TIME, COMMAND_CATEGORY_FEATURE_MAP };

export function getCommandPrefix() {
  return botConfig.commands.prefix;
}

export function getBotOwners() {
  return [...botConfig.commands.owners];
}

export function isBotOwner(userId) {
  if (!userId) return false;
  return botConfig.commands.owners.includes(String(userId));
}

export function isMaintenanceMode() {
  return botConfig.commands.maintenanceMode;
}

export function getBotMessage(key, replacements = {}) {
  let message = botConfig.messages[key] ?? key;
  for (const [placeholder, value] of Object.entries(replacements)) {
    message = message.replaceAll(`{${placeholder}}`, String(value));
  }
  return message;
}

export function isFeatureEnabled(featureKey) {
  if (!featureKey) return true;
  return botConfig.features[featureKey] !== false;
}

export function isCommandCategoryEnabled(category) {
  const normalized = normalizeCategoryKey(category);
  if (!normalized || normalized === 'core') return true;
  const featureKey = COMMAND_CATEGORY_FEATURE_MAP[normalized];
  if (!featureKey) return true;
  return isFeatureEnabled(featureKey);
}

export function getApplicationStatusColor(status) {
  const hex = botConfig.applications.statusColors[status];
  return hex ? getColor(hex) : getColor(status === 'approved' ? 'success' : status === 'denied' ? 'error' : 'warning');
}

export function getDefaultApplicationQuestions() {
  return botConfig.applications.defaultQuestions
    .map((entry) => (typeof entry === 'string' ? entry : entry.question))
    .filter(Boolean);
}

/**
 * Resolve a color path to a Discord-ready integer.
 * @param {string|number} path - Dot-path like 'success', 'ticket.open', or raw hex/number
 * @param {string} [fallback='#99AAB5'] - Fallback hex color
 * @returns {number} Discord color integer
 */
export function getColor(path, fallback = '#99AAB5') {
  if (typeof path === 'number') return path;

  const hex = parseHex(path);
  if (hex !== null) return hex;

  const result = path.split('.').reduce((obj, key) => obj?.[key] ?? fallback, botConfig.embeds.colors);

  const resultHex = parseHex(result);
  if (resultHex !== null) return resultHex;

  return parseHex(fallback) ?? 0x99aab5;
}

export function getRandomColor() {
  const colors = Object.values(botConfig.embeds.colors).flatMap((color) =>
    typeof color === 'string' ? color : Object.values(color).filter((c) => typeof c === 'string')
  );
  return colors[Math.floor(Math.random() * colors.length)];
}

export default botConfig;
