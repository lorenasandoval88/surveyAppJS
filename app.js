// -----------------------------
// 0. Configuration
// -----------------------------
const MIN_BIRTH_YEAR = 1900;

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
// 3. Helper: get cigarette rows up to current age
// -----------------------------
function getCigaretteRowsForAge(age) {
  const allRows = [
    { key: "under_18", label: "Under 18", maxAge: 17 },
    { key: "18_29", label: "18-29", maxAge: 29 },
    { key: "30_39", label: "30-39", maxAge: 39 },
    { key: "40_49", label: "40-49", maxAge: 49 },
    { key: "50_59", label: "50-59", maxAge: 59 },
    { key: "60_plus", label: "60+", maxAge: Infinity }
  ];

  const rows = [];

  for (const row of allRows) {
    rows.push({ key: row.key, label: row.label });

    if (age <= row.maxAge) {
      break;
    }
  }

  return rows;
}

// -----------------------------
// 4. Survey questions with skip logic
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
    next: "smoked_cigarettes_past"
  },

  {
    id: "smoked_cigarettes_past",
    text: "Have you smoked cigarettes in the past?",
    type: "yes_no",
    next: (answers) => {
      if (answers.smoked_cigarettes_past === "yes") {
        return "cigarettes_by_age_bin";
      }

      return "end";
    }
  },

  {
    id: "cigarettes_by_age_bin",
    text: "Cigarettes per day by age bin",
    type: "grid",
    rowHeader: "Age Bin",
    columnHeader: "Cigarettes Per Day",
    placeholder: "Select cigarettes/day",
    getRows: (answers) => getCigaretteRowsForAge(answers.age),
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
// 5. Survey state
// -----------------------------
let answers = {};
let currentQuestionId = "dob";

// -----------------------------
// 6. Get current question
// -----------------------------
function getCurrentQuestion() {
  return questions.find(q => q.id === currentQuestionId);
}

// -----------------------------
// 7. Render question on page
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
    for (let y = currentYear; y >= MIN_BIRTH_YEAR; y--) {
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
  } else if (question.type === "number") {
    inputHtml = `
      <input type="number" id="answer-input" min="0" />
    `;
  } else if (question.type === "yes_no") {
    inputHtml = `
      <select id="answer-input">
        <option value="">Select an answer</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    `;
  } else if (question.type === "select") {
    inputHtml = `
      <select id="answer-input">
        <option value="">Select an answer</option>
        ${question.options.map(option => `
          <option value="${option}">${option}</option>
        `).join("")}
      </select>
    `;
  } else if (question.type === "grid") {
    const gridRows = typeof question.getRows === "function"
      ? question.getRows(answers)
      : question.rows;

    inputHtml = `
      <table class="grid-table">
        <thead>
          <tr>
            <th>${question.rowHeader || "Row"}</th>
            <th>${question.columnHeader || "Value"}</th>
          </tr>
        </thead>
        <tbody>
          ${gridRows.map(row => `
            <tr>
              <td>${row.label}</td>
              <td>
                <select
                  data-grid-question="${question.id}"
                  data-row-key="${row.key}"
                  aria-label="Select ${(question.columnHeader || "value").toLowerCase()} for ${row.label}"
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
  } else {
    inputHtml = `<p>Unsupported question type.</p>`;
  }

  container.innerHTML = `
    <h2>${question.text}</h2>
    ${inputHtml}
  `;

  nextButton.style.display = "block";
}

// -----------------------------
// 8. Save answer and move forward
// -----------------------------
function answerCurrentQuestion() {
  const question = getCurrentQuestion();

  let answerValue;

  if (question.type === "date") {
    const monthEl = document.getElementById("dob-month");
    const dayEl = document.getElementById("dob-day");
    const yearEl = document.getElementById("dob-year");

    if (!monthEl || !dayEl || !yearEl) {
      alert("Date of birth inputs are missing. Please refresh and try again.");
      return;
    }

    const month = monthEl.value;
    const day = dayEl.value;
    const year = yearEl.value;

    if (!month || !day || !year) {
      alert("Please select a complete date of birth.");
      return;
    }

    answerValue = `${year}-${month}-${day}`;

    const parsedDate = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10)
    );

    if (
      isNaN(parsedDate.getTime()) ||
      parsedDate.getFullYear() !== parseInt(year, 10) ||
      parsedDate.getMonth() + 1 !== parseInt(month, 10) ||
      parsedDate.getDate() !== parseInt(day, 10)
    ) {
      alert("Please select a valid date of birth.");
      return;
    }
  } else if (question.type === "grid") {
    const gridRows = typeof question.getRows === "function"
      ? question.getRows(answers)
      : question.rows;

    const selects = document.querySelectorAll(
      `select[data-grid-question="${question.id}"]`
    );

    if (selects.length !== gridRows.length) {
      alert("Something went wrong loading this question. Please refresh and try again.");
      return;
    }

    answerValue = {};

    for (const select of selects) {
      const rowKey = select.dataset.rowKey;
      const value = select.value;

      if (value === "") {
        alert("Please answer every row before continuing.");
        select.focus();
        return;
      }

      answerValue[rowKey] = value;
    }
  } else if (
    question.type === "number" ||
    question.type === "yes_no" ||
    question.type === "select"
  ) {
    const input = document.getElementById("answer-input");

    if (!input) {
      alert("Input field is missing. Please refresh and try again.");
      return;
    }

    if (!input.value) {
      alert("Please answer the question before continuing.");
      return;
    }

    answerValue = input.value;
  } else {
    alert(`Unsupported question type: ${question.type}`);
    return;
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
// 9. Final summary
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
// 10. Start app
// -----------------------------
document.getElementById("next-btn").addEventListener("click", answerCurrentQuestion);

renderQuestion();
