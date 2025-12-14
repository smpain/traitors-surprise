// Shared game state module for Next.js API routes
// Uses Redis for persistence in production, falls back to in-memory for local dev

import { getRedisClient, isRedisAvailable } from './redis';

const REDIS_KEY = 'traitors:gameState';

// Default initial state
function getInitialState() {
  return {
    currentQuestionIndex: 0,
    phase: 'answering', // 'answering', 'showing-results', 'completed'
    players: {
      eti: { name: 'Eti', score: 0, answered: false, simulated: false },
      jude: { name: 'Jude', score: 0, answered: false, simulated: false },
      nathalie: { name: 'Nathalie', score: 0, answered: false, simulated: false },
      gareth: { name: 'Gareth', score: 0, answered: false, simulated: false }
    },
    currentAnswers: {}, // player -> { answerIndex, correct } for current question
    allAnswers: {
      eti: {},
      jude: {},
      nathalie: {},
      gareth: {}
    }
  };
}

// In-memory fallback state (for local dev or when Redis unavailable)
let inMemoryState = null;
let stateInitialized = false;

// Load game state from Redis or initialize
async function loadGameState() {
  if (stateInitialized && !isRedisAvailable()) {
    // Using in-memory state, return cached
    return inMemoryState || getInitialState();
  }

  const redis = getRedisClient();
  
  if (redis) {
    try {
      const stored = await redis.get(REDIS_KEY);
      if (stored) {
        console.log('[REDIS] Loaded game state from Redis');
        stateInitialized = true;
        return stored;
      } else {
        console.log('[REDIS] No state found in Redis, initializing new state');
        const initialState = getInitialState();
        await saveGameState(initialState);
        return initialState;
      }
    } catch (error) {
      console.error('[REDIS] Error loading state from Redis:', error);
      // Fall back to in-memory
      if (!inMemoryState) {
        inMemoryState = getInitialState();
      }
      return inMemoryState;
    }
  } else {
    // No Redis available, use in-memory
    if (!inMemoryState) {
      console.log('[GAME-STATE] Using in-memory state (Redis not available)');
      inMemoryState = getInitialState();
    }
    stateInitialized = true;
    return inMemoryState;
  }
}

// Save game state to Redis
async function saveGameState(state) {
  const redis = getRedisClient();
  
  if (redis) {
    try {
      await redis.set(REDIS_KEY, state);
      console.log(`[REDIS] Saved game state: Q${state.currentQuestionIndex + 1}, phase=${state.phase}`);
    } catch (error) {
      console.error('[REDIS] Error saving state to Redis:', error);
    }
  } else {
    // Update in-memory state
    inMemoryState = state;
  }
}

// Get current game state (async wrapper)
let gameStatePromise = null;
async function getGameState() {
  if (!gameStatePromise) {
    gameStatePromise = loadGameState();
  }
  return await gameStatePromise;
}

// Export a synchronous getter that returns a promise-based state manager
// This allows existing code to work with minimal changes
const gameStateProxy = {
  get currentQuestionIndex() {
    throw new Error('gameState must be accessed asynchronously. Use await getGameState() instead.');
  },
  // ... other properties will throw similar errors
};

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

// Recalculate player scores from stored answers
async function recalculateScores() {
  const state = await getGameState();
  
  // Capture current answered flags BEFORE doing anything
  const answeredFlags = {};
  Object.keys(state.players).forEach(player => {
    answeredFlags[player] = !!state.players[player].answered;
  });
  
  // Calculate scores
  Object.keys(state.players).forEach(player => {
    const answers = state.allAnswers[player];
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
    const playerObj = state.players[player];
    playerObj.score = score;
    // Restore answered flag from backup
    playerObj.answered = answeredFlags[player];
  });
  
  await saveGameState(state);
}

// Check if all players have answered
async function allPlayersAnswered() {
  const state = await getGameState();
  return Object.values(state.players).every(p => p.answered === true);
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
  
  const isCorrect = Math.random() < accuracy;
  
  let answerIndex;
  if (isCorrect) {
    answerIndex = correctIndex;
  } else {
    const wrongAnswers = [];
    for (let i = 0; i < numChoices; i++) {
      if (i !== correctIndex) wrongAnswers.push(i);
    }
    answerIndex = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)];
  }
  
  return { answerIndex, correct: isCorrect };
}

// Track pending simulated answers
const pendingSimulatedAnswers = {};
let isAdvancing = false;

// Auto-answer for simulated players
async function autoAnswerSimulatedPlayers() {
  const state = await getGameState();
  
  if (state.phase !== 'answering') return;
  
  const currentQuestionIndex = state.currentQuestionIndex;
  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    console.log('autoAnswerSimulatedPlayers: No question found for index', currentQuestionIndex);
    return;
  }
  
  Object.keys(state.players).forEach(async (playerKey) => {
    const player = state.players[playerKey];
    const pendingKey = `${playerKey}_${currentQuestionIndex}`;
    
    if (player.simulated && !player.answered && !pendingSimulatedAnswers[pendingKey]) {
      pendingSimulatedAnswers[pendingKey] = true;
      
      const delay = 1000 + Math.random() * 3000;
      
      setTimeout(async () => {
        const currentState = await getGameState();
        if (currentState.phase !== 'answering' || 
            currentState.currentQuestionIndex !== currentQuestionIndex) {
          delete pendingSimulatedAnswers[pendingKey];
          return;
        }
        
        const { answerIndex, correct } = generateSimulatedAnswer(currentQuestionIndex);
        currentState.currentAnswers[playerKey] = { answerIndex, correct };
        
        if (!currentState.allAnswers[playerKey]) {
          currentState.allAnswers[playerKey] = {};
        }
        currentState.allAnswers[playerKey][currentQuestionIndex] = {
          answerIndex,
          correct
        };
        
        currentState.players[playerKey].answered = true;
        
        await recalculateScores();
        
        if (await allPlayersAnswered()) {
          currentState.phase = 'showing-results';
          await saveGameState(currentState);
        } else {
          await saveGameState(currentState);
        }
      }, delay);
    }
  });
}

// Export using CommonJS for compatibility
module.exports = {
  getGameState,
  saveGameState,
  getInitialState,
  questions,
  recalculateScores,
  allPlayersAnswered,
  generateSimulatedAnswer,
  autoAnswerSimulatedPlayers,
  pendingSimulatedAnswers,
  get isAdvancing() { return isAdvancing; },
  set isAdvancing(value) { isAdvancing = value; },
  // Export the variable directly for easier access
  _isAdvancing: () => isAdvancing,
  _setIsAdvancing: (value) => { isAdvancing = value; }
};
