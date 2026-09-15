use crate::interaction::{InteractionProgram, Step, TargetRef, UiAction, UiObservation, ZoomLevel};

pub const MAGIC: [u8; 4] = *b"JCUI";
pub const VERSION: u16 = 1;
pub const MAX_STEPS: usize = 1_048_576;
pub const MAX_TARGET_BYTES: usize = 1024 * 1024;

const STEP_ACT: u8 = 1;
const STEP_EXPECT: u8 = 2;
const TARGET_SEMANTIC: u8 = 1;
const TARGET_SOURCE: u8 = 2;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WireError {
    Truncated,
    BadMagic,
    UnsupportedVersion(u16),
    TooManySteps,
    TargetTooLarge,
    InvalidUtf8,
    InvalidStepKind(u8),
    InvalidOpcode { step_kind: u8, opcode: u8 },
    InvalidTargetKind(u8),
    InvalidDetail(u8),
    TrailingBytes,
}

pub fn encode_program(program: &InteractionProgram) -> Vec<u8> {
    assert!(program.steps().len() <= MAX_STEPS, "interaction program exceeds wire step bound");
    let count = u32::try_from(program.steps().len()).expect("interaction program exceeds u32 step count");
    let mut out = Vec::new();
    out.extend_from_slice(&MAGIC);
    out.extend_from_slice(&VERSION.to_le_bytes());
    out.extend_from_slice(&count.to_le_bytes());

    for step in program.steps() {
        let (step_kind, opcode, target, detail) = encode_step_header(step);
        let (target_kind, target_text) = encode_target(target);
        let target_bytes = target_text.as_bytes();
        assert!(target_bytes.len() <= MAX_TARGET_BYTES, "interaction target exceeds wire bound");
        let target_len = u32::try_from(target_bytes.len()).expect("interaction target exceeds u32 length");

        out.push(step_kind);
        out.push(opcode);
        out.push(target_kind);
        out.push(detail);
        out.extend_from_slice(&target_len.to_le_bytes());
        out.extend_from_slice(target_bytes);
    }

    out
}

pub fn decode_program(bytes: &[u8]) -> Result<InteractionProgram, WireError> {
    let mut cursor = Cursor::new(bytes);
    let magic = cursor.take(4)?;
    if magic != MAGIC.as_slice() {
        return Err(WireError::BadMagic);
    }

    let version = cursor.read_u16()?;
    if version != VERSION {
        return Err(WireError::UnsupportedVersion(version));
    }

    let step_count = cursor.read_u32()? as usize;
    if step_count > MAX_STEPS {
        return Err(WireError::TooManySteps);
    }
    let mut steps = Vec::with_capacity(step_count);

    for _ in 0..step_count {
        let step_kind = cursor.read_u8()?;
        let opcode = cursor.read_u8()?;
        let target_kind = cursor.read_u8()?;
        let detail = cursor.read_u8()?;
        let target_len = cursor.read_u32()? as usize;
        if target_len > MAX_TARGET_BYTES {
            return Err(WireError::TargetTooLarge);
        }
        let raw_target = cursor.take(target_len)?;
        let target_text = std::str::from_utf8(raw_target).map_err(|_| WireError::InvalidUtf8)?;
        let target = decode_target(target_kind, target_text)?;
        let step = decode_step(step_kind, opcode, detail, target)?;
        steps.push(step);
    }

    if !cursor.is_eof() {
        return Err(WireError::TrailingBytes);
    }

    Ok(InteractionProgram::new(steps))
}

fn encode_step_header(step: &Step) -> (u8, u8, &TargetRef, u8) {
    match step {
        Step::Act(action) => match action {
            UiAction::Activate(target) => (STEP_ACT, 1, target, 0),
            UiAction::Focus(target) => (STEP_ACT, 2, target, 0),
            UiAction::Select(target) => (STEP_ACT, 3, target, 0),
            UiAction::Expand(target) => (STEP_ACT, 4, target, 0),
            UiAction::Collapse(target) => (STEP_ACT, 5, target, 0),
            UiAction::Follow(target) => (STEP_ACT, 6, target, 0),
            UiAction::OpenSource(target) => (STEP_ACT, 7, target, 0),
            UiAction::Zoom { target, level } => {
                let detail = match level {
                    ZoomLevel::In => 1,
                    ZoomLevel::Out => 2,
                    ZoomLevel::Fit => 3,
                };
                (STEP_ACT, 8, target, detail)
            }
        },
        Step::Expect(observation) => match observation {
            UiObservation::Visible(target) => (STEP_EXPECT, 1, target, 0),
            UiObservation::Hidden(target) => (STEP_EXPECT, 2, target, 0),
            UiObservation::Focused(target) => (STEP_EXPECT, 3, target, 0),
            UiObservation::Selected(target) => (STEP_EXPECT, 4, target, 0),
            UiObservation::Expanded(target) => (STEP_EXPECT, 5, target, 0),
            UiObservation::Collapsed(target) => (STEP_EXPECT, 6, target, 0),
        },
    }
}

