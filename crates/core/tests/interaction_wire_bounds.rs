use crust_core::interaction::{InteractionProgram, Step, TargetRef, UiAction};
use crust_core::interaction_wire::{decode_program, encode_program, WireError, MAX_STEPS};

#[test]
fn decoder_rejects_step_count_above_bound_before_step_allocation() {
    let mut bytes = Vec::new();
    bytes.extend_from_slice(b"JCUI");
    bytes.extend_from_slice(&1u16.to_le_bytes());
    bytes.extend_from_slice(&((MAX_STEPS as u32) + 1).to_le_bytes());

    assert_eq!(decode_program(&bytes), Err(WireError::TooManySteps));
}

#[test]
fn encoder_accepts_small_bounded_program() {
    let program = InteractionProgram::new(vec![Step::Act(UiAction::Activate(
        TargetRef::semantic("mabo:proposition:terra-nullius"),
    ))]);
    assert!(encode_program(&program).len() > 10);
}
