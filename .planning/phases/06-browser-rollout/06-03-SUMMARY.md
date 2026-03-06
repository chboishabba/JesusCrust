# Phase 6 Measurement Summary

Status: telemetry captured for chatgpt.com; selector/layout counters still missing.

## Measurement anchors
- Sample hosts: chatgpt.com.
- Samples stored: `.planning/phases/06-browser-rollout/telemetry-samples/phase6-telemetry-https_chatgpt.com-1768599876598.json`, `.planning/phases/06-browser-rollout/telemetry-samples/phase6-telemetry-https_chatgpt.com-1768612497315.json`, `.planning/phases/06-browser-rollout/telemetry-samples/phase6-telemetry-https_chatgpt.com-1768622039517.json`.
- Metrics captured: per-tick durations, patch size, fingerprint, guardrail status. Selector invalidation counters are present in the schema but reported as zero across both captures.

## Highlights
- Sample 1 (`1768599876598.json`): 611 commits, avg total tick 0.094ms, P95 0.200ms, max 1.2ms (script-only).
- Sample 2 (`1768612497315.json`): 1242 commits, avg total tick 0.084ms, P95 0.200ms, max 0.6ms (script-only).
- Sample 3 (`1768622039517.json`): 557 commits, avg total tick 0.101ms, P95 0.200ms, max 0.7ms (script-only).
- Both samples report `selectors_evaluated = 0` and `elements_invalidated = 0` for all ticks; `style_ms`, `layout_ms`, and `render_ms` are zero, with all time in `script_ms`.
- Guardrail status: no fallback/rollback events recorded; fingerprints appear stable within each capture.

## Selector + guardrail story
- We can confirm the telemetry pipeline and fingerprints are stable, but selector dominance cannot be evaluated yet because selector counters and style/layout durations are not emitting.
- Decision ratios in `docs/phase6_browser_ui.md` (`selector_invalidation_ms / total_tick_ms`, `elements_invalidated / patch_ops`, `selectors_evaluated / elements_invalidated`) cannot be computed until 06-02 counters are wired.

## Next steps
1. Complete 06-02: emit selector invalidation + style/layout/render counters so ticks show non-zero selector work.
2. Collect at least one sample with selector activity and guardrail events (intentional fallback) to validate UI ratios.
3. Update `.planning/STATE.md` with the remaining telemetry instrumentation gaps before flipping the Phase-6 flag.
