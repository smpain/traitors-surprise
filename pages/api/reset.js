import { getGameState, saveGameState, getInitialState } from '../../lib/gameState';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameState = await getGameState();
  const simulatedStates = {
    eti: gameState.players.eti.simulated,
    jude: gameState.players.jude.simulated,
    nathalie: gameState.players.nathalie.simulated,
    gareth: gameState.players.gareth.simulated
  };
  
  // Reset to initial state but preserve simulated flags
  const resetState = getInitialState();
  resetState.players.eti.simulated = simulatedStates.eti;
  resetState.players.jude.simulated = simulatedStates.jude;
  resetState.players.nathalie.simulated = simulatedStates.nathalie;
  resetState.players.gareth.simulated = simulatedStates.gareth;
  
  await saveGameState(resetState);
  
  res.json({ success: true });
}
