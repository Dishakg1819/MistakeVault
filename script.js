const STORAGE_KEY = "mistakeVaultRecords";
const PROFILE_KEY = "mistakeVaultStudentName";

const $ = (selector) => document.querySelector(selector);

let mistakes = loadMistakes();
let currentTestId = null;
let answerIsVisible = false;

function loadMistakes() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (error) {
    console.error("Could not read saved mistakes:", error);
    return [];
  }
}

function saveMistakes() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mistakes));
  renderEverything();
}

function todayString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(dateString) {
  if (!dateString) return "No date selected";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  }[character]));
}

function isDue(record) {
  return record.status !== "Corrected" && record.revisionDate && record.revisionDate <= todayString();
}

function topicCounts() {
  const counts = {};
  mistakes.forEach((record) => {
    const key = record.topic.trim().toLowerCase();
    if (key) counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

function repeatedTopics() {
  const counts = topicCounts();
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1]);
}

function showPage(pageName) {
  document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
  const page = $(`#page-${pageName}`);
  if (page) page.classList.add("active");

  document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
    button.classList.toggle("active", button.dataset.page === pageName);
  });

  const titles = {
    dashboard: "Dashboard", add: "Add Mistake", mistakes: "My Mistakes",
    revision: "Revision Room", selftest: "Self-Test", analytics: "Analytics",
    profile: "Profile & Settings"
  };
  $("#pageTitle").textContent = titles[pageName] || "MistakeVault";

  if (pageName === "selftest" && !currentTestId && mistakes.length) startSelfTest();
  if (pageName === "profile") $("#studentName").value = localStorage.getItem(PROFILE_KEY) || "";
}

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

function deleteMistake(id) {
  const record = mistakes.find((item) => item.id === id);
  if (!record) return;
  if (!confirm(`Delete the mistake "${record.topic}"?`)) return;
  mistakes = mistakes.filter((item) => item.id !== id);
  if (currentTestId === id) currentTestId = null;
  saveMistakes();
}

function markCorrected(id) {
  const record = mistakes.find((item) => item.id === id);
  if (!record) return;
  record.status = "Corrected";
  record.lastReviewed = todayString();
  saveMistakes();
}

function mistakeCard(record) {
  const repeatCount = topicCounts()[record.topic.trim().toLowerCase()] || 1;
  const statusClass = record.status === "Corrected" ? "corrected" : "";
  return `
    <article class="mistake-card">
      <div class="card-top">
        <div>
          <h3>${escapeHTML(record.topic)}</h3>
          <div class="card-meta">
            <span class="category-tag">${escapeHTML(record.category)}</span>
            <span class="status-tag ${statusClass}">${record.status === "Corrected" ? "Corrected" : "Need practice"}</span>
          </div>
        </div>
        ${repeatCount > 1 ? `<span class="soft-tag">Repeated ×${repeatCount}</span>` : ""}
      </div>
      <p><strong>Question:</strong> ${escapeHTML(record.question)}</p>
      ${record.wrongAnswer ? `<p><strong>My answer:</strong> ${escapeHTML(record.wrongAnswer)}</p>` : ""}
      <p><strong>Why it happened:</strong> ${escapeHTML(record.reason)}</p>
      <p><strong>Correct understanding:</strong> ${escapeHTML(record.correctAnswer)}</p>
      <p><strong>Revise on:</strong> ${formatDate(record.revisionDate)}</p>
      <div class="card-actions">
        <button class="small-button" data-action="edit" data-id="${record.id}">Edit</button>
        <button class="small-button" data-action="test" data-id="${record.id}">Practise</button>
        ${record.status !== "Corrected" ? `<button class="small-button" data-action="correct" data-id="${record.id}">Mark corrected</button>` : ""}
        <button class="small-button danger" data-action="delete" data-id="${record.id}">Delete</button>
      </div>
    </article>`;
}

