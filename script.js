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
const semesterSelect = document.getElementById("numSemesters");

// Load JSON
async function loadSubjects() {
  if (!regulationSelect.value) return;

  try {
    const res = await fetch(`data/${regulationSelect.value}.json`);
    if (!res.ok) throw new Error("JSON missing");
    subjectsData = await res.json();
    populateDepartments();
  } catch {
    alert("Syllabus JSON not found!");
    subjectsData = {};
  }
}

function populateDepartments() {
  departmentSelect.innerHTML = `<option value="">Select Department</option>`;
  Object.keys(subjectsData).forEach((dept) => {
    departmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
  });
}

function getSubjectDetails(code) {
  const dept = departmentSelect.value;
  const sem = semesterSelect.value;
  if (!dept || !sem || !code) return null;
  return subjectsData?.[dept]?.[sem]?.[code] || null;
}

regulationSelect?.addEventListener("change", loadSubjects);

/* ================= GPA CALCULATION ================= */
const subjectsContainer = document.getElementById("subjects-container");
const numSubjectsInput = document.getElementById("numSubjects");
const calculateGpaBtn = document.getElementById("calculateGPA");
const downloadGpaBtn = document.getElementById("downloadGPA");

function createSubjectCard() {
  const div = document.createElement("div");
  div.className = "subject-card";

  div.innerHTML = `
    <input type="text" class="subject-code" placeholder="Subject Code" />
    <select class="grade">
      <option value="10">O</option>
      <option value="9">A+</option>
      <option value="8">A</option>
      <option value="7">B+</option>
      <option value="6">B</option>
      <option value="5">C</option>
      <option value="0">U/RA</option>
    </select>
    <span class="credit-display"></span>
    <button class="remove-subject">X</button>
  `;

  div.querySelector(".remove-subject").onclick = () => div.remove();
  return div;
}

numSubjectsInput?.addEventListener("input", () => {
  const count = parseInt(numSubjectsInput.value);
  if (!count || count <= 0) return;
  subjectsContainer.innerHTML = "";
  for (let i = 0; i < count; i++) {
    subjectsContainer.appendChild(createSubjectCard());
  }
});

calculateGpaBtn?.addEventListener("click", () => {
  let total = 0,
    credits = 0;

  const cards = document.querySelectorAll(".subject-card");
  for (let card of cards) {
    const code = card.querySelector(".subject-code").value.trim().toUpperCase();
    const grade = parseFloat(card.querySelector(".grade").value);
    const subject = getSubjectDetails(code);

    if (!subject) {
      alert(`Invalid subject code: ${code}`);
      return;
    }

    credits += subject.credit;
    total += grade * subject.credit;
  }

  const gpa = credits ? (total / credits).toFixed(2) : 0;
  document.getElementById("resultGPA").innerText = `Your GPA is: ${gpa}`;
});

/* ================= PDF INPUT FIX (NO FONT CUT) ================= */
function replaceInputsForPDF(container) {
  const elements = container.querySelectorAll("input, select");
  const replaced = [];

  elements.forEach((el) => {
    const span = document.createElement("span");
    span.innerText =
      el.tagName === "SELECT"
        ? el.options[el.selectedIndex]?.text || ""
        : el.value || "";

    const style = window.getComputedStyle(el);
    span.style.display = "inline-flex";
    span.style.alignItems = "center";
    span.style.minHeight = style.height;
    span.style.minWidth = style.width;
    span.style.padding = style.padding;
    span.style.border = style.border;
    span.style.fontSize = style.fontSize;
    span.style.fontFamily = style.fontFamily;
    span.style.color = style.color;
    span.style.background = "#fff";
    span.style.boxSizing = "border-box";

    replaced.push({ original: el, span });
    el.replaceWith(span);
  });

  return replaced;
}

function restoreInputs(replaced) {
  replaced.forEach(({ original, span }) => span.replaceWith(original));
}

/* ================= GPA PDF (DESKTOP + MOBILE FIX) ================= */
downloadGpaBtn?.addEventListener("click", async () => {
  const result = document.getElementById("resultGPA");
  if (!result?.innerText.trim()) {
    alert("Calculate GPA first!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");
  const content = document.querySelector(".pdf-area");

  const replaced = replaceInputsForPDF(content);

  const canvas = await html2canvas(content, {
    scale: 2,
    scrollY: -window.scrollY,
    windowWidth: content.scrollWidth,
  });

  restoreInputs(replaced);

  const imgData = canvas.toDataURL("image/png");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imgHeight + margin;
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save("GPA_Result.pdf");
});

/* ================= CGPA ================= */
const numSemSelect = document.getElementById("numSemesters");
const gpaInputsContainer = document.getElementById("gpa-inputs-container");
const calculateCgpaBtn = document.getElementById("calculateCGPA");
const downloadCgpaBtn = document.getElementById("downloadCGPA");

numSemSelect?.addEventListener("change", () => {
  gpaInputsContainer.innerHTML = "";
  for (let i = 1; i <= numSemSelect.value; i++) {
    gpaInputsContainer.innerHTML += `
      <div class="form-grid">
        <label>Semester ${i} GPA:</label>
        <input type="number" min="0" max="10" step="0.01">
      </div>`;
  }
});

calculateCgpaBtn?.addEventListener("click", () => {
  const inputs = gpaInputsContainer.querySelectorAll("input");
  let total = 0;
  inputs.forEach((i) => (total += parseFloat(i.value || 0)));
  const cgpa = inputs.length ? (total / inputs.length).toFixed(2) : 0;
  document.getElementById("resultCGPA").innerText = `Your CGPA is: ${cgpa}`;
});

/* ================= CGPA PDF (SAME FIX) ================= */
downloadCgpaBtn?.addEventListener("click", async () => {
  const result = document.getElementById("resultCGPA");
  if (!result?.innerText.trim()) {
    alert("Calculate CGPA first!");
    return;
  }

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "pt", "a4");
  const content = document.querySelector(".pdf-area");

  const replaced = replaceInputsForPDF(content);

  const canvas = await html2canvas(content, {
    scale: 2,
    scrollY: -window.scrollY,
    windowWidth: content.scrollWidth,
  });

  restoreInputs(replaced);

  const imgData = canvas.toDataURL("image/png");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const imgWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imgHeight + margin;
    pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save("CGPA_Result.pdf");
});
