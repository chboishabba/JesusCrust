# Phase 6.02 Summary (Servo-side telemetry hooks)

Status: selector telemetry counters added in core; browser host now surfaces selector ratios + rolling stats; Servo-side style/layout/render counters still need real hook points.

## What changed
- Added selector invalidation counters and style recalculation durations to the Phase-6 telemetry recorder.
- `Selector::evaluate_with_recorder` now records selector invalidation time + counts.
- Work telemetry now tracks `restyled_elements` for future selector accuracy comparisons.
- Phase-6 UI now renders selector invalidation duration, restyle counts, decision ratios, and rolling averages/P95s.
- Core telemetry exports a Phase-6 schema-aligned snapshot (`phase6_snapshot`) with patch ops.

## Notes
- The browser telemetry samples under `.planning/phases/06-browser-rollout/telemetry-samples/` still show zero selector/style/layout/render counters because the host/Servo integration has not yet emitted those fields.
- Selector invalidation PR guidance now requires telemetry evidence from the Phase-6 UI, guardrail health, and fingerprint stability before optimization work.
