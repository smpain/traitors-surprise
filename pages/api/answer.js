import { getGameState, saveGameState, questions, recalculateScores, allPlayersAnswered } from '../../lib/gameState';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { player, answerIndex } = req.body;
    
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      console.error('[ANSWER] Questions not loaded');
      return res.status(500).json({ error: 'Questions not available' });
    }
    
    const gameState = await getGameState();
    
    if (!gameState || !gameState.players) {
      console.error('[ANSWER] Failed to load game state');
      return res.status(500).json({ error: 'Failed to load game state' });
    }
    
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
    
    // Check if player already answered this question
    if (playerState.answered) {
      console.log(`[ANSWER] ${player} already answered Q${qIndex + 1}, rejecting duplicate submission`);
      return res.json({ 
        success: false, 
        message: 'Already answered this question',
        score: playerState.score,
        allAnswered: await allPlayersAnswered(),
        phase: gameState.phase,
        currentQuestionIndex: qIndex
      });
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
  await recalculateScores();
  
  // Reload state after recalculation
  const updatedState = await getGameState();
  
  // Double-check answered flag is still set after recalculation (defensive)
  if (!updatedState.players[player].answered) {
    console.warn(`⚠ ${player}.answered was reset during recalculation! Restoring...`);
    updatedState.players[player].answered = true;
  }
  
  // Check if all players have answered
  const allAnswered = await allPlayersAnswered();
  
  if (allAnswered) {
    console.log(`[ANSWER] All players answered Q${qIndex + 1}, moving to showing-results`);
    updatedState.phase = 'showing-results';
  } else {
    const missing = Object.keys(updatedState.players).filter(p => !updatedState.players[p].answered);
    console.log(`[ANSWER] Waiting for: ${missing.map(p => updatedState.players[p].name).join(', ')}`);
  }
  
  await saveGameState(updatedState);

    return res.json({ 
      success: true, 
      score: updatedState.players[player].score,
      allAnswered: allAnswered,
      phase: updatedState.phase,
      currentQuestionIndex: updatedState.currentQuestionIndex
    });
  } catch (error) {
    console.error('[ANSWER] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
