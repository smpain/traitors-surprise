import { gameState, autoAnswerSimulatedPlayers } from '../../lib/gameState';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const players = Object.keys(gameState.players).map(key => ({
      player: key,
      name: gameState.players[key].name,
      simulated: gameState.players[key].simulated
    }));
    return res.json({ players });
  }

  if (req.method === 'POST') {
    const { player, simulated } = req.body;
    
    if (!player || !gameState.players[player]) {
      return res.status(400).json({ error: 'Invalid player' });
    }
    
    gameState.players[player].simulated = !!simulated;
    
    // If we just enabled simulation and we're in answering phase, trigger auto-answer
    if (simulated && gameState.phase === 'answering') {
      setTimeout(() => {
        autoAnswerSimulatedPlayers();
      }, 100);
    }
    
    return res.json({ 
      success: true, 
      player, 
      simulated: gameState.players[player].simulated 
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
