# Roadmap: JesusCrust

## Overview

Establish deterministic scheduling semantics in a standalone harness first, then move heavy compute off the main thread while keeping DOM commits deterministic and budgeted.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Execution Harness** - QuickJS-driven harness with fake DOM, effect log, and deterministic replay.
- [x] **Phase 2: Rust/WASM Core** - Store, dependency graph, scheduler, and patch op generation.
- [x] **Phase 3: JS Host Integration** - JS host applies patch ops and validates batching boundary.
- [x] **Phase 4: Developer Experience** - Public API sketch, docs, and example scenarios.
- [x] **Phase 5: Drop-in Acceleration Research** - Investigate feasibility of drop-in acceleration for existing apps (research track).
- [ ] **Phase 6: Guarded Browser Rollout** - Telemetry-first browser integration and parallel planning behind commit boundaries.

## Phase Details

### Phase 1: Execution Harness
**Goal**: Implement a standalone JavaCrust execution harness validating transactional ticks, deferred DOM effects, and microtask coalescing.
**Depends on**: Nothing (first phase)
**Research**: Likely (QuickJS embedding details)
**Plans**: 1 plan

Plans:
- [x] 01-01: Execution harness (QuickJS, fake DOM, effect log, deterministic replay)

### Phase 2: Rust/WASM Core
**Goal**: Implement state graph, scheduler, and patch op generation targeting a WASM boundary.
**Depends on**: Phase 1
**Research**: Likely (WASM host boundary and data layout)
**Plans**: TBD

Plans:
- [x] 02-01: Core store and dependency graph
- [x] 02-02: Scheduler + patch op serialization

### Phase 3: JS Host Integration
**Goal**: JS host applies patch ops and enforces single batched commit semantics.
**Depends on**: Phase 2
**Research**: Unlikely (internal integration)
**Plans**: TBD

Plans:
- [x] 03-01: JS host runner and patch applier
- [x] 03-02: Host-side constraints + debug tooling

### Phase 4: Developer Experience
**Goal**: Document API surface and provide example scenarios for early adopters.
**Depends on**: Phase 3
**Research**: Unlikely
**Plans**: 1 plan

Plans:
- [x] 04-01: API sketch, docs, and examples

### Phase 5: Drop-in Acceleration Research (INSERTED)
**Goal**: Assess feasibility and constraints for drop-in acceleration of existing apps using the JesusCrust runtime.
**Depends on**: Phase 3/4 (semantics + API defined)
**Research**: Deep (integration/compat)
**Plans**: 4 plans

Plans:
- [x] 05-01: Research plan (discovery + constraints)
- [x] 05-02: Drop-in adapter prototype
- [x] 05-03: Preact renderer integration

### Phase 6: Guarded Browser Rollout
**Goal**: Validate Phase-5 semantics in real browsers and prove the first off-thread planning win under a strict commit budget.
**Depends on**: Phase 5 (adapter contract, conformance)
**Research**: Moderate (telemetry attribution + worker protocol)
**Plans**: 3 plans

Plans:
- [x] 06-01: Guarded browser host + Phase-6 telemetry UI
- [ ] 06-02: Servo-side telemetry hooks + selector counters
- [ ] 06-03: Measurement summary and next-win decision
- [ ] 06-04: Worker protocol + commit-budget plan

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Execution Harness | 1/1 | Complete | 2026-01-14 |
| 2. Rust/WASM Core | 2/2 | Complete | 2026-01-14 |
| 3. JS Host Integration | 2/2 | Complete | 2026-01-14 |
| 4. Developer Experience | 1/1 | Complete | 2026-01-14 |
| 5. Drop-in Acceleration Research | 3/3 | Complete | 2026-01-14 |
| 6. Guarded Browser Rollout | 1/4 | In Progress | — |
