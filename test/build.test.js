import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { buildStandalone } from "../scripts/build.mjs";

const standalone = new URL("../phi-scrubber.html", import.meta.url);

const inlineScript = (html) => {
  const match = html.match(/<script>([\s\S]*?)<\/script>/);
  assert.ok(match, "expected an inline script element");
  return match[1];
};

test("phi-scrubber.html matches the current sources", async () => {
  const [built, committed] = await Promise.all([buildStandalone(), readFile(standalone, "utf8")]);
  assert.equal(committed, built, "run `npm run build` to regenerate phi-scrubber.html");
});

test("the standalone file loads no external resources", async () => {
  const html = await readFile(standalone, "utf8");
  assert.equal(/<script[^>]+src=/i.test(html), false);
  assert.equal(/<link[^>]+href=/i.test(html), false);
  assert.equal(/https?:\/\//i.test(html), false);
});

test("the inlined script compiles and holds only script content", async () => {
  const script = inlineScript(await readFile(standalone, "utf8"));
  assert.doesNotThrow(() => new vm.Script(script), "inlined script must be valid JavaScript");
  assert.equal(/<!doctype|<html|<body/i.test(script), false);
});

test("markup and script placeholders are fully replaced", async () => {
  const html = await readFile(standalone, "utf8");
  assert.equal(html.includes("{{CSS}}"), false);
  assert.equal(html.includes("{{SCRIPT}}"), false);
});
