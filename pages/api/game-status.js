import { gameState, autoAnswerSimulatedPlayers } from '../../lib/gameState';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const players = Object.values(gameState.players);
  
  // Log state for debugging cold start issues
  console.log(`[GAME-STATUS] Q${gameState.currentQuestionIndex + 1}, phase=${gameState.phase}, answered: ${players.filter(p => p.answered).map(p => p.name).join(',') || 'none'}`);
  
  // Trigger auto-answer for simulated players when a new question starts
  if (gameState.phase === 'answering') {
    autoAnswerSimulatedPlayers();
  }
  
  const response = {
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase,
    players: players.map(p => ({
      name: p.name,
      score: p.score,
      answered: p.answered,
      simulated: p.simulated
    })),
    currentAnswers: gameState.currentAnswers
  };
  
  // Debug check for state inconsistency
  const allAnswered = players.every(p => p.answered === true);
  if (gameState.phase === 'answering' && allAnswered) {
    console.warn(`[GAME-STATUS] State inconsistency: All players answered but phase is still 'answering'`);
  }
  
  // Check if state was reset (question index went backwards)
  if (req.headers['x-game-question-index']) {
    const previousIndex = parseInt(req.headers['x-game-question-index']);
    if (previousIndex > gameState.currentQuestionIndex) {
      console.error(`[GAME-STATUS] WARNING: State reset detected! Previous Q${previousIndex + 1} -> Current Q${gameState.currentQuestionIndex + 1}`);
    }
  }
  
  res.json(response);
}
