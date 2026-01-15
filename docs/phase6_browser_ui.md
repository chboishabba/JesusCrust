# Phase 6 Guarded Host UI Surface

Verso Phase 6 exposes a single host guardrail surface at `window.__versoGuardedHost` so UI, policy, and telemetry layers can inspect diagnostics and control the extension without compromising the Servo guardrails:

| Field / method | Purpose |
|---------------|---------|
| `getDiagnostics()` | Returns the adapter diagnostics array emitted per tick (commit/rollback/fallback reasons). |
| `getLastBatch()` | Returns the last committed/rolled-back batch so UI can show what semantics the adapter preserved. |
| `getTelemetry()` | Returns telemetry stats for commits, fallback events, and tick start timestamps (see below). |
| `requestFallback(reason)` | Triggers the guardrail fallback path with a recorded reason and disables the host until reset (used for policy or QA). |
| `reset()` | Re-enables the host after a fallback/failure and clears the persisted per-origin disable record. |
| `origin` | The current page origin, for telemetry labels. |
| `running()` | Boolean flag that is `true` when the extension is actively steering commits and telemetry; false once fallback is active.

## Telemetry snapshot shape

The telemetry helper records:

* `commits`: each entry includes `tickId`, `duration`, `patchSize`, optional `fingerprint`, and a timestamp.
* `fallbacks`: `reason`, fallback metadata (`origin`, tickId), and timestamp.
* `ticks`: tick start timestamps keyed by `tickId` so UI can correlate durations and rollback windows.

A UI consuming this surface should refresh frequently (e.g., every animation frame or second) so telemetry stays close to real-time, expose fallback status, and allow contributors to call `requestFallback`/`reset` from a diagnostics panel. Having this documented upfront keeps Servo’s guardrails intact — any UI change touching the adapter must still obey the documented API and include a semantic-impact note referencing this surface, `npm run conformance`, and telemetry guardrails noted in `docs/phase6_pr_boundaries.md`.

The Phase-6 diagnostics popup now renders per-tick work-stack bars, selector counters, guardrail health cards, and a fingerprint-stability indicator driven by the `durations` and `work` fields below so contributors can immediately see when selectors dominate the tick versus script/layout/render work.

## Telemetry instrumentation

Telemetry exists to answer “what dominated this tick?” and is emitted once per tick at commit or fallback. The canonical schema is:

```ts
TickStats {
  tick_id: number
  result: 'commit' | 'fallback' | 'rollback'
  durations: {
    script_ms: number      // JS work inside the tick
    style_ms: number       // selector matching + invalidation
    layout_ms: number      // layout/reflow work
    render_ms: number      // renderer/compositor work
    total_ms: number       // wall-clock duration
  }
  work: {
    dom_mutations: number  // ops in this PatchBatch
    nodes_touched: number  // unique nodes affected
    patch_bytes: number    // serialized payload size
  }
  fallback?: {
    reason: string
    phase: 'script' | 'layout' | 'commit'
  }
}
```

Instrument proxy counters that correlate with real compute rather than low-level FLOPs: selectors_evaluated/elements_matched/rules_applied for style work, layout_nodes_visited/layout_passes/constraints_solved for layout work, and `js_time_ms` with a `js_long_task` boolean for script time. This keeps the telemetry lean but actionable without touching SpiderMonkey internals.

Aggregated UI surfaces should display rolling averages (avg/P95 tick duration), stacked “time per phase” bars, fallback rate per 1k ticks, and a patch size histogram so noise stays contained. Anything beyond these aggregates belongs in logs or more detailed instrumentation dashboards.

Recommended instrumentation touch points mirror Servo subsystems:

* **Script** — track start/end of ticks inside the host.
* **Style/selectors** — log invalidation duration + matched selector counts during style refresh.
* **Layout** — capture passes/nodes visited in build/traverse phases.
* **Renderer** — record frame build/composite time.
* **Commit boundary** — include serialization/fingerprint work so the UI knows when commits happen.

Rule: if you cannot answer “what phase dominated this tick?” with the new telemetry, the metric should be rethought before adding it.

## Extension manifest notes

The Phase 6 prototype ships as a manifest v3 extension whose `content_scripts` inject `host-entry.js` into every page while `action.default_popup` hosts `ui.html`/`ui.js` for diagnostics. The manifest lists `storage`/`<all_urls>` permissions, exposes the telemetry UI via `web_accessible_resources`, and keeps the adapter logic isolated in the injected content script so the guardrails cannot be bypassed from the action popup.

The popup UI loads `ui.js` via `<script type="module">` so its ES module imports run successfully, preventing the “Cannot use import statement outside a module” errors that occur when the diagnostics surface falls back to classic script loading.

