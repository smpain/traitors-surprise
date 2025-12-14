import { gameState } from '../../lib/gameState';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const simulatedStates = {
    eti: gameState.players.eti.simulated,
    jude: gameState.players.jude.simulated,
    nathalie: gameState.players.nathalie.simulated,
    gareth: gameState.players.gareth.simulated
  };
  
  // Reset the global state object (mutate in place to preserve singleton reference)
  gameState.currentQuestionIndex = 0;
  gameState.phase = 'answering';
  gameState.players.eti = { name: 'Eti', score: 0, answered: false, simulated: simulatedStates.eti };
  gameState.players.jude = { name: 'Jude', score: 0, answered: false, simulated: simulatedStates.jude };
  gameState.players.nathalie = { name: 'Nathalie', score: 0, answered: false, simulated: simulatedStates.nathalie };
  gameState.players.gareth = { name: 'Gareth', score: 0, answered: false, simulated: simulatedStates.gareth };
  gameState.currentAnswers = {};
  gameState.allAnswers = {};
  
  // Initialize allAnswers structure
  Object.keys(gameState.players).forEach(player => {
    gameState.allAnswers[player] = {};
  });
  
  res.json({ success: true });
}
