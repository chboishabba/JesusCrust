# Phase 6 Contribution Boundaries

Phase 6 work splits cleanly along two domains:

1. **Verso / Browser Shell (UI, policy, telemetry surface)**

   * allowlist settings + user controls for enabling/disabling the adapter per origin
   * telemetry dashboards, fallback rate displays, and UI that exposes commit counts
   * kill switches, feature flags, and origin-specific policies
   * any PR touching Verso should not modify the adapter semantics, only how they are surfaced or configured

2. **Servo / Engine (semantics, parallelism, guardrails)**

   * tokenized `beginTick()`/`commit()` APIs in the adapter and any enforcement of `inTick` barriers belong here
   * telemetry probes that measure layout/style/renderer timings live in Servo’s layout/renderer/resource subsystems
   * the “one win” parallelism changes (selector matching, layout planning, decode scheduling) must keep SpiderMonkey semantics intact
   * Phase‑5 invariants (single commit, deferred mutation, deterministic replay) remain the baseline in any PR

**Contributor rules**

* Always run `npm run conformance` before landing a change that touches the adapter or renderer helpers.
* Document any “semantic impact” in PR descriptions when you touch `prototypes/dropin/adapter.js`, contract docs, or renderer shims.
* Add telemetry stubs early; they help confirm the correct Servo subsystem boundaries before optimization.

These boundaries keep Phase 5 frozen while allowing Phase 6 to explore rollout and parallelism in a controlled way.
