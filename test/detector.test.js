import test from "node:test";
import assert from "node:assert/strict";
import { detectPhi, scrubText } from "../src/detector.js";

test("detects common clinical identifiers", () => {
  const text =
    "Patient Jane Morrison, DOB 08/22/1981, MRN: A184-9921, email jane@example.com, phone (617) 555-0142.";
  const entities = detectPhi(text);
  const types = new Set(entities.map(({ type }) => type));

  for (const expected of ["PERSON", "DATE", "MEDICAL_RECORD", "EMAIL", "PHONE"]) {
    assert.ok(types.has(expected), `expected ${expected}`);
  }
});

test("uses surrounding context before treating five digits as ZIP code", () => {
  assert.equal(detectPhi("The sample count was 12345.").length, 0);
  assert.equal(detectPhi("ZIP: 12345")[0].type, "ZIP_CODE");
});

test("scrubs without changing surrounding content", () => {
  const text = "Email alice@example.com today.";
  assert.equal(scrubText(text, detectPhi(text)), "Email [EMAIL] today.");
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
