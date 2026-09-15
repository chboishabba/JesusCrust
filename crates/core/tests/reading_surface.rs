use crust_core::interaction::{TargetRef, UiAction, ZoomLevel};
use crust_core::reading_surface::{
    CardKind, PnfCue, ReadingAnchor, ReadingIntent, ReadingRole, ReadingSurface, ReadingView,
};

fn anchor() -> ReadingAnchor {
    ReadingAnchor::new(
        TargetRef::semantic("mabo:proposition:radical-title"),
        "proof:mabo:radical-title",
        "source:mabo:1992:hca:23",
        Some("span:mabo:radical-title"),
        Some("revision:mabo:1992:hca:23"),
        ReadingRole::AuthorityProposition,
    )
    .expect("semantic reading anchor")
}

#[test]
fn sibling_views_preserve_semantic_identity() {
    let surface = ReadingSurface::new(anchor());
    let expected = TargetRef::semantic("mabo:proposition:radical-title");

    for view in [
        ReadingView::Explain,
        ReadingView::Why,
        ReadingView::Source,
        ReadingView::Context,
        ReadingView::Graph,
        ReadingView::Guide,
    ] {
        assert_eq!(surface.project(view).semantic_ref(), &expected);
    }
}

#[test]
fn why_source_context_and_graph_compile_to_existing_jcui_actions() {
    let surface = ReadingSurface::new(anchor());

    assert_eq!(
        surface.compile_intent(ReadingIntent::Why),
        UiAction::Expand(TargetRef::semantic("mabo:proposition:radical-title"))
    );
    assert_eq!(
        surface.compile_intent(ReadingIntent::OpenSource),
        UiAction::OpenSource(TargetRef::source("source:mabo:1992:hca:23"))
    );
    assert_eq!(
        surface.compile_intent(ReadingIntent::FollowContext),
        UiAction::Follow(TargetRef::semantic("mabo:proposition:radical-title"))
    );
    assert_eq!(
        surface.compile_intent(ReadingIntent::FitGraph),
        UiAction::Zoom {
            target: TargetRef::semantic("mabo:proposition:radical-title"),
            level: ZoomLevel::Fit,
        }
    );
}

#[test]
fn hiding_projection_does_not_delete_or_change_anchor() {
    let surface = ReadingSurface::new(anchor());
    let hidden = surface.with_visible(false);

    assert!(!hidden.is_visible());
    assert_eq!(hidden.semantic_ref(), surface.semantic_ref());
    assert_eq!(hidden.proof_ref(), surface.proof_ref());
    assert_eq!(hidden.source_ref(), surface.source_ref());
}

#[test]
fn exact_authority_audit_requires_span_and_revision() {
    let full = ReadingSurface::new(anchor());
    assert!(full.exact_authority_ready());

    let no_span = ReadingSurface::new(
        ReadingAnchor::new(
            TargetRef::semantic("mabo:proposition:radical-title"),
            "proof:mabo:radical-title",
            "source:mabo:1992:hca:23",
            None,
            Some("revision:mabo:1992:hca:23"),
            ReadingRole::AuthorityProposition,
        )
        .unwrap(),
    );
    assert!(!no_span.exact_authority_ready());

    let no_revision = ReadingSurface::new(
        ReadingAnchor::new(
            TargetRef::semantic("mabo:proposition:radical-title"),
            "proof:mabo:radical-title",
            "source:mabo:1992:hca:23",
            Some("span:mabo:radical-title"),
            None,
            ReadingRole::AuthorityProposition,
        )
        .unwrap(),
    );
    assert!(!no_revision.exact_authority_ready());
}

#[test]
fn source_refs_cannot_be_used_as_reading_semantic_anchors() {
    let result = ReadingAnchor::new(
        TargetRef::source("source:mabo:1992:hca:23"),
        "proof:mabo:radical-title",
        "source:mabo:1992:hca:23",
        None,
        None,
        ReadingRole::AuthorityProposition,
    );

    assert!(result.is_err());
}

#[test]
fn identity_source_and_proof_cards_are_distinct_projection_kinds() {
    assert_ne!(CardKind::Identity, CardKind::Source);
    assert_ne!(CardKind::Identity, CardKind::Proof);
    assert_ne!(CardKind::Source, CardKind::Proof);
}

#[test]
fn guide_mode_exposes_pnf_cues_without_changing_semantic_identity() {
    let surface = ReadingSurface::new(anchor());
    let guide = surface.project(ReadingView::Guide);

    assert_eq!(guide.semantic_ref(), surface.semantic_ref());
    assert_eq!(
        guide.pnf_cues(),
        &[
            PnfCue::Actor,
            PnfCue::Predicate,
            PnfCue::Patient,
            PnfCue::Negation,
            PnfCue::Modality,
            PnfCue::Condition,
            PnfCue::Temporal,
            PnfCue::Coreference,
        ]
    );
}
