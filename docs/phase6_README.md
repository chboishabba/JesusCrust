# Phase-6: Guarded Browser Rollout

## Purpose

Phase-6 integrates the Phase-5 execution model into a real browser environment **without weakening its guarantees**.

This phase exists to:

* observe real-world performance
* add parallelism only where semantics are preserved
* prevent regressions in determinism and safety

## What is LOCKED (do not break)

The following invariants are **non-negotiable**:

* One commit per tick
* All DOM mutations require a tick token
* No DOM/layout reads during a tick
* Rollback/fallback produce zero observable change
* Deterministic replay from identical inputs
* `npm run conformance` must pass unchanged

If your change violates any of these, it does **not** belong in Phase-6.

## What Phase-6 is allowed to change

* Telemetry and diagnostics
* Scheduling of non-observable work
* Parallel planning/precompute stages
* Browser-side host integration
* Feature-flagged engine optimizations

## What Phase-6 must NOT do

* Modify JavaScript semantics
* Introduce parallel JS execution without fallback
* Bypass commit boundaries
* Add site-specific hacks to engine code
* Touch SpiderMonkey unless starting a new research phase

## How to work safely in Phase-6

1. Add telemetry **before** optimization
2. Prove bottlenecks with data
3. Change one subsystem at a time
4. Keep fallbacks cheap and explicit
5. Run `npm run conformance` on every change

## If you’re unsure

When in doubt, ask:

> *Can JavaScript observe this change without going through commit/fallback?*

If yes → stop.

## Final guidance (important)

You are now in the **hard but valuable** part of the project:

* measurement
* attribution
* disciplined engine work

Do **not** rush FLOPs or “parallel JS” yet — the telemetry you’re about to add will tell you exactly when (and if) that’s warranted.

If you want next, I can:

* sketch the telemetry UI layout
* draft the exact Servo PR description text
* or help you interpret early telemetry from a real ChatGPT session
