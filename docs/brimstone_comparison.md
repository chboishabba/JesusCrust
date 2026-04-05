# Brimstone comparison

*Purpose:* record a lightweight reference for what JesusCrust already shares with Brimstone, what we should lift from it, and what to consciously leave alone so we focus on the scheduling/DOM story.

## Overlap
- Both are Rust-first projects that aim to respect JavaScript semantics even while moving heavy work into Rust land: JesusCrust keeps DOM commits deterministic under a budget, while Brimstone implements almost the entire ECMAScript spec from scratch.
- Both teams accept that a faithful JS surface demands discipline; JesusCrust wants to avoid behavioral drift when offloading computation, and Brimstone tracks test262 coverage to prove language correctness.

## Borrow
- Rigorous spec-driven testing: Brimstone ships a test262-backed integration runner for `cargo brimstone-test`, plus a dedicated testing README. We should mirror that discipline by adding end-to-end scenarios for host-core contracts and scheduling guarantees as soon as the Phase 3 surfaces stabilize. Those checks should extend the existing JesusCrust QuickJS-backed transactional harness or run beside it as a narrow semantics gate; they should not replace the host runner.
- Integration fuzzing: Brimstone already scripts `tests/fuzz/run.sh` for stress testing the engine. We can reuse that idea (not the exact harness) by adding targeted fuzzing or randomized workloads against JesusCrust's scheduler/patcher once our core API matures.
- Lightweight dependency posture: Brimstone sticks mostly to its own Rust modules, leaning on ICU4X only where needed. JesusCrust should keep the same bias—no extra runtime layers—when deciding which host helpers we ship with the core bundle.

## Do-not-borrow
- Do **not** try to reimplement Brimstone's parser, bytecode VM, garbage collector, or RegExp engine inside JesusCrust. Those capabilities belong to a full JS engine, while our goal is to stay a scheduling/diffing core that talks to whatever JS runtime hosts the DOM.
- Do **not** chase 97%-plus ECMAScript completeness on the Rust side; instead, let the host runtime continue providing the semantics and use targeted conformance checks only around the contract boundaries we control.

## Trigger conditions
1. When we define concrete host-core contracts (docs/api.md, docs/host-core-api.md, etc.), revisit this note to decide if additional compliance tests (borrowed from Brimstone's runner model) are worth the effort.
2. If the scheduler or patch generation requires fuzzing or stress coverage, match the scale by standing up a JesusCrust-specific fuzz harness before layering new optimizations. Prefer extending the existing harness surface before adding a second test runner.
3. Should a future phase push us toward embedding in a custom runtime, re-evaluate these recommendations to keep the sampling of borrowed ideas focused on integration work rather than a second JS engine.
