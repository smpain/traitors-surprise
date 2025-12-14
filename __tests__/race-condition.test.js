// Test for race condition: simulated players answer, then real player submits
const resetModuleCache = () => {
  delete require.cache[require.resolve('../lib/gameState')];
};

describe('Race Condition Test', () => {
  let gameState, recalculateScores, allPlayersAnswered;
  
  beforeEach(() => {
    resetModuleCache();
    const gameStateModule = require('../lib/gameState');
    gameState = gameStateModule.gameState;
    recalculateScores = gameStateModule.recalculateScores;
    allPlayersAnswered = gameStateModule.allPlayersAnswered;
    
    // Reset to initial state
    gameState.currentQuestionIndex = 0;
    gameState.phase = 'answering';
    gameState.players = {
      eti: { name: 'Eti', score: 0, answered: false, simulated: true },
      jude: { name: 'Jude', score: 0, answered: false, simulated: true },
      nathalie: { name: 'Nathalie', score: 0, answered: false, simulated: true },
      gareth: { name: 'Gareth', score: 0, answered: false, simulated: false }
    };
    gameState.currentAnswers = {};
    gameState.allAnswers = {
      eti: {},
      jude: {},
      nathalie: {},
      gareth: {}
    };
  });

  test('should handle real player submitting after simulated players', () => {
    // Step 1: Simulated players answer (like in setTimeout callbacks)
    gameState.players.eti.answered = true;
    gameState.allAnswers.eti[0] = { answerIndex: 1, correct: true };
    recalculateScores(); // Simulated player's recalculateScores call
    
    gameState.players.jude.answered = true;
    gameState.allAnswers.jude[0] = { answerIndex: 1, correct: true };
    recalculateScores(); // Another simulated player's recalculateScores call
    
    gameState.players.nathalie.answered = true;
    gameState.allAnswers.nathalie[0] = { answerIndex: 0, correct: false };
    recalculateScores(); // Another simulated player's recalculateScores call
    
    // Verify simulated players still have answered = true
    expect(gameState.players.eti.answered).toBe(true);
    expect(gameState.players.jude.answered).toBe(true);
    expect(gameState.players.nathalie.answered).toBe(true);
    expect(gameState.players.gareth.answered).toBe(false);
    
    // Step 2: Real player (Gareth) submits answer
    gameState.players.gareth.answered = true;
    gameState.allAnswers.gareth[0] = { answerIndex: 1, correct: true };
    
    console.log('Before final recalculateScores:', Object.keys(gameState.players).map(p => ({
      name: gameState.players[p].name,
      answered: gameState.players[p].answered
    })));
    
    recalculateScores(); // Real player's recalculateScores call
    
    console.log('After final recalculateScores:', Object.keys(gameState.players).map(p => ({
      name: gameState.players[p].name,
      answered: gameState.players[p].answered
    })));
    
    // All players should have answered = true
    expect(gameState.players.eti.answered).toBe(true);
    expect(gameState.players.jude.answered).toBe(true);
    expect(gameState.players.nathalie.answered).toBe(true);
    expect(gameState.players.gareth.answered).toBe(true);
    
    // allPlayersAnswered should return true
    expect(allPlayersAnswered()).toBe(true);
  });
});
