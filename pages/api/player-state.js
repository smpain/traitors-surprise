import { getGameState } from '../../lib/gameState';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { player } = req.query;
  const gameState = await getGameState();
  
  if (!player || !gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }

  const playerAnswers = gameState.allAnswers[player] || {};
  const playerState = gameState.players[player];
  
  res.json({
    player: player,
    name: playerState.name,
    score: playerState.score,
    answers: playerAnswers,
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase
  });
}
