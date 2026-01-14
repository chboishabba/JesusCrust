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

## Rollback/Barriers

- The adapter currently enforces a single commit per tick; unsupported reads should either run after commit (via event callbacks) or trigger a new tick.
- Any rollback/fallback needs to use the host/core contract `metaKind: 'rollback'` (not shown here yet).

## Summary

Any renderer hooking into this adapter agrees to:
1. Use `beginTick`/`commit` once per macrotask.
2. Route all DOM writes through the adapter.
3. Schedule microtask-based writes before committing, as proven by `microtask-test.js`.
4. Keep NodeId identity stable with `ensureNodeWithKey`.
5. Fire events only via `dispatchEvent` after commit.

Breaking any rule risks violating the core D0 model. Every proof run (`example.js`, `framework-example.js`, and the tests) maintains these invariants.

## Invariants to preserve

1. **Single-commit invariant:** exactly one `commit()` may be called per `beginTick()`. Calling `commit()` twice without a new tick throws.
2. **Event-phase invariant:** event handlers (registered via `addEventListener`) only run after `commit()` completes. They never run during the execution phase.
3. **Rollback invariant:** any barrier or unsupported read must trigger a rollback (`metaKind: 'rollback'`) with no DOM mutation, leaving the pre-commit state intact.
