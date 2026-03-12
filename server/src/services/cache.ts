import { Redis } from 'ioredis';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

let redis: Redis | null = null;
let connected = false;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(config.REDIS_URL, {
      maxRetriesPerRequest: 1,
      retryStrategy(times: number) {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      connected = true;
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      connected = false;
      logger.warn({ err: err.message }, 'Redis connection error (cache disabled)');
    });

    redis.on('close', () => {
      connected = false;
    });

    redis.connect().catch(() => {
      logger.warn('Redis unavailable, cache disabled');
    });
  }
  return redis;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!connected) return null;
  try {
    const value = await getRedis().get(key);
    if (value === null) return null;
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  if (!connected) return;
  try {
    await getRedis().set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // cache failure is non-critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  if (!connected) return;
  try {
    await getRedis().del(key);
  } catch {
    // cache failure is non-critical
  }
}

export async function redisPing(): Promise<boolean> {
  if (!connected) return false;
  try {
    const result = await getRedis().ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export async function closeRedis(): Promise<void> {
  if (redis) {
    redis.disconnect();
    redis = null;
    connected = false;
    logger.info('Redis closed');
  }
}

export function initCache(): void {
  getRedis();
}
