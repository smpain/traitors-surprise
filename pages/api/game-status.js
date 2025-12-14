import { getGameState, saveGameState, autoAnswerSimulatedPlayers, allPlayersAnswered } from '../../lib/gameState';

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let gameState = await getGameState();
    
    if (!gameState) {
      console.error('[GAME-STATUS] Failed to load game state');
      return res.status(500).json({ error: 'Failed to load game state' });
    }
    
    const players = Object.values(gameState.players);
    
    // Log state for debugging
    console.log(`[GAME-STATUS] Q${gameState.currentQuestionIndex + 1}, phase=${gameState.phase}, answered: ${players.filter(p => p.answered).map(p => p.name).join(',') || 'none'}`);
    
    // Fix state inconsistency: if all players answered but phase is still 'answering', fix it
    const allAnswered = players.every(p => p.answered === true);
    if (gameState.phase === 'answering' && allAnswered) {
      console.warn(`[GAME-STATUS] ⚠️ State inconsistency detected: All players answered but phase is still 'answering'. Fixing...`);
      gameState.phase = 'showing-results';
      await saveGameState(gameState);
      console.log(`[GAME-STATUS] ✓ Fixed: Phase set to 'showing-results'`);
    }
    
    // Trigger auto-answer for simulated players when a new question starts
    if (gameState.phase === 'answering') {
      autoAnswerSimulatedPlayers();
    }
    
    // Build currentAnswers from allAnswers for the current question (for results display)
    // This ensures we have answers even if currentAnswers was cleared
    const currentAnswersForDisplay = {};
    if (gameState.phase === 'showing-results') {
      console.log(`[GAME-STATUS] Reconstructing answers for Q${gameState.currentQuestionIndex + 1} from allAnswers`);
      console.log(`[GAME-STATUS] allAnswers keys:`, Object.keys(gameState.allAnswers || {}));
      
      Object.keys(gameState.players).forEach(playerKey => {
        const playerAnswers = gameState.allAnswers[playerKey];
        console.log(`[GAME-STATUS] Player ${playerKey} allAnswers:`, playerAnswers);
        
        if (playerAnswers) {
          // Try both string and number key (JavaScript object keys are strings)
          const answer = playerAnswers[gameState.currentQuestionIndex] || 
                        playerAnswers[String(gameState.currentQuestionIndex)];
          
          if (answer) {
            console.log(`[GAME-STATUS] Found answer for ${playerKey}:`, answer);
            currentAnswersForDisplay[playerKey] = answer;
          } else {
            console.warn(`[GAME-STATUS] No answer found for ${playerKey} at Q${gameState.currentQuestionIndex + 1}`);
            console.warn(`[GAME-STATUS] Available question indices:`, Object.keys(playerAnswers));
          }
        } else {
          console.warn(`[GAME-STATUS] No allAnswers entry for player ${playerKey}`);
        }
      });
    } else {
      // Use currentAnswers when still answering
      Object.assign(currentAnswersForDisplay, gameState.currentAnswers);
      console.log(`[GAME-STATUS] Using currentAnswers:`, currentAnswersForDisplay);
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
      currentAnswers: currentAnswersForDisplay
    };
    
    // Check if state was reset (question index went backwards)
    if (req.headers['x-game-question-index']) {
      const previousIndex = parseInt(req.headers['x-game-question-index']);
      if (previousIndex > gameState.currentQuestionIndex) {
        console.error(`[GAME-STATUS] WARNING: State reset detected! Previous Q${previousIndex + 1} -> Current Q${gameState.currentQuestionIndex + 1}`);
      }
    }
    
    return res.json(response);
  } catch (error) {
    console.error('[GAME-STATUS] Error:', error);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
