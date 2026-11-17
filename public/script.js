
// ==========================================
// MISTAKEVAULT - FRONTEND + MONGODB API
// ==========================================

const PROFILE_KEY = "mistakeVaultStudentName";

const $ = (selector) => document.querySelector(selector);

let mistakes = [];
let currentTestId = null;
let answerIsVisible = false;


// ==========================================
// 1. COMMUNICATE WITH THE BACKEND
// ==========================================

async function apiRequest(url, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed: ${response.status}`);
  }

  return result;
}


// Convert MongoDB records into the format used by our frontend
function normalizeMistake(record) {
  return {
    ...record,
    id: record._id || record.id
  };
}


// Get all mistakes from MongoDB
async function refreshMistakes() {
  const result = await apiRequest("/api/mistakes");

  mistakes = result.data.map(normalizeMistake);

  // Keep the current Self-Test question if it still exists
  if (currentTestId && !mistakes.some((item) => item.id === currentTestId)) {
    currentTestId = null;
  }

  renderEverything();
}


// Load mistakes when the website opens
async function loadMistakes() {
  try {
    const mistakeList = $("#mistakeList");

    if (mistakeList) {
      mistakeList.innerHTML = `<div class="panel empty-state">Loading your mistakes...</div>`;
    }

    await refreshMistakes();

  } catch (error) {
    console.error("Could not load mistakes:", error);

    $("#mistakeList").innerHTML = `
      <div class="panel empty-state">
        Could not load your mistakes.<br>
        Please check whether the backend server is running.
        <br><br>
        Error: ${escapeHTML(error.message)}
      </div>
    `;
  }
}


// ==========================================
// 2. GENERAL HELPER FUNCTIONS
// ==========================================

function todayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function formatDate(dateString) {
  if (!dateString) return "No date selected";

  // Handle both date-only values and full ISO timestamps
  const datePart = String(dateString).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "No date selected";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}


function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}


function isDue(record) {
  return (
    record.status !== "Corrected" &&
    record.revisionDate &&
    record.revisionDate <= todayString()
  );
}


function topicCounts() {
  const counts = {};

  mistakes.forEach((record) => {
    const key = record.topic.trim().toLowerCase();

    if (key) {
      counts[key] = (counts[key] || 0) + 1;
    }
  });

  return counts;
}


function repeatedTopics() {
  const counts = topicCounts();

  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
}


// ==========================================
// 3. PAGE NAVIGATION
// ==========================================

function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => {
    page.classList.remove("active");
  });

  const page = $(`#page-${pageName}`);

  if (page) {
    page.classList.add("active");
  }

  document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  const titles = {
    dashboard: "Dashboard",
    add: "Add Mistake",
    mistakes: "My Mistakes",
    revision: "Revision Room",
    selftest: "Self-Test",
    analytics: "Analytics",
    profile: "Profile & Settings"
  };

  $("#pageTitle").textContent = titles[pageName] || "MistakeVault";

  if (pageName === "selftest" && !currentTestId && mistakes.length) {
    startSelfTest();
  }

  if (pageName === "profile") {
    $("#studentName").value = localStorage.getItem(PROFILE_KEY) || "";
  }
}


// ==========================================
// 4. ADD AND EDIT MISTAKES
// ==========================================

function resetMistakeForm() {
  $("#mistakeForm").reset();

  $("#mistakeId").value = "";
  $("#formHeading").textContent = "Record a new mistake";
  $("#saveMistakeButton").textContent = "Save mistake";
  $("#cancelEdit").hidden = true;
  $("#formMessage").textContent = "";
}


function editMistake(id) {
  const record = mistakes.find((item) => item.id === id);

  if (!record) return;

  $("#mistakeId").value = record.id;
  $("#topic").value = record.topic;
  $("#category").value = record.category;
  $("#question").value = record.question;
  $("#wrongAnswer").value = record.wrongAnswer || "";
  $("#reason").value = record.reason;
  $("#correctAnswer").value = record.correctAnswer;
  $("#revisionDate").value = record.revisionDate || "";

  $("#formHeading").textContent = "Edit your mistake";
  $("#saveMistakeButton").textContent = "Update mistake";
  $("#cancelEdit").hidden = false;
  $("#formMessage").textContent = "";

  showPage("add");
}


