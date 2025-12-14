import { allQuestions } from './questions.js';

const API_BASE = window.location.origin;

const quizEl = document.getElementById('quiz');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');
const progressEl = document.getElementById('quizProgress');
const voucherSection = document.getElementById('voucher');
const missionSection = document.getElementById('mission');
const playerSelectionSection = document.getElementById('playerSelection');
const leaderboardEl = document.getElementById('leaderboard');
const resultsSection = document.getElementById('results');
const waitingSection = document.getElementById('waiting');
const crestEl = document.getElementById('crest');
const finalScoresEl = document.getElementById('finalScores');

let currentPlayer = null;
let selected = -1;
let gameStatusInterval = null;
let currentQuestionIndex = -1;
let myAnswerSubmitted = false;

// Player display names
const playerNames = {
  eti: 'Eti',
  jude: 'Jude',
  nathalie: 'Nathalie',
  gareth: 'Gareth'
};

async function selectPlayer(playerName) {
  currentPlayer = playerName.toLowerCase();
  localStorage.setItem('traitors_player', currentPlayer);
  
  // Check if player has previous answers (reconnection)
  try {
    const response = await fetch(`${API_BASE}/api/player-state?player=${currentPlayer}`);
    if (response.ok) {
      const playerState = await response.json();
      // Score is already calculated on server, just continue
      console.log(`Reconnected as ${playerState.name}, score: ${playerState.score}, at question ${playerState.currentQuestionIndex + 1}`);
    }
  } catch (error) {
    console.error('Error fetching player state:', error);
  }
  
  playerSelectionSection.classList.add('hidden');
  missionSection.classList.remove('hidden');
  resultsSection.classList.add('hidden');
  waitingSection.classList.add('hidden');
  
  startGameStatusPolling();
}

// Check if player is already selected
function checkExistingPlayer() {
  const savedPlayer = localStorage.getItem('traitors_player');
  if (savedPlayer && ['eti', 'jude', 'nathalie', 'gareth'].includes(savedPlayer)) {
    selectPlayer(savedPlayer);
  } else {
    playerSelectionSection.classList.remove('hidden');
    missionSection.classList.add('hidden');
  }
}

function startGameStatusPolling() {
  updateGameStatus();
  gameStatusInterval = setInterval(updateGameStatus, 1000); // Poll every second
}

function stopGameStatusPolling() {
  if (gameStatusInterval) {
    clearInterval(gameStatusInterval);
    gameStatusInterval = null;
  }
}

function updateCrestProgress(questionIndex, totalQuestions) {
  if (!crestEl) return;
  
  const progress = questionIndex / totalQuestions;
  const circumference = 2 * Math.PI * 45; // radius is 45
  const offset = circumference * (1 - progress);
  
  const progressCircle = crestEl.querySelector('.crest-progress');
  if (progressCircle) {
    progressCircle.style.strokeDashoffset = offset;
  }
  
  // Show round table when complete
  if (questionIndex >= totalQuestions) {
    crestEl.classList.add('complete');
  } else {
    crestEl.classList.remove('complete');
  }
}

async function updateGameStatus() {
  try {
    const response = await fetch(`${API_BASE}/api/game-status`);
    if (!response.ok) {
      console.error('Failed to fetch game status');
      return;
    }
    const status = await response.json();
    
    // Update crest progress
    updateCrestProgress(status.currentQuestionIndex, allQuestions.length);
    
    // Update leaderboard
    renderLeaderboard(status.players);
    
    // Handle different phases
    if (status.phase === 'completed') {
      stopGameStatusPolling();
      showVoucher();
      return;
    }
    
    if (status.phase === 'answering') {
      resultsSection.classList.add('hidden');
      
      // Check if question index changed (new question)
      const questionChanged = status.currentQuestionIndex !== currentQuestionIndex;
      if (questionChanged) {
        currentQuestionIndex = status.currentQuestionIndex;
        myAnswerSubmitted = false;
        await render();
      } else if (!quizEl.classList.contains('hidden') && !myAnswerSubmitted) {
        // Question hasn't changed, but we need to check if we've already answered
        const myPlayer = status.players.find(p => p.name.toLowerCase() === currentPlayer);
        if (myPlayer && myPlayer.answered) {
          // We've already answered - re-render to show disabled state
          await render();
        }
      }
      
      // Show waiting message if others haven't answered yet (but we have)
      const myPlayer = status.players.find(p => p.name.toLowerCase() === currentPlayer);
      if (myPlayer && myPlayer.answered && !allPlayersAnswered(status.players)) {
        showWaitingMessage();
        myAnswerSubmitted = true;
      } else if (!myPlayer || !myPlayer.answered) {
        // We haven't answered yet
        hideWaitingMessage();
      }
    } else if (status.phase === 'showing-results') {
      showResults(status);
    }
  } catch (error) {
    console.error('Error fetching game status:', error);
  }
}

