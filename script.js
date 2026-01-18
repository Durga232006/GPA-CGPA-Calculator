/* ================= REDIRECT BUTTONS ================= */
const gpaBtn = document.getElementById("gpaBtn");
const cgpaBtn = document.getElementById("cgpaBtn");

gpaBtn?.addEventListener("click", () => (window.location.href = "gpa.html"));
cgpaBtn?.addEventListener("click", () => (window.location.href = "cgpa.html"));

/* ================= THEME TOGGLE ================= */
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    document.body.classList.remove("light-mode");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    if (document.body.classList.contains("light-mode")) {
      document.body.classList.replace("light-mode", "dark-mode");
      themeToggle.textContent = "☀️";
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.replace("dark-mode", "light-mode");
      themeToggle.textContent = "🌙";
      localStorage.setItem("theme", "light");
    }
  });
}
/* ================= JSON DATA LOADING ================= */
let subjectsData = {};

const regulationSelect = document.getElementById("regulation");
const departmentSelect = document.getElementById("department");
const semesterSelect = document.getElementById("semester");

// Load JSON based on selected regulation
async function loadSubjects() {
  if (!regulationSelect?.value) return;

  const path = `data/${regulationSelect.value}.json`;
  console.log("Fetching JSON:", path);

  try {
    const res = await fetch(path);

    if (!res.ok) {
      throw new Error(`JSON file not found: ${path}`);
    }

    subjectsData = await res.json();
    console.log("Loaded subjectsData:", subjectsData);

    // Populate department dropdown dynamically if needed
    if (departmentSelect) {
      departmentSelect.innerHTML = `<option value="">Select Department</option>`;
      Object.keys(subjectsData).forEach((dept) => {
        departmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
      });
    }

    // If department already selected, populate semesters
    if (departmentSelect?.value) populateSemesters();
  } catch (e) {
    console.error(e);
    alert("Syllabus JSON not found for this regulation");
    subjectsData = {};
    semesterSelect.innerHTML = `<option value="">No data available</option>`;
  }
}

// Populate semesters based on selected department
function populateSemesters() {
  if (!semesterSelect || !departmentSelect?.value) return;

  const dept = departmentSelect.value;
  const sems = subjectsData?.[dept];

  if (!sems) {
    semesterSelect.innerHTML = `<option value="">No semesters found for ${dept}</option>`;
    return;
  }

  semesterSelect.innerHTML = `<option value="">Select Semester</option>`;
  Object.keys(sems).forEach((sem) => {
    semesterSelect.innerHTML += `<option value="${sem}">Semester ${sem}</option>`;
  });
}

// Get subject details for GPA calculation
function getSubjectDetails(code) {
  const dept = departmentSelect?.value;
  if (!dept || !code) return null;

  const subjectCode = code.trim().toUpperCase();
  const deptData = subjectsData[dept];

  if (!deptData) return null;

  // 🔍 SEARCH IN ALL SEMESTERS
  for (const sem in deptData) {
    if (deptData[sem][subjectCode]) {
      return deptData[sem][subjectCode];
    }
  }

  return null;
}

// Event listeners
regulationSelect?.addEventListener("change", loadSubjects);
departmentSelect?.addEventListener("change", populateSemesters);

/* ================= GPA PAGE (with Number of Subjects) ================= */
const subjectsContainer = document.getElementById("subjects-container");
const numSubjectsInput = document.getElementById("numSubjects"); // new input
const calculateGpaBtn = document.getElementById("calculateGPA");
const downloadGpaBtn = document.getElementById("downloadGPA");

