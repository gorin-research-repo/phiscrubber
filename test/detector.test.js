import test from "node:test";
import assert from "node:assert/strict";
import { detectPhi, scrubText } from "../src/detector.js";

const scrub = (text) => scrubText(text, detectPhi(text));

test("detects common clinical identifiers", () => {
  const text =
    "Patient Jane Morrison, DOB 08/22/1981, MRN: A184-9921, email jane@example.com, phone (617) 555-0142.";
  const types = new Set(detectPhi(text).map(({ type }) => type));

  for (const expected of ["PERSON", "DATE", "MEDICAL_RECORD", "EMAIL", "PHONE"]) {
    assert.ok(types.has(expected), `expected ${expected}`);
  }
});

test("detects names introduced by a title or clinical role", () => {
  assert.equal(scrub("Seen by Dr. Samuel Reed today."), "Seen by Dr. [PERSON] today.");
  assert.equal(scrub("Emergency contact: Yolanda Whitfield-Barnes"), "Emergency contact: [PERSON]");
  assert.equal(scrub("Name: Tomasz Wisniewski"), "Name: [PERSON]");
});

test("detects names in plain prose without a trigger word", () => {
  assert.equal(scrub("Kwame Osei-Bonsu reviewed the chart."), "[PERSON] reviewed the chart.");
  assert.equal(scrub("Contacted Sarah McDonald yesterday."), "Contacted [PERSON] yesterday.");
});

test("keeps whole names together across initials, suffixes, and particles", () => {
  assert.equal(scrub("Signed by Robert Q. Vandenberg III, MD"), "Signed by [PERSON], MD");
  assert.equal(scrub("Consulted Maria de la Cruz."), "Consulted [PERSON].");
  assert.equal(scrub("Nurse Patricia OConnell called."), "Nurse [PERSON] called.");
});

test("detects uppercase roster names", () => {
  assert.equal(scrub("MORRISON, JANE"), "[PERSON]");
});

test("leaves clinical vocabulary and headings alone", () => {
  const text = "Chief Complaint: Chest Pain. Vital Signs Stable. The Emergency Department called.";
  assert.equal(scrub(text), text);
});

test("labels places as locations rather than people", () => {
  assert.equal(scrub("Seen in Boston, MA 02118").startsWith("Seen in [LOCATION]"), true);
  assert.equal(scrub("Referred by Ahmed Al-Rashid, MD"), "Referred by [PERSON], MD");
});

test("uses surrounding context before treating five digits as ZIP code", () => {
  assert.equal(detectPhi("The sample count was 12345.").length, 0);
  assert.equal(detectPhi("ZIP: 12345")[0].type, "ZIP_CODE");
});

test("flags ages over 89", () => {
  assert.equal(scrub("The patient is 94 years old."), "The patient is [AGE].");
  assert.equal(scrub("The patient is 62 years old."), "The patient is 62 years old.");
});

test("scrubs without changing surrounding content", () => {
  assert.equal(scrub("Email alice@example.com today."), "Email [EMAIL] today.");
});

test("supports numbered and masked replacements", () => {
  const text = "alice@example.com and bob@example.com";
  const entities = detectPhi(text);
  assert.equal(scrubText(text, entities, "token"), "<EMAIL_1> and <EMAIL_2>");
  assert.match(scrubText(text, entities, "mask"), /^█+ and █+$/);
});

test("does not match invalid IPv4 octets", () => {
  assert.equal(detectPhi("server 999.999.999.999").length, 0);
});

test("keeps dates out of the address recognizer", () => {
  assert.equal(scrub("Seen on 04/17/2025 by Dr. Samuel Reed."), "Seen on [DATE] by Dr. [PERSON].");
});

test("produces non-overlapping entities in document order", () => {
  const text = "Patient Jane Morrison at 742 Evergreen Avenue, Boston, MA 02118.";
  const entities = detectPhi(text);
  for (let index = 1; index < entities.length; index += 1) {
    assert.ok(entities[index].start >= entities[index - 1].end, "entities must not overlap");
  }
});