function allPlayersAnswered(players) {
  return players.every(p => p.answered);
}

function showWaitingMessage() {
  waitingSection.classList.remove('hidden');
  quizEl.classList.add('hidden');
}

function hideWaitingMessage() {
  waitingSection.classList.add('hidden');
  quizEl.classList.remove('hidden');
}

function renderLeaderboard(players) {
  if (!leaderboardEl) return;
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  
  leaderboardEl.innerHTML = `
    <div class="leaderboard-content">
      <div class="leaderboard-header">Round Table Standings</div>
      <div class="leaderboard-scores">
        ${sortedPlayers.map(p => `
          <div class="score-item">
            <span class="score-name">${p.name}</span>
            <span class="score-value">${p.score}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function render() {
  if (currentQuestionIndex >= allQuestions.length || currentQuestionIndex < 0) return;
  
  const { q, choices } = allQuestions[currentQuestionIndex];
  questionEl.textContent = q;
  optionsEl.innerHTML = '';
  nextBtn.disabled = true;
  selected = -1;
  progressEl.textContent = `Question ${currentQuestionIndex + 1} of ${allQuestions.length}`;
  hideWaitingMessage();

  // Check if we've already answered this question (for reconnection)
  try {
    const response = await fetch(`${API_BASE}/api/player-state?player=${currentPlayer}`);
    if (response.ok) {
      const playerState = await response.json();
      const previousAnswer = playerState.answers[currentQuestionIndex];
      
      if (previousAnswer) {
        // We've already answered - disable options and show our answer
        myAnswerSubmitted = true;
        choices.forEach((label, i) => {
          const btn = document.createElement('button');
          btn.className = 'option';
          btn.type = 'button';
          btn.textContent = label;
          btn.disabled = true;
          if (i === previousAnswer.answerIndex) {
            btn.classList.add(previousAnswer.correct ? 'correct' : 'incorrect');
          }
          optionsEl.appendChild(btn);
        });
        nextBtn.disabled = true;
        return;
      }
    }
  } catch (error) {
    console.error('Error checking player state:', error);
  }

  // Normal render - we haven't answered yet
  choices.forEach((label, i) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => selectOption(i, btn));
    optionsEl.appendChild(btn);
  });
}

function selectOption(i, btn) {
  if (myAnswerSubmitted) return; // Can't change answer after submitting
  
  selected = i;
  nextBtn.disabled = false;
  Array.from(optionsEl.children).forEach(c => c.classList.remove('selected'));
  btn.classList.add('selected');
}

