use crate::interaction::{TargetRef, UiAction, ZoomLevel};

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum ReadingView {
    Explain,
    Why,
    Source,
    Context,
    Graph,
    Guide,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum ReadingRole {
    ChallengedPremise,
    HistoricalInput,
    AuthorityProposition,
    ImmediateImplication,
    DownstreamApplication,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum CardKind {
    Identity,
    Source,
    Proof,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum PnfCue {
    Actor,
    Predicate,
    Patient,
    Negation,
    Modality,
    Condition,
    Temporal,
    Coreference,
}

const GUIDE_CUES: [PnfCue; 8] = [
    PnfCue::Actor,
    PnfCue::Predicate,
    PnfCue::Patient,
    PnfCue::Negation,
    PnfCue::Modality,
    PnfCue::Condition,
    PnfCue::Temporal,
    PnfCue::Coreference,
];

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub enum ReadingIntent {
    Why,
    OpenSource,
    FollowContext,
    FitGraph,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ReadingAnchorError {
    SourceCannotBeSemanticAnchor,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReadingAnchor {
    semantic_ref: TargetRef,
    proof_ref: String,
    source_ref: String,
    source_span_ref: Option<String>,
    source_revision_ref: Option<String>,
    role: ReadingRole,
}

impl ReadingAnchor {
    pub fn new(
        semantic_ref: TargetRef,
        proof_ref: impl Into<String>,
        source_ref: impl Into<String>,
        source_span_ref: Option<impl Into<String>>,
        source_revision_ref: Option<impl Into<String>>,
        role: ReadingRole,
    ) -> Result<Self, ReadingAnchorError> {
        if !matches!(semantic_ref, TargetRef::Semantic(_)) {
            return Err(ReadingAnchorError::SourceCannotBeSemanticAnchor);
        }

        Ok(Self {
            semantic_ref,
            proof_ref: proof_ref.into(),
            source_ref: source_ref.into(),
            source_span_ref: source_span_ref.map(Into::into),
            source_revision_ref: source_revision_ref.map(Into::into),
            role,
        })
    }

    pub fn semantic_ref(&self) -> &TargetRef {
        &self.semantic_ref
    }

    pub fn proof_ref(&self) -> &str {
        &self.proof_ref
    }

    pub fn source_ref(&self) -> &str {
        &self.source_ref
    }

    pub fn role(&self) -> ReadingRole {
        self.role
    }

    pub fn exact_authority_ready(&self) -> bool {
        self.source_span_ref.is_some() && self.source_revision_ref.is_some()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ReadingSurface {
    anchor: ReadingAnchor,
    view: ReadingView,
    visible: bool,
}

impl ReadingSurface {
    pub fn new(anchor: ReadingAnchor) -> Self {
        Self {
            anchor,
            view: ReadingView::Explain,
            visible: true,
        }
    }

    pub fn semantic_ref(&self) -> &TargetRef {
        self.anchor.semantic_ref()
    }

    pub fn proof_ref(&self) -> &str {
        self.anchor.proof_ref()
    }

    pub fn source_ref(&self) -> &str {
        self.anchor.source_ref()
    }

    pub fn role(&self) -> ReadingRole {
        self.anchor.role()
    }

    pub fn view(&self) -> ReadingView {
        self.view
    }

    pub fn project(&self, view: ReadingView) -> Self {
        let mut next = self.clone();
        next.view = view;
        next
    }

    pub fn with_visible(&self, visible: bool) -> Self {
        let mut next = self.clone();
        next.visible = visible;
        next
    }

    pub fn is_visible(&self) -> bool {
        self.visible
    }

    pub fn exact_authority_ready(&self) -> bool {
        self.anchor.exact_authority_ready()
    }

    pub fn pnf_cues(&self) -> &'static [PnfCue] {
        if self.view == ReadingView::Guide {
            &GUIDE_CUES
        } else {
            &[]
        }
    }

    pub fn compile_intent(&self, intent: ReadingIntent) -> UiAction {
        match intent {
            ReadingIntent::Why => UiAction::Expand(self.semantic_ref().clone()),
            ReadingIntent::OpenSource => {
                UiAction::OpenSource(TargetRef::source(self.source_ref().to_owned()))
            }
            ReadingIntent::FollowContext => UiAction::Follow(self.semantic_ref().clone()),
            ReadingIntent::FitGraph => UiAction::Zoom {
                target: self.semantic_ref().clone(),
                level: ZoomLevel::Fit,
            },
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MaboReadingSpecimen {
    surfaces: Vec<ReadingSurface>,
    roles: Vec<ReadingRole>,
}

impl MaboReadingSpecimen {
    pub fn surfaces(&self) -> &[ReadingSurface] {
        &self.surfaces
    }

    pub fn roles(&self) -> &[ReadingRole] {
        &self.roles
    }

    pub fn len(&self) -> usize {
        self.surfaces.len()
    }

    pub fn is_empty(&self) -> bool {
        self.surfaces.is_empty()
    }

    pub fn encodes_legal_verdict(&self) -> bool {
        false
    }

    pub fn encodes_evidence_payment(&self) -> bool {
        false
    }
}

fn specimen_surface(
    semantic: &str,
    proof: &str,
    source: &str,
    span: &str,
    revision: &str,
    role: ReadingRole,
) -> ReadingSurface {
    ReadingSurface::new(
        ReadingAnchor::new(
            TargetRef::semantic(semantic),
            proof,
            source,
            Some(span),
            Some(revision),
            role,
        )
        .expect("Mabo fixture uses semantic anchors"),
    )
}

pub fn mabo_bounded_specimen() -> MaboReadingSpecimen {
    let surfaces = vec![
        specimen_surface(
            "mabo:premise:prior-crown-title-treatment",
            "proof:mabo:challenged-premise",
            "source:mabo:1992:hca:23",
            "span:mabo:challenged-premise",
            "revision:mabo:1992:hca:23",
            ReadingRole::ChallengedPremise,
        ),
        specimen_surface(
            "mabo:input:historical-common-law",
            "proof:mabo:historical-input",
            "source:mabo:1992:hca:23",
            "span:mabo:historical-input",
            "revision:mabo:1992:hca:23",
            ReadingRole::HistoricalInput,
        ),
        specimen_surface(
            "mabo:proposition:radical-title-native-title",
            "proof:mabo:authority-proposition",
            "source:mabo:1992:hca:23",
            "span:mabo:authority-proposition",
            "revision:mabo:1992:hca:23",
            ReadingRole::AuthorityProposition,
        ),
        specimen_surface(
            "mabo:implication:native-title-survival",
            "proof:mabo:immediate-implication",
            "source:mabo:1992:hca:23",
            "span:mabo:immediate-implication",
            "revision:mabo:1992:hca:23",
            ReadingRole::ImmediateImplication,
        ),
        specimen_surface(
            "mabo:application:downstream-law",
            "proof:mabo:downstream-application",
            "source:mabo:downstream-application",
            "span:mabo:downstream-application",
            "revision:mabo:downstream-application",
            ReadingRole::DownstreamApplication,
        ),
    ];
    let roles = surfaces.iter().map(ReadingSurface::role).collect();

    MaboReadingSpecimen { surfaces, roles }
}
