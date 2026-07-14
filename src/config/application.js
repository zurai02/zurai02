import { fileURLToPath } from 'node:url';
import path from 'node:path';
import botConfig, { validateConfig } from './bot.js';
import { shopConfig as shop } from './shop/index.js';
import { pgConfig } from './database/postgres.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Validation (fail fast before building config) ───────────────────────────

const configErrors = validateConfig();
if (configErrors.length > 0) {
  // eslint-disable-next-line no-console
  console.error('[CONFIG] Validation failed:', configErrors.join('\n'));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

// ─── Path Resolution ─────────────────────────────────────────────────────────

const ROOT = path.join(__dirname, '../..');

const PATHS = Object.freeze({
  root: ROOT,
  src: path.join(ROOT, 'src'),
  commands: path.join(ROOT, 'src', 'commands'),
  events: path.join(ROOT, 'src', 'events'),
  config: __dirname,
  utils: path.join(ROOT, 'src', 'utils'),
  services: path.join(ROOT, 'src', 'services'),
  handlers: path.join(ROOT, 'src', 'handlers'),
  interactions: path.join(ROOT, 'src', 'interactions'),
  scripts: path.join(ROOT, 'scripts'),
  logs: path.join(ROOT, 'logs'),
  backups: path.join(ROOT, 'backups'),
  tests: path.join(ROOT, 'tests'),
});

// ─── Environment ─────────────────────────────────────────────────────────────

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const IS_DEVELOPMENT = !IS_PRODUCTION;

// ─── CORS Parsing ──────────────────────────────────────────────────────────────

function parseCorsOrigin(raw) {
  if (!raw) return '*';
  const origins = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

// ─── Application Config ────────────────────────────────────────────────────────

const appConfig = Object.freeze({
  // ─── Paths ──────────────────────────────────────────────────────────────────
  paths: PATHS,

  // ─── Bot ────────────────────────────────────────────────────────────────────
  bot: Object.freeze({
    ...botConfig,
    token: process.env.DISCORD_TOKEN || process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID, // tutorial/setup compatibility only

    shop: Object.freeze({
      ...botConfig.shop,
      ...shop,
    }),
  }),

  // ─── Database ───────────────────────────────────────────────────────────────
  postgresql: Object.freeze({
    ...pgConfig,
  }),

  // ─── Logging ────────────────────────────────────────────────────────────────
  logging: Object.freeze({
    level: process.env.LOG_LEVEL || 'info',
    file: Object.freeze({
      enabled: process.env.LOG_TO_FILE === 'true',
      path: PATHS.logs,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    }),
    console: Object.freeze({
      enabled: true,
      colorize: true,
      timestamp: true,
    }),
    sentry: Object.freeze({
      enabled: Boolean(process.env.SENTRY_DSN),
      dsn: process.env.SENTRY_DSN,
      environment: NODE_ENV,
    }),
  }),

  // ─── API / Web Server ───────────────────────────────────────────────────────
  api: Object.freeze({
    port: Number(process.env.PORT) || 3000,
    host: process.env.WEB_HOST || '0.0.0.0',
    cors: Object.freeze({
      origin: parseCorsOrigin(process.env.CORS_ORIGIN),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
    rateLimit: Object.freeze({
      windowMs: 15 * 60 * 1000,
      max: 100,
    }),
  }),

  // ─── Shop (standalone export compatibility) ─────────────────────────────────
  shop: Object.freeze(shop),

  // ─── Features ───────────────────────────────────────────────────────────────
  features: Object.freeze({
    ...botConfig.features,
    music: botConfig.features?.music ?? true,
  }),

  // ─── Environment ──────────────────────────────────────────────────────────────
  env: NODE_ENV,
  isProduction: IS_PRODUCTION,
  isDevelopment: IS_DEVELOPMENT,
  isTest: NODE_ENV === 'test',
  isStaging: NODE_ENV === 'staging',
});

// ─── Deep Freeze Helper ───────────────────────────────────────────────────────

function deepFreeze(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  const propNames = Object.getOwnPropertyNames(obj);
  for (const name of propNames) {
    const value = obj[name];
    if (value !== null && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(obj);
}

deepFreeze(appConfig);

// ─── Exports ─────────────────────────────────────────────────────────────────

export default appConfig;

export {
  PATHS as paths,
  NODE_ENV as env,
  IS_PRODUCTION as isProduction,
  IS_DEVELOPMENT as isDevelopment,
};
