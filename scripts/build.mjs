import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const read = (name) => readFile(new URL(name, root), "utf8");

export async function buildStandalone() {
  const [template, css, detector, ui] = await Promise.all([
    read("src/template.html"),
    read("src/ui.css"),
    read("src/detector.js"),
    read("src/ui.js"),
  ]);

  const logic = detector.replace(/^export\s+/gm, "");
  const script = `${logic}\n${ui}`;

  if (/<\/script/i.test(script)) {
    throw new Error("Inlined script would terminate the HTML script element early.");
  }

  // Replacer functions keep "$" sequences in the sources from being read as
  // replacement patterns, which would splice unrelated text into the output.
  return template
    .replace("/* {{CSS}} */", () => css.trim())
    .replace("/* {{SCRIPT}} */", () => script.trim());
}

const invokedDirectly = process.argv[1] === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  const html = await buildStandalone();
  await writeFile(new URL("phi-scrubber.html", root), html);
  console.log(`Wrote phi-scrubber.html (${html.length.toLocaleString()} bytes)`);
}
