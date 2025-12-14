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
