import { getGameState, saveGameState, questions, autoAnswerSimulatedPlayers, pendingSimulatedAnswers, _isAdvancing, _setIsAdvancing } from '../../lib/gameState';

let localIsAdvancing = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { player } = req.body;
  
  const gameState = await getGameState();
  
  if (!gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }

  if (gameState.phase !== 'showing-results') {
    return res.json({ success: false, message: 'Not ready to advance' });
  }

  // Prevent multiple simultaneous advances
  if (localIsAdvancing || _isAdvancing()) {
    return res.json({ success: false, message: 'Already advancing' });
  }

  localIsAdvancing = true;
  
  gameState.currentQuestionIndex += 1;
  
  if (gameState.currentQuestionIndex >= questions.length) {
    gameState.phase = 'completed';
  } else {
    // Reset for next question
    gameState.phase = 'answering';
    Object.values(gameState.players).forEach(p => p.answered = false);
    gameState.currentAnswers = {};
    // Clear pending simulated answers for new question
    Object.keys(pendingSimulatedAnswers).forEach(key => {
      delete pendingSimulatedAnswers[key];
    });
    
    // Trigger auto-answer for simulated players on new question
    setTimeout(() => {
      autoAnswerSimulatedPlayers();
    }, 100);
  }
  
  await saveGameState(gameState);

  // Allow next advance after a short delay
  setTimeout(() => {
    localIsAdvancing = false;
  }, 500);

  res.json({ 
    success: true, 
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase
  });
}
