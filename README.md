# PHI Scrubber

A private, browser-based assistant for finding and removing protected health information from
clinical text. Detection happens entirely on the device: there is no backend, telemetry, external
model, or network request.

## Run locally

Python 3 is the only runtime needed:

```bash
npm start
```

Open [http://localhost:8080](http://localhost:8080). After the first load, the service worker caches
the app so it remains available offline. For a strict airplane-mode workflow, load it once, turn off
the network, and keep the browser data for this origin.

Tests use Node's built-in test runner:

```bash
npm test
```

## Detection

The recognizer pipeline is inspired by Microsoft Presidio's pattern, score, context, and overlap
model. It detects common names in clinical context, dates, phone numbers, email addresses, SSNs,
medical record and account identifiers, street addresses, ZIP codes, IP addresses, and URLs.

Microsoft Presidio itself is a Python service and cannot run natively in a browser without shipping
a Python runtime and NLP models. This implementation preserves the local-only requirement with a
small JavaScript recognizer layer instead. The recognizers are in `src/detector.js` and can be
extended independently.

## Safety

Automated de-identification is imperfect. This app is an aid, not a HIPAA compliance certification.
Review output before sharing it, especially names without titles or clinical context, uncommon
identifier formats, free-form locations, ages, and organization names.
