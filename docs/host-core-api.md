# Host ↔ Core API (Phase 3 Freeze)

This document defines the Phase 3 contract between the core runtime and the JS host. It is deterministic, batch-only, and enforces commit boundaries. Later optimizations (binary encoding, streaming) must preserve these semantics.

## PatchBatch

```
interface PatchBatch {
  metaKind: 'commit' | 'rollback' | 'fallback';
  ops: PatchOp[];            // empty unless metaKind === 'commit'
  // optional: batchId, tickId, reason, fingerprint (not required in Phase 3)
}
```

- `metaKind === 'commit'`: host applies all ops in order inside a single commit.
- `metaKind !== 'commit'` (rollback/fallback): host applies **no ops**; `ops` must be empty.

## PatchOp set (frozen for Phase 3)

- `EnsureNode { nodeId, tag }` — idempotent create-or-noop; registers NodeId mapping.
- `SetText { nodeId, value }` — sets text content.
- `SetAttr { nodeId, name, value }` — sets/overwrites attribute.
- `AppendChild { parentId, childId }` — moves child if already attached.
- `Remove { nodeId }` — removes node and its descendants (no-op if missing).

All ops are total; applying to a valid DOM-equivalent must not throw.

## Host responsibilities

- Maintain a NodeId→node registry on a **DOM-equivalent model** (not the browser DOM) with deterministic serialization.
- Apply patches **synchronously** and **in order** only via `commitBatch`.
- Enforce **one commit per tick**; reject additional commits in the same tick.
- Guard mutations: attempts to mutate outside `commitBatch` must throw.
- Rollback/fallback batches **must not mutate**; if `ops` is non-empty, reject the batch.
- Provide a stable serializer and (optionally) a fingerprint for replay checks.

## Determinism and replay

- Serialization sorts nodes by `id` and attributes alphabetically for stability.
- Fingerprint (Phase 3 helper): SHA-256 of serialized state, first 8 bytes (little-endian) → `u64`.
- Applying the same PatchBatch to the same serialized state must produce identical serialized output and fingerprint.

## Commit boundary

- Host mutators are only allowed inside `commitBatch`; mutation outside commit throws (`Mutation outside commitBatch`).
- Mid-tick visibility: state changes become observable only after `commitBatch` completes.
- Tick lifecycle: `beginTick` → `commitBatch` (once) → next tick.

## Out of scope (Phase 3)

- Performance/streaming encodings
- Browser DOM integration
- Devtools/debug UI
- Workers/SharedArrayBuffer/multithreading
