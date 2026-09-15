use crust_core::interaction::{
    InteractionProgram, Step, TargetRef, UiAction, UiObservation, WorkSignature,
};
use harness::{FakeInteractionDriver, InteractionOutcome};

#[test]
fn fake_driver_executes_typed_flow_and_returns_receipts() {
    let proposition = TargetRef::semantic("mabo:proposition:terra-nullius");
    let source = TargetRef::source("mabo:1992:hca:23");
    let program = InteractionProgram::new(vec![
        Step::Act(UiAction::Expand(proposition.clone())),
        Step::Expect(UiObservation::Expanded(proposition)),
        Step::Act(UiAction::OpenSource(source.clone())),
        Step::Expect(UiObservation::Visible(source)),
    ]);

    let mut driver = FakeInteractionDriver::default();
    let receipt = driver.run(&program);

    assert!(receipt.completed);
    assert_eq!(receipt.steps.len(), 4);
    assert_eq!(receipt.steps[0].outcome, InteractionOutcome::Applied);
    assert_eq!(receipt.steps[1].outcome, InteractionOutcome::Observed(true));
    assert_eq!(receipt.steps[3].outcome, InteractionOutcome::Observed(true));
    assert_eq!(
        receipt.total_work,
        WorkSignature {
            target_resolutions: 4,
            state_reads: 2,
            state_writes: 2,
            commit_boundaries: 2,
            external_io: 1,
        }
    );
}

#[test]
fn failed_expectation_stops_before_later_actions() {
    let missing = TargetRef::semantic("mabo:missing-panel");
    let source = TargetRef::source("mabo:1992:hca:23");
    let program = InteractionProgram::new(vec![
        Step::Expect(UiObservation::Visible(missing)),
        Step::Act(UiAction::OpenSource(source.clone())),
    ]);

    let mut driver = FakeInteractionDriver::default();
    let receipt = driver.run(&program);

    assert!(!receipt.completed);
    assert_eq!(receipt.steps.len(), 1);
    assert_eq!(receipt.steps[0].outcome, InteractionOutcome::Observed(false));
    assert!(!driver.is_visible(&source));
}

#[test]
fn interaction_receipts_preserve_the_original_typed_step() {
    let target = TargetRef::semantic("mabo:proof-cone");
    let program = InteractionProgram::new(vec![Step::Act(UiAction::Select(target.clone()))]);

    let mut driver = FakeInteractionDriver::default();
    let receipt = driver.run(&program);

    assert_eq!(receipt.steps[0].step, Step::Act(UiAction::Select(target)));
}
