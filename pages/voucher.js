import Head from 'next/head';
import Script from 'next/script';

export default function Voucher() {
  return (
    <>
      <Head>
        <title>Classified Briefing — Christmas Voucher</title>
        <style jsx>{`
          .reveal {
            opacity: 0;
            transform: translateY(12px) scale(0.98);
            animation: reveal 0.7s ease forwards 0.2s;
          }
          @keyframes reveal {
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .pop {
            animation: pop 0.4s ease forwards;
          }
          @keyframes pop {
            0% { transform: scale(0.8) rotate(-6deg); }
            60% { transform: scale(1.05) rotate(-2deg); }
            100% { transform: scale(1) rotate(-6deg); }
          }
          canvas#confetti {
            position: fixed;
            inset: 0;
            pointer-events: none;
          }
        `}</style>
      </Head>
      <canvas id="confetti"></canvas>
      <div id="container">
        <header className="hero">
          <div className="crest complete">
            <svg className="crest-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle className="crest-bg" cx="50" cy="50" r="45" fill="none" stroke="rgba(199, 166, 69, 0.2)" strokeWidth="4"/>
              <circle className="crest-progress" cx="50" cy="50" r="45" fill="none" stroke="#c7a645" strokeWidth="4" 
                      strokeDasharray="282.74" strokeDashoffset="0" transform="rotate(-90 50 50)"/>
              <g className="round-table-icon" opacity="1">
                <circle cx="50" cy="50" r="35" fill="#c7a645"/>
                <text x="50" y="62" fontFamily="Cinzel" fontSize="48" fontWeight="700" fill="#000000" textAnchor="middle">T</text>
              </g>
              <text className="crest-letter" x="50" y="65" fontFamily="Cinzel" fontSize="40" fontWeight="700" fill="#c7a645" textAnchor="middle" opacity="0">T</text>
            </svg>
          </div>
          <h1>Classified Briefing</h1>
          <p className="tag">Mission accomplished!</p>
        </header>

        <main>
          <section className="card voucher reveal">
            <div className="ticket">
              <div className="stamp pop">APPROVED</div>
              <h2>Christmas Voucher</h2>
              <p>
                Merry Christmas, Eti, Jude, Nathalie and Gareth! Your present is an unforgettable experience at{' '}
                <strong>The Traitors: Live Experience</strong> in Covent Garden, London.
              </p>
              <p>Get ready for deception, strategy and fun!</p>
              <p><strong>Date:</strong> 11th January, 10am</p>
              <a className="btn" href="https://www.thetraitorslive.co.uk" target="_blank" rel="noopener noreferrer">Learn about the experience</a>
            </div>
          </section>
        </main>

        <footer>
          <small></small>
        </footer>
      </div>
      <Script id="confetti-script" strategy="afterInteractive">
        {`
          (function(){
            const canvas = document.getElementById('confetti');
            const ctx = canvas.getContext('2d');
            function resize(){canvas.width = innerWidth; canvas.height = innerHeight}
            addEventListener('resize', resize); resize();
            const colors = ['#c7a645','#9b1c2c','#ffffff'];
            const pieces = Array.from({length: 120}, () => ({
              x: Math.random()*canvas.width,
              y: -10 - Math.random()*canvas.height,
              r: 2 + Math.random()*4,
              s: 1 + Math.random()*2,
              a: Math.random()*Math.PI*2,
              c: colors[Math.floor(Math.random()*colors.length)]
            }));
            function tick(){
              ctx.clearRect(0,0,canvas.width,canvas.height);
              pieces.forEach(p=>{
                p.y += p.s;
                p.x += Math.sin(p.a += 0.02);
                if(p.y > canvas.height+6) { p.y = -10; p.x = Math.random()*canvas.width; }
                ctx.beginPath();
                ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
                ctx.fillStyle=p.c; ctx.fill();
              });
              requestAnimationFrame(tick);
            }
            tick();
          })();
        `}
      </Script>
    </>
  );
}
