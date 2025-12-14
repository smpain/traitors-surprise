const express = require('express');
const cors = require('cors');
const path = require('path');
const questionsData = require('../questions-data.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// This Express app only handles API routes
// Static files (CSS, JS, HTML) are served directly by Vercel

const questions = questionsData.allQuestions;

// Store game state in memory
let gameState = {
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
Object.keys(gameState.players).forEach(player => {
  gameState.allAnswers[player] = {};
});

// Recalculate player scores from stored answers (verifying against current question data)
function recalculateScores() {
  Object.keys(gameState.players).forEach(player => {
    const answers = gameState.allAnswers[player] || {};
    let score = 0;
    Object.keys(answers).forEach(qIndex => {
      const answer = answers[qIndex];
      const question = questions[parseInt(qIndex)];
      if (question) {
        // Re-verify correctness based on current question data
        const isCorrect = answer.answerIndex === question.answerIndex;
        // Update the stored correct value
        answer.correct = isCorrect;
        if (isCorrect) score++;
        
        // Also update currentAnswers if this is the current question
        const currentQIndex = gameState.currentQuestionIndex;
        if (parseInt(qIndex) === currentQIndex && gameState.currentAnswers[player]) {
          gameState.currentAnswers[player].correct = isCorrect;
        }
      }
    });
    gameState.players[player].score = score;
  });
}

// Check if all players have answered the current question
function allPlayersAnswered() {
  return Object.values(gameState.players).every(p => p.answered);
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
      console.log(`Simulating answer for ${player.name} on question ${currentQuestionIndex + 1}`);
      // Mark as pending
      pendingSimulatedAnswers[pendingKey] = true;
      
      // Random delay between 1-4 seconds to make it feel natural
      const delay = 1000 + Math.random() * 3000;
      
      setTimeout(() => {
        // Double-check we're still in answering phase for this question
        if (gameState.phase !== 'answering' || 
            gameState.currentQuestionIndex !== currentQuestionIndex) {
          console.log(`Simulated answer for ${player.name} cancelled - phase changed`);
          delete pendingSimulatedAnswers[pendingKey];
          return;
        }
        
        const { answerIndex, correct } = generateSimulatedAnswer(currentQuestionIndex);
        console.log(`Simulated ${player.name} answered question ${currentQuestionIndex + 1}: ${answerIndex} (correct: ${correct})`);
        
        // Store the answer
        gameState.currentAnswers[playerKey] = { answerIndex, correct };
        
        if (!gameState.allAnswers[playerKey]) {
          gameState.allAnswers[playerKey] = {};
        }
        gameState.allAnswers[playerKey][currentQuestionIndex] = {
          answerIndex,
          correct
        };
        
        player.answered = true;
        
        // Clean up pending flag
        delete pendingSimulatedAnswers[pendingKey];
        
        // Recalculate scores
        recalculateScores();
        
        // Check if all players have answered
        if (allPlayersAnswered()) {
          console.log('All players have answered, moving to results phase');
          gameState.phase = 'showing-results';
        }
      }, delay);
    } else if (player.simulated && player.answered) {
      console.log(`Skipping ${player.name} - already answered`);
    } else if (player.simulated && pendingSimulatedAnswers[pendingKey]) {
      console.log(`Skipping ${player.name} - answer pending`);
    }
  });
}

// Get game status
app.get('/api/game-status', (req, res) => {
  const players = Object.values(gameState.players);
  
  // Trigger auto-answer for simulated players when a new question starts
  if (gameState.phase === 'answering') {
    autoAnswerSimulatedPlayers();
  }
  
  res.json({
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase,
    players: players.map(p => ({
      name: p.name,
      score: p.score,
      answered: p.answered,
      simulated: p.simulated
    })),
    currentAnswers: gameState.currentAnswers
  });
});

// Get player's specific state (for reconnection)
app.get('/api/player-state', (req, res) => {
  const { player } = req.query;
  
  if (!player || !gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }

  const playerAnswers = gameState.allAnswers[player] || {};
  const playerState = gameState.players[player];
  
  res.json({
    player: player,
    name: playerState.name,
    score: playerState.score,
    answers: playerAnswers,
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase
  });
});

