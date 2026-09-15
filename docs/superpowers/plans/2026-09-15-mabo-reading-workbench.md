# Mabo Reading Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Add a typed, progressive-disclosure `ReadingSurface` projection and Mabo acceptance specimen over existing JCUI actions without moving legal semantics into JesusCrust.

**Architecture:** SensibLaw remains semantic/legal owner; the new Rust core module stores opaque semantic/proof/source refs plus view/card/PNF projection metadata and compiles user-facing intents into existing `UiAction`s. The first Mabo specimen is deliberately bounded and view-preserving. Svelte rendering is deferred until this model is validated.

**Tech Stack:** Rust (`crust_core`), existing JCUI binary/interaction types, Cargo integration tests, DASHI Agda parity owner already present.

**Spec:** `docs/superpowers/specs/2026-09-15-mabo-reading-workbench.md`

## Global Constraints

- Do not encode Mabo legal conclusions in JesusCrust.
- Reuse existing `TargetRef`, `UiAction`, and `ZoomLevel`; do not invent parallel interaction actions.
- View changes preserve semantic identity and do not imply evidence/payment/authority changes.
- Source inspection is distinct from identity/context navigation and proof role.
- Default projection is bounded; graph/context/guide are opt-in.
- StatiBaker retention remains optional observer-only output and is not part of the first implementation.
- No JSON interaction ABI is introduced.

## Task 1 — RED: ReadingSurface identity and interaction contract

**Files:**
- Create: `crates/core/tests/reading_surface.rs`

Write failing tests for:

1. all sibling views preserve one semantic anchor;
2. `Why` compiles to `UiAction::Expand(Semantic(...))`;
3. source inspection compiles to `OpenSource(Source(...))`;
4. context follow compiles to `Follow(Semantic(...))`;
5. graph view fit compiles to `Zoom(Semantic(...), Fit)`;
6. hiding/closing a projection leaves the anchor intact;
7. exact-authority audit is unavailable without span + revision refs.

Commit the RED surface before implementation.

## Task 2 — GREEN: Core ReadingSurface projection

**Files:**
- Create: `crates/core/src/reading_surface.rs`
- Modify: `crates/core/src/lib.rs`

Implement:

- `ReadingView`
- `ReadingRole`
- `CardKind`
- `PnfCue`
- `ReadingAnchor`
- `ReadingSurface`
- projection/intention helpers compiling into existing JCUI actions.

Reject non-semantic anchors. Preserve the anchor across view changes. Exact-authority readiness requires both source span and source revision.

## Task 3 — RED/GREEN: Mabo bounded specimen

**Files:**
- Create: `crates/core/tests/mabo_reading_surface.rs`
- Extend: `crates/core/src/reading_surface.rs`

Test first that the default specimen exposes exactly five bounded stages:

- challenged premise
- historical/common-law input
- Mabo proposition
- immediate native-title implication
- downstream application

and that graph/context/guide detail is not default-visible.

Implement an opaque-ref Mabo fixture constructor; do not encode legal truth or authority evaluation.

## Task 4 — Learning/PNF projection tests

**Files:**
- Extend: `crates/core/tests/reading_surface.rs`

Verify Guide mode exposes the typed PNF cue vocabulary while preserving semantic identity. A guide interaction receipt must not contain any field representing `understands`, `believes`, or legal truth.

## Task 5 — Documentation and parity cross-check

**Files:**
- Modify: `docs/ui_interaction_ir.md`
- Inspect only unless a gap is found: `DASHI/Interop/SensibLawMaboProgressiveExplanationProjectionExact.agda`

Document the `ReadingSurface` projection and ensure runtime fields/actions correspond to the existing Agda projection laws. If runtime introduces a coordinate absent from Agda, extend the existing owner rather than create a duplicate theory.

## Task 6 — Verification

Run locally when available:

```bash
cargo test -p crust_core --test reading_surface --test mabo_reading_surface
cargo test -p crust_core
```

Then type-check the existing DASHI owner:

```bash
agda -i . DASHI/Interop/SensibLawMaboProgressiveExplanationProjectionExact.agda
```

Do not claim green until receipts are observed.

## Deferred follow-up

After the typed projection is validated:

- implement the in-process Svelte/ITIR adapter;
- bind live SensibLaw Mabo proof refs/source spans into the projection;
- add source/identity/proof side cards;
- add opt-in StatiBaker interaction-trail adapter;
- generalize the same workbench to non-legal reading comprehension.
