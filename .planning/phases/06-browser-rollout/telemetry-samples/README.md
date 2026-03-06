# Phase-6 Telemetry Samples

This folder contains exported Phase-6 telemetry captures
from real browser sessions.

The goal is to:
- attribute main-thread cost
- identify dominant subsystems
- validate determinism and commit behavior
- guide which subsystem to parallelize next

---

## File Naming Convention

```
phase6-telemetry-<origin>-<ISO8601>.json
```

Examples:
- `phase6-telemetry-https_chatgpt.com-2026-01-17T01-22-19Z.json`
- `phase6-telemetry-https_chatgpt.com-2026-01-17T01-26-39Z.json`

---

## Capture Instructions

1. Enable Phase-6 extension
2. Reproduce the target scenario
   (e.g. long ChatGPT thread + LaTeX response)
3. Open Phase-6 UI
4. Export telemetry JSON
5. Place file in this directory

---

## What to Look For

Key fields:
- `script_ms`
- `style_ms`
- `layout_ms`
- `render_ms`
- `patch_bytes`
- `dom_mutations`
- `selectors_evaluated`
- `elements_invalidated`
- `fingerprint`

Patterns of interest:
- growth with thread length
- spikes during response generation
- correlation between patch size and layout cost

---

## Usage

Telemetry samples in this folder are treated as:
- immutable evidence
- regression baselines
- design inputs for Phase-6.x optimizations

Do not edit samples after capture.
