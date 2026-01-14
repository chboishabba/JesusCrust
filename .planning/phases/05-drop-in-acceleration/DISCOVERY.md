# Phase 5: Drop-in Acceleration Research (Discovery)

## Constraints from Host/Core Contract

- **Batch-only commits**: One commit per tick; all ops applied in order inside commitBatch.
- **Mutation guard**: Host mutators must throw outside commitBatch.
- **Rollback/fallback = no-ops**: Non-commit batches must not mutate and must carry no ops.
- **Deterministic replay**: Stable serialization + SHA-256 u64 fingerprint; same input → same output.
- **Patch op set**: EnsureNode, SetText, SetAttr, AppendChild, Remove.

## Where typical apps conflict

- **Streaming DOM writes** (imperative frameworks, unbatched setState/useEffect bursts): violate batch-only commit; would need interception/coalescing.
- **Uncontrolled microtasks/promises** (3rd-party libs queuing jobs): can mutate mid-tick; violate mutation guard unless sandboxed.
- **Direct DOM mutations outside framework** (widgets, extensions): bypass host contract; hard to intercept without heavy shimming.
- **Event-driven sync reads** (layout thrash patterns): could observe partial state unless reads are forced after commit.

## Approach Survey

1) **DOM patch interception shim**
   - **Idea**: Wrap DOM write APIs (setAttribute, textContent, appendChild/removeChild) to enqueue patch ops, then commit at boundaries.
   - **Pros**: Requires no app changes; captures most writes.
   - **Cons**: Heavy monkey-patching; brittle with custom elements/3P libs; perf overhead; hard to guarantee no escape hatches; determinism risk if patch order differs from native.

2) **Virtual layer / shadow DOM-equivalent**
   - **Idea**: Apps render into a provided DOM-equivalent (like js-host model); we own commit boundaries; real DOM updated only via commitBatch.
   - **Pros**: Aligns with existing contract; deterministic; minimal escape hatches; easier replay.
   - **Cons**: Requires integration adapter per framework; not “drop-in” for existing real DOM trees; may need event bridging.

3) **Framework adapter (e.g., React/Vue/Vite plugin)**
   - **Idea**: Provide a renderer/adapter that routes framework updates into our patch batches.
   - **Pros**: Less monkey-patching; leverages framework lifecycle; more deterministic.
   - **Cons**: Per-framework work; not truly drop-in for arbitrary apps; still need to guard userland direct DOM.

## Recommendation / Next Step

- **Go for a scoped prototype** using **virtual layer / shadow DOM-equivalent** (approach 2) with a small adapter (approach 3) for one framework (React custom renderer or a Vite plugin) to test feasibility.
- Defer DOM monkey-patch shim (approach 1) due to determinism and brittleness.

### Prototype scope (go)
- Provide a DOM-equivalent host surface as the rendering target.
- Adapter translates framework updates into PatchBatch, committing once per tick.
- Include mutation guard to catch direct DOM writes during prototype.
- Measure: determinism (fingerprint stable), no mid-tick visibility, single commit per tick.

### Prototype notes
- `prototypes/dropin/adapter.js` exposes `createDropInHost()` that buffers writes (EnsureNode, SetText, SetAttr, AppendChild) before invoking the js-host runner's `beginTick`/`commitBatch`. It reuses `fingerprintFromSerialized`.
- `prototypes/dropin/example.js` simulates two ticks, logging serialization + fingerprint on each to prove deterministic batching.
- `prototypes/dropin/framework.js` / `framework-example.js` render a React-like view tree into the adapter: attributes, text, and event listeners are applied via host ops, and `addEventListener` captures widget events during commit.
- The prototype validates the DOM-equivalent + adapter approach, proves event bridging for widgets, and confirms why DOM monkey-patching is still too brittle for this phase.
- **Truth tests** (`microtask-test.js`, `mutation-test.js`, `identity-test.js`) verify: microtasks complete before commit, strict mutation guard throws outside tick, and `ensureNodeWithKey` keeps NodeIds stable across ticks.

### Blockers to watch
- Third-party widgets that demand real DOM hooks will bypass the guard.
- Event propagation differences between virtual host and real DOM may need bridging (out of scope for first prototype).
