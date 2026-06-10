// -----------------------------
// 1. Helper: calculate age from DOB
// -----------------------------
function calculateAge(dobString) {
  const dob = new Date(dobString);
  const today = new Date();

  let age = today.getFullYear() - dob.getFullYear();

  const hadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() &&
      today.getDate() >= dob.getDate());

  if (!hadBirthdayThisYear) {
    age--;
  }

  return age;
}

// -----------------------------
// 2. Helper: convert age to age group
// -----------------------------
function getAgeGroup(age) {
  if (age < 18) return "under_18";
  if (age <= 29) return "18_29";
  if (age <= 39) return "30_39";
  if (age <= 49) return "40_49";
  if (age <= 59) return "50_59";
  return "60_plus";
}

// -----------------------------
// 3. Survey questions with skip logic
// -----------------------------
const questions = [
  {
    id: "dob",
    text: "What is your date of birth?",
    type: "date",
    next: (answers) => {
      const age = calculateAge(answers.dob);

      answers.age = age;
      answers.age_group = getAgeGroup(age);

      if (age < 18) {
        return "guardian_consent";
      }

      return "diabetes";
    }
  },

  {
    id: "guardian_consent",
    text: "Do you have parent or guardian consent?",
    type: "yes_no",
    next: (answers) => {
      if (answers.guardian_consent === "yes") {
        return "diabetes";
      }

      return "end";
    }
  },

  {
    id: "diabetes",
    text: "Have you ever been diagnosed with diabetes?",
    type: "yes_no",
    next: (answers) => {
      if (answers.diabetes === "yes") {
        return "diabetes_type";
      }

      return "heart_disease";
    }
  },

  {
    id: "diabetes_type",
    text: "What type of diabetes were you diagnosed with?",
    type: "select",
    options: ["Type 1", "Type 2", "Gestational", "Unknown"],
    next: "diabetes_age"
  },

  {
    id: "diabetes_age",
    text: "At what age were you diagnosed with diabetes?",
    type: "number",
    next: "diabetes_medication"
  },

  {
    id: "diabetes_medication",
    text: "Are you currently taking medication for diabetes?",
    type: "yes_no",
    next: "heart_disease"
  },

  {
    id: "heart_disease",
    text: "Have you ever been diagnosed with heart disease?",
    type: "yes_no",
    next: (answers) => {
      if (answers.heart_disease === "yes") {
        return "heart_disease_age";
      }

      return "family_history";
    }
  },

  {
    id: "heart_disease_age",
    text: "At what age were you diagnosed with heart disease?",
    type: "number",
    next: "family_history"
  },

  {
    id: "family_history",
    text: "Do you have a family history of diabetes or heart disease?",
    type: "yes_no",
    next: "end"
  }
];

// -----------------------------
// 4. Survey state
// -----------------------------
let answers = {};
let currentQuestionId = "dob";

// -----------------------------
// 5. Get current question
// -----------------------------
function getCurrentQuestion() {
  return questions.find(q => q.id === currentQuestionId);
}

// -----------------------------
// 6. Render question on page
// -----------------------------
function renderQuestion() {
  const container = document.getElementById("question-container");
  const summaryContainer = document.getElementById("summary-container");
  const nextButton = document.getElementById("next-btn");

  summaryContainer.innerHTML = "";

  if (currentQuestionId === "end") {
    renderSummary();
    return;
  }

  const question = getCurrentQuestion();

  let inputHtml = "";

  if (question.type === "date") {
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let y = currentYear; y >= 1900; y--) {
      yearOptions.push(`<option value="${y}">${y}</option>`);
    }
    const dayOptions = [];
    for (let d = 1; d <= 31; d++) {
      const val = String(d).padStart(2, "0");
      dayOptions.push(`<option value="${val}">${d}</option>`);
    }
    inputHtml = `
      <div class="dob-selects">
        <select id="dob-month">
          <option value="">Month</option>
          <option value="01">January</option>
          <option value="02">February</option>
          <option value="03">March</option>
          <option value="04">April</option>
          <option value="05">May</option>
          <option value="06">June</option>
          <option value="07">July</option>
          <option value="08">August</option>
          <option value="09">September</option>
          <option value="10">October</option>
          <option value="11">November</option>
          <option value="12">December</option>
        </select>
        <select id="dob-day">
          <option value="">Day</option>
          ${dayOptions.join("")}
        </select>
        <select id="dob-year">
          <option value="">Year</option>
          ${yearOptions.join("")}
        </select>
      </div>
    `;
  }

  if (question.type === "number") {
    inputHtml = `
      <input type="number" id="answer-input" min="0" />
    `;
  }

  if (question.type === "yes_no") {
    inputHtml = `
      <select id="answer-input">
        <option value="">Select an answer</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    `;
  }

  if (question.type === "select") {
    inputHtml = `
      <select id="answer-input">
        <option value="">Select an answer</option>
        ${question.options.map(option => `
          <option value="${option}">${option}</option>
        `).join("")}
      </select>
    `;
  }

  container.innerHTML = `
    <h2>${question.text}</h2>
    ${inputHtml}
  `;

  nextButton.style.display = "block";
}

// -----------------------------
// 7. Save answer and move forward
// -----------------------------
function answerCurrentQuestion() {
  const question = getCurrentQuestion();

  let answerValue;

  if (question.type === "date") {
    const month = document.getElementById("dob-month").value;
    const day = document.getElementById("dob-day").value;
    const year = document.getElementById("dob-year").value;

    if (!month || !day || !year) {
      alert("Please select a complete date of birth.");
      return;
    }

    answerValue = `${year}-${month}-${day}`;
  } else {
    const input = document.getElementById("answer-input");

    if (!input.value) {
      alert("Please answer the question before continuing.");
      return;
    }

    answerValue = input.value;
  }

  answers[question.id] = answerValue;

  if (typeof question.next === "function") {
    currentQuestionId = question.next(answers);
  } else {
    currentQuestionId = question.next;
  }

  renderQuestion();
}

// -----------------------------
// 8. Final summary
// -----------------------------
function renderSummary() {
  const container = document.getElementById("question-container");
  const summaryContainer = document.getElementById("summary-container");
  const nextButton = document.getElementById("next-btn");

  nextButton.style.display = "none";

  container.innerHTML = `<h2>Survey Complete</h2>`;

  summaryContainer.innerHTML = `
    <h3>Structured Survey Data</h3>
    <pre>${JSON.stringify(answers, null, 2)}</pre>
  `;
}

// -----------------------------
// 9. Start app
// -----------------------------
document.getElementById("next-btn").addEventListener("click", answerCurrentQuestion);

renderQuestion();
