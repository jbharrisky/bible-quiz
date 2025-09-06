const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGWgTvf3kg9QYY_uwOSUrrXayVQ5dKUJFvnTVN3cEKwLx7LBxdT2GhlEhyMqxwZnaRc78jvaZ3DWzH/pub?output=csv"; 

let QUESTIONS = [];
let currentIndex = 0;
let answers = [];

const quizEl = document.getElementById("quiz");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const resultEl = document.getElementById("result");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadQuestions() {
  const res = await fetch(url);
  const text = await res.text();
  const rows = text.trim().split("\n").map(r => r.split(","));

  rows.shift(); // remove headers

  QUESTIONS = shuffle(
    rows.map(r => {
      const q = {
        id: r[0],
        text: r[1],
        correct: r[2],
        wrongs: [r[3], r[4], r[5]],
        category: r[6],
        explanation: r[7],
        images: [r[8], r[9], r[10]].filter(Boolean)
      };

      // Shuffle the answer choices
      q.choices = shuffle([q.correct, ...q.wrongs]);
      return q;
    })
  );

  answers = new Array(QUESTIONS.length).fill(null);
  renderQuestion();
}

function renderQuestion() {
  if (QUESTIONS.length === 0) return;
  const q = QUESTIONS[currentIndex];
  quizEl.innerHTML = `
    <div class="question">Q${currentIndex+1}: ${q.text}</div>
    <div class="choices">
      ${q.choices.map(c => `
        <label>
          <input type="radio" name="q${currentIndex}" value="${c}" ${answers[currentIndex] === c ? "checked" : ""}>
          ${c}
        </label>
      `).join("")}
    </div>
    <div id="feedback" class="explanation" style="display:none;"></div>
  `;

  prevBtn.disabled = currentIndex === 0;
  nextBtn.textContent = currentIndex === QUESTIONS.length-1 ? "Submit" : "Next";

  // Disable Next if no answer yet
  nextBtn.disabled = answers[currentIndex] === null;
}

quizEl.addEventListener("change", (e) => {
  if (e.target.name === `q${currentIndex}`) {
    answers[currentIndex] = e.target.value;

    const q = QUESTIONS[currentIndex];
    const feedbackEl = document.getElementById("feedback");

    // Lock all choices after selection
    document.querySelectorAll(`input[name="q${currentIndex}"]`).forEach(input => {
      input.disabled = true;
    });

    if (answers[currentIndex] === q.correct) {
      feedbackEl.style.display = "block";
      feedbackEl.innerHTML = `<strong>Correct!</strong>`;
    } else {
      feedbackEl.style.display = "block";
      feedbackEl.innerHTML = `
        <strong>Incorrect.</strong><br>
        <strong>Correct Answer:</strong> ${q.correct}<br>
        <p>${q.explanation || ""}</p>
        ${q.images.map(img => `<img src="${img}" alt="image for question">`).join("")}
      `;
    }

    // Enable Next once an answer is chosen
    nextBtn.disabled = false;
  }
});

nextBtn.addEventListener("click", () => {
  if (currentIndex === QUESTIONS.length-1) {
    showResult();
  } else {
    currentIndex++;
    renderQuestion();
  }
});

prevBtn.addEventListener("click", () => {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
});

function showResult() {
  let score = 0;
  let details = "";

  QUESTIONS.forEach((q,i) => {
    const correct = answers[i] === q.correct;
    if (correct) score++;

    details += `
      <div class="explanation">
        <strong>Q${i+1}:</strong> ${q.text}<br>
        <strong>Your Answer:</strong> ${answers[i] || "No answer"}<br>
        <strong>Correct Answer:</strong> ${q.correct}<br>
        <em>Category:</em> ${q.category}<br>
        <p>${q.explanation || ""}</p>
        ${q.images.map(img => `<img src="${img}" alt="image for question">`).join("")}
      </div>
    `;
  });

  quizEl.style.display = "none";
  document.querySelector(".navigation").style.display = "none";
  resultEl.style.display = "block";
  resultEl.innerHTML = `<h2>Your Score: ${score} / ${QUESTIONS.length}</h2>${details}`;
}

loadQuestions();
