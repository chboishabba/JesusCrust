# Mabo Progressive Reading Workbench Design

## Goal

Provide a lay-readable, progressive-disclosure reading surface over the existing SensibLaw Mabo proof specimen while preserving semantic identity, source provenance, proof roles, and legal-authority boundaries.

The product surface should feel closer to Wikipedia/Encarta than a graph debugger: read first, follow a term when curious, ask “why?”, inspect the exact source when needed, and only reveal wider proof/graph structure on demand.

## Ownership

- SensibLaw owns legal proposition identity, authority/application, support/defeater/comparator roles, review/payment, and legal explanation.
- SLR owns parse → residual → acquire → parse recurrence.
- JesusCrust/JCUI owns typed interaction intent and projection identity.
- A concrete web/Svelte host owns rendering only.
- StatiBaker may retain opt-in interaction receipts as temporal observations only; it does not infer belief, understanding, semantic truth, or legal truth.

## Product primitive

The canonical primitive is `ReadingSurface`, not `TimelineRibbonLite` and not a proof-graph widget.

Sibling views are projections over one semantic anchor:

- Explain
- Why
- Source
- Context
- Graph
- Guide

Switching view never mutates the underlying semantic/proof state.

## Progressive disclosure

Default flow:

```
read → notice → ask → expand
```

The default Mabo specimen exposes a bounded cone only:

1. challenged premise;
2. one relevant historical/common-law input;
3. the Mabo proposition that changes the relation;
4. immediate native-title implication;
5. one downstream later-law/application node.

Nothing hidden is discarded, unsupported, unavailable, or semantically demoted merely by being hidden.

## Cards

Three cards remain distinct:

- Identity: what is this thing? label/aliases/QID/high-value ontology navigation.
- Source: where did this assertion come from? document/revision/span/source role.
- Proof: what does this source/proposition do here? support/defeater/comparator/residual/wrong-type.

Invariant:

```
Wikidata identity != source provenance != proof role
```

## PNF learning overlay

Guide mode may expose beginner-friendly PNF cues:

- Actor — who?
- Predicate — did what?
- Patient — to what/whom?
- Negation
- Modality
- Condition
- Temporal
- Coreference

These are presentation/learning overlays only. Correct interaction does not establish comprehension.

## JCUI compilation

The workbench should reuse existing JCUI actions rather than add domain-specific gestures:

- Why → `Expand(Semantic(...))`
- Source card/open exact source → `OpenSource(Source(...))`
- Context/entity rabbit-hole → `Follow(Semantic(...))`
- Graph fit → `Zoom(Semantic(...), Fit)`

DOM selectors, pointer coordinates, keyboard gestures, and framework component IDs remain adapter-local.

## Formal parity

DASHI already owns `SensibLawMaboProgressiveExplanationProjectionExact.agda` and should remain canonical for projection firewalls. Runtime additions must agree with it:

- explanation and richer views preserve semantic refs;
- lay explanation can factor through the shallow projection;
- primary-authority audit does not;
- source view requires source identity; exact-authority inspection requires span + revision;
- Wikipedia/Wikidata navigation does not create legal authority, applicability, or evidence payment;
- hidden detail is not evidence loss;
- navigation does not change proof state.

## Acceptance specimen

A user should be able to spend roughly five minutes on the Mabo specimen and reach the explanatory insight “this is why Mabo mattered” without needing to understand PNF, QIDs, Agda, proof graphs, or `FactorsThrough`.

The typed acceptance path is:

```
plain-language paragraph
→ activate challenged premise
→ why/expand
→ inspect bounded explanation
→ open exact authority source
→ return to proposition
→ optionally show graph/context/guide
```

The first implementation is a pure Rust projection model plus deterministic JCUI program. A Svelte/web host follows once this identity/interaction contract is executable and regression-tested.
