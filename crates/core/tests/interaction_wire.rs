use crust_core::interaction::{InteractionProgram, Step, TargetRef, UiAction, UiObservation, ZoomLevel};
use crust_core::interaction_wire::{decode_program, encode_program, WireError, MAGIC, VERSION};

#[test]
fn binary_program_roundtrip_preserves_typed_steps() {
    let target = TargetRef::semantic("mabo:proposition:terra-nullius");
    let source = TargetRef::source("mabo:1992:hca:23");
    let program = InteractionProgram::new(vec![
        Step::Act(UiAction::Activate(target.clone())),
        Step::Act(UiAction::Zoom {
            target: target.clone(),
            level: ZoomLevel::Fit,
        }),
        Step::Expect(UiObservation::Visible(target)),
        Step::Act(UiAction::OpenSource(source.clone())),
        Step::Expect(UiObservation::Visible(source)),
    ]);

    let bytes = encode_program(&program);
    assert_eq!(&bytes[0..4], &MAGIC);
    assert_eq!(u16::from_le_bytes([bytes[4], bytes[5]]), VERSION);
    assert_eq!(decode_program(&bytes).unwrap(), program);
}

#[test]
fn binary_program_rejects_wrong_magic() {
    let program = InteractionProgram::new(vec![]);
    let mut bytes = encode_program(&program);
    bytes[0] = b'X';
    assert_eq!(decode_program(&bytes), Err(WireError::BadMagic));
}

#[test]
fn binary_program_rejects_trailing_bytes() {
    let program = InteractionProgram::new(vec![Step::Act(UiAction::Focus(
        TargetRef::semantic("reading:sentence:1"),
    ))]);
    let mut bytes = encode_program(&program);
    bytes.push(0);
    assert_eq!(decode_program(&bytes), Err(WireError::TrailingBytes));
}

#[test]
fn binary_program_is_not_json_text() {
    let program = InteractionProgram::new(vec![Step::Act(UiAction::Select(
        TargetRef::semantic("mabo:proof-cone"),
    ))]);
    let bytes = encode_program(&program);
    assert!(!bytes.starts_with(b"{"));
    assert!(!bytes.starts_with(b"["));
}
