# Typed UI Interaction IR

JesusCrust now owns a backend-neutral interaction program for deterministic UI flow tests and future UI automation adapters.

The purpose is not to replace a browser driver with another browser-specific scripting language. The purpose is to keep user intent, UI state observation, DOM mutation, and physical input separate enough that the same flow can be interpreted by a fake harness, an in-process web adapter, a browser adapter, a native Rust/Java UI, or another frontend without changing the canonical interaction semantics.

## Boundary

The canonical split is:

```text
semantic interaction intent
        |
        v
backend interaction adapter
        |
        +--> application/domain state transition
        |
        +--> DOM/native patch implementation
        |
        `--> measured implementation telemetry
```

Therefore:

```text
semantic interaction IR != DOM patch IR != mouse/touch/keyboard gesture
```

A `UiAction::Activate(TargetRef::Semantic("mabo:proposition:terra-nullius"))` may be implemented by a mouse click, keyboard activation, touch gesture, accessibility API action, test shim, or direct in-process event. None of those concrete mechanisms becomes part of the canonical flow.

Likewise a CSS selector or screen coordinate is an adapter-local resolution mechanism, not semantic identity.

## Core types

`TargetRef` currently has two canonical identity classes:

- `Semantic(String)` for application objects such as a proposition, proof cone, graph node, reading-span anchor, inspector tab, or navigation concept;
- `Source(String)` for source/document identities exposed through provenance inspection.

`UiAction` currently contains:

- `Activate`
- `Focus`
- `Select`
- `Expand`
- `Collapse`
- `Follow`
- `OpenSource`
- `Zoom { In | Out | Fit }`

`UiObservation` currently contains:

- `Visible`
- `Hidden`
- `Focused`
- `Selected`
- `Expanded`
- `Collapsed`

A program is an ordered sequence of either actions or expectations:

```text
Step::Act(action)
Step::Expect(observation)
```

This deliberately models the interaction contract rather than implementation internals.

## Abstract work signature

Every step has an implementation-neutral `WorkSignature`:

```text
WorkSignature {
    target_resolutions,
    state_reads,
    state_writes,
    commit_boundaries,
    external_io,
}
```

This is not a benchmark and is not wall-clock cost. It is an abstract work vector that lets different implementations be compared against the same semantic flow before or alongside measurements.

Current v1 accounting is intentionally simple:

- local UI action: `(1 resolve, 0 read, 1 write, 1 commit, 0 IO)`;
- `Follow` or `OpenSource`: `(1, 0, 1, 1, 1)`;
- observation: `(1, 1, 0, 0, 0)`.

A later browser, Rust-native, Java, GPU-assisted, or CPU-only implementation can report measured telemetry next to this vector without redefining the flow itself.

This follows JesusCrust's existing CPU/GPU-style boundary: expensive computation may move off the main thread, but externally observable mutation occurs only at deterministic commit boundaries.

## Deterministic harness

`harness::FakeInteractionDriver` executes the same typed program against a minimal deterministic state model and returns a receipt for every executed step.

A receipt retains:

- original typed step;
- step index;
- action/observation result;
- abstract work signature.

A failed expectation terminates the remaining program. It is not silently ignored and does not fabricate progress.

This makes the harness useful before a frontend exists: product flows can be specified and checked as semantic transitions while rendering/toolkit-specific work remains replaceable.

## Binary wire

The canonical wire is `JCUI` version 1. It is binary, length-prefixed, and contains no JSON flow representation.

Header:

```text
magic[4] = "JCUI"
version: u16 little-endian = 1
step_count: u32 little-endian
```

Each step:

```text
step_kind: u8
action_or_observation_opcode: u8
target_kind: u8
detail: u8
target_len: u32 little-endian
target_utf8[target_len]
```

Target kinds:

```text
1 Semantic
2 Source
```

Step kinds:

```text
1 Act
2 Expect
```

Action opcodes:

```text
1 Activate
2 Focus
3 Select
4 Expand
5 Collapse
6 Follow
7 OpenSource
8 Zoom
```

Observation opcodes:

```text
1 Visible
2 Hidden
3 Focused
4 Selected
5 Expanded
6 Collapsed
```

Zoom detail:

```text
1 In
2 Out
3 Fit
```

The target text is bounded UTF-8. Unknown tags, bad detail values, truncated frames, unsupported versions, trailing bytes, and oversized targets are decoder errors.

## Mabo reading-workbench specimen

A first flagship flow can stay small even though the underlying proof graph is rich:

```text
Activate(mabo:proposition:terra-nullius)
Expand(mabo:proposition:terra-nullius)
Expect(Expanded(...))
OpenSource(mabo:1992:hca:23)
Expect(Visible(...))
Zoom(mabo:proof-cone, Fit)
```

The frontend may initially show only a bounded explanatory cone:

```text
challenged premise
  -> historical/common-law input
  -> Mabo proposition
  -> immediate native-title consequence
  -> one downstream application
```

The user can then expand proof detail, source inspection, Wikidata/Wikipedia identity, provenance, defeaters, comparators, or surrounding graph only when requested.

This keeps the interaction contract aligned with the ITIR workbench rule that source/readable content is the orientation surface and graph drill-in remains bounded until the user explicitly widens scope.

## Reading and learning consumers

The same IR can drive a general reading-comprehension surface without changing proof semantics. For example:

```text
Select(reading:sentence:42:pronoun:they)
Expand(reading:coreference-candidates)
Follow(entity:golden-spider-silk-project)
OpenSource(source:museum-archive)
```

PNF annotations may expose actor/predicate/patient, negation, modality, conditions, and high-value operators such as `must`, `may`, `unless`, and `not`, but those overlays remain consumer views over the same source-grounded objects.

A learning exercise result is not a legal proof receipt and a navigation event is not evidence that the user understands or believes a proposition.

## StatiBaker boundary

Interaction receipts may be supplied to StatiBaker as observer events only when the user's retention policy allows it. They may support resume/history views such as:

```text
opened Mabo
-> followed terra nullius
-> inspected judgment source
-> returned to proof cone
```

They must never imply:

```text
interaction receipt -> user belief
interaction receipt -> user understanding
interaction receipt -> semantic truth
interaction receipt -> legal truth
```

Ephemeral interaction mode may retain no durable trail at all. Local-trail, bookmark, or explicit learning-history modes are separate user-visible retention choices.

## Adapter roadmap

The intended adapter progression is:

1. deterministic fake driver — current;
2. in-process web/Svelte adapter resolving semantic target IDs to application components;
3. browser adapter for end-to-end rendering/accessibility/input verification;
4. optional native Rust/Java/other UI adapters;
5. measured implementation telemetry compared against the same abstract `WorkSignature`.

Adapter-local selectors, DOM paths, accessibility locators, browser protocols, and physical gestures must not leak into the canonical `JCUI` identity model.

## Non-goals

The interaction IR is not:

- a semantic/legal truth layer;
- a replacement for SensibLaw proof semantics;
- a replacement for StatiBaker memory authority;
- a DOM mutation format (`PatchOp` already serves a different role);
- a user-engagement or belief-inference system;
- a requirement that all frontends use one implementation language.

Its job is narrower: make user-visible flows deterministic, portable, inspectable, and comparable before the concrete UI implementation becomes the architecture.
