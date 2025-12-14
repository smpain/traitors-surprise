// Redis client for persistent game state storage
import { Redis } from '@upstash/redis';

let redis = null;

export function getRedisClient() {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      console.warn('[REDIS] Redis credentials not found. Falling back to in-memory state.');
      return null;
    }
    
    try {
      redis = new Redis({
        url,
        token,
      });
      console.log('[REDIS] Connected to Redis');
    } catch (error) {
      console.error('[REDIS] Failed to connect:', error);
      return null;
    }
  }
  
  return redis;
}

// Check if Redis is available
export function isRedisAvailable() {
  return !!getRedisClient();
}
