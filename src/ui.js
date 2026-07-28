const byId = (id) => document.getElementById(id);
const source = byId("source");
const output = byId("output");
const copyButton = byId("copy");
const styleSelect = byId("style");
const findings = byId("findings");

const EXAMPLE = [
  "Patient Jane Morrison was seen on 04/17/2025 by Dr. Samuel Reed.",
  "DOB: 08/22/1981",
  "MRN: A184-9921",
  "Address: 742 Evergreen Avenue, Boston, MA 02118",
  "Phone: (617) 555-0142",
  "Email: jane.morrison@example.com",
  "",
  "Emergency contact: Yolanda Whitfield-Barnes (mother).",
  "Kwame Osei-Bonsu from case management will follow up next week.",
].join("\n");

let entities = [];
let scanTimer = null;

function updateCharacterCount() {
  const total = source.value.length;
  byId("chars").textContent = total.toLocaleString() + (total === 1 ? " character" : " characters");
}

function renderOutput(scrubbed) {
  output.className = "output";
  output.textContent = "";
  // Highlights each replacement without ever using innerHTML on user text.
  const pattern = /\[[A-Z_]+\]|<[A-Z_]+_\d+>|█+/g;
  let cursor = 0;
  let match;
  while ((match = pattern.exec(scrubbed)) !== null) {
    if (match.index > cursor) {
      output.appendChild(document.createTextNode(scrubbed.slice(cursor, match.index)));
    }
    const mark = document.createElement("mark");
    mark.textContent = match[0];
    output.appendChild(mark);
    cursor = match.index + match[0].length;
  }
  output.appendChild(document.createTextNode(scrubbed.slice(cursor)));
}

function renderFindings() {
  const grouped = {};
  entities.forEach((entity) => {
    grouped[entity.label] = (grouped[entity.label] || 0) + 1;
  });

  const chips = byId("chips");
  while (chips.firstChild) chips.removeChild(chips.firstChild);
  Object.keys(grouped).forEach((label) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = label + " \u00b7 " + grouped[label];
    chips.appendChild(chip);
  });

  findings.hidden = entities.length === 0;
  byId("total").textContent = entities.length + " total";
}

function scrub() {
  const text = source.value;
  entities = detectPhi(text);

  if (!text) {
    reset();
    return;
  }

  renderOutput(scrubText(text, entities, styleSelect.value));
  renderFindings();
  copyButton.disabled = false;
  byId("summary").textContent = entities.length
    ? entities.length + (entities.length === 1 ? " identifier scrubbed" : " identifiers scrubbed")
    : "No identifiers detected";
}

function reset() {
  entities = [];
  output.className = "output empty";
  output.textContent = "Your de-identified text will appear here.";
  copyButton.disabled = true;
  findings.hidden = true;
  byId("summary").textContent = "Ready to scan";
}

function scheduleScrub(delay) {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scrub, delay);
}

source.addEventListener("input", function () {
  updateCharacterCount();
  scheduleScrub(180);
});

source.addEventListener("paste", function () {
  scheduleScrub(0);
});

byId("scrub").onclick = scrub;
styleSelect.onchange = scrub;

byId("clear").onclick = function () {
  source.value = "";
  updateCharacterCount();
  reset();
  source.focus();
};

byId("example").onclick = function () {
  source.value = EXAMPLE;
  updateCharacterCount();
  scrub();
};

copyButton.onclick = function () {
  const text = scrubText(source.value, entities, styleSelect.value);
  const done = function (label) {
    copyButton.textContent = label;
    window.setTimeout(function () {
      copyButton.textContent = "Copy";
    }, 1400);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(
      function () {
        done("Copied");
      },
      function () {
        done("Copy blocked");
      },
    );
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  document.body.appendChild(helper);
  helper.select();
  try {
    done(document.execCommand("copy") ? "Copied" : "Copy blocked");
  } catch (error) {
    done("Copy blocked");
  }
  document.body.removeChild(helper);
};

document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    scrub();
  }
});

updateCharacterCount();
