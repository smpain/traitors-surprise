// Redis client for persistent game state storage
let Redis;
try {
  Redis = require('@upstash/redis').Redis;
} catch (error) {
  console.error('[REDIS] Failed to load @upstash/redis:', error);
}

let redis = null;

function getRedisClient() {
  if (!Redis) {
    return null;
  }
  
  if (!redis) {
    // Try Vercel KV env vars first (KV_REST_API_URL, KV_REST_API_TOKEN)
    // Then fall back to Upstash direct env vars (UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)
    const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (!url || !token) {
      console.warn('[REDIS] Redis credentials not found. Falling back to in-memory state.');
      console.warn('[REDIS] Checked: KV_REST_API_URL, KV_REST_API_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN');
      return null;
    }
    
    try {
      redis = new Redis({
        url,
        token,
      });
      console.log('[REDIS] Connected to Redis successfully');
      console.log('[REDIS] Using URL:', url.substring(0, 20) + '...');
    } catch (error) {
      console.error('[REDIS] Failed to connect:', error);
      console.error('[REDIS] Error details:', error.message);
      return null;
    }
  }
  
  return redis;
}

// Check if Redis is available
function isRedisAvailable() {
  try {
    return !!getRedisClient();
  } catch (error) {
    console.error('[REDIS] Error checking availability:', error);
    return false;
  }
}

module.exports = {
  getRedisClient,
  isRedisAvailable
};
