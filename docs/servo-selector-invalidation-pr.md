# Parallel selector invalidation PR outline

## PR title
Parallel selector invalidation planning behind the commit boundary

## Scope

**This PR does:**

* Parallelize the preparation of selector invalidation work using Servo’s worker infrastructure.
* Emit invalidation results that are applied only once the guarded commit boundary is reached so DOM semantics remain unchanged.
* Add telemetry counters (`selector_invalidation_ms`, `selectors_evaluated`, `elements_invalidated`) that feed the Phase-6 dashboard and help show impact.
* Include a feature flag that defaults to serial operations and a fallback path in case the parallel task overruns, graph dependencies go stale, or memory pressure spikes.

**This PR does not:**

* Change JavaScript semantics or DOM mutation ordering.
* Touch SpiderMonkey internals or introduce parallel JS execution.
* Bypass the commit boundary or allow selector planning to mutate shared state outside the guardrail.

This work sits squarely inside Servo’s style pipeline. The Phase-6 host/extension only observes the emitted telemetry, so no guardrails or UI behavior change.

## Technical outline

1. Capture mutations and enqueue invalidation planning tasks without blocking the main thread.
2. In parallel, compute affected selectors/nodes and record the affected style zones.
3. At the guarded commit boundary, apply the precomputed invalidations in the existing style recalculation pipeline.
4. Instrument telemetry so the host can report style/selectors duration contributions for every tick.

Telemetry must call into the `Phase6TelemetryRecorder`, which aggregates per-tick stats and only emits data after `commit()`/`fallback()` returns. The recorder exposes `record_selector_invalidation(duration, selectors, elements)` so the UI can visualize `selector_invalidation_ms`, `selectors_evaluated`, and `elements_invalidated` without touching JS semantics.

## Telemetry

Emit the following counters per tick so the Phase-6 UI can attribute gains:

* `selector_invalidation_ms` — wall-clock time spent planning selector work.
* `selectors_evaluated` — number of selector rules touched during planning.
* `elements_invalidated` — how many nodes were marked dirty.
* `restyled_elements` — nodes that actually changed style so you can compare invalidated vs. restyled scope.

These feed into the aggregated telemetry described in `docs/phase6_browser_ui.md`.

Telemetry rule: counters must emit once per tick, after the commit/fallback completes. No telemetry hook may mutate DOM state, bypass tick boundaries, or disable guardrail sampling.

## Safety valves

* Feature flag guarding the parallel path.
* Automatic fallback to the serial invalidation path if the parallel task exceeds a time budget or the dependency graph changes.
* Resource checks that abort the parallel task when memory pressure is detected.
* Logging of fallback reason so diagnostics appear in the telemetry surface.
* Telemetry emissions are also gated by the feature flag so serial mode remains the current code path exactly.

## Success criteria

* No behavioral regressions on any WPT or existing Servo tests.
* Serial mode (flag off) reproduces current behavior exactly.
* Style/selector time drops measurably on DOM-heavy pages when the flag is on.
* Telemetry proves the selector invalidation duration reduced.