async function showResults(status) {
  waitingSection.classList.add('hidden');
  quizEl.classList.add('hidden');
  resultsSection.classList.remove('hidden');
  
  if (currentQuestionIndex >= allQuestions.length) return;
  
  const currentQuestion = allQuestions[currentQuestionIndex];
  const correctAnswerIndex = currentQuestion.answerIndex;
  
  const isLastQuestion = currentQuestionIndex >= allQuestions.length - 1;
  
  // Build additional content for specific questions
  let additionalContent = '';
  
  // Check if this question should show the contestants table
  if (currentQuestion.showContestantsTable) {
    const contestantsTable = `
      <div class="contestants-table">
        <h4>Season 1 Contestants (in elimination order)</h4>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Aisha</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Nicky</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Claire</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Imran</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Ivan</td><td>Faithful</td><td>-</td></tr>
            <tr><td>John</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Tom</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Matt</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Alyssa</td><td>Traitor</td><td>Original</td></tr>
            <tr><td>Rayan</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Alex</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Theo</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Amos</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Fay</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Amanda</td><td>Traitor</td><td>Original</td></tr>
            <tr><td>Andrea</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Maddy</td><td>Faithful</td><td>-</td></tr>
            <tr><td>Kieran</td><td>Traitor</td><td>Recruited</td></tr>
            <tr><td>Wilfred</td><td>Traitor</td><td>Original</td></tr>
            <tr><td>Aaron</td><td>Faithful</td><td>Winner</td></tr>
            <tr><td>Hannah</td><td>Faithful</td><td>Winner</td></tr>
            <tr><td>Meryl</td><td>Faithful</td><td>Winner</td></tr>
          </tbody>
        </table>
      </div>
    `;
    additionalContent = contestantsTable;
  }
  
  // Build results display
  const resultsHTML = `
    <h3>Question ${currentQuestionIndex + 1} Results</h3>
    <div class="results-question">${currentQuestion.q}</div>
    <div class="results-answers">
      ${status.players.map(player => {
        const answer = status.currentAnswers[player.name.toLowerCase()];
        if (!answer) return '';
        
        const isCorrect = answer.correct;
        const answerText = currentQuestion.choices[answer.answerIndex];
        
        return `
          <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
            <span class="result-player">${player.name}</span>
            <span class="result-answer">${answerText}</span>
            <span class="result-mark">${isCorrect ? '✓' : '✗'}</span>
          </div>
        `;
      }).join('')}
    </div>
    <div class="results-correct-answer">
      Correct answer: <strong>${currentQuestion.choices[correctAnswerIndex]}</strong>
    </div>
    ${currentQuestion.showContestantsTable ? '' : (currentQuestion.trivia ? `<div class="results-trivia"><strong>Trivia:</strong> ${currentQuestion.trivia}</div>` : '')}
    ${additionalContent}
    <div class="results-actions">
      <button id="nextQuestionBtn" class="btn">${isLastQuestion ? 'View Results' : 'Next Question'}</button>
    </div>
  `;
  
  resultsSection.innerHTML = resultsHTML;
  
  // Set up next question button
  const nextQuestionBtn = document.getElementById('nextQuestionBtn');
  if (nextQuestionBtn) {
    nextQuestionBtn.addEventListener('click', async () => {
      await advanceToNextQuestion();
    });
  }
}

