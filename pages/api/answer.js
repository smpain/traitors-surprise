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
    // BUT: Allow resubmission if answer was lost (answered flag is true but answer is missing)
    const hasAnswerInAllAnswers = gameState.allAnswers[player] && 
                                   gameState.allAnswers[player][qIndex];
    const hasAnswerInCurrent = gameState.currentAnswers && 
                                gameState.currentAnswers[player];
    
    if (playerState.answered && hasAnswerInAllAnswers && hasAnswerInCurrent) {
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
    
    // If answered flag is true but answer is missing, allow resubmission
    if (playerState.answered && (!hasAnswerInAllAnswers || !hasAnswerInCurrent)) {
      console.warn(`[ANSWER] ${player} marked as answered but answer is missing! Allowing resubmission.`);
      // Reset answered flag to allow resubmission
      playerState.answered = false;
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
    console.log(`[ANSWER] Stored in allAnswers[${player}][${qIndex}]:`, gameState.allAnswers[player][qIndex]);
    console.log(`[ANSWER] allAnswers[${player}] keys:`, Object.keys(gameState.allAnswers[player]));
  
    // Set answered flag FIRST, before any recalculation
    gameState.players[player].answered = true;
  
    // IMPORTANT: Save state BEFORE recalculating scores
    // recalculateScores() loads a fresh state, so we need to persist our changes first
    const saveSuccess = await saveGameState(gameState);
    if (!saveSuccess) {
      console.error(`[ANSWER] ⚠️ Failed to save answer for ${player} - will retry after recalculation`);
    }
    console.log(`[ANSWER] Saved state with answer before recalculating scores`);
  
  // Recalculate score from all answers (this will load fresh state and recalculate)
  await recalculateScores();
  
  // Reload state after recalculation
  const updatedState = await getGameState();
  
  // Double-check answered flag is still set after recalculation (defensive)
  if (!updatedState.players[player].answered) {
    console.warn(`⚠ ${player}.answered was reset during recalculation! Restoring...`);
    updatedState.players[player].answered = true;
  }
  
  // Double-check that our answer is still in allAnswers and currentAnswers
  let answerWasLost = false;
  if (!updatedState.allAnswers[player] || !updatedState.allAnswers[player][qIndex]) {
    console.error(`⚠ ${player}'s answer was lost from allAnswers! Restoring...`);
    answerWasLost = true;
    if (!updatedState.allAnswers[player]) {
      updatedState.allAnswers[player] = {};
    }
    updatedState.allAnswers[player][qIndex] = {
      answerIndex: submittedIndex,
      correct: isCorrect
    };
  }
  
  // Ensure currentAnswers has our answer
  if (!updatedState.currentAnswers || !updatedState.currentAnswers[player]) {
    console.warn(`⚠ ${player}'s answer missing from currentAnswers! Restoring...`);
    answerWasLost = true;
    if (!updatedState.currentAnswers) {
      updatedState.currentAnswers = {};
    }
    updatedState.currentAnswers[player] = {
      answerIndex: submittedIndex,
      correct: isCorrect
    };
  }
  
  // If answer was lost, save again with retry
  if (answerWasLost) {
    console.log(`[ANSWER] Re-saving state after restoring lost answer for ${player}`);
    await saveGameState(updatedState);
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
  
  // Final save
  await saveGameState(updatedState);

    // Get the answer info for this specific question
    const answerInfo = updatedState.allAnswers[player] && updatedState.allAnswers[player][qIndex];
    
    return res.json({ 
      success: true, 
      score: updatedState.players[player].score,
      allAnswered: allAnswered,
      phase: updatedState.phase,
      currentQuestionIndex: updatedState.currentQuestionIndex,
      correct: answerInfo ? answerInfo.correct : isCorrect // Include correctness in response
    });
  } catch (error) {
    console.error('[ANSWER] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
