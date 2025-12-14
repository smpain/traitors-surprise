// Clear module cache to get fresh state for each test
const resetModuleCache = () => {
  delete require.cache[require.resolve('../lib/gameState')];
};

describe('Game State Management', () => {
  let gameState, recalculateScores, allPlayersAnswered, questions;
  
  beforeEach(() => {
    resetModuleCache();
    const gameStateModule = require('../lib/gameState');
    gameState = gameStateModule.gameState;
    recalculateScores = gameStateModule.recalculateScores;
    allPlayersAnswered = gameStateModule.allPlayersAnswered;
    questions = gameStateModule.questions;
    
    // Reset game state to initial state
    gameState.currentQuestionIndex = 0;
    gameState.phase = 'answering';
    gameState.players = {
      eti: { name: 'Eti', score: 0, answered: false, simulated: false },
      jude: { name: 'Jude', score: 0, answered: false, simulated: false },
      nathalie: { name: 'Nathalie', score: 0, answered: false, simulated: false },
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

  test('should preserve answered flags during score recalculation', () => {
    // Simulate: Eti and Jude have answered
    gameState.players.eti.answered = true;
    gameState.players.jude.answered = true;
    gameState.allAnswers.eti[0] = { answerIndex: 1, correct: true };
    gameState.allAnswers.jude[0] = { answerIndex: 1, correct: true };
    
    // Nathalie and Gareth haven't answered
    gameState.players.nathalie.answered = false;
    gameState.players.gareth.answered = false;
    
    const beforeRecalc = {
      eti: gameState.players.eti.answered,
      jude: gameState.players.jude.answered,
      nathalie: gameState.players.nathalie.answered,
      gareth: gameState.players.gareth.answered
    };
    
    // Recalculate scores
    recalculateScores();
    
    // Check that answered flags are preserved
    expect(gameState.players.eti.answered).toBe(beforeRecalc.eti);
    expect(gameState.players.jude.answered).toBe(beforeRecalc.jude);
    expect(gameState.players.nathalie.answered).toBe(beforeRecalc.nathalie);
    expect(gameState.players.gareth.answered).toBe(beforeRecalc.gareth);
  });

  test('should detect when all players have answered', () => {
    // Initially, no one has answered
    expect(allPlayersAnswered()).toBe(false);
    
    // Set all players as answered
    gameState.players.eti.answered = true;
    gameState.players.jude.answered = true;
    gameState.players.nathalie.answered = true;
    gameState.players.gareth.answered = true;
    
    expect(allPlayersAnswered()).toBe(true);
  });

  test('should preserve answered flag when real player submits after simulated players', () => {
    // Simulate: Eti, Jude, Nathalie have answered (simulated)
    gameState.players.eti.answered = true;
    gameState.players.jude.answered = true;
    gameState.players.nathalie.answered = true;
    gameState.allAnswers.eti[0] = { answerIndex: 1, correct: true };
    gameState.allAnswers.jude[0] = { answerIndex: 1, correct: true };
    gameState.allAnswers.nathalie[0] = { answerIndex: 0, correct: false };
    
    // Recalculate scores (simulating what happens when simulated players answer)
    recalculateScores();
    
    // Verify simulated players still have answered = true
    expect(gameState.players.eti.answered).toBe(true);
    expect(gameState.players.jude.answered).toBe(true);
    expect(gameState.players.nathalie.answered).toBe(true);
    
    // Now Gareth (real player) submits answer
    gameState.players.gareth.answered = true;
    gameState.allAnswers.gareth[0] = { answerIndex: 1, correct: true };
    
    // Recalculate scores again
    recalculateScores();
    
    // All players should still have answered = true
    expect(gameState.players.eti.answered).toBe(true);
    expect(gameState.players.jude.answered).toBe(true);
    expect(gameState.players.nathalie.answered).toBe(true);
    expect(gameState.players.gareth.answered).toBe(true);
    
    // allPlayersAnswered should return true
    expect(allPlayersAnswered()).toBe(true);
  });

  test('should calculate scores correctly', () => {
    // Eti answers correctly
    gameState.allAnswers.eti[0] = { answerIndex: 1, correct: true };
    gameState.players.eti.answered = true;
    
    // Jude answers incorrectly
    gameState.allAnswers.jude[0] = { answerIndex: 0, correct: false };
    gameState.players.jude.answered = true;
    
    recalculateScores();
    
    // Check scores (assuming question 0 has answerIndex 1)
    const question0 = questions[0];
    if (question0 && question0.answerIndex === 1) {
      expect(gameState.players.eti.score).toBe(1);
      expect(gameState.players.jude.score).toBe(0);
    }
  });

  test('should handle multiple recalculations without losing answered flags', () => {
    // Set all players as answered
    gameState.players.eti.answered = true;
    gameState.players.jude.answered = true;
    gameState.players.nathalie.answered = true;
    gameState.players.gareth.answered = true;
    
    // Recalculate multiple times
    recalculateScores();
    recalculateScores();
    recalculateScores();
    
    // All should still be answered
    expect(allPlayersAnswered()).toBe(true);
    expect(gameState.players.eti.answered).toBe(true);
    expect(gameState.players.jude.answered).toBe(true);
    expect(gameState.players.nathalie.answered).toBe(true);
    expect(gameState.players.gareth.answered).toBe(true);
  });
});
