# Phase 6 Telemetry Schema

This schema captures the **decision-grade selector telemetry** referenced in `docs/phase6_browser_ui.md`.
It defines the canonical fields and invariants that both Servo and the Phase-6 UI must honor before any selector
parallelism or invalidation optimization proceeds.

## Minimal JSON shape

```json
{
  "tick_id": 3726,
  "commit_id": 3725,
  "fingerprint": "912589757505950543",

  "total_tick_ms": 0.10,
  "script_ms": 0.02,
  "style_recalc_ms": 0.05,
  "selector_invalidation_ms": 0.03,
  "layout_ms": 0.02,
  "render_ms": 0.01,

  "selectors_evaluated": 184,
  "elements_invalidated": 42,
  "elements_restyled": 39,

  "patch_ops": 2,
  "patch_bytes": 96,

  "fallback_kind": null
}
```

## Invariants

* `selector_invalidation_ms <= style_recalc_ms`
* `script_ms + style_recalc_ms + layout_ms + render_ms ≈ total_tick_ms`
* `fingerprint` **must not change** unless committed state changes
* `fallback_kind != null` ⇒ committed state unchanged

These invariants form the contract between Servo and the Phase-6 UI, ensure traceable telemetry, and enable
definitive `selector_invalidation_ms / total_tick_ms`, `elements_invalidated / patch_ops`, and
`selectors_evaluated / elements_invalidated` ratios before any selector decisions are made.
