#!/usr/bin/env node

/**
 * External test script to simulate multiple players
 * 
 * This script simulates three players (Jude, Nathalie, Gareth) as if they were
 * separate users accessing the game from different devices.
 * 
 * Usage: 
 *   node test-simulate-players.js [base-url]
 * 
 * Examples:
 *   node test-simulate-players.js https://traitors-surprise.vercel.app
 *   node test-simulate-players.js http://localhost:3000
 * 
 * The script will:
 * - Monitor the game status continuously
 * - Automatically answer questions for the three simulated players
 * - Use realistic delays (1-3 seconds) between answers
 * - Mix correct (70%) and incorrect (30%) answers for realism
 * - Continue until the game is completed
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

const players = [
  { id: 'jude', name: 'Jude' },
  { id: 'nathalie', name: 'Nathalie' },
  { id: 'gareth', name: 'Gareth' }
];

// Import questions data (we'll load it from the file)
const fs = require('fs');
const path = require('path');

let questions = [];
let currentQuestionIndex = 0;

// Load questions from questions-data.js
function loadQuestions() {
  try {
    const questionsPath = path.join(__dirname, 'questions-data.js');
    // Read and evaluate the questions file
    const questionsContent = fs.readFileSync(questionsPath, 'utf8');
    // Extract the allQuestions array using eval (not ideal but works for test script)
    const module = { exports: {} };
    eval(questionsContent.replace('module.exports', 'module.exports'));
    questions = module.exports.allQuestions || [];
    console.log(`✓ Loaded ${questions.length} questions`);
  } catch (error) {
    console.error('⚠ Could not load questions from file, will use random answers:', error.message);
    questions = [];
  }
}

// Simulate a player answering a question
async function simulatePlayerAnswer(playerId, questionIndex, answerIndex) {
  try {
    const response = await fetch(`${BASE_URL}/api/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: playerId,
        answerIndex: answerIndex
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to submit answer: ${response.status} - ${JSON.stringify(error)}`);
    }
    
    const data = await response.json();
    
    // Check if answer was rejected (e.g., already answered)
    if (data.success === false) {
      return data; // Return the rejection response
    }
    
    // Use the correct field from API response if available, otherwise infer from score change
    const isCorrect = data.correct !== undefined ? data.correct : (data.score !== undefined && data.score > 0);
    console.log(`✓ ${playerId} answered question ${questionIndex + 1} with answer ${answerIndex} (correct: ${isCorrect ? 'yes' : 'no'})`);
    return data;
  } catch (error) {
    console.error(`✗ Error submitting answer for ${playerId}:`, error.message);
    throw error;
  }
}

// Get current game status
async function getGameStatus() {
  try {
    const response = await fetch(`${BASE_URL}/api/game-status`);
    if (!response.ok) {
      throw new Error(`Failed to fetch game status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching game status:', error.message);
    throw error;
  }
}

// Wait for a condition
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Track if we're currently simulating to prevent duplicate runs
let isSimulating = false;
let currentSimulatingQuestion = -1;

// Simulate all players answering the current question
async function simulateAllPlayersAnswer() {
  // Prevent concurrent simulation runs - check and set lock atomically
  if (isSimulating) {
    return;
  }
  
  // Set lock IMMEDIATELY to prevent concurrent runs
  isSimulating = true;
  
  try {
    const status = await getGameStatus();
    const qIndex = status.currentQuestionIndex;
    
    // Update the question we're simulating
    currentSimulatingQuestion = qIndex;
    
    if (status.phase !== 'answering') {
      console.log(`⚠ Game is in phase "${status.phase}", not answering. Skipping.`);
      return;
    }
    
    // Check which players haven't answered
    const unansweredPlayers = players.filter(p => {
      const playerStatus = status.players.find(ps => ps.name.toLowerCase() === p.id);
      const hasAnswered = playerStatus && playerStatus.answered === true;
      if (hasAnswered) {
        console.log(`⏭ Skipping ${p.name} - already answered`);
      }
      return !hasAnswered;
    });
    
    if (unansweredPlayers.length === 0) {
      console.log('✓ All simulated players have already answered');
      return;
    }
    
    console.log(`\n📋 Simulating ${unansweredPlayers.length} player(s) for question ${qIndex + 1}...`);
  
    // Get the current question to determine correct answer
    const currentQuestion = questions[qIndex];
    const numChoices = currentQuestion ? currentQuestion.choices.length : 3;
  
    // Simulate each player answering with random delays (1-3 seconds)
    const promises = unansweredPlayers.map(async (player, index) => {
      // Stagger the answers slightly
      await wait(1000 + index * 500 + Math.random() * 2000);
      
      // Final check before submitting - make sure we're still on the same question
      const finalStatus = await getGameStatus();
      if (finalStatus.currentQuestionIndex !== qIndex || finalStatus.phase !== 'answering') {
        console.log(`⚠ ${player.name}: Question changed, skipping answer`);
        return;
      }
      
      // Check if player already answered (might have been answered by another instance)
      const playerStatus = finalStatus.players.find(ps => ps.name.toLowerCase() === player.id);
      if (playerStatus && playerStatus.answered) {
        console.log(`⏭ ${player.name}: Already answered, skipping`);
        return;
      }
      
      // Pick an answer - mix of correct and incorrect for realism
      // 70% chance of correct answer, 30% chance of wrong answer
      let answerIndex;
      if (currentQuestion && Math.random() < 0.7) {
        // Answer correctly
        answerIndex = currentQuestion.answerIndex;
      } else {
        // Answer incorrectly (pick a random wrong answer)
        const wrongAnswers = Array.from({ length: numChoices }, (_, i) => i)
          .filter(i => !currentQuestion || i !== currentQuestion.answerIndex);
        answerIndex = wrongAnswers[Math.floor(Math.random() * wrongAnswers.length)] || 0;
      }
      
      try {
        const result = await simulatePlayerAnswer(player.id, qIndex, answerIndex);
        // Check if the answer was rejected (already answered)
        if (result && result.success === false) {
          console.log(`⏭ ${player.name}: ${result.message || 'Answer rejected'}`);
          // If rejected, mark as answered locally to prevent retry
          // (The server already has the answer, we just need to stop trying)
          return; // Exit early to prevent any retry logic
        }
      } catch (error) {
        console.error(`Failed to simulate ${player.id}:`, error.message);
        // On error, don't retry - exit early
        return;
      }
    });
  
    await Promise.all(promises);
    console.log('✓ Simulation complete\n');
  } finally {
    // Always release lock, even if there's an error
    isSimulating = false;
    currentSimulatingQuestion = -1;
  }
}

// Main loop - continuously monitor and simulate
async function main() {
  console.log(`🎮 Starting player simulation against ${BASE_URL}`);
  console.log(`👥 Simulating players: ${players.map(p => p.name).join(', ')}\n`);
  
  // Load questions first
  loadQuestions();
  
  let lastQuestionIndex = -1;
  
  while (true) {
    try {
      const status = await getGameStatus();
      
      // Check if we've moved to a new question
      if (status.currentQuestionIndex !== lastQuestionIndex) {
        lastQuestionIndex = status.currentQuestionIndex;
        console.log(`\n🔄 New question detected: Question ${status.currentQuestionIndex + 1}`);
        
        if (status.phase === 'answering') {
          await simulateAllPlayersAnswer();
        } else if (status.phase === 'completed') {
          console.log('🎉 Game completed!');
          break;
        }
      } else if (status.phase === 'answering') {
        // Check if any players need to answer
        const needsAnswer = players.some(p => {
          const playerStatus = status.players.find(ps => ps.name.toLowerCase() === p.id);
          return !playerStatus || !playerStatus.answered;
        });
        
        // Only simulate if we're not already simulating and players need to answer
        if (needsAnswer && !isSimulating) {
          await simulateAllPlayersAnswer();
        } else if (!needsAnswer) {
          // All players have answered, just wait quietly
          // (don't log anything to avoid spam)
        }
        // If isSimulating is true, skip - we're already handling it
      } else if (status.phase === 'showing-results') {
        // Don't try to answer when showing results - wait for next question
        // (don't log to avoid spam)
      }
      
      // Wait before next check
      await wait(2000);
    } catch (error) {
      console.error('Error in main loop:', error.message);
      await wait(5000); // Wait longer on error
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down simulation...');
  process.exit(0);
});

// Start the simulation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