// ==========================================
// 5. DELETE MISTAKE FROM MONGODB
// ==========================================

async function deleteMistake(id) {
  const record = mistakes.find((item) => item.id === id);

  if (!record) return;

  if (!confirm(`Delete the mistake "${record.topic}"?`)) {
    return;
  }

  try {
    await apiRequest(`/api/mistakes/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });

    if (currentTestId === id) {
      currentTestId = null;
    }

    await refreshMistakes();

  } catch (error) {
    alert("Could not delete the mistake: " + error.message);
  }
}


// ==========================================
// 6. MARK MISTAKE AS CORRECTED
// ==========================================

async function markCorrected(id) {
  try {
    await apiRequest(`/api/mistakes/${encodeURIComponent(id)}/correct`, {
      method: "PATCH"
    });

    await refreshMistakes();

  } catch (error) {
    alert("Could not update the mistake: " + error.message);
  }
}


// ==========================================
// 7. MISTAKE CARD DESIGN
// ==========================================

function mistakeCard(record) {
  const repeatCount =
    topicCounts()[record.topic.trim().toLowerCase()] || 1;

  const statusClass =
    record.status === "Corrected" ? "corrected" : "";

  return `
    <article class="mistake-card">

      <div class="card-top">
        <div>
          <h3>${escapeHTML(record.topic)}</h3>

          <div class="card-meta">
            <span class="category-tag">
              ${escapeHTML(record.category)}
            </span>

            <span class="status-tag ${statusClass}">
              ${record.status === "Corrected" ? "Corrected" : "Need practice"}
            </span>
          </div>
        </div>

        ${
          repeatCount > 1
            ? `<span class="soft-tag">Repeated ×${repeatCount}</span>`
            : ""
        }
      </div>

      <p>
        <strong>Question:</strong>
        ${escapeHTML(record.question)}
      </p>

      ${
        record.wrongAnswer
          ? `<p><strong>My answer:</strong> ${escapeHTML(record.wrongAnswer)}</p>`
          : ""
      }

      <p>
        <strong>Why it happened:</strong>
        ${escapeHTML(record.reason)}
      </p>

      <p>
        <strong>Correct understanding:</strong>
        ${escapeHTML(record.correctAnswer)}
      </p>

      <p>
        <strong>Revise on:</strong>
        ${formatDate(record.revisionDate)}
      </p>

      <div class="card-actions">

        <button class="small-button"
          data-action="edit"
          data-id="${record.id}">
          Edit
        </button>

        <button class="small-button"
          data-action="test"
          data-id="${record.id}">
          Practise
        </button>

        ${
          record.status !== "Corrected"
            ? `<button class="small-button"
                data-action="correct"
                data-id="${record.id}">
                Mark corrected
              </button>`
            : ""
        }

        <button class="small-button danger"
          data-action="delete"
          data-id="${record.id}">
          Delete
        </button>

      </div>
    </article>
  `;
}


// ==========================================
// 8. DASHBOARD
// ==========================================

function renderDashboard() {
  const corrected = mistakes.filter(
    (item) => item.status === "Corrected"
  ).length;

  const pending = mistakes.length - corrected;
  const due = mistakes.filter(isDue);

  $("#totalCount").textContent = mistakes.length;
  $("#correctedCount").textContent = corrected;
  $("#pendingCount").textContent = pending;
  $("#dueCount").textContent = due.length;


  // Recent mistakes
  const recent = [...mistakes]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
    .slice(0, 4);

  $("#recentMistakes").innerHTML = recent.length
    ? recent.map((item) => `
        <div class="compact-item">

          <div>
            <strong>${escapeHTML(item.topic)}</strong>
            <small>
              ${escapeHTML(item.category)} · ${formatDate(item.createdDate)}
            </small>
          </div>

          <span class="status-tag ${
            item.status === "Corrected" ? "corrected" : ""
          }">
            ${item.status === "Corrected" ? "Corrected" : "Pending"}
          </span>

        </div>
      `).join("")
    : `
        <div class="empty-state">
          No mistakes saved yet.<br>
          Use “Record a mistake” to add your first one.
        </div>
      `;


  // Due mistakes
  $("#dashboardDue").innerHTML = due.length
    ? due.slice(0, 4).map((item) => `
        <div class="compact-item">

          <div>
            <strong>${escapeHTML(item.topic)}</strong>
            <small>Due ${formatDate(item.revisionDate)}</small>
          </div>

          <button class="small-button"
            data-action="edit"
            data-id="${item.id}">
            Review
          </button>

        </div>
      `).join("")
    : `
        <div class="empty-state">
          Nothing is due right now.<br>
          Add a revision date when recording a mistake.
        </div>
      `;


  // Repeated topics
  const repeats = repeatedTopics();

  $("#dashboardRepeats").innerHTML = repeats.length
    ? repeats.map(([topic, count]) =>
        `<span class="repeat-chip">
          ${escapeHTML(topic)} · ${count} mistakes
        </span>`
      ).join("")
    : `
        <div class="empty-state">
          No repeated topics detected yet.
          Keep recording mistakes to discover patterns.
        </div>
      `;
}


// ==========================================
// 9. MY MISTAKES PAGE
// ==========================================

function renderMistakes() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const status = $("#statusFilter").value;

  const filtered = mistakes.filter((record) => {
    const matchesSearch =
      `${record.topic} ${record.question} ${record.reason}`
        .toLowerCase()
        .includes(search);

    const matchesCategory =
      category === "All" || record.category === category;

    const matchesStatus =
      status === "All" ||
      (status === "Corrected" && record.status === "Corrected") ||
      (status === "Pending" && record.status !== "Corrected");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  $("#mistakeList").innerHTML = filtered.length
    ? filtered.map(mistakeCard).join("")
    : `
        <div class="panel empty-state">
          No matching mistakes found.<br>
          Try changing your search or filters.
        </div>
      `;
}


// ==========================================
// 10. REVISION ROOM
// ==========================================

function renderRevision() {
  const due = mistakes
    .filter(isDue)
    .sort((a, b) =>
      String(a.revisionDate).localeCompare(String(b.revisionDate))
    );

  $("#revisionList").innerHTML = due.length
    ? due.map(mistakeCard).join("")
    : `
        <div class="panel empty-state">
          Your revision room is clear!<br>
          When a pending mistake reaches its revision date,
          it will appear here.
        </div>
      `;
}


// ==========================================
// 11. ANALYTICS
// ==========================================

function renderAnalytics() {
  const corrected = mistakes.filter(
    (item) => item.status === "Corrected"
  ).length;

  const repeats = repeatedTopics();

  $("#analyticsTotal").textContent = mistakes.length;
  $("#analyticsCorrected").textContent = corrected;
  $("#analyticsRepeated").textContent = repeats.length;


  // Mistakes by category
  const categories = {};

  mistakes.forEach((item) => {
    categories[item.category] =
      (categories[item.category] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(categories));

  $("#categoryChart").innerHTML = Object.keys(categories).length
    ? Object.entries(categories).map(([name, count]) => `
        <div class="bar-row">

          <span>${escapeHTML(name)}</span>

          <div class="bar-track">
            <div class="bar-fill"
              style="width:${(count / maxCount) * 100}%">
            </div>
          </div>

          <strong>${count}</strong>

        </div>
      `).join("")
    : `
        <div class="empty-state">
          Your category chart will appear after you save mistakes.
        </div>
      `;


  // Repeated topics
  $("#analyticsRepeats").innerHTML = repeats.length
    ? repeats.map(([topic, count]) => `
        <div class="compact-item">
          <strong>${escapeHTML(topic)}</strong>
          <span class="soft-tag">${count} records</span>
        </div>
      `).join("")
    : `
        <div class="empty-state">
          No repeated topics yet.
        </div>
      `;
}


// ==========================================
// 12. SELF-TEST
// ==========================================

function renderSelfTest() {
  const area = $("#selfTestArea");

  const record = mistakes.find(
    (item) => item.id === currentTestId
  );

  if (!record) {
    area.innerHTML = `
      <div class="empty-state">
        You haven't saved any mistakes yet.<br>
        Add a mistake first, then return here to practise it.
      </div>

      <button class="button button-primary" data-go="add">
        Add your first mistake
      </button>
    `;

    return;
  }

  area.innerHTML = `
    <div class="card-meta">

      <span class="category-tag">
        ${escapeHTML(record.category)}
      </span>

      <span class="soft-tag">
        ${escapeHTML(record.topic)}
      </span>

    </div>

    <p class="eyebrow" style="margin-top:20px">
      TRY TO ANSWER BEFORE REVEALING
    </p>

    <div class="test-question">
      ${escapeHTML(record.question)}
    </div>

    ${
      record.wrongAnswer
        ? `<p><strong>Your earlier answer:</strong>
            ${escapeHTML(record.wrongAnswer)}</p>`
        : ""
    }

    ${
      answerIsVisible
        ? `
          <div class="answer-box">

            <strong>Why the earlier answer was wrong</strong>
            <p>${escapeHTML(record.reason)}</p>

            <strong>Correct understanding</strong>
            <p>${escapeHTML(record.correctAnswer)}</p>

          </div>

          <p class="muted">Did you understand it this time?</p>

          <div class="test-actions">

            <button class="button button-primary"
              data-action="test-correct"
              data-id="${record.id}">
              I got it right
            </button>

            <button class="button button-ghost"
              data-action="test-again"
              data-id="${record.id}">
              I need more practice
            </button>

            <button class="button button-ghost"
              data-action="next-test">
              Next question
            </button>

          </div>
        `
        : `
          <div class="test-actions">

            <button class="button button-primary"
              data-action="reveal-answer">
              Reveal correct explanation
            </button>

            <button class="button button-ghost"
              data-action="next-test">
              Choose another question
            </button>

          </div>
        `
    }
  `;
}


function startSelfTest(preferredId = null) {
  if (!mistakes.length) {
    currentTestId = null;
  } else if (preferredId) {
    currentTestId = preferredId;
  } else {
    const randomIndex = Math.floor(Math.random() * mistakes.length);
    currentTestId = mistakes[randomIndex].id;
  }

  answerIsVisible = false;

  renderSelfTest();
}


// Save the Self-Test result to MongoDB
async function saveTestResult(id, action) {
  const record = mistakes.find((item) => item.id === id);

  if (!record) return;

  const updatedRecord = {
    topic: record.topic,
    category: record.category,
    question: record.question,
    wrongAnswer: record.wrongAnswer || "",
    reason: record.reason,
    correctAnswer: record.correctAnswer,
    revisionDate: record.revisionDate || "",
    status: action === "test-correct" ? "Corrected" : "Pending",
    attempts: (record.attempts || 0) + 1,
    lastReviewed: todayString()
  };

  try {
    await apiRequest(`/api/mistakes/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(updatedRecord)
    });

    await refreshMistakes();

    startSelfTest();

  } catch (error) {
    alert("Could not save your Self-Test result: " + error.message);
  }
}


