# AugmentedMD Tools

Tools for doctors navigating the post-AI digital world, developed by Dr. Michael Gorin.

## Sites

- **AugmentedMD** (`augmentedmd.html`) — Landing page showcasing all available tools
- **PHI Scrubber** (`phi-scrubber.html`) — Private, browser-based tool for finding and removing protected health information from clinical text

## PHI Scrubber

A private, browser-based tool for finding and removing protected health information from clinical
text. Detection happens entirely on the device: there is no backend, telemetry, external model, or
network request of any kind.

## Use it

Download `phi-scrubber.html` and open it in any modern browser. Everything—styling, recognizers, and
UI—is inlined in that one file, so it works in airplane mode with no server, install, or build step.
Text is scrubbed automatically as you type or paste; the Scrub PHI button forces a rescan.

## Develop

`phi-scrubber.html` is generated, so edit the sources rather than the built file:

- `src/detector.js` — recognizers and redaction, covered by the tests
- `src/ui.js`, `src/ui.css`, `src/template.html` — interface
- `scripts/build.mjs` — inlines the above into `phi-scrubber.html`

```bash
npm run build   # regenerate phi-scrubber.html
npm test        # build, then run the test suite
npm start       # build and serve on http://localhost:8080
```

The test suite fails if `phi-scrubber.html` is out of date with the sources or if it ever references
an external resource, which keeps the shipped file both current and fully offline.

## Detection

The pipeline follows Microsoft Presidio's model of independent recognizers that each return a
confidence score, with context checks and overlap resolution across the results. It covers names,
locations, dates, ages, phone numbers, email addresses, SSNs, medical record and account
identifiers, street addresses, ZIP codes, IP addresses, and URLs.

Ages are redacted whenever a number is attached to `year-old`, `years old`, `yo`, `y.o.`, `y/o`, or
an explicit `age` label, regardless of the value.

Dates follow the HIPAA rule that a year on its own is acceptable but anything more precise is not:

- `1981` on its own is kept, while `March 2019` and `08/2020` are redacted
- calendar dates, standalone month names, and weekday names are redacted
- relative references that anchor a record in time are redacted, including `today`, `yesterday`,
  `tomorrow`, `last month`, `this year`, `next Tuesday`, `two weeks ago`, and `in three months`
- `May` is only read as a month when a date or preposition supports it, so `may proceed` is kept
- durations that do not point at a date, such as `for 7 days`, are kept

Names use layered evidence rather than a single pattern:

- titles and clinical roles, such as `Dr. Samuel Reed` or `Emergency contact: ...`
- a first-name gazetteer, including common non-Anglo names
- general capitalized name sequences, filtered against a clinical stopword list
- initials, generational suffixes, hyphenated names, and particles such as `de la` or `van`
- uppercase roster formatting such as `MORRISON, JANE`

Presidio itself is a Python service and cannot run natively in a browser without shipping a Python
runtime and NLP models, which would break the offline, single-file requirement. This implementation
keeps Presidio's recognizer structure in JavaScript instead. Without a statistical model, unusual
names carry lower confidence than gazetteer or context matches, so review remains important.

## Safety

Automated de-identification is imperfect. This app is an aid, not a HIPAA compliance certification.
Review output before sharing it, especially for uncommon names, free-form locations, organization
names, and unusual identifier formats.