function renderDashboard() {
  const corrected = mistakes.filter((item) => item.status === "Corrected").length;
  const pending = mistakes.length - corrected;
  const due = mistakes.filter(isDue);
  $("#totalCount").textContent = mistakes.length;
  $("#correctedCount").textContent = corrected;
  $("#pendingCount").textContent = pending;
  $("#dueCount").textContent = due.length;

  const recent = [...mistakes].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  $("#recentMistakes").innerHTML = recent.length ? recent.map((item) => `
    <div class="compact-item"><div><strong>${escapeHTML(item.topic)}</strong><small>${escapeHTML(item.category)} · ${formatDate(item.createdDate)}</small></div>
    <span class="status-tag ${item.status === "Corrected" ? "corrected" : ""}">${item.status === "Corrected" ? "Corrected" : "Pending"}</span></div>
  `).join("") : `<div class="empty-state">No mistakes saved yet.<br>Use “Record a mistake” to add your first one.</div>`;

  $("#dashboardDue").innerHTML = due.length ? due.slice(0, 4).map((item) => `
    <div class="compact-item"><div><strong>${escapeHTML(item.topic)}</strong><small>Due ${formatDate(item.revisionDate)}</small></div>
    <button class="small-button" data-action="edit" data-id="${item.id}">Review</button></div>
  `).join("") : `<div class="empty-state">Nothing is due right now.<br>Add a revision date when recording a mistake.</div>`;

  const repeats = repeatedTopics();
  $("#dashboardRepeats").innerHTML = repeats.length ? repeats.map(([topic, count]) =>
    `<span class="repeat-chip">${escapeHTML(topic)} · ${count} mistakes</span>`
  ).join("") : `<div class="empty-state">No repeated topics detected yet. Keep recording mistakes to discover patterns.</div>`;
}

function renderMistakes() {
  const search = $("#searchInput").value.trim().toLowerCase();
  const category = $("#categoryFilter").value;
  const status = $("#statusFilter").value;

  const filtered = mistakes.filter((record) => {
    const matchesSearch = `${record.topic} ${record.question} ${record.reason}`.toLowerCase().includes(search);
    const matchesCategory = category === "All" || record.category === category;
    const matchesStatus = status === "All" ||
      (status === "Corrected" && record.status === "Corrected") ||
      (status === "Pending" && record.status !== "Corrected");
    return matchesSearch && matchesCategory && matchesStatus;
  });

  $("#mistakeList").innerHTML = filtered.length
    ? filtered.map(mistakeCard).join("")
    : `<div class="panel empty-state">No matching mistakes found.<br>Try changing your search or filters.</div>`;
}

function renderRevision() {
  const due = mistakes.filter(isDue).sort((a, b) => a.revisionDate.localeCompare(b.revisionDate));
  $("#revisionList").innerHTML = due.length
    ? due.map(mistakeCard).join("")
    : `<div class="panel empty-state">Your revision room is clear!<br>When a pending mistake reaches its revision date, it will appear here.</div>`;
}

function renderAnalytics() {
  const corrected = mistakes.filter((item) => item.status === "Corrected").length;
  const repeats = repeatedTopics();
  $("#analyticsTotal").textContent = mistakes.length;
  $("#analyticsCorrected").textContent = corrected;
  $("#analyticsRepeated").textContent = repeats.length;

  const categories = {};
  mistakes.forEach((item) => categories[item.category] = (categories[item.category] || 0) + 1);
  const maxCount = Math.max(1, ...Object.values(categories));
  $("#categoryChart").innerHTML = Object.keys(categories).length
    ? Object.entries(categories).map(([name, count]) => `
      <div class="bar-row"><span>${escapeHTML(name)}</span><div class="bar-track"><div class="bar-fill" style="width:${(count / maxCount) * 100}%"></div></div><strong>${count}</strong></div>
    `).join("")
    : `<div class="empty-state">Your category chart will appear after you save mistakes.</div>`;

  $("#analyticsRepeats").innerHTML = repeats.length
    ? repeats.map(([topic, count]) => `<div class="compact-item"><strong>${escapeHTML(topic)}</strong><span class="soft-tag">${count} records</span></div>`).join("")
    : `<div class="empty-state">No repeated topics yet.</div>`;
}