// API endpoint to submit an answer for current question
app.post('/api/answer', (req, res) => {
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
  
  playerState.answered = true;
  
  // Recalculate score from all answers to ensure accuracy
  recalculateScores();

  // Check if all players have answered
  if (allPlayersAnswered()) {
    gameState.phase = 'showing-results';
  }

  res.json({ 
    success: true, 
    score: playerState.score,
    allAnswered: allPlayersAnswered(),
    phase: gameState.phase
  });
});

// Track if we're in the process of advancing (prevent double-advance)
let isAdvancing = false;

// API endpoint to advance to next question (called manually via button)
app.post('/api/next-question', (req, res) => {
  const { player } = req.body;
  
  if (!gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }

  if (gameState.phase !== 'showing-results') {
    return res.json({ success: false, message: 'Not ready to advance' });
  }

  // Prevent multiple simultaneous advances
  if (isAdvancing) {
    return res.json({ success: false, message: 'Already advancing' });
  }

  isAdvancing = true;
  
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

  // Allow next advance after a short delay
  setTimeout(() => {
    isAdvancing = false;
  }, 500);

  res.json({ 
    success: true, 
    currentQuestionIndex: gameState.currentQuestionIndex,
    phase: gameState.phase
  });
});

// API endpoint to get/set simulate mode
app.get('/api/simulate', (req, res) => {
  const players = Object.keys(gameState.players).map(key => ({
    player: key,
    name: gameState.players[key].name,
    simulated: gameState.players[key].simulated
  }));
  res.json({ players });
});

app.post('/api/simulate', (req, res) => {
  const { player, simulated } = req.body;
  
  if (!player || !gameState.players[player]) {
    return res.status(400).json({ error: 'Invalid player' });
  }
  
  gameState.players[player].simulated = !!simulated;
  
  // If we just enabled simulation and we're in answering phase, trigger auto-answer
  if (simulated && gameState.phase === 'answering') {
    setTimeout(() => {
      autoAnswerSimulatedPlayers();
    }, 100);
  }
  
  res.json({ 
    success: true, 
    player, 
    simulated: gameState.players[player].simulated 
  });
});

// API endpoint to get leaderboard
app.get('/api/leaderboard', (req, res) => {
  const players = Object.values(gameState.players);
  res.json({
    players: players.map(p => ({
      name: p.name,
      score: p.score
    })).sort((a, b) => b.score - a.score)
  });
});

// API endpoint to reset game (useful for testing)
app.post('/api/reset', (req, res) => {
  const simulatedStates = {
    eti: gameState.players.eti.simulated,
    jude: gameState.players.jude.simulated,
    nathalie: gameState.players.nathalie.simulated,
    gareth: gameState.players.gareth.simulated
  };
  
  gameState = {
    currentQuestionIndex: 0,
    phase: 'answering',
    players: {
      eti: { name: 'Eti', score: 0, answered: false, simulated: simulatedStates.eti },
      jude: { name: 'Jude', score: 0, answered: false, simulated: simulatedStates.jude },
      nathalie: { name: 'Nathalie', score: 0, answered: false, simulated: simulatedStates.nathalie },
      gareth: { name: 'Gareth', score: 0, answered: false, simulated: simulatedStates.gareth }
    },
    currentAnswers: {},
    allAnswers: {}
  };
  // Initialize allAnswers structure
  Object.keys(gameState.players).forEach(player => {
    gameState.allAnswers[player] = {};
  });
  isAdvancing = false;
  res.json({ success: true });
});

// For Vercel: serve static files and index.html
// In serverless, __dirname points to the function directory, so we need to go up one level
// Use process.cwd() as fallback for Vercel serverless environment
const rootDir = __dirname ? path.join(__dirname, '..') : process.cwd();

// Serve static files (CSS, JS, images) - only if they reach Express
// Vercel should serve these automatically, but this is a fallback
app.use(express.static(rootDir, {
  index: false, // Don't serve index.html automatically
  setHeaders: (res, filePath) => {
    // Set proper content types
    if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Explicitly handle root route
app.get('/', (req, res) => {
  const indexPath = path.join(rootDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Serve index.html for all other non-API routes (SPA fallback)
app.get('*', (req, res, next) => {
  // Don't handle API routes here - they should be handled by specific routes above
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Serve index.html for SPA routing
  const indexPath = path.join(rootDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading page');
    }
  });
});

// Export the app for Vercel serverless functions
// Vercel automatically wraps Express apps
module.exports = app;

// Add error handler for uncaught errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
