# Semantics Oracle Loader Plan

## Purpose
- Provide a narrow, implementation-ready sketch for the semantics-oracle loader that can sit next to the drop-in adapter and call an external engine (e.g., Brimstone) in "semantic check only" mode without mutating the DOM model or violating the host contract.
- Keep the adapter removable: the loader must be a toggleable observer that hooks into `commitBatch`/`PatchBatch` emissions, not the mutating core. The plan focuses on what we need to ship before the loader can exist as a clean, optional safeguard.

## TODO checklist
1. **Capture the commit/rollback lifecycle.** Document how the loader observes `beginTick`/`commitBatch` in the existing adapter to get the `PatchBatch` plus serialized host state (fingerprint) once per tick. Record the invariant that only one `commit` batch is emitted per tick and that non-`commit` batches must remain empty so the loader never sees mutation outside `commitBatch`.
2. **Define the serialized payload.** Decide what data the loader sends to the semantics engine: (a) the `PatchOp` array, (b) current fingerprint/state tag, (c) tick metadata (`tickId`, `batchId`, reason). Keep it read-only so the loader never mutates the host model; it only clones/serializes.
3. **Design the loader interface and lifecycle.** Sketch the adapter-facing API plus failure hooks (pass-through `PollTrust`, fallback signal). Ensure the interface can be wired behind feature flags so the adapter remains removable. Include timeout/retry policy for the external `semantic check only` call.
4. **Bridge to the external engine.** Spell out how to start Brimstone (or equivalent) in semantic-check mode, feed it the serialized snapshot, and interpret success/failure. Decide on transport (child process with stdin/stdout JSON, socket, etc.) and how the loader reports diagnostics without blocking the host more than one tick per host invariants.
5. **Handle host outcomes.** Specify how the loader responds to (a) success — proceed with commit, (b) failure — trigger `fallback`/`rollback`, log reason, and keep the host state untouched, and (c) errors/timeouts — treat as fallback while keeping the loader optional.
6. **Document orchestration.** Write short usage notes referencing `docs/host-core-api.md` invariants: one commit per tick, no mutation outside `commitBatch`, rollback/fallback apply zero ops. Describe how the loader ensures those invariants remain true even while it is active, and how to disable it to keep the adapter removable.

## Interface sketch
```rust
/// Minimal hook the adapter keeps around; feature-flagged so the loader can be dropped.
pub trait SemanticsOracleLoader {
    /// Called once per tick right before the host commits.
    fn inspect_batch(&mut self, batch: &PatchBatch, state: &HostStateSnapshot) -> SemanticsCheckOutcome;

    /// Called when the host is shutting down or disabling the loader.
    fn shutdown(&mut self);
}

pub struct SemanticsCheckRequest {
    pub tick_id: TickId,
    pub batch_id: BatchId,
    pub ops: Vec<PatchOp>, // read-only copy
    pub fingerprint: u64,  // host serializer output
}

pub enum SemanticsCheckOutcome {
    /// External engine accepted the batch; host may commit normally.
    Approved,
    /// Engine rejected the batch (dialect error, heuristic mismatch, etc.). Host should emit `metaKind: 'fallback'` with the provided reason and leave DOM state untouched.
    Rejected { reason: String, diagnostics: Vec<String> },
    /// Loader failed to get a response (timeout, crash). Treat as fallback but keep adapter removable.
    Error { source: SemanticsError },
}
```
- The loader implementation translates `SemanticsCheckRequest` into the transport format expected by Brimstone's semantic-only runner (e.g., JSON + `--semantic-check`).
- The loader never mutates `PatchBatch`/host state: it copies `ops`, serializes them, and either lets the host continue or signals a fallback without emitting new `ops`.
- Because the adapter only wires the loader when a feature flag is enabled, removing the semantics oracle is a matter of not instantiating `SemanticsOracleLoader`.