function renderSelfTest() {
  const area = $("#selfTestArea");
  const record = mistakes.find((item) => item.id === currentTestId);
  if (!record) {
    area.innerHTML = `<div class="empty-state">You haven't saved any mistakes yet.<br>Add a mistake first, then return here to practise it.</div>
      <button class="button button-primary" data-go="add">Add your first mistake</button>`;
    return;
  }

  area.innerHTML = `
    <div class="card-meta"><span class="category-tag">${escapeHTML(record.category)}</span><span class="soft-tag">${escapeHTML(record.topic)}</span></div>
    <p class="eyebrow" style="margin-top:20px">TRY TO ANSWER BEFORE REVEALING</p>
    <div class="test-question">${escapeHTML(record.question)}</div>
    ${record.wrongAnswer ? `<p><strong>Your earlier answer:</strong> ${escapeHTML(record.wrongAnswer)}</p>` : ""}
    ${answerIsVisible ? `
      <div class="answer-box"><strong>Why the earlier answer was wrong</strong><p>${escapeHTML(record.reason)}</p>
      <strong>Correct understanding</strong><p>${escapeHTML(record.correctAnswer)}</p></div>
      <p class="muted">Did you understand it this time?</p>
      <div class="test-actions">
        <button class="button button-primary" data-action="test-correct" data-id="${record.id}">I got it right</button>
        <button class="button button-ghost" data-action="test-again" data-id="${record.id}">I need more practice</button>
        <button class="button button-ghost" data-action="next-test">Next question</button>
      </div>
    ` : `
      <div class="test-actions">
        <button class="button button-primary" data-action="reveal-answer">Reveal correct explanation</button>
        <button class="button button-ghost" data-action="next-test">Choose another question</button>
      </div>
    `}
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

function renderEverything() {
  renderDashboard();
  renderMistakes();
  renderRevision();
  renderAnalytics();
  renderSelfTest();
}

document.querySelectorAll(".nav-link[data-page]").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

document.addEventListener("click", (event) => {
  const goButton = event.target.closest("[data-go]");
  if (goButton) showPage(goButton.dataset.go);

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const { action, id } = actionButton.dataset;
  if (action === "edit") editMistake(id);
  if (action === "delete") deleteMistake(id);
  if (action === "correct") markCorrected(id);
  if (action === "test") {
    startSelfTest(id);
    showPage("selftest");
  }
  if (action === "reveal-answer") {
    answerIsVisible = true;
    renderSelfTest();
  }
  if (action === "next-test") startSelfTest();
  if (action === "test-correct" || action === "test-again") {
    const record = mistakes.find((item) => item.id === id);
    if (record) {
      record.attempts = (record.attempts || 0) + 1;
      record.lastReviewed = todayString();
      record.status = action === "test-correct" ? "Corrected" : "Pending";
      saveMistakes();
      startSelfTest();
    }
  }
});

$("#mistakeForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const id = $("#mistakeId").value;
  const oldRecord = mistakes.find((item) => item.id === id);
  const record = {
    id: id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    topic: $("#topic").value.trim(),
    category: $("#category").value,
    question: $("#question").value.trim(),
    wrongAnswer: $("#wrongAnswer").value.trim(),
    reason: $("#reason").value.trim(),
    correctAnswer: $("#correctAnswer").value.trim(),
    revisionDate: $("#revisionDate").value,
    status: oldRecord ? oldRecord.status : "Pending",
    attempts: oldRecord ? (oldRecord.attempts || 0) : 0,
    lastReviewed: oldRecord ? oldRecord.lastReviewed : "",
    createdDate: oldRecord ? oldRecord.createdDate : todayString(),
    createdAt: oldRecord ? oldRecord.createdAt : Date.now()
  };

  if (!record.topic || !record.question || !record.reason || !record.correctAnswer) {
    $("#formMessage").textContent = "Please fill in all required fields.";
    return;
  }

  if (oldRecord) {
    mistakes = mistakes.map((item) => item.id === id ? record : item);
    $("#formMessage").textContent = "Your mistake has been updated.";
  } else {
    mistakes.unshift(record);
    $("#formMessage").textContent = "Your mistake has been saved.";
  }

  saveMistakes();
  resetMistakeForm();
  showPage("mistakes");
});

$("#cancelEdit").addEventListener("click", resetMistakeForm);
$("#searchInput").addEventListener("input", renderMistakes);
$("#categoryFilter").addEventListener("change", renderMistakes);
$("#statusFilter").addEventListener("change", renderMistakes);

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#studentName").value.trim() || "Student";
  localStorage.setItem(PROFILE_KEY, name);
  updateProfileDisplay();
  $("#profileMessage").textContent = "Profile name saved in this browser.";
});

function updateProfileDisplay() {
  const name = localStorage.getItem(PROFILE_KEY) || "Student";
  $("#profileDisplayName").textContent = name;
  $("#profileInitial").textContent = name.charAt(0).toUpperCase();
}

updateProfileDisplay();
renderEverything();
