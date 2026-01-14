# API Surface (Phase 3)

This document describes the Phase 3 public surface for the Rust/WASM core and JS host. It mirrors `docs/host-core-api.md` and adds host usage notes and a runnable shape for quickstarts.

## PatchBatch

```
interface PatchBatch {
  metaKind: 'commit' | 'rollback' | 'fallback';
  ops: PatchOp[]; // empty unless metaKind === 'commit'
}
```

- `commit`: apply ops in order inside a single commit boundary.
- `rollback` / `fallback`: **no ops**; `ops` must be empty.

## PatchOp (Phase 3 set)

- `EnsureNode { nodeId, tag }`
- `SetText { nodeId, value }`
- `SetAttr { nodeId, name, value }`
- `AppendChild { parentId, childId }`
- `Remove { nodeId }`

All ops are total on a valid DOM-equivalent host.

## Host responsibilities

- Maintain a deterministic DOM-equivalent model (not the browser DOM).
- Apply patches synchronously and in order via `commitBatch` only.
- Enforce one commit per tick; reject additional commits.
- Guard mutations: throw if mutated outside `commitBatch`.
- Rollback/fallback batches perform no mutation; reject if `ops` is non-empty.
- Provide stable serialization and optional fingerprint for replay.

## Replay and fingerprint

- Serialization sorts nodes by id and attributes alphabetically.
- Fingerprint: SHA-256 of serialized state, first 8 bytes (little-endian) → `u64`.
- Applying the same PatchBatch to the same serialized state must yield identical serialized output and fingerprint.

## Usage (JS host)

```js
import { createRunner } from '../packages/js-host/src/runner.js';

const runner = createRunner();
const batch = {
  metaKind: 'commit',
  ops: [
    { kind: 'EnsureNode', nodeId: 1, tag: 'div' },
    { kind: 'SetText', nodeId: 1, value: 'hello' },
  ],
};

runner.beginTick();
const serialized = runner.commitBatch(batch);
console.log(serialized);
```

## Related docs

- `docs/host-core-api.md` — frozen host-core contract
- `examples/quickstart.js` — runnable example demonstrating commit + fingerprint
