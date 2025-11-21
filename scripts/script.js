// 👉 Replace this with your actual published CSV URL:


const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTGWgTvf3kg9QYY_uwOSUrrXayVQ5dKUJFvnTVN3cEKwLx7LBxdT2GhlEhyMqxwZnaRc78jvaZ3DWzH/pub?output=csv";

let QUESTIONS = [];
let currentIndex = 0;
let answers = {}; // { [ID]: selectedText }

const questionTextEl = document.getElementById("questionText");
const optionsEl = document.getElementById("options");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const resultEl = document.getElementById("result");
const explanationEl = document.getElementById("explanation");
const imagesEl = document.getElementById("images");
const metaEl = document.getElementById("meta");

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadQuestions() {
  try {
    questionTextEl.textContent = "Loading questions from sheet…";

    console.log("Fetching CSV from:", url);
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }

    const csv = await res.text();
    console.log("CSV length:", csv.length);

    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    console.log("Parsed result:", parsed);

    if (parsed.errors && parsed.errors.length > 0) {
      console.warn("PapaParse errors:", parsed.errors);
    }

    QUESTIONS = parsed.data;

    if (!QUESTIONS || !QUESTIONS.length) {
      questionTextEl.textContent = "No questions found in the sheet (check headers & rows).";
      return;
    }

    currentIndex = 0;
    showQuestion();
  } catch (err) {
    console.error("Error loading questions:", err);
    questionTextEl.textContent = "Error loading questions – check the console for details.";
  }
}

function showQuestion() {
  const q = QUESTIONS[currentIndex];
  if (!q) return;

  // Meta info (Category + Bible Period)
  const category = q["Category"] || "";
  const period = q["Bible Period"] || "";
  metaEl.textContent = [category, period].filter(Boolean).join(" • ");

  // Question text
  questionTextEl.textContent = q["Question"] || "No question text";

  // Clear previous UI
  optionsEl.innerHTML = "";
  explanationEl.textContent = "";
  imagesEl.innerHTML = "";
  resultEl.textContent = "";

  // Build answer choices (Correct + 3 Wrong)
  let answerObjects = [
    { text: q["Correct Answer"], isCorrect: true },
    { text: q["Wrong Answer 1"], isCorrect: false },
    { text: q["Wrong Answer 2"], isCorrect: false },
    { text: q["Wrong Answer 3"], isCorrect: false }
  ].filter(a => a.text && a.text.trim() !== "");

  answerObjects = shuffle(answerObjects);

  const savedAnswer = answers[q["ID"]];

  answerObjects.forEach(answerObj => {
    const label = document.createElement("label");
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "option";
    radio.value = answerObj.text;

    if (savedAnswer && savedAnswer === answerObj.text) {
      radio.checked = true;
    }

    label.appendChild(radio);
    label.append(" " + answerObj.text);
    optionsEl.appendChild(label);
  });

  // Images (if any)
  ["Image1", "Image2", "Image3"].forEach(key => {
    const src = q[key];
    if (src && src.trim() !== "") {
      const img = document.createElement("img");
      img.src = src.trim();
      img.alt = key;
      imagesEl.appendChild(img);
    }
  });

  // Buttons state
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === QUESTIONS.length - 1;
}

function saveAnswer() {
  const q = QUESTIONS[currentIndex];
  const selected = document.querySelector("input[name='option']:checked");
  if (selected) {
    answers[q["ID"]] = selected.value;
  }
}

prevBtn.addEventListener("click", () => {
  saveAnswer();
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
});

nextBtn.addEventListener("click", () => {
  saveAnswer();
  if (currentIndex < QUESTIONS.length - 1) {
    currentIndex++;
    showQuestion();
  }
});

submitBtn.addEventListener("click", () => {
  saveAnswer();

  let score = 0;
  QUESTIONS.forEach(q => {
    const userAnswer = answers[q["ID"]];
    const correct = q["Correct Answer"];
    if (userAnswer && correct && userAnswer.trim() === correct.trim()) {
      score++;
    }
  });

  resultEl.textContent = `You scored ${score} out of ${QUESTIONS.length}.`;

  const q = QUESTIONS[currentIndex];
  const expl = q["Explanation"];
  if (expl && expl.trim() !== "") {
    explanationEl.textContent = expl;
  } else {
    explanationEl.textContent = "";
  }
});

// Start it up
loadQuestions();
