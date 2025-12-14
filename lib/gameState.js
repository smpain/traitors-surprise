// Shared game state module for Next.js API routes
// Use global object to ensure singleton across all module instances

// Use global to ensure singleton state across all module instances
if (typeof global !== 'undefined' && !global.__traitorsGameState) {
  global.__traitorsGameState = {
    currentQuestionIndex: 0,
    phase: 'answering', // 'answering', 'showing-results', 'completed'
    players: {
      eti: { name: 'Eti', score: 0, answered: false, simulated: false },
      jude: { name: 'Jude', score: 0, answered: false, simulated: false },
      nathalie: { name: 'Nathalie', score: 0, answered: false, simulated: false },
      gareth: { name: 'Gareth', score: 0, answered: false, simulated: false }
    },
    currentAnswers: {}, // player -> { answerIndex, correct } for current question
    allAnswers: {} // player -> { [questionIndex]: { answerIndex, correct } } for all questions
  };
  
  // Initialize allAnswers structure
  Object.keys(global.__traitorsGameState.players).forEach(player => {
    global.__traitorsGameState.allAnswers[player] = {};
  });
}

// Reference to the singleton game state
const gameState = (typeof global !== 'undefined' ? global.__traitorsGameState : null) || 
                  (typeof window !== 'undefined' ? window.__traitorsGameState : null);

if (!gameState) {
  throw new Error('Game state not initialized. This should not happen in Node.js environment.');
}

// Use dynamic import for CommonJS module in ES6 context
let questionsData;
let questions;

// Load questions data synchronously
try {
  questionsData = require('../questions-data.js');
  questions = questionsData.allQuestions;
} catch (err) {
  console.error('Error loading questions-data.js:', err);
  throw err;
}

// Recalculate player scores from stored answers (verifying against current question data)
// IMPORTANT: This function ONLY updates scores. It does NOT modify answered flags or any other state.
function recalculateScores() {
  // Capture current answered flags BEFORE doing anything
  const answeredFlags = {};
  Object.keys(gameState.players).forEach(player => {
    answeredFlags[player] = !!gameState.players[player].answered; // Ensure boolean
  });
  
  // Calculate scores
  Object.keys(gameState.players).forEach(player => {
    const answers = gameState.allAnswers[player];
    let score = 0;
    
    if (answers && typeof answers === 'object') {
      const answerKeys = Object.keys(answers);
      
      answerKeys.forEach(qIndexStr => {
        const qIndex = parseInt(qIndexStr, 10);
        if (isNaN(qIndex)) return;
        
        const answer = answers[qIndexStr];
        if (!answer || typeof answer.answerIndex === 'undefined') return;
        
        const question = questions[qIndex];
        if (question && typeof question.answerIndex !== 'undefined') {
          const isCorrect = answer.answerIndex === question.answerIndex;
          answer.correct = isCorrect;
          if (isCorrect) score++;
        }
      });
    }
    
    // Update ONLY the score - preserve everything else
    const playerObj = gameState.players[player];
    playerObj.score = score;
    // Restore answered flag from backup (critical - preserves state)
    playerObj.answered = answeredFlags[player];
  });
}

// Check if all players have answered the current question
function allPlayersAnswered() {
  return Object.values(gameState.players).every(p => p.answered === true);
}

// Generate an answer for a simulated player
function generateSimulatedAnswer(questionIndex) {
  const question = questions[questionIndex];
  if (!question) return { answerIndex: 0, correct: false };
  
  const correctIndex = question.answerIndex;
  const numChoices = question.choices.length;
  
  // Difficulty-based accuracy: easy=80%, medium=60%, hard=40%
  const accuracyRates = { easy: 0.8, medium: 0.6, hard: 0.4 };
  const accuracy = accuracyRates[question.difficulty] || 0.5;
  
  // Decide if answer is correct based on difficulty
  const isCorrect = Math.random() < accuracy;
  
  let answerIndex;
  if (isCorrect) {
    answerIndex = correctIndex;
  } else {
    // Pick a wrong answer
    const wrongAnswers = [];
    for (let i = 0; i < numChoices; i++) {
      if (i !== correctIndex) wrongAnswers.push(i);
    }
    answerIndex = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
  }
  
  return { answerIndex, correct: isCorrect };
}

// Track pending simulated answers to prevent duplicates
const pendingSimulatedAnswers = {};
let isAdvancing = false;

// Auto-answer for simulated players
function autoAnswerSimulatedPlayers() {
  if (gameState.phase !== 'answering') return;
  
  const currentQuestionIndex = gameState.currentQuestionIndex;
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    console.log('autoAnswerSimulatedPlayers: No question found for index', currentQuestionIndex);
    return;
  }
  
  Object.keys(gameState.players).forEach(playerKey => {
    const player = gameState.players[playerKey];
    // Check if already answered or already has a pending answer
    const pendingKey = `${playerKey}_${currentQuestionIndex}`;
    
    if (player.simulated && !player.answered && !pendingSimulatedAnswers[pendingKey]) {
      // Mark as pending
      pendingSimulatedAnswers[pendingKey] = true;
      
      // Random delay between 1-4 seconds to make it feel natural
      const delay = 1000 + Math.random() * 3000;
      
      setTimeout(() => {
        // Double-check we're still in answering phase for this question
        if (gameState.phase !== 'answering' || 
            gameState.currentQuestionIndex !== currentQuestionIndex) {
          delete pendingSimulatedAnswers[pendingKey];
          return;
        }
        
        const { answerIndex, correct } = generateSimulatedAnswer(currentQuestionIndex);
        // Store the answer
        gameState.currentAnswers[playerKey] = { answerIndex, correct };
        
        // Ensure allAnswers structure exists
        if (!gameState.allAnswers[playerKey]) {
          gameState.allAnswers[playerKey] = {};
        }
        // Store answer with numeric key (will be converted to string by JS, but we store as number)
        gameState.allAnswers[playerKey][currentQuestionIndex] = {
          answerIndex,
          correct
        };
        
        player.answered = true;
        
        // Recalculate scores
        recalculateScores();
        
        // Check if all players have answered
        if (allPlayersAnswered()) {
          gameState.phase = 'showing-results';
        }
      }, delay);
    }
  });
}

// Export using CommonJS - Next.js handles ES6 imports from CommonJS modules correctly
// This ensures all API routes share the same module instance
module.exports = {
  gameState,
  questions,
  recalculateScores,
  allPlayersAnswered,
  generateSimulatedAnswer,
  autoAnswerSimulatedPlayers,
  pendingSimulatedAnswers
};
