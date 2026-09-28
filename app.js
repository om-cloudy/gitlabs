let questions = [];

function addQuestion() {
  questions.push({
    question: "",
    type: "text",
    options: [],
    required: false
  });

  renderQuestions();
}

function removeQuestion(index) {
  questions.splice(index, 1);
  renderQuestions();
}

function updateQuestion(index, field, value) {
  questions[index][field] = value;
}

function changeType(index, type) {
  questions[index].type = type;

  if (
    type === "radio" ||
    type === "checkbox" ||
    type === "select"
  ) {
    if (!questions[index].options.length) {
      questions[index].options = ["Option 1"];
    }
  } else {
    questions[index].options = [];
  }

  renderQuestions();
}

function addOption(index) {
  questions[index].options.push(
    `Option ${questions[index].options.length + 1}`
  );

  renderQuestions();
}

function updateOption(questionIndex, optionIndex, value) {
  questions[questionIndex].options[optionIndex] = value;
}

function removeOption(questionIndex, optionIndex) {
  questions[questionIndex].options.splice(optionIndex, 1);
  renderQuestions();
}

function renderQuestions() {
  const container = document.getElementById("questions");

  container.innerHTML = questions.map((q, i) => {

    let optionsHTML = "";

    if (
      q.type === "radio" ||
      q.type === "checkbox" ||
      q.type === "select"
    ) {

      optionsHTML = `
        <div class="options">

          <label>Options</label>

          ${q.options.map((option, oi) => `
            <div class="option-row">

              <input
                value="${escapeHtml(option)}"
                oninput="updateOption(${i}, ${oi}, this.value)"
              >

              <button
                onclick="removeOption(${i}, ${oi})"
                type="button"
              >
                ×
              </button>

            </div>
          `).join("")}

          <button
            onclick="addOption(${i})"
            type="button"
            class="small-btn"
          >
            + Add option
          </button>

        </div>
      `;
    }

    return `
      <div class="question-card">

        <div class="question-header">

          <strong>
            Question ${i + 1}
          </strong>

          <button
            onclick="removeQuestion(${i})"
            class="delete-question"
          >
            🗑
          </button>

        </div>

        <input
          class="question-input"
          placeholder="Your question"
          value="${escapeHtml(q.question)}"
          oninput="updateQuestion(${i}, 'question', this.value)"
        >

        <div class="question-controls">

          <select
            onchange="changeType(${i}, this.value)"
          >

            <option
              value="text"
              ${q.type === "text" ? "selected" : ""}
            >
              Short answer
            </option>

            <option
              value="textarea"
              ${q.type === "textarea" ? "selected" : ""}
            >
              Paragraph
            </option>

            <option
              value="radio"
              ${q.type === "radio" ? "selected" : ""}
            >
              Multiple choice
            </option>

            <option
              value="checkbox"
              ${q.type === "checkbox" ? "selected" : ""}
            >
              Checkboxes
            </option>

            <option
              value="select"
              ${q.type === "select" ? "selected" : ""}
            >
              Dropdown
            </option>

            <option
              value="date"
              ${q.type === "date" ? "selected" : ""}
            >
              Date
            </option>

          </select>

          <label class="required">

            <input
              type="checkbox"
              ${q.required ? "checked" : ""}
              onchange="
                updateQuestion(
                  ${i},
                  'required',
                  this.checked
                )
              "
            >

            Required

          </label>

        </div>

        ${optionsHTML}

      </div>
    `;

  }).join("");
}

async function saveForm() {

  const title = document.getElementById("title").value.trim();
  const description =
    document.getElementById("description").value.trim();

  if (!title) {
    alert("Please enter a form title.");
    return;
  }

  if (questions.length === 0) {
    alert("Please add at least one question.");
    return;
  }

  for (const q of questions) {

    if (!q.question.trim()) {
      alert("Please enter all questions.");
      return;
    }

    if (
      ["radio", "checkbox", "select"].includes(q.type) &&
      q.options.length === 0
    ) {
      alert("Please add options.");
      return;
    }
  }

  const response = await fetch("/api/forms", {
    method: "POST",

    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify({
      title,
      description,
      questions
    })
  });

  const result = await response.json();

  if (result.success) {
    window.location.href =
      `form.html?id=${result.id}`;
  } else {
    alert(result.error || "Something went wrong");
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

addQuestion();

