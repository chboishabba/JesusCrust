use crust_core::reading_surface::{mabo_bounded_specimen, ReadingRole, ReadingView};

#[test]
fn default_mabo_specimen_is_exactly_one_bounded_five_stage_cone() {
    let specimen = mabo_bounded_specimen();

    assert_eq!(specimen.len(), 5);
    assert_eq!(
        specimen.roles(),
        &[
            ReadingRole::ChallengedPremise,
            ReadingRole::HistoricalInput,
            ReadingRole::AuthorityProposition,
            ReadingRole::ImmediateImplication,
            ReadingRole::DownstreamApplication,
        ]
    );
    assert!(specimen
        .surfaces()
        .iter()
        .all(|surface| surface.view() == ReadingView::Explain));
}

#[test]
fn bounded_specimen_does_not_default_to_graph_context_or_guide() {
    let specimen = mabo_bounded_specimen();

    assert!(specimen.surfaces().iter().all(|surface| !matches!(
        surface.view(),
        ReadingView::Graph | ReadingView::Context | ReadingView::Guide
    )));
}

#[test]
fn every_mabo_stage_retains_source_and_proof_refs() {
    let specimen = mabo_bounded_specimen();

    for surface in specimen.surfaces() {
        assert!(!surface.proof_ref().is_empty());
        assert!(!surface.source_ref().is_empty());
    }
}

#[test]
fn mabo_specimen_is_projection_only_not_legal_status() {
    let specimen = mabo_bounded_specimen();

    // The UI specimen deliberately contains no authority/applicability/truth
    // verdict coordinate. Those remain SensibLaw-owned semantics.
    assert!(!specimen.encodes_legal_verdict());
    assert!(!specimen.encodes_evidence_payment());
}