// ==========================================
// 13. REFRESH ALL WEBSITE SECTIONS
// ==========================================

function renderEverything() {
  renderDashboard();
  renderMistakes();
  renderRevision();
  renderAnalytics();
  renderSelfTest();
}


// ==========================================
// 14. NAVIGATION BUTTON EVENTS
// ==========================================

document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});


// ==========================================
// 15. BUTTON ACTIONS
// ==========================================

document.addEventListener("click", async (event) => {

  const goButton = event.target.closest("[data-go]");

  if (goButton) {
    showPage(goButton.dataset.go);
  }

  const actionButton = event.target.closest("[data-action]");

  if (!actionButton) return;

  const { action, id } = actionButton.dataset;


  if (action === "edit") {
    editMistake(id);
  }


  if (action === "delete") {
    await deleteMistake(id);
  }


  if (action === "correct") {
    await markCorrected(id);
  }


  if (action === "test") {
    startSelfTest(id);
    showPage("selftest");
  }


  if (action === "reveal-answer") {
    answerIsVisible = true;
    renderSelfTest();
  }


  if (action === "next-test") {
    startSelfTest();
  }


  if (action === "test-correct" || action === "test-again") {
    await saveTestResult(id, action);
  }

});


// ==========================================
// 16. ADD OR UPDATE MISTAKE FORM
// ==========================================

