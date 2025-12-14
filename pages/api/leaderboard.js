import { getGameState, recalculateScores } from '../../lib/gameState';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Recalculate scores to ensure they're up to date when showing final results
  await recalculateScores();

  const gameState = await getGameState();
  const players = Object.values(gameState.players);
  
  // Return scores - these should be calculated from allAnswers
  const result = {
    players: players.map(p => ({
      name: p.name,
      score: p.score || 0  // Ensure score is always a number
    })).sort((a, b) => b.score - a.score)
  };
  
  res.json(result);
}
