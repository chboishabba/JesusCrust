# Drop-in Adapter Contract

This document summarizes the drop-in shim’s execution model. It sits on top of the host/core contract (PatchBatch) and defines what a renderer must respect when driving the adapter.

## Tick semantics

- A tick equals one macrotask plus all microtasks that run before the host commits.
- Tick flow: `beginTick()` → renderer writes (methods on adapter) → awaited microtasks → `commit()` (single commit batch) → optional post-commit callbacks/events.
- Microtasks can schedule writes; the adapter defers commit until all microtasks that resolved before `await Promise.resolve()` complete. Your prototype tests exercise this via `microtask-test.js`.

## Mutation guard

- All DOM-like writes must happen via adapter methods (`ensureNode`, `ensureNodeWithKey`, `setText`, `setAttr`, `appendChild`).
- Methods throw if called outside of `beginTick()`/`commit()`.
- The underlying DOM model (`packages/js-host/src/dom.js`) is immutable outside `runMutating`, so any direct call outside the adapter throws (tested in `mutation-test.js`).

## Identity tracking

- Renderers should call `ensureNodeWithKey(key, tag)` to keep consistent NodeIds per logical node.
- Keys can be derived from component paths, `props.key`, or any deterministic string.
- The adapter preserves the key-to-NodeId map across ticks; the identity test (`identity-test.js`) verifies the same key yields the same NodeId.

## Event bridging

- `addEventListener(nodeId, type, handler)` registers callbacks and `dispatchEvent` fires them after commit.
- This ensures post-commit widget events run without mutating state mid-tick (used by `example.js` and `framework-example.js`).

## Renderer integration (Preact)

- `prototypes/dropin/preact-renderer.js` maps Preact VNodes into adapter ops, using deterministic keys and one commit per `render()`.
- `prototypes/dropin/preact-example.js` exercises two renders plus event callbacks, logging serialized output and fingerprint per tick.

## Rollback/Barriers

- The adapter currently enforces a single commit per tick; unsupported reads should either run after commit (via event callbacks) or trigger a new tick.
- Any rollback/fallback needs to use the host/core contract `metaKind: 'rollback'` (not shown here yet).

## Observable vs committed state

- The adapter exposes state changes only through the commit boundary. Until `commit()` returns, the DOM-equivalent model is still in-flight and must not be read or mutated by the renderer.
- The serialized snapshot (`runner.snapshot()` or the value returned by `commit()`) is the canonical representation of *committed* state. Event handlers and post-commit observers may consult this snapshot but should never read intermediate state during the mutation window.
- If a renderer needs to read structural data (e.g., layout size, focus state), it must schedule that work after commit (via events) or trigger a new tick. Attempting to observe the DOM-equivalent model before commit is conceptually forbidden and should fall back.

## Fallback semantics

- `metaKind: 'fallback'` is reserved for situations where a tick cannot safely commit because the adapter detected an unsupported read or invariant violation but still wants to keep the host alive. A fallback batch behaves like a rollback (no ops applied and committed state unchanged) but records the reason so the host can surface diagnostics or retry in a cleaner configuration.
- Both rollback and fallback guarantee the same observable effect: the DOM-equivalent state remains the same as before the tick, and the renderer must start a new tick if it wishes to reapply effects. The adapter may expose `host.rollback()` or similar helpers to signal a fallback at any time.

## Summary

Any renderer hooking into this adapter agrees to:
1. Use `beginTick`/`commit` once per macrotask.
2. Route all DOM writes through the adapter.
3. Schedule microtask-based writes before committing, as proven by `microtask-test.js`.
4. Keep NodeId identity stable with `ensureNodeWithKey`.
5. Fire events only via `dispatchEvent` after commit.

The adapter treats renderers as untrusted: all effects are buffered, validated, and committed transactionally so their only observable state changes happen through a single, deterministic commit boundary.

Breaking any rule risks violating the core D0 model. Every proof run (`example.js`, `framework-example.js`, and the tests) maintains these invariants.

## Invariants to preserve

1. **Single-commit invariant:** exactly one `commit()` may be called per `beginTick()`. Calling `commit()` twice without a new tick throws.
2. **Event-phase invariant:** event handlers (registered via `addEventListener`) only run after `commit()` completes. They never run during the execution phase.
3. **Rollback invariant:** any barrier or unsupported read must trigger a rollback (`metaKind: 'rollback'`) with no DOM mutation, leaving the pre-commit state intact.
4. **Deferred mutation invariant:** all DOM-equivalent mutations MUST be performed via adapter APIs during the tick's mutation window and remain frozen outside of `commit()`. Direct mutations outside this window are forbidden.
5. **Determinism invariant:** given identical initial state and identical `PatchBatch` input, applying the batch MUST yield identical serialized DOM output and fingerprint.

## Phase-6 guardrails

1. **Tokenized mutation channels:** every `beginTick()` now returns a capability token and every mutating call (`ensureNode`, `setText`, `appendChild`, `removeNode`) requires that token. The token is consumed by `commit()`/`rollback()`/`fallback()` so no mutation can elide the Phase‑5 window.
2. **Runtime barriers:** reads or observers that occur while `inTick` is true throw or fallback. `commit()` asserts the microtask queue is drained and that no other commit occurred during the tick; if an invariant would break, the host issues a fallback batch with an explicit reason.
3. **Conformance suite:** the locked `npm test` command (`prototypes/dropin/package.json`) is the semantic baseline. Phase‑6 changes must run it and may only add new tests, not change the Phase‑5 proofs. Any work touching `prototypes/dropin/adapter.js`, contract docs, or renderer shims must document the semantic impact and preserve the existing gate.
