import Head from 'next/head';
import Script from 'next/script';

export default function Home() {
  return (
    <>
      <Head>
        <title>The Round Table — Christmas Mission</title>
      </Head>
      <div id="container">
        <header className="hero">
          <button id="resetBtn" className="btn reset-btn" style={{ display: 'none' }}>Reset Game</button>
          <div className="crest" id="crest">
            <svg className="crest-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle className="crest-bg" cx="50" cy="50" r="45" fill="none" stroke="rgba(199, 166, 69, 0.2)" strokeWidth="4"/>
              <circle className="crest-progress" cx="50" cy="50" r="45" fill="none" stroke="#c7a645" strokeWidth="4" 
                      strokeDasharray="282.74" strokeDashoffset="282.74" transform="rotate(-90 50 50)"/>
              <g className="round-table-icon" opacity="0">
                <circle cx="50" cy="50" r="35" fill="#c7a645"/>
                <text x="50" y="62" fontFamily="Cinzel" fontSize="48" fontWeight="700" fill="#000000" textAnchor="middle">T</text>
              </g>
              <text className="crest-letter" x="50" y="65" fontFamily="Cinzel" fontSize="40" fontWeight="700" fill="#c7a645" textAnchor="middle">T</text>
            </svg>
          </div>
          <h1>Take your seat at the Round Table</h1>
          <p className="tag">A Christmas mission awaits. Are you Faithful… or Traitor?</p>
        </header>

        <main>
          <section id="playerSelection" className="card">
            <h2>Choose Your Identity</h2>
            <p>Select who you are to begin your mission at the Round Table.</p>
            <div className="player-buttons">
              <button id="selectEti" className="btn player-btn">Eti</button>
              <button id="selectJude" className="btn player-btn">Jude</button>
              <button id="selectNathalie" className="btn player-btn">Nathalie</button>
              <button id="selectGareth" className="btn player-btn">Gareth</button>
            </div>
            
            <div id="simulatePanel" className="simulate-panel" style={{ display: 'none' }}>
              <h3>Test Mode: Simulate Players</h3>
              <p className="simulate-help">Toggle players to simulate mode to auto-generate answers for testing.</p>
              <div className="simulate-controls">
                <label className="simulate-toggle">
                  <input type="checkbox" id="simulateEti" data-player="eti" />
                  <span>Simulate Eti</span>
                </label>
                <label className="simulate-toggle">
                  <input type="checkbox" id="simulateJude" data-player="jude" />
                  <span>Simulate Jude</span>
                </label>
                <label className="simulate-toggle">
                  <input type="checkbox" id="simulateNathalie" data-player="nathalie" />
                  <span>Simulate Nathalie</span>
                </label>
                <label className="simulate-toggle">
                  <input type="checkbox" id="simulateGareth" data-player="gareth" />
                  <span>Simulate Gareth</span>
                </label>
              </div>
            </div>
          </section>

          <section id="mission" className="card hidden">
            <div id="leaderboard"></div>
            <h2>Christmas Mission</h2>
            <p>
              Your task is to answer questions about The Traitors UK at the Round Table.
              When you succeed, your classified briefing will appear.
            </p>
            <div id="quiz" className="quiz" aria-label="Quiz" role="group">
              <div id="question" className="question"></div>
              <div id="options" className="options"></div>
              <div className="actions">
                <button id="nextBtn" className="btn next" disabled>Submit</button>
              </div>
              <div id="quizProgress" className="progress"></div>
            </div>
            <div id="waiting" className="waiting hidden">
              <p>Waiting for other players to answer...</p>
            </div>
            <div id="results" className="results hidden"></div>
          </section>

          <section id="voucher" className="card voucher hidden" aria-live="polite">
            <h2>Classified Briefing</h2>
            <p className="lead">Mission accomplished! Your surprise is revealed.</p>
            
            <div id="finalScores" className="final-scores"></div>
            
            <div className="ticket">
              <div className="stamp pop">APPROVED</div>
              <h3>Christmas Voucher</h3>
              <p>
                Merry Christmas, Eti, Jude, Nathalie and Gareth! Your present is an unforgettable experience at{' '}
                <strong>The Traitors: Live Experience</strong> in Covent Garden, London.
              </p>
              <p><strong>Date:</strong> 11th January, 10am</p>
              <p>Get ready for deception, strategy and fun!</p>
              <a className="btn" href="https://www.thetraitorslive.co.uk" target="_blank" rel="noopener noreferrer">Learn about the experience</a>
            </div>
          </section>
        </main>

        <footer>
          <small></small>
        </footer>
      </div>

      <canvas id="confetti"></canvas>
      <Script src="/assets/js/app.js" type="module" strategy="afterInteractive" />
    </>
  );
}