$("#mistakeForm").addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = $("#mistakeId").value;

  const oldRecord = mistakes.find(
    (item) => item.id === id
  );

  const record = {
    topic: $("#topic").value.trim(),
    category: $("#category").value,
    question: $("#question").value.trim(),
    wrongAnswer: $("#wrongAnswer").value.trim(),
    reason: $("#reason").value.trim(),
    correctAnswer: $("#correctAnswer").value.trim(),
    revisionDate: $("#revisionDate").value,

    status: oldRecord ? oldRecord.status : "Pending",

    attempts: oldRecord ? (oldRecord.attempts || 0) : 0,

    lastReviewed: oldRecord ? oldRecord.lastReviewed : ""
  };


  // Validate required fields
  if (
    !record.topic ||
    !record.category ||
    !record.question ||
    !record.reason ||
    !record.correctAnswer
  ) {
    $("#formMessage").textContent =
      "Please fill in all required fields.";

    return;
  }


  // Prevent multiple clicks while saving
  const saveButton = $("#saveMistakeButton");

  saveButton.disabled = true;
  saveButton.textContent = oldRecord ? "Updating..." : "Saving...";


  try {

    if (oldRecord) {

      // Update existing mistake in MongoDB
      await apiRequest(`/api/mistakes/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(record)
      });

    } else {

      // Add new mistake to MongoDB
      await apiRequest("/api/mistakes", {
        method: "POST",
        body: JSON.stringify(record)
      });

    }


    // Get the latest records from MongoDB
    await refreshMistakes();

    resetMistakeForm();

    showPage("mistakes");


  } catch (error) {

    console.error("Could not save mistake:", error);

    $("#formMessage").textContent =
      "Could not save your mistake: " + error.message;

  } finally {

    saveButton.disabled = false;

    if ($("#mistakeId").value) {
      saveButton.textContent = "Update mistake";
    } else {
      saveButton.textContent = "Save mistake";
    }

  }

});


// ==========================================
// 17. CANCEL EDITING
// ==========================================

$("#cancelEdit").addEventListener("click", resetMistakeForm);


// ==========================================
// 18. SEARCH AND FILTERS
// ==========================================

$("#searchInput").addEventListener("input", renderMistakes);

$("#categoryFilter").addEventListener("change", renderMistakes);

$("#statusFilter").addEventListener("change", renderMistakes);


// ==========================================
// 19. STUDENT PROFILE
// Profile name remains in localStorage
// ==========================================

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("#studentName").value.trim() || "Student";

  localStorage.setItem(PROFILE_KEY, name);

  updateProfileDisplay();

  $("#profileMessage").textContent =
    "Profile name saved in this browser.";
});


function updateProfileDisplay() {
  const name = localStorage.getItem(PROFILE_KEY) || "Student";

  $("#profileDisplayName").textContent = name;

  $("#profileInitial").textContent =
    name.charAt(0).toUpperCase();
}


// ==========================================
// 20. START MISTAKEVAULT
// ==========================================

updateProfileDisplay();

// Fetch all mistake records from MongoDB
loadMistakes();
