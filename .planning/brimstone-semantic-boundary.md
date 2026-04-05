# Brimstone semantic-check boundary

## Purpose
Document the thin adapter that walks the host-core contract needle once JesusCrust drops in Brimstone as a regression oracle. This is a _semantics gate only_: the adapter feeds commit/rollback batches into Brimstone's runner, interprets its fingerprint/diagnostic output, and reports pass/fail for the contract without touching DOM mutation or scheduler internals.

## Inputs
- JesusCrust batched commit payloads (`metaKind: commit/rollback/fallback`, `ops`, `tickId`) produced by the drop-in JS host layer.
- Fingerprints and diagnostics returned by `createRunner().commitBatch()` (or the `fingerprintFromSerialized` helper) to prove JS semantics remained unchanged.

## Outputs
- A boolean or diagnostic signal that a given batch matches Brimstone's expectations (used by the regression harness described in `prototypes/dropin`).
- A log entry (or failure) when Brimstone reports divergence so the drop-in harness can surface the mismatch.

## Non-goals
- Do not borrow Brimstone's parser, bytecode VM, RegExp engine, or GC implementations into JesusCrust.
- Do not expose or control JesusCrust's scheduler, selector graph, or deterministic patch format; those remain JC-owned.
- Do not route DOM writes or attribute mutations through Brimstone; the host still owns the DOM commit gate and the virtualization boundary.

## Escalation triggers
1. We need to hook into the drop-in scheduler/selector graph to provide more context to Brimstone; escalate immediately because the adapter would no longer be semantics-only.
2. We need Brimstone to read or mutate DOM state (including heuristics for `inTick` enforcement); exit the gate and revisit scope with the orchestrator.
3. Jacking GC/heap metadata into the harness (e.g., to check JS memory) would cross into engine-reimplementation territory; escalate before adding such logic.

## Validation signal
The new `prototypes/dropin/semantic-gate-test.js` asserts that `createDropInHost()` enforces the tick token guard before mutating state. If that guard ever disappears, the semantics-check adapter cannot trust the drop-in payloads and needs a reevaluation.

## Adapter handshake outline

1. **Request schema** (JesusCrust → Brimstone oracle):
   - `metaKind`: `commit | rollback | fallback` (string) describing batch intent.
   - `ops`: array of patch ops (EnsureNode/SetText/etc.) finalized by the JS host’s `commit()`.
   - `tickId`: host tick identifier to correlate diagnostics and replay logs.
   - `token`: optional fingerprint/tag produced by JC so the oracle can link responses to host tokens.
2. **Invocation steps**:
   1. Host calls `createRunner().commitBatch(request)` with the request above.
   2. Brimstone returns `{ serialized, fingerprint, diagnostics }` plus a status (pass/fail) inferred from `serialized` matching expectations.
   3. Adapter interprets Brimstone’s fingerprint to assert semantic parity and surface diagnostics; failing asserts trigger a harness-level error.
   4. On success, the adapter reuses the fingerprint for telemetry or replays as needed, but it never alters scheduling metadata.
3. **Response shape** (Brimstone → JesusCrust adapter):
   - `serialized`: host-visible batch outcome (used only for logging/replay).
   - `fingerprint`: canonical hash of the semantics run (monotonic from Brimstone). 
   - `diagnostics`: optional list of parsed guard violations.
   - `status`: derived boolean/text describing pass/fail; host logs this but keeps decision authority.
4. **Non-goals (reiterated)**:
   - Adapter does *not* expose JS host internals, GC metrics, or mutation hooks.
   - Adapter does *not* rely on Brimstone to mutate or inspect DOM state directly.
5. **Escalation hooks**:
   - Need more detailed host context to make deterministic assertions? Investigate whether the serializer or scheduler must expose extra metadata or if the adapter can derive the same from existing batches.
   - Brimstone reports divergence tied to host state (e.g., missing tokens): log the context, flag a regression, and revisit whether the adapter needs richer instrumentation (without touching DOM).
 6. **Feature flag & manifest**:
    - Wrap the adapter behind `BRIMSTONE_SEMANTICS_ORACLE` (default `false`) so the production scheduler path never instantiates the oracle unless testing/diagnostic builds opt in.
    - `prototypes/dropin` manifests (scripts/test runners) invoke the flag-enabled adapter only while the main runtime keeps `BRIMSTONE_SEMANTICS_ORACLE` disabled.
 7. **Removal/replace guarantee**:
    - Because the adapter is gated, removing the flag or the shim removes all Brimstone references and restores JC to its pure scheduler; no other module should depend on the adapter’s exports.
 8. **Manifest/runner structure**:
    - The adapter only calls `createRunner().commitBatch(request)` and interprets `{ serialized, fingerprint, diagnostics }`; there is no dependency on Brimstone’s parser/VM/GC, and no DOM or scheduler coupling occurs over that surface.
