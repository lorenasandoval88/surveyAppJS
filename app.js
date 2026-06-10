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
    next: "cigarettes_by_age_bin"
  },

  {
    id: "cigarettes_by_age_bin",
    text: "Cigarettes per day by age bin",
    type: "grid",
    rowHeader: "Age Bin",
    columnHeader: "Cigarettes Per Day",
    placeholder: "Select cigarettes/day",
    rows: [
      { key: "under_18", label: "Under 18" },
      { key: "18_29", label: "18-29" },
      { key: "30_39", label: "30-39" },
      { key: "40_49", label: "40-49" },
      { key: "50_59", label: "50-59" },
      { key: "60_plus", label: "60+" }
    ],
    columns: [
      { key: "0", label: "0" },
      { key: "1_5", label: "1-5" },
      { key: "6_10", label: "6-10" },
      { key: "11_20", label: "11-20" },
      { key: "21_plus", label: "21+" }
    ],
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
    inputHtml = `
      <input type="date" id="answer-input" />
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

  if (question.type === "grid") {
    inputHtml = `
      <table class="grid-table">
        <thead>
          <tr>
            <th>${question.rowHeader || "Row"}</th>
            <th>${question.columnHeader || "Value"}</th>
          </tr>
        </thead>
        <tbody>
          ${question.rows.map(row => `
            <tr>
              <td>${row.label}</td>
              <td>
                <select
                  data-grid-question="${question.id}"
                  data-row-key="${row.key}"
                  aria-label="Select ${question.columnHeader || "value"} for ${row.label}"
                >
                  <option value="">${question.placeholder || "Select value"}</option>
                  ${question.columns.map(column => `
                    <option value="${column.key}">${column.label}</option>
                  `).join("")}
                </select>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
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

  if (question.type === "grid") {
    const rowInputs = Array.from(
      document.querySelectorAll(`select[data-grid-question="${question.id}"]`)
    );
    const gridAnswer = {};

    for (const rowInput of rowInputs) {
      if (!rowInput.value) {
        alert("Please complete all age bin selections before continuing.");
        return;
      }

      gridAnswer[rowInput.dataset.rowKey] = rowInput.value;
    }

    answers[question.id] = gridAnswer;
  } else {
    const input = document.getElementById("answer-input");

    if (!input.value) {
      alert("Please answer the question before continuing.");
      return;
    }

    answers[question.id] = input.value;
  }

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
