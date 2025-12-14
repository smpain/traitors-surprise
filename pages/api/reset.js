import { getGameState, saveGameState, getInitialState } from '../../lib/gameState';
import { getRedisClient } from '../../lib/redis';

const REDIS_KEY = 'traitors:gameState';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const gameState = await getGameState();
    const simulatedStates = {
      eti: gameState.players.eti.simulated,
      jude: gameState.players.jude.simulated,
      nathalie: gameState.players.nathalie.simulated,
      gareth: gameState.players.gareth.simulated
    };
    
    // Clear Redis state explicitly FIRST
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(REDIS_KEY);
        console.log('[RESET] ✓ Cleared Redis state');
      } catch (error) {
        console.error('[RESET] Error clearing Redis:', error);
        // Continue anyway - we'll save the new state below
      }
    }
    
    // Reset to initial state but preserve simulated flags
    const resetState = getInitialState();
    resetState.players.eti.simulated = simulatedStates.eti;
    resetState.players.jude.simulated = simulatedStates.jude;
    resetState.players.nathalie.simulated = simulatedStates.nathalie;
    resetState.players.gareth.simulated = simulatedStates.gareth;
    
    // Save fresh initial state (this will also clear in-memory cache)
    await saveGameState(resetState);
    
    console.log('[RESET] ✓ Game state reset successfully');
    res.json({ success: true, message: 'Game state reset successfully' });
  } catch (error) {
    console.error('[RESET] Error:', error);
    res.status(500).json({ error: 'Failed to reset game state', message: error.message });
  }
}
