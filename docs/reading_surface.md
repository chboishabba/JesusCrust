# ReadingSurface

`ReadingSurface` is the progressive-disclosure reading projection built over the existing JCUI semantic interaction IR.

It is intentionally not a proof engine, legal-semantic model, graph store, or timeline widget.

## Ownership

```text
SensibLaw proof/source world
        |
        v
ReadingSurface projection
        |
        v
JCUI semantic interaction intent
        |
        v
web/native adapter
```

Optional interaction receipts may later be observed by StatiBaker when the user's retention policy permits that. StatiBaker does not become semantic authority and an interaction receipt does not imply belief or understanding.

## Views

The current typed views are:

```text
Explain
Why
Source
Context
Graph
Guide
```

Every sibling view preserves the same semantic anchor. Hiding or changing a view does not delete proof/source state.

## Cards

Three projection kinds remain distinct:

```text
Identity != Source != Proof
```

Identity/context surfaces may expose Wikipedia, Wikidata, or public-ontology navigation. Source inspection exposes document/revision/span coordinates. Proof inspection exposes the role of the canonical proof object. None inherits the authority of another.

## Existing JCUI actions

Reading intents compile to the existing interaction IR:

```text
Why          -> Expand(Semantic)
Open source  -> OpenSource(Source)
Context      -> Follow(Semantic)
Show graph   -> Zoom(Semantic, Fit)
```

Guide mode is a local projection over the same semantic anchor and currently does not require a new domain action.

## PNF guide cues

The projection vocabulary is:

```text
Actor
Predicate
Patient
Negation
Modality
Condition
Temporal
Coreference
```

These may be presented to beginners as questions such as “who?”, “did what?”, and “to what/whom?” before grammatical terminology is exposed.

A guide interaction is not evidence that the user understands, believes, or accepts a proposition.

## Mabo specimen

The first bounded specimen contains exactly five presentation roles:

```text
challenged premise
historical/common-law input
Mabo authority proposition
immediate implication
one downstream application
```

The default view is Explain. Graph, context, guide, hashes, QIDs, complete residual lists, and all source-role metadata stay folded until requested.

The fixture stores opaque semantic/proof/source references only. Legal authority, applicability, evidence payment, support/defeater/comparator semantics, and legal conclusions remain SensibLaw-owned.

## Agda parity

Runtime coordinates are mirrored in the existing DASHI owner:

```text
DASHI/Interop/SensibLawMaboProgressiveExplanationProjectionExact.agda
```

No separate UI truth theory should be introduced.
