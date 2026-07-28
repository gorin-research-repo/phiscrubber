import { detectPhi, scrubText } from "./detector.js";

const source = document.querySelector("#sourceText");
const output = document.querySelector("#outputText");
const scrubButton = document.querySelector("#scrubButton");
const clearButton = document.querySelector("#clearButton");
const copyButton = document.querySelector("#copyButton");
const exampleButton = document.querySelector("#exampleButton");
const styleSelect = document.querySelector("#replacementStyle");
const charCount = document.querySelector("#charCount");
const resultSummary = document.querySelector("#resultSummary");
const findings = document.querySelector("#findings");
const findingCount = document.querySelector("#findingCount");
const findingChips = document.querySelector("#findingChips");

const example = `Patient Jane Morrison was seen on 04/17/2025.
DOB: 08/22/1981
MRN: A184-9921
Address: 742 Evergreen Avenue, Boston, MA 02118
Phone: (617) 555-0142
Email: jane.morrison@example.com

Dr. Samuel Reed reviewed the patient's lab results and requested follow-up in two weeks.`;

let lastEntities = [];

function updateCount() {
  const count = source.value.length;
  charCount.textContent = `${count.toLocaleString()} ${count === 1 ? "character" : "characters"}`;
}

function render() {
  const text = source.value;
  lastEntities = detectPhi(text);
  const scrubbed = scrubText(text, lastEntities, styleSelect.value);

  output.classList.remove("empty");
  output.textContent = scrubbed || "No text to scrub.";
  copyButton.disabled = !text;

  const count = lastEntities.length;
  resultSummary.textContent = count
    ? `${count} ${count === 1 ? "identifier" : "identifiers"} scrubbed`
    : "No identifiers detected";

  findings.hidden = count === 0;
  findingCount.textContent = `${count} total`;
  findingChips.replaceChildren();

  const grouped = lastEntities.reduce((counts, entity) => {
    counts[entity.label] = (counts[entity.label] || 0) + 1;
    return counts;
  }, {});

  for (const [label, amount] of Object.entries(grouped)) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = `${label} · ${amount}`;
    findingChips.append(chip);
  }
}

source.addEventListener("input", updateCount);
scrubButton.addEventListener("click", render);
styleSelect.addEventListener("change", () => {
  if (source.value) render();
});

clearButton.addEventListener("click", () => {
  source.value = "";
  lastEntities = [];
  updateCount();
  output.className = "output empty";
  output.innerHTML = `<div class="empty-state"><p>Your de-identified text will appear here.</p></div>`;
  resultSummary.textContent = "Ready to scan";
  findings.hidden = true;
  copyButton.disabled = true;
  source.focus();
});

exampleButton.addEventListener("click", () => {
  source.value = example;
  updateCount();
  render();
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(scrubText(source.value, lastEntities, styleSelect.value));
    copyButton.textContent = "Copied";
    window.setTimeout(() => {
      copyButton.textContent = "Copy";
    }, 1400);
  } catch {
    copyButton.textContent = "Copy failed";
  }
});

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    event.preventDefault();
    render();
  }
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("./service-worker.js");
}
