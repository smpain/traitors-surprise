import { gameState, questions, recalculateScores, allPlayersAnswered } from '../../lib/gameState';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { player, answerIndex } = req.body;
  
  if (!gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }

  if (gameState.phase !== 'answering') {
    return res.status(400).json({ error: 'Not accepting answers in current phase' });
  }

  const playerState = gameState.players[player];
  const qIndex = gameState.currentQuestionIndex;
  const question = questions[qIndex];
  
  if (!question) {
    return res.status(400).json({ error: 'Invalid question index' });
  }
  
  // Verify correctness on server side
  const submittedIndex = parseInt(answerIndex);
  const isCorrect = submittedIndex === question.answerIndex;
  
  // Store the answer for current question
  gameState.currentAnswers[player] = {
    answerIndex: submittedIndex,
    correct: isCorrect
  };
  
  // Store permanently in allAnswers
  if (!gameState.allAnswers[player]) {
    gameState.allAnswers[player] = {};
  }
  gameState.allAnswers[player][qIndex] = {
    answerIndex: submittedIndex,
    correct: isCorrect
  };
  
  console.log(`[ANSWER] ${player} submitting answer ${answerIndex} for Q${qIndex + 1}`);
  
  // Set answered flag FIRST, before any recalculation
  gameState.players[player].answered = true;
  
  // Recalculate score from all answers
  recalculateScores();
  
  // Double-check answered flag is still set after recalculation (defensive)
  if (!gameState.players[player].answered) {
    console.warn(`⚠ ${player}.answered was reset during recalculation! Restoring...`);
    gameState.players[player].answered = true;
  }
  
  // Check if all players have answered
  const allAnswered = allPlayersAnswered();
  
  if (allAnswered) {
    console.log(`[ANSWER] All players answered Q${qIndex + 1}, moving to showing-results`);
    gameState.phase = 'showing-results';
  } else {
    const missing = Object.keys(gameState.players).filter(p => !gameState.players[p].answered);
    console.log(`[ANSWER] Waiting for: ${missing.map(p => gameState.players[p].name).join(', ')}`);
  }

  res.json({ 
    success: true, 
    score: playerState.score,
    allAnswered: allAnswered,
    phase: gameState.phase,
    currentQuestionIndex: gameState.currentQuestionIndex
  });
}
