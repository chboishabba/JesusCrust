use crust_core::interaction::{
    InteractionProgram, Step, TargetRef, UiAction, UiObservation, WorkSignature, ZoomLevel,
};

#[test]
fn action_work_signature_separates_local_work_from_external_io() {
    let target = TargetRef::semantic("mabo:terra-nullius");

    assert_eq!(
        UiAction::Expand(target.clone()).abstract_work(),
        WorkSignature {
            target_resolutions: 1,
            state_reads: 0,
            state_writes: 1,
            commit_boundaries: 1,
            external_io: 0,
        }
    );

    assert_eq!(
        UiAction::OpenSource(TargetRef::source("mabo:1992:hca:23")).abstract_work(),
        WorkSignature {
            target_resolutions: 1,
            state_reads: 0,
            state_writes: 1,
            commit_boundaries: 1,
            external_io: 1,
        }
    );

    assert_eq!(
        UiAction::Zoom {
            target,
            level: ZoomLevel::Fit,
        }
        .abstract_work()
        .external_io,
        0
    );
}

#[test]
fn observation_work_is_read_only() {
    let observation = UiObservation::Visible(TargetRef::semantic("mabo:proof-cone"));
    assert_eq!(
        observation.abstract_work(),
        WorkSignature {
            target_resolutions: 1,
            state_reads: 1,
            state_writes: 0,
            commit_boundaries: 0,
            external_io: 0,
        }
    );
}

#[test]
fn program_preserves_typed_step_order_without_serialization() {
    let proposition = TargetRef::semantic("mabo:proposition:terra-nullius");
    let source = TargetRef::source("mabo:1992:hca:23");
    let program = InteractionProgram::new(vec![
        Step::Act(UiAction::Activate(proposition.clone())),
        Step::Act(UiAction::Expand(proposition.clone())),
        Step::Expect(UiObservation::Expanded(proposition)),
        Step::Act(UiAction::OpenSource(source.clone())),
        Step::Expect(UiObservation::Visible(source)),
    ]);

    assert_eq!(program.steps().len(), 5);
    assert!(matches!(program.steps()[0], Step::Act(UiAction::Activate(_))));
    assert!(matches!(program.steps()[2], Step::Expect(UiObservation::Expanded(_))));
    assert!(matches!(program.steps()[3], Step::Act(UiAction::OpenSource(_))));
}
