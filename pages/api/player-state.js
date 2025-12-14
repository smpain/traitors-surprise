import { gameState } from '../../lib/gameState';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { player } = req.query;
  
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