if (subjectsContainer) {
  // Create a subject card
  function createSubjectCard() {
    const div = document.createElement("div");
    div.className = "subject-card";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "10px";
    div.style.marginBottom = "10px";

    div.innerHTML = `
  <input type="text" class="subject-code" placeholder="Subject Code" style="width=20px;">
  <select style="width=10px;">
    <option value="10">O</option>
    <option value="9">A+</option>
    <option value="8">A</option>
    <option value="7">B+</option>
    <option value="6">B</option>
    <option value="5">C</option>
    <option value="0">U/UA/RA-FAIL</option>
    <option value="0">W</option>
  </select>
  <span class="credit-display" style="flex:0 0 120px;"></span>
  <button class="remove-subject">X</button>
`;

    const removeBtn = div.querySelector(".remove-subject");
    removeBtn.style.background = "#f44336";
    removeBtn.style.color = "white";
    removeBtn.style.border = "none";
    removeBtn.style.borderRadius = "5px";
    removeBtn.style.cursor = "pointer";
    removeBtn.style.padding = "5px 10px";
    removeBtn.style.fontWeight = "bold";
    removeBtn.onclick = () => div.remove();

    const input = div.querySelector("input");
    const display = div.querySelector(".credit-display");

    // Show credit from JSON if available
    input.addEventListener("input", (e) => {
      const code = e.target.value.trim().toUpperCase();
      const subject = getSubjectDetails(code);
    });

    return div;
  }

  // Event: enter number of subjects
  numSubjectsInput?.addEventListener("input", () => {
    const count = parseInt(numSubjectsInput.value);
    if (isNaN(count) || count <= 0) return;

    subjectsContainer.innerHTML = ""; // clear existing
    for (let i = 0; i < count; i++) {
      subjectsContainer.appendChild(createSubjectCard());
    }
  });

  // Calculate GPA
  calculateGpaBtn?.addEventListener("click", () => {
    let total = 0,
      totalCredits = 0;

    const cards = subjectsContainer.querySelectorAll(".subject-card");
    for (let card of cards) {
      const code = card.querySelector("input").value.trim().toUpperCase();
      const grade = parseFloat(card.querySelector("select").value);

      const subject = getSubjectDetails(code);
      if (!subject) {
        alert(`Subject not found: ${code}`);
        return;
      }

      totalCredits += subject.credit;
      total += grade * subject.credit;
    }

    const gpa = totalCredits ? (total / totalCredits).toFixed(2) : 0;
    document.getElementById("resultGPA").innerText = `Your GPA is: ${gpa}`;
  });

  // Download GPA PDF
  downloadGpaBtn?.addEventListener("click", async () => {
    const resultDiv = document.getElementById("resultGPA");

    if (!resultDiv || !resultDiv.innerText.trim()) {
      alert("Calculate GPA first!");
      return;
    }

    if (!window.html2canvas || !window.jspdf) {
      alert("PDF libraries not loaded");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");

    // Use pdf-area if exists, else container
    const content =
      document.querySelector(".pdf-area") ||
      document.querySelector(".container");

    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);

    // GPA text (inside page safely)
    pdf.setFontSize(14);
    pdf.setTextColor(30, 144, 255);
    pdf.text(resultDiv.innerText, 20, pageHeight - 30);

    pdf.save("GPA_Result.pdf");
  });
}

/* ================= CGPA PAGE ================= */
const numSemSelect = document.getElementById("numSemesters");
const gpaInputsContainer = document.getElementById("gpa-inputs-container");
const calculateCgpaBtn = document.getElementById("calculateCGPA");
const downloadCgpaBtn = document.getElementById("downloadCGPA");

if (numSemSelect) {
  function createSemInput(num) {
    const div = document.createElement("div");
    div.className = "form-grid sem-row";
    div.style.alignItems = "center";
    div.style.marginBottom = "10px";
    div.style.display = "flex";
    div.style.gap = "10px";

    div.innerHTML = `
      <label>Semester ${num} GPA:</label>
      <input type="number" min="0" max="10" step="0.01" placeholder="Enter GPA" style="flex:2;">
      <button class="delete-sem">X</button>
    `;

    const btn = div.querySelector(".delete-sem");
    btn.style.background = "#ffffff";
    btn.style.color = "#d70000";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.style.padding = "5px 10px";
    btn.style.fontWeight = "bold";
    btn.onclick = () => div.remove();

    return div;
  }

  numSemSelect.addEventListener("change", () => {
    gpaInputsContainer.innerHTML = "";
    const num = parseInt(numSemSelect.value);
    for (let i = 1; i <= num; i++)
      gpaInputsContainer.appendChild(createSemInput(i));
  });

  calculateCgpaBtn?.addEventListener("click", () => {
    const inputs = gpaInputsContainer.querySelectorAll("input");
    let total = 0,
      count = 0;
    for (let input of inputs) {
      const val = parseFloat(input.value);
      if (isNaN(val) || val < 0 || val > 10) {
        alert("Invalid GPA detected");
        return;
      }
      total += val;
      count++;
    }
    const cgpa = count > 0 ? (total / count).toFixed(2) : 0;
    document.getElementById("resultCGPA").innerText = `Your CGPA is: ${cgpa}`;
  });
  //download pdf
  downloadCgpaBtn?.addEventListener("click", async () => {
    const resultDiv = document.getElementById("resultCGPA");
    if (!resultDiv || !resultDiv.innerText.trim()) {
      alert("Calculate CGPA first!");
      return;
    }

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "pt", "a4");

    // IMPORTANT: correct container
    const element =
      document.querySelector(".pdf-area") ||
      document.querySelector(".container");

    if (!element) {
      alert("PDF area not found!");
      return;
    }

    const canvas = await html2canvas(element, {
      scale: 1.5,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("CGPA_Result.pdf");
  });
}
