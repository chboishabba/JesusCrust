#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum TargetRef {
    Semantic(String),
    Source(String),
}

impl TargetRef {
    pub fn semantic(id: impl Into<String>) -> Self {
        Self::Semantic(id.into())
    }

    pub fn source(id: impl Into<String>) -> Self {
        Self::Source(id.into())
    }
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum ZoomLevel {
    In,
    Out,
    Fit,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum UiAction {
    Activate(TargetRef),
    Focus(TargetRef),
    Select(TargetRef),
    Expand(TargetRef),
    Collapse(TargetRef),
    Follow(TargetRef),
    OpenSource(TargetRef),
    Zoom { target: TargetRef, level: ZoomLevel },
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum UiObservation {
    Visible(TargetRef),
    Hidden(TargetRef),
    Focused(TargetRef),
    Selected(TargetRef),
    Expanded(TargetRef),
    Collapsed(TargetRef),
}

#[derive(Debug, Copy, Clone, Default, PartialEq, Eq)]
pub struct WorkSignature {
    pub target_resolutions: u32,
    pub state_reads: u32,
    pub state_writes: u32,
    pub commit_boundaries: u32,
    pub external_io: u32,
}

impl WorkSignature {
    pub fn combine(self, other: Self) -> Self {
        Self {
            target_resolutions: self.target_resolutions + other.target_resolutions,
            state_reads: self.state_reads + other.state_reads,
            state_writes: self.state_writes + other.state_writes,
            commit_boundaries: self.commit_boundaries + other.commit_boundaries,
            external_io: self.external_io + other.external_io,
        }
    }
}

impl UiAction {
    pub fn target(&self) -> &TargetRef {
        match self {
            Self::Activate(target)
            | Self::Focus(target)
            | Self::Select(target)
            | Self::Expand(target)
            | Self::Collapse(target)
            | Self::Follow(target)
            | Self::OpenSource(target)
            | Self::Zoom { target, .. } => target,
        }
    }

    pub fn abstract_work(&self) -> WorkSignature {
        let external_io = match self {
            Self::Follow(_) | Self::OpenSource(_) => 1,
            _ => 0,
        };

        WorkSignature {
            target_resolutions: 1,
            state_reads: 0,
            state_writes: 1,
            commit_boundaries: 1,
            external_io,
        }
    }
}

impl UiObservation {
    pub fn target(&self) -> &TargetRef {
        match self {
            Self::Visible(target)
            | Self::Hidden(target)
            | Self::Focused(target)
            | Self::Selected(target)
            | Self::Expanded(target)
            | Self::Collapsed(target) => target,
        }
    }

    pub fn abstract_work(&self) -> WorkSignature {
        WorkSignature {
            target_resolutions: 1,
            state_reads: 1,
            state_writes: 0,
            commit_boundaries: 0,
            external_io: 0,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Step {
    Act(UiAction),
    Expect(UiObservation),
}

impl Step {
    pub fn abstract_work(&self) -> WorkSignature {
        match self {
            Self::Act(action) => action.abstract_work(),
            Self::Expect(observation) => observation.abstract_work(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct InteractionProgram {
    steps: Vec<Step>,
}

impl InteractionProgram {
    pub fn new(steps: Vec<Step>) -> Self {
        Self { steps }
    }

    pub fn steps(&self) -> &[Step] {
        &self.steps
    }

    pub fn abstract_work(&self) -> WorkSignature {
        self.steps
            .iter()
            .fold(WorkSignature::default(), |acc, step| acc.combine(step.abstract_work()))
    }
}