fn encode_target(target: &TargetRef) -> (u8, &str) {
    match target {
        TargetRef::Semantic(value) => (TARGET_SEMANTIC, value),
        TargetRef::Source(value) => (TARGET_SOURCE, value),
    }
}

fn decode_target(kind: u8, value: &str) -> Result<TargetRef, WireError> {
    match kind {
        TARGET_SEMANTIC => Ok(TargetRef::semantic(value)),
        TARGET_SOURCE => Ok(TargetRef::source(value)),
        other => Err(WireError::InvalidTargetKind(other)),
    }
}

fn decode_step(
    step_kind: u8,
    opcode: u8,
    detail: u8,
    target: TargetRef,
) -> Result<Step, WireError> {
    match step_kind {
        STEP_ACT => {
            let action = match opcode {
                1 if detail == 0 => UiAction::Activate(target),
                2 if detail == 0 => UiAction::Focus(target),
                3 if detail == 0 => UiAction::Select(target),
                4 if detail == 0 => UiAction::Expand(target),
                5 if detail == 0 => UiAction::Collapse(target),
                6 if detail == 0 => UiAction::Follow(target),
                7 if detail == 0 => UiAction::OpenSource(target),
                8 => {
                    let level = match detail {
                        1 => ZoomLevel::In,
                        2 => ZoomLevel::Out,
                        3 => ZoomLevel::Fit,
                        other => return Err(WireError::InvalidDetail(other)),
                    };
                    UiAction::Zoom { target, level }
                }
                1..=7 => return Err(WireError::InvalidDetail(detail)),
                other => {
                    return Err(WireError::InvalidOpcode {
                        step_kind,
                        opcode: other,
                    })
                }
            };
            Ok(Step::Act(action))
        }
        STEP_EXPECT => {
            if detail != 0 {
                return Err(WireError::InvalidDetail(detail));
            }
            let observation = match opcode {
                1 => UiObservation::Visible(target),
                2 => UiObservation::Hidden(target),
                3 => UiObservation::Focused(target),
                4 => UiObservation::Selected(target),
                5 => UiObservation::Expanded(target),
                6 => UiObservation::Collapsed(target),
                other => {
                    return Err(WireError::InvalidOpcode {
                        step_kind,
                        opcode: other,
                    })
                }
            };
            Ok(Step::Expect(observation))
        }
        other => Err(WireError::InvalidStepKind(other)),
    }
}

struct Cursor<'a> {
    bytes: &'a [u8],
    offset: usize,
}

impl<'a> Cursor<'a> {
    fn new(bytes: &'a [u8]) -> Self {
        Self { bytes, offset: 0 }
    }

    fn take(&mut self, len: usize) -> Result<&'a [u8], WireError> {
        let end = self.offset.checked_add(len).ok_or(WireError::Truncated)?;
        if end > self.bytes.len() {
            return Err(WireError::Truncated);
        }
        let slice = &self.bytes[self.offset..end];
        self.offset = end;
        Ok(slice)
    }

    fn read_u8(&mut self) -> Result<u8, WireError> {
        Ok(self.take(1)?[0])
    }

    fn read_u16(&mut self) -> Result<u16, WireError> {
        let bytes = self.take(2)?;
        Ok(u16::from_le_bytes([bytes[0], bytes[1]]))
    }

    fn read_u32(&mut self) -> Result<u32, WireError> {
        let bytes = self.take(4)?;
        Ok(u32::from_le_bytes([bytes[0], bytes[1], bytes[2], bytes[3]]))
    }

    fn is_eof(&self) -> bool {
        self.offset == self.bytes.len()
    }
}
