#!/usr/bin/env node
import { createRequire } from 'node:module';

process.title = 'titanbot';
process.env.UV_THREADPOOL_SIZE ||= '128';

process.on('uncaughtException', (err, origin) => {
  console.error(`[FATAL] ${origin}:`, err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  process.exit(1);
});

const shutdown = async (signal) => {
  if (globalThis.__titanShuttingDown) return;
  globalThis.__titanShuttingDown = true;
  console.log(`\n[${signal}] Shutting down...`);
  const timer = setTimeout(() => process.exit(1), 30_000);
  try { await globalThis.__titanCleanup?.(signal); } catch (e) { console.error(e); }
  clearTimeout(timer);
  process.exit(0);
};
process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

try { createRequire(import.meta.url)('source-map-support/register'); } catch {}

const t0 = performance.now();
await import('./src/app.js');
console.log(`[BOOT] Ready in ${(performance.now() - t0).toFixed(2)}ms`);