async function advanceToNextQuestion() {
  try {
    const response = await fetch(`${API_BASE}/api/next-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player: currentPlayer })
    });
    
    if (response.ok) {
      // Status polling will pick up the change
      resultsSection.classList.add('hidden');
      quizEl.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error advancing question:', error);
  }
}

function startConfetti() {
  const canvas = document.getElementById('confetti');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  
  const colors = ['#c7a645', '#9b1c2c', '#ffffff'];
  const pieces = Array.from({length: 120}, () => ({
    x: Math.random() * canvas.width,
    y: -10 - Math.random() * canvas.height,
    r: 2 + Math.random() * 4,
    s: 1 + Math.random() * 2,
    a: Math.random() * Math.PI * 2,
    c: colors[Math.floor(Math.random() * colors.length)]
  }));
  
  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.y += p.s;
      p.x += Math.sin(p.a += 0.02);
      if (p.y > canvas.height + 6) {
        p.y = -10;
        p.x = Math.random() * canvas.width;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.c;
      ctx.fill();
    });
    requestAnimationFrame(tick);
  }
  tick();
}

async function showVoucher() {
  stopGameStatusPolling();
  
  // Hide mission section and show voucher
  missionSection.classList.add('hidden');
  voucherSection.classList.remove('hidden');
  voucherSection.classList.add('reveal');
  
  // Get final scores
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    if (response.ok) {
      const data = await response.json();
      renderFinalScores(data.players);
    }
  } catch (error) {
    console.error('Error fetching final scores:', error);
  }
  
  // Start confetti animation
  startConfetti();
  
  // Scroll to voucher
  voucherSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderFinalScores(players) {
  if (!finalScoresEl) return;
  
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const maxScore = sortedPlayers[0].score;
  
  finalScoresEl.innerHTML = `
    <h3>Final Scores</h3>
    <div class="scores-grid">
      ${sortedPlayers.map((player, index) => {
        const isWinner = index === 0 && player.score === maxScore && maxScore > 0;
        const isTie = index > 0 && player.score === maxScore;
        return `
          <div class="score-card ${isWinner ? 'winner' : ''} ${isTie ? 'tie' : ''}">
            <div class="score-rank">${index + 1}</div>
            <div class="score-info">
              <div class="score-name-final">${player.name}</div>
              <div class="score-value-final">${player.score} / ${allQuestions.length}</div>
            </div>
            ${isWinner ? '<div class="winner-badge">🏆 Winner</div>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function submit() {
  if (selected < 0 || myAnswerSubmitted || currentQuestionIndex < 0) return;
  
  const correct = selected === allQuestions[currentQuestionIndex].answerIndex;
  myAnswerSubmitted = true;
  
  // Disable all options
  const buttons = Array.from(optionsEl.children);
  buttons.forEach(b => b.disabled = true);
  
  // Highlight selected answer
  buttons[selected].classList.add('selected');
  
  // Submit answer to server
  try {
    const response = await fetch(`${API_BASE}/api/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: currentPlayer,
        answerIndex: selected,
        correct: correct
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Status polling will handle showing results when all players answer
      nextBtn.disabled = true;
      showWaitingMessage();
    }
  } catch (error) {
    console.error('Error submitting answer:', error);
    myAnswerSubmitted = false;
    buttons.forEach(b => b.disabled = false);
  }
}

// Initialize
if (nextBtn) {
  nextBtn.addEventListener('click', submit);
}

// Set up player selection buttons
const playerButtons = ['eti', 'jude', 'nathalie', 'gareth'];
playerButtons.forEach(player => {
  const btn = document.getElementById(`select${player.charAt(0).toUpperCase() + player.slice(1)}`);
  if (btn) {
    btn.addEventListener('click', () => selectPlayer(player));
  }
});

// Check if we're on localhost
function isLocalhost() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '';
}

// Show/hide simulate panel based on hostname
function toggleSimulatePanel() {
  const simulatePanel = document.getElementById('simulatePanel');
  if (simulatePanel) {
    if (isLocalhost()) {
      simulatePanel.style.display = 'block';
    } else {
      simulatePanel.style.display = 'none';
    }
  }
}

// Set up simulation toggles
async function loadSimulateState() {
  try {
    const response = await fetch(`${API_BASE}/api/simulate`);
    if (response.ok) {
      const data = await response.json();
      data.players.forEach(p => {
        // Use player key (eti, jude, etc.) to find checkbox
        const checkbox = document.getElementById(`simulate${p.player.charAt(0).toUpperCase() + p.player.slice(1)}`);
        if (checkbox) {
          checkbox.checked = p.simulated;
        }
      });
    }
  } catch (error) {
    console.error('Error loading simulate state:', error);
  }
}

async function toggleSimulate(player, simulated) {
  try {
    const response = await fetch(`${API_BASE}/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player, simulated })
    });
    if (!response.ok) {
      console.error('Failed to toggle simulate mode');
    }
  } catch (error) {
    console.error('Error toggling simulate mode:', error);
  }
}

// Set up simulate toggle listeners (only if on localhost)
if (isLocalhost()) {
  playerButtons.forEach(player => {
    const checkbox = document.getElementById(`simulate${player.charAt(0).toUpperCase() + player.slice(1)}`);
    if (checkbox) {
      checkbox.addEventListener('change', (e) => {
        toggleSimulate(player, e.target.checked);
      });
    }
  });
}

// Initialize simulate panel visibility
toggleSimulatePanel();

// Show/hide reset button based on hostname
function toggleResetButton() {
  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    if (isLocalhost()) {
      resetBtn.classList.remove('hidden');
    } else {
      resetBtn.classList.add('hidden');
    }
  }
}

// Reset game function
async function resetGame() {
  if (!confirm('Are you sure you want to reset the game? This will clear all progress.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.ok) {
      // Clear localStorage
      localStorage.removeItem('traitors_player');
      
      // Reload the page to start fresh
      window.location.reload();
    } else {
      console.error('Failed to reset game');
      alert('Failed to reset game. Please try again.');
    }
  } catch (error) {
    console.error('Error resetting game:', error);
    alert('Error resetting game. Please try again.');
  }
}

// Set up reset button
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', resetGame);
}

// Initialize reset button visibility
toggleResetButton();

// Load simulate state on page load (only if on localhost)
if (isLocalhost()) {
  loadSimulateState();
}

// Initialize crest progress
updateCrestProgress(0, allQuestions.length);

// Check for existing player on load
checkExistingPlayer();
