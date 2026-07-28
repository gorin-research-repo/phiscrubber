import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { buildStandalone } from "../scripts/build.mjs";

const standalone = new URL("../phi-scrubber.html", import.meta.url);

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
