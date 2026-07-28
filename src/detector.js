const MONTH =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

const DEFINITIONS = [
  {
    type: "EMAIL",
    label: "Email",
    score: 0.99,
    regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    type: "SSN",
    label: "SSN",
    score: 0.99,
    regex: /\b(?!000|666|9\d\d)\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/g,
  },
  {
    type: "PHONE",
    label: "Phone",
    score: 0.93,
    regex: /(?<!\w)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]\d{3}[\s.-]\d{4}(?!\w)/g,
  },
  {
    type: "IP_ADDRESS",
    label: "IP address",
    score: 0.98,
    regex: /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g,
  },
  {
    type: "URL",
    label: "URL",
    score: 0.92,
    regex: /\bhttps?:\/\/[^\s<>"']+/gi,
  },
  {
    type: "DATE",
    label: "Date",
    score: 0.86,
    regex: new RegExp(
      `\\b(?:${MONTH}\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s+\\d{2,4})?|\\d{1,2}\\s+${MONTH}(?:\\s+\\d{2,4})?|\\d{1,2}[/-]\\d{1,2}[/-]\\d{2,4})\\b`,
      "gi",
    ),
  },
  {
    type: "MEDICAL_RECORD",
    label: "Medical record",
    score: 0.96,
    regex: /\b(?:MRN|medical record|patient id|chart)(?:\s*(?:number|no\.?|#|:))?\s*[A-Z0-9][A-Z0-9-]{3,}\b/gi,
  },
  {
    type: "ACCOUNT",
    label: "Account",
    score: 0.9,
    regex: /\b(?:account|member|beneficiary|claim|policy)(?:\s*(?:number|no\.?|#|id|:))?\s*[A-Z0-9][A-Z0-9-]{4,}\b/gi,
  },
  {
    type: "ADDRESS",
    label: "Address",
    score: 0.9,
    regex: /\b\d{1,6}\s+(?:[A-Z0-9.'-]+\s+){0,5}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Parkway|Pkwy|Highway|Hwy|Way)\b\.?(?:\s*(?:Apt|Unit|Suite|#)\s*[A-Z0-9-]+)?/gi,
  },
  {
    type: "ZIP_CODE",
    label: "ZIP code",
    score: 0.75,
    regex: /\b\d{5}(?:-\d{4})?\b/g,
  },
];

const NAME_PATTERNS = [
  /\b(?:patient|member|name|provider|physician|doctor|dr\.?|nurse|signed by|attending)(?:\s+(?:is|was|:))?\s+([A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?(?:\s+[A-Z]\.?)?\s+[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?)/g,
  /\b(?:Mr|Mrs|Ms|Miss|Dr)\.?\s+([A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?(?:\s+[A-Z][a-z]+(?:[-'][A-Z]?[a-z]+)?)+)/g,
];

function addMatch(results, match, definition, start = match.index, value = match[0]) {
  results.push({
    type: definition.type,
    label: definition.label,
    score: definition.score,
    start,
    end: start + value.length,
    text: value,
  });
}

function validZipContext(text, start, end) {
  const nearby = text.slice(Math.max(0, start - 28), Math.min(text.length, end + 12));
  return /\b(?:zip|postal|address|,\s*[A-Z]{2}\s*)/i.test(nearby);
}

export function detectPhi(text) {
  if (!text) return [];
  const results = [];

  for (const definition of DEFINITIONS) {
    definition.regex.lastIndex = 0;
    for (const match of text.matchAll(definition.regex)) {
      if (
        definition.type === "ZIP_CODE" &&
        !validZipContext(text, match.index, match.index + match[0].length)
      ) {
        continue;
      }
      addMatch(results, match, definition);
    }
  }

  for (const regex of NAME_PATTERNS) {
    regex.lastIndex = 0;
    for (const match of text.matchAll(regex)) {
      const value = match[1];
      const start = match.index + match[0].lastIndexOf(value);
      addMatch(results, match, { type: "PERSON", label: "Person", score: 0.82 }, start, value);
    }
  }

  return removeOverlaps(results);
}

function removeOverlaps(results) {
  const preferred = [...results].sort(
    (a, b) => b.score - a.score || b.end - b.start - (a.end - a.start),
  );
  const accepted = [];
  for (const candidate of preferred) {
    if (!accepted.some((item) => candidate.start < item.end && candidate.end > item.start)) {
      accepted.push(candidate);
    }
  }
  return accepted.sort((a, b) => a.start - b.start);
}

export function scrubText(text, entities, style = "label") {
  const counters = {};
  let cursor = 0;
  let output = "";

  for (const entity of entities) {
    output += text.slice(cursor, entity.start);
    counters[entity.type] = (counters[entity.type] || 0) + 1;
    if (style === "mask") {
      output += "█".repeat(Math.max(4, entity.text.length));
    } else if (style === "token") {
      output += `<${entity.type}_${counters[entity.type]}>`;
    } else {
      output += `[${entity.type}]`;
    }
    cursor = entity.end;
  }
  return output + text.slice(cursor);
}
