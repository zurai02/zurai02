import 'dotenv/config';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { REST } from '@discordjs/rest';
import express from 'express';
import cron from 'node-cron';
import { performance } from 'node:perf_hooks';

import config from './config/application.js';
import { initializeDatabase } from './utils/database.js';
import { getServerCounters, saveServerCounters, updateCounter } from './services/serverstatsService.js';
import { logger, startupLog, shutdownLog } from './utils/logger.js';
import { checkBirthdays } from './services/birthdayService.js';
import { checkGiveaways } from './services/giveawayService.js';
import { loadCommands, registerCommands as registerSlashCommands } from './handlers/loaders/commandLoader.js';
import { runSafeTask, handleTaskError, ErrorCodes } from './utils/errorHandler.js';
import { initializeMusic } from './services/music/riffySetup.js';
import { shutdownMusic } from './services/music/playerHandler.js';
import { LavalinkNodeManager } from './services/lavalinkNodeManager.js';
import pkg from '../package.json' with { type: 'json' };
import { EXPECTED_SCHEMA_VERSION, EXPECTED_SCHEMA_LABEL } from './config/database/schemaVersion.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const SHUTDOWN_TIMEOUT_MS = 30_000;
const CRON_JOBS = {
  BIRTHDAY: '0 6 * * *',
  GIVEAWAY: '* * * * *',
  COUNTER: '*/15 * * * *',
};

// ─── TitanBot Class ───────────────────────────────────────────────────────────

