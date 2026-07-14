#!/usr/bin/env node
/**
 * TitanBot Entry Point
 *
 * Responsibilities:
 *   - Graceful startup / shutdown lifecycle
 *   - Signal handling (SIGINT, SIGTERM, SIGUSR2 for zero-downtime restart)
 *   - Uncaught exception / unhandled rejection guards
 *   - Process title and resource limit hints
 *   - Optional: cluster mode readiness
 */

import { createRequire } from 'node:module';
import { env, exit } from 'node:process';

// ─── Crash Guards (must be first) ───────────────────────────────────────────

process.on('uncaughtException', (error, origin) => {
  console.error(`[FATAL] Uncaught exception at ${origin}:`, error);
  exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled rejection at:', promise, 'reason:', reason);
  exit(1);
});

// ─── Process Identity ─────────────────────────────────────────────────────────

process.title = 'titanbot';
process.env.UV_THREADPOOL_SIZE = env.UV_THREADPOOL_SIZE || '128';

// ─── Source Map Support (if available) ────────────────────────────────────────

try {
  const require = createRequire(import.meta.url);
  require('source-map-support/register');
} catch {
  // source-map-support not installed, ignore
}

// ─── Graceful Shutdown Plumbing ─────────────────────────────────────────────

const shutdown = async (signal, code = 0) => {
  console.log(`\n[${signal}] Shutting down TitanBot...`);
  // Allow app.js to register cleanup via globalThis.__titanCleanup
  if (typeof globalThis.__titanCleanup === 'function') {
    try {
      await globalThis.__titanCleanup(signal);
    } catch (error) {
      console.error('[CLEANUP] Error during shutdown:', error);
    }
  }
  exit(code);
};

process.once('SIGINT', () => shutdown('SIGINT', 0));
process.once('SIGTERM', () => shutdown('SIGTERM', 0));

// Zero-downtime reload signal (PM2, systemd)
process.once('SIGUSR2', async () => {
  console.log('[SIGUSR2] Reload requested');
  if (typeof globalThis.__titanReload === 'function') {
    await globalThis.__titanReload();
  }
});

// ─── Startup ─────────────────────────────────────────────────────────────────

const start = performance.now();

try {
  await import('./src/app.js');
  console.log(`[BOOT] Started in ${(performance.now() - start).toFixed(2)}ms`);
} catch (error) {
  console.error('[BOOT] Failed to start app:', error);
  exit(1);
  }
