use std::collections::HashMap;

use crust_core::interaction::{
    InteractionProgram, Step, TargetRef, UiAction, UiObservation, WorkSignature,
};

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum InteractionOutcome {
    Applied,
    Observed(bool),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InteractionStepReceipt {
    pub index: usize,
    pub step: Step,
    pub outcome: InteractionOutcome,
    pub work: WorkSignature,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct InteractionRunReceipt {
    pub completed: bool,
    pub steps: Vec<InteractionStepReceipt>,
    pub total_work: WorkSignature,
}

#[derive(Debug, Clone, Default)]
struct TargetState {
    visible: bool,
    focused: bool,
    selected: bool,
    expanded: bool,
}

#[derive(Debug, Clone, Default)]
pub struct FakeInteractionDriver {
    states: HashMap<TargetRef, TargetState>,
}

impl FakeInteractionDriver {
    pub fn set_visible(&mut self, target: TargetRef, visible: bool) {
        self.states.entry(target).or_default().visible = visible;
    }

    pub fn is_visible(&self, target: &TargetRef) -> bool {
        self.states.get(target).map(|state| state.visible).unwrap_or(false)
    }

    pub fn run(&mut self, program: &InteractionProgram) -> InteractionRunReceipt {
        let mut receipts = Vec::with_capacity(program.steps().len());
        let mut total_work = WorkSignature::default();
        let mut completed = true;

        for (index, step) in program.steps().iter().cloned().enumerate() {
            let work = step.abstract_work();
            total_work = total_work.combine(work);
            let outcome = match &step {
                Step::Act(action) => {
                    self.apply(action);
                    InteractionOutcome::Applied
                }
                Step::Expect(observation) => {
                    let matched = self.observe(observation);
                    if !matched {
                        completed = false;
                    }
                    InteractionOutcome::Observed(matched)
                }
            };

            receipts.push(InteractionStepReceipt {
                index,
                step,
                outcome,
                work,
            });

            if !completed {
                break;
            }
        }

        InteractionRunReceipt {
            completed,
            steps: receipts,
            total_work,
        }
    }

    fn apply(&mut self, action: &UiAction) {
        let state = self.states.entry(action.target().clone()).or_default();
        match action {
            UiAction::Activate(_) => {}
            UiAction::Focus(_) => state.focused = true,
            UiAction::Select(_) => state.selected = true,
            UiAction::Expand(_) => state.expanded = true,
            UiAction::Collapse(_) => state.expanded = false,
            UiAction::Follow(_) | UiAction::OpenSource(_) => state.visible = true,
            UiAction::Zoom { .. } => {}
        }
    }

    fn observe(&self, observation: &UiObservation) -> bool {
        let state = self.states.get(observation.target());
        match observation {
            UiObservation::Visible(_) => state.map(|state| state.visible).unwrap_or(false),
            UiObservation::Hidden(_) => !state.map(|state| state.visible).unwrap_or(false),
            UiObservation::Focused(_) => state.map(|state| state.focused).unwrap_or(false),
            UiObservation::Selected(_) => state.map(|state| state.selected).unwrap_or(false),
            UiObservation::Expanded(_) => state.map(|state| state.expanded).unwrap_or(false),
            UiObservation::Collapsed(_) => !state.map(|state| state.expanded).unwrap_or(false),
        }
    }
}