`host-entry.js` bridges MV3’s classic-script restrictions to the ES modules that implement the actual guardrails: it runs in the injected page context, calls `import('./host.js?browser=1')`, and exposes `startGuardedBrowserHost()` without ever exposing Node-only imports. The UI/host/adapters now query-string their imports (e.g., `host.js?browser=1`, `adapter.js?browser=1`, `replay.js?browser=1`) so the browser reloads the updated bundles and never pulls in `node:crypto`; fingerprinting now uses a deterministic UTF-8 + SHA-256 implementation built entirely in `replay.js` rather than relying on Node builtins.

## Phase-6 architecture & responsibilities

```
                   ┌───────────────────────────────────────────────────┐
                   │                SERVO / VERSO BROWSER              │
                   │                                                   │
                   │  Constellation (pipeline orchestration, threads)  │
                   │   ├─ Script thread (JS engine + DOM bindings)     │
                   │   ├─ Style system (selector matching + invalidation) │
                   │   ├─ Layout threads (flow/layout compute)         │
                   │   ├─ Renderer / Compositor (paint/raster/composite)│
                   │   └─ Resource decode (images/CSS/fonts)           │
                   └───────────────────────────────────────────────────┘
                                      ▲
                                      │ (telemetry export hook points)
                                      │
┌────────────────────────────────────────────────────────────────────────────┐
│                         PHASE-6 GUARDED HOST (extension / shim)            │
│                                                                            │
│  UI (popup: ui.html + ui.js as ES module)                                  │
│   ├─ reads telemetry stream                                                │
│   ├─ graphs per-tick work, patch size, fallbacks, fingerprints             │
│   └─ allows requestFallback/reset (diagnostic controls only)               │
│                                                                            │
│  Host runtime (content-script/host-entry → host.js?browser=1)              │
│   ├─ begins tick  → token returned                                         │
│   ├─ allows ONLY tokenized mutations                                       │
│   ├─ drains microtasks → asserts single commit boundary                    │
│   ├─ commit/rollback/fallback consumes token                               │
│   ├─ logs diagnostics (reason, durations, patch stats, fingerprint)        │
│   └─ emits TickTelemetry { tick_id, commit?, duration, patch_ops/bytes… }  │
│                                                                            │
│  Conformance gate (`npm run conformance`)                                   │
│   └─ microtask/mutation/identity/rollback/replay/stateful/keyed/…          │
└────────────────────────────────────────────────────────────────────────────┘

KEY CONTRACT:
- Renderer/JS is treated as “untrusted”: it cannot read or observe intermediate state.
- Only committed snapshots are visible after `commit()` returns.
- Any invariant violation → rollback/fallback with reason (committed state unchanged).

## Telemetry specification

Telemetry is emitted **only once per tick** and only after `commit()`, `rollback()`, or `fallback()` finishes. Each interface below describes its counters.

1. **Tick telemetry**

```ts
interface TickTelemetry {
  tick_id: number;
  commit: boolean;            // false when rollback/fallback
  reason?: string;            // rollback/fallback reason
  duration_ms: number;        // beginTick → commit/rollback
  patch_ops: number;          // ops emitted in the batch
  patch_bytes: number;        // serialized payload size
  fingerprint: u64;           // deterministic fingerprint already computed
}
```

2. **Script telemetry**

```ts
interface ScriptTelemetry {
  tick_id: number;
  js_time_ms: number;          // storyboard JS time inside the tick
  js_calls: number;            // adapter/host entry invocations
  microtasks_drained: number;  // microtask count drained before commit
}
```

3. **Style/selector telemetry**

```ts
interface StyleTelemetry {
  tick_id: number;
  selector_match_ms: number;
  invalidated_elements: number;
  restyled_elements: number;
}
```

4. **Layout telemetry**

```ts
interface LayoutTelemetry {
  tick_id: number;
  layout_time_ms: number;
  layout_nodes: number;
  layout_threads: number;
}
```

5. **Render telemetry**

```ts
interface RenderTelemetry {
  tick_id: number;
  paint_time_ms: number;
  raster_time_ms: number;
  composite_time_ms: number;
}
```

6. **Guardrail telemetry**

```ts
interface GuardrailTelemetry {
  tick_id: number;
  kind: "rollback" | "fallback";
  reason: string;
}
```

Rule: **Telemetry must remain on and faithful to the current contract.** No Phase-6 PR may reduce visibility, bypass tick boundaries, or de-prioritize guardrails. Every telemetry change must keep `npm run conformance` green and preserve the deterministic fingerprint stream.

## Servo vs. Verso/host ownership

| Layer | Scope |
| --- | --- |
| Phase-6 host/extension | Telemetry dashboard, diagnostics UI, requestFallback/reset buttons, tick enforcement, fallback logging, and conformance gate glue. |
| Servo (style/layout/render) | Selector invalidation, layout planning, rendering, and telemetry hook points inside those subsystems—always behind the commit boundary. |

Servo work is allowed to parallelize or optimize, but it must not change JS-visible behavior; the host/UI side only observes and reports.