class TitanBot extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });

    this.config = config;
    this.commands = new Collection();
    this.events = new Collection();
    this.buttons = new Collection();
    this.selectMenus = new Collection();
    this.modals = new Collection();
    this.cooldowns = new Collection();
    this.db = null;
    this.rest = new REST({ version: '10' }).setToken(config.bot.token);
    this.lavalink = null;
    this.webServer = null;
    this._shuttingDown = false;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async start() {
    const bootStart = performance.now();

    try {
      startupLog('Starting TitanBot...');
      await this._delay(1000);

      await this._initDatabase();
      await this._initWebServer();
      await this._initCommands();
      await this._initHandlers();
      await this._initMusic();
      await this._initDiscord();
      await this._initCronJobs();

      const elapsed = (performance.now() - bootStart).toFixed(2);
      startupLog(`ONLINE ✅ | ${this.commands.size} commands | ${this.buttons.size} buttons, ${this.selectMenus.size} menus, ${this.modals.size} modals | ${elapsed}ms`);

      logger.info('TitanBot started', {
        event: 'bot.ready',
        commands: this.commands.size,
        buttons: this.buttons.size,
        selectMenus: this.selectMenus.size,
        modals: this.modals.size,
        guilds: this.guilds.cache.size,
        elapsedMs: Number(elapsed),
      });
    } catch (error) {
      logger.error('Failed to start bot', { event: 'bot.start.failed', error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  async shutdown(reason = 'UNKNOWN') {
    if (this._shuttingDown) return;
    this._shuttingDown = true;

    shutdownLog(`Bot is shutting down (${reason})...`);
    logger.info('Graceful shutdown initiated', { event: 'shutdown.start', reason });

    const timer = setTimeout(() => {
      logger.error('Shutdown timed out, forcing exit', { event: 'shutdown.timeout', reason });
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    try {
      await this._stopCronJobs();
      await this._stopMusic();
      await this._stopWebServer();
      await this._stopDatabase();
      await this._stopDiscord();

      logger.info('Graceful shutdown complete', { event: 'shutdown.complete', reason });
      shutdownLog('Bot stopped successfully.');
    } catch (error) {
      logger.error('Error during shutdown', { event: 'shutdown.error', error: error.message, reason });
    } finally {
      clearTimeout(timer);
      process.exit(0);
    }
  }

  // ─── Initialization Phases ──────────────────────────────────────────────────

  async _initDatabase() {
    startupLog('Initializing database...');
    const dbInstance = await initializeDatabase();
    this.db = dbInstance.db;

    const dbStatus = this.db.getStatus();
    if (dbStatus.isDegraded) {
      logger.warn('Database running in degraded mode', {
        event: 'db.degraded',
        connectionType: dbStatus.connectionType,
        degradedReason: dbStatus.degradedReason,
      });
    } else {
      startupLog(`✅ Database: ${dbStatus.connectionType}`);
    }
  }

  async _initWebServer() {
    startupLog('Starting web server...');
    this.startWebServer();
  }

  async _initCommands() {
    startupLog('Loading commands...');
    await loadCommands(this);
    startupLog(`✅ Commands loaded: ${this.commands.size}`);
  }

  async _initHandlers() {
    startupLog('Loading handlers...');
    await this.loadHandlers();
    startupLog('✅ Handlers loaded');
  }

  async _initMusic() {
    startupLog('Initializing music system...');
    this.lavalink = new LavalinkNodeManager();
    await this.lavalink.start();

    const bestNode = this.lavalink.getBestNode();
    if (!bestNode) {
      logger.warn('No Lavalink nodes available, music features disabled', { event: 'lavalink.unavailable' });
    } else {
      startupLog(`✅ Lavalink: ${bestNode.name} (${bestNode.tier})`);
    }

    initializeMusic(this);
  }

  async _initDiscord() {
    startupLog('Logging into Discord...');
    await this.login(this.config.bot.token);
    startupLog('✅ Discord login successful');

    startupLog('Registering slash commands...');
    await this.registerCommands();
    startupLog('✅ Slash commands registered');
  }

  async _initCronJobs() {
    this._cronTasks = [];
    this._cronTasks.push(
      cron.schedule(CRON_JOBS.BIRTHDAY, runSafeTask('birthday_check', () => checkBirthdays(this))),
      cron.schedule(CRON_JOBS.GIVEAWAY, runSafeTask('giveaway_check', () => checkGiveaways(this))),
      cron.schedule(CRON_JOBS.COUNTER, runSafeTask('counter_update', () => this.updateAllCounters()))
    );
  }

  // ─── Shutdown Phases ────────────────────────────────────────────────────────

  async _stopCronJobs() {
    logger.info('Stopping cron jobs...', { event: 'shutdown.cron' });
    this._cronTasks?.forEach((task) => task.stop());
    logger.info('✅ Cron jobs stopped', { event: 'shutdown.cron.done' });
  }

  async _stopMusic() {
    logger.info('Stopping music players...', { event: 'shutdown.music' });
    await shutdownMusic(this);
    await this.lavalink?.stop();
    logger.info('✅ Music players stopped', { event: 'shutdown.music.done' });
  }

  async _stopWebServer() {
    if (!this.webServer) return;
    logger.info('Closing web server...', { event: 'shutdown.web' });
    await new Promise((resolve) => this.webServer.close(resolve));
    logger.info('✅ Web server closed', { event: 'shutdown.web.done' });
  }

  async _stopDatabase() {
    if (!this.db?.db?.pool) return;
    logger.info('Closing database connection...', { event: 'shutdown.db' });
    try {
      await this.db.db.pool.end();
      logger.info('✅ Database connection closed', { event: 'shutdown.db.done' });
    } catch (error) {
      logger.warn('Error closing database pool', { event: 'shutdown.db.error', error: error.message });
    }
  }

  async _stopDiscord() {
    if (!this.isReady()) return;
    logger.info('Destroying Discord client...', { event: 'shutdown.discord' });
    try {
      this.destroy();
      logger.info('✅ Discord client destroyed', { event: 'shutdown.discord.done' });
    } catch (error) {
      logger.warn('Discord client destroy warning', { event: 'shutdown.discord.warn', error: error.message });
    }
  }

  // ─── Web Server ─────────────────────────────────────────────────────────────

  startWebServer() {
    const app = express();
    const configuredPort = Number(this.config.api?.port || process.env.PORT || 3000);
    const maxRetries = Number(process.env.PORT_RETRY_ATTEMPTS || 5);
    const host = process.env.WEB_HOST || '0.0.0.0';

    this._setupMiddleware(app);
    this._setupRoutes(app);

    this._bindServer(app, configuredPort, host, maxRetries);
  }

  _setupMiddleware(app) {
    const corsOrigin = this.config.api?.cors?.origin || '*';

    app.use((req, res, next) => {
      const allowed = Array.isArray(corsOrigin) ? corsOrigin : [corsOrigin];
      const origin = req.headers.origin;

      if (allowed.includes('*') || allowed.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin || '*');
      }
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    const requestCounts = new Map();
    const windowMs = this.config.api?.rateLimit?.windowMs || 60_000;
    const maxRequests = this.config.api?.rateLimit?.max || 100;

    app.use((req, res, next) => {
      const ip = req.ip;
      const now = Date.now();
      const windowStart = now - windowMs;

      const times = (requestCounts.get(ip) || []).filter((t) => t > windowStart);
      if (times.length >= maxRequests) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      times.push(now);
      requestCounts.set(ip, times);
      next();
    });
  }

  _setupRoutes(app) {
    app.get('/health', (req, res) => {
      const dbStatus = this.db?.getStatus?.() || { isDegraded: true, connectionType: 'none' };
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          connected: dbStatus.connectionType !== 'none',
          degraded: dbStatus.isDegraded,
          type: dbStatus.connectionType,
        },
      });
    });

    app.get('/ready', (req, res) => {
      const dbStatus = this.db?.getStatus?.() || { isDegraded: true, connectionType: 'none' };
      const isReady = this.isReady() && !dbStatus.isDegraded;

      const metrics = {
        guildCount: this.guilds?.cache?.size ?? 0,
        commandCount: this.commands?.size ?? 0,
        database: {
          mode: dbStatus.connectionType,
          degraded: dbStatus.isDegraded,
          degradedReason: dbStatus.degradedReason ?? null,
        },
        schemaVersion: EXPECTED_SCHEMA_VERSION,
        schemaLabel: EXPECTED_SCHEMA_LABEL,
        lavalink: this.lavalink?.getStatus() || null,
      };

      if (isReady) {
        return res.status(200).json({ ready: true, message: 'Bot is ready', metrics });
      }

      res.status(503).json({
        ready: false,
        reason: !this.isReady() ? 'Bot not ready' : 'Database degraded',
        metrics,
      });
    });

    app.get('/', (req, res) => {
      res.status(200).json({
        message: 'TitanBot System Online',
        version: pkg.version,
        timestamp: new Date().toISOString(),
      });
    });
  }

  _bindServer(app, port, host, maxRetries, attempt = 0) {
    let listening = false;
    const server = app.listen(port, host, () => {
      listening = true;
      this.webServer = server;
      startupLog(`✅ Web Server: ${host}:${port}`);
      startupLog(`   Health:  http://${host}:${port}/health`);
      startupLog(`   Ready:   http://${host}:${port}/ready`);
    });

    server.on('error', (error) => {
      if (!listening && error.code === 'EADDRINUSE' && attempt < maxRetries) {
        startupLog(`Port ${port} in use, trying ${port + 1}...`);
        setTimeout(() => this._bindServer(app, port + 1, host, maxRetries, attempt + 1), 250);
        return;
      }

      if (listening && error.code === 'EADDRINUSE') {
        logger.warn('Duplicate bind warning (non-critical)', { event: 'web.duplicate_bind', port });
        return;
      }

      logger.error('Web server error', { event: 'web.error', code: error.code, message: error.message });
      if (!listening) process.exit(1);
    });
  }

  // ─── Cron Jobs ──────────────────────────────────────────────────────────────

  updateAllCounters() {
    if (!this.db) {
      logger.warn('Database not available for counter updates', { event: 'counter.skip' });
      return;
    }

    const promises = [];
    for (const [guildId, guild] of this.guilds.cache) {
      promises.push(this._updateGuildCounters(guildId, guild));
    }

    return Promise.allSettled(promises);
  }

  async _updateGuildCounters(guildId, guild) {
    try {
      const counters = await getServerCounters(this, guildId);
      const valid = [];
      const orphaned = [];

      for (const counter of counters) {
        if (!counter?.type || !counter.channelId || counter.enabled === false) continue;

        const channel = guild.channels.cache.get(counter.channelId);
        if (channel) {
          valid.push(counter);
          await updateCounter(this, guild, counter);
        } else {
          orphaned.push(counter);
          logger.info('Removing orphaned counter', {
            event: 'counter.orphan',
            counterId: counter.id,
            type: counter.type,
            channelId: counter.channelId,
            guildId,
          });
        }
      }

      if (orphaned.length > 0) {
        await saveServerCounters(this, guildId, valid);
        logger.info('Cleaned up orphaned counters', { event: 'counter.cleanup', count: orphaned.length, guildId });
      }
    } catch (error) {
      logger.error('Counter update failed', { event: 'counter.error', guildId, error: error.message });
    }
  }

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async loadHandlers() {
    const handlers = [
      { path: 'events', required: true },
      { path: 'interactions', required: true },
    ];

    for (const { path, required } of handlers) {
      try {
        startupLog(`Loading handler: ${path}`);
        const { default: loader } = await import(`./handlers/loaders/${path}.js`);
        if (typeof loader !== 'function') throw new Error(`Invalid export from ${path}`);
        await loader(this);
        startupLog(`✅ Loaded ${path}`);
      } catch (error) {
        if (required) {
          logger.error('Failed to load required handler', { event: 'handler.error', path, error: error.message });
          throw error;
        }
        logger.warn('Failed to load optional handler', { event: 'handler.warn', path, error: error.message });
      }
    }
  }

  async registerCommands() {
    try {
      await registerSlashCommands(this, { clientId: this.config.bot.clientId });
    } catch (error) {
      logger.error('Command registration failed', { event: 'commands.register.error', error: error.message });
    }
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Process Setup ────────────────────────────────────────────────────────────

const bot = new TitanBot();

process.once('SIGTERM', () => bot.shutdown('SIGTERM'));
process.once('SIGINT', () => bot.shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  handleTaskError('uncaught_exception', error, { fatal: true });
  bot.shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
  const code = reason?.code;
  if ([10062, 40060, 50027].includes(code)) {
    logger.warn('Recoverable Discord interaction rejection', { event: 'discord.recoverable', code, reason: reason?.message });
    return;
  }
  if (reason?.message?.includes('Queue is empty')) return;

  handleTaskError('unhandled_rejection', reason instanceof Error ? reason : new Error(String(reason)), {
    errorCode: ErrorCodes.UNHANDLED_REJECTION,
  });
});

// ─── Boot ─────────────────────────────────────────────────────────────────────

bot.start().catch((error) => {
  logger.error('Fatal startup error', { event: 'bot.start.fatal', error: error.message, stack: error.stack });
  bot.shutdown('STARTUP_ERROR');
});

export default TitanBot;
