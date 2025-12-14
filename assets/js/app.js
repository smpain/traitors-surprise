(() => {
  const quizEl = document.getElementById('quiz');
  const questionEl = document.getElementById('question');
  const optionsEl = document.getElementById('options');
  const nextBtn = document.getElementById('nextBtn');
  const progressEl = document.getElementById('quizProgress');
  const voucherSection = document.getElementById('voucher');
  const missionSection = document.getElementById('mission');

  const questions = [
    {
      q: "At the Round Table, would a Faithful tell the truth or deceive?",
      choices: ["Always tell the truth", "Deceive every time", "Choose wisely, it depends"],
      answerIndex: 2
    },
    {
      q: "Which of these is most useful: instinct, teamwork, or luck?",
      choices: ["Instinct", "Teamwork", "Luck"],
      answerIndex: 1
    },
    {
      q: "When suspicion rises, what should you do first?",
      choices: ["Panic", "Observe and gather clues", "Blame your best friend"],
      answerIndex: 1
    }
  ];

  let idx = 0;
  let selected = -1;

  function render() {
    const { q, choices } = questions[idx];
    questionEl.textContent = q;
    optionsEl.innerHTML = '';
    nextBtn.disabled = true;
    selected = -1;
    progressEl.textContent = `Question ${idx + 1} of ${questions.length}`;

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
    selected = i;
    nextBtn.disabled = false;
    Array.from(optionsEl.children).forEach(c => c.classList.remove('selected'));
    btn.classList.add('selected');
  }

  function showVoucher() {
    // Navigate to dedicated voucher page
    window.location.assign('voucher.html');
  }

  function submit() {
    if (selected < 0) return;
    const correct = selected === questions[idx].answerIndex;
    const buttons = Array.from(optionsEl.children);
    buttons.forEach((b, i) => {
      b.classList.remove('selected');
      if (i === questions[idx].answerIndex) b.classList.add('correct');
      if (i === selected && !correct) b.classList.add('incorrect');
      b.disabled = true;
    });

    if (!correct) {
      quizEl.classList.remove('shake');
      // retrigger animation
      void quizEl.offsetWidth;
      quizEl.classList.add('shake');
      nextBtn.disabled = true;
      // allow changing answer
      buttons.forEach((b, i) => {
        b.disabled = false;
        b.addEventListener('click', () => {
          buttons.forEach(bb => bb.classList.remove('correct', 'incorrect'));
          selectOption(i, b);
        }, { once: true });
      });
      return;
    }

    // Correct -> advance after short pause
    setTimeout(() => {
      idx += 1;
      if (idx >= questions.length) {
        showVoucher();
      } else {
        render();
      }
    }, 450);
  }

  nextBtn.addEventListener('click', submit);
  render();
})();


